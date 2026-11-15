const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendNotification } = require('../sockets/notificationSocket');

/**
 * @desc    Apply for a job
 * @route   POST /api/v1/jobs/:jobId/apply
 * @access  Private (Candidate only)
 */
const applyJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const candidate = req.user;

  const job = await Job.findById(jobId);
  if (!job) {
    throw ApiError.notFound('Job posting not found');
  }

  if (job.status !== 'Active') {
    throw ApiError.badRequest('This job posting is no longer active.');
  }

  // Check if candidate has already applied
  const existingApplication = await Application.findOne({
    job: jobId,
    candidate: candidate._id,
  });

  if (existingApplication) {
    throw ApiError.conflict('You have already submitted an application for this job.');
  }

  // Resolve resume URL
  let resumeUrl = req.body.resumeUrl;
  let resumeOriginalName = req.body.resumeOriginalName;

  if (req.file) {
    resumeUrl = `/uploads/resumes/${req.file.filename}`;
    resumeOriginalName = req.file.originalname;
  } else if (!resumeUrl) {
    resumeUrl = candidate.candidateProfile?.resumeUrl;
    resumeOriginalName = candidate.candidateProfile?.resumeOriginalName || 'Resume.pdf';
  }

  if (!resumeUrl) {
    throw ApiError.badRequest(
      'Resume is required. Please upload a resume or update your profile with a default resume.'
    );
  }

  const application = await Application.create({
    job: job._id,
    candidate: candidate._id,
    recruiter: job.recruiter,
    resumeUrl,
    resumeOriginalName,
    coverLetter: req.body.coverLetter || '',
  });

  // Increment application count on the job
  await Job.findByIdAndUpdate(job._id, { $inc: { applicationsCount: 1 } });

  // Send real-time notification to the recruiter
  await sendNotification({
    recipientId: job.recruiter,
    senderId: candidate._id,
    type: 'NEW_APPLICATION_RECEIVED',
    title: 'New Job Application',
    message: `${candidate.name} applied for "${job.title}".`,
    data: {
      applicationId: application._id,
      jobId: job._id,
      candidateId: candidate._id,
    },
  });

  return ApiResponse.created(res, { application }, 'Application submitted successfully');
});

/**
 * @desc    Get all applications submitted by candidate
 * @route   GET /api/v1/applications/my-applications
 * @access  Private (Candidate only)
 */
const getCandidateApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = { candidate: req.user._id };
  if (status) {
    query.status = status;
  }

  const [total, applications] = await Promise.all([
    Application.countDocuments(query),
    Application.find(query)
      .populate('job', 'title location workplaceType jobType company salary status')
      .populate('recruiter', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      applications,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'Candidate applications retrieved'
  );
});

/**
 * @desc    Get applications for recruiter's jobs
 * @route   GET /api/v1/applications/recruiter
 * @access  Private (Recruiter only)
 */
const getRecruiterApplications = asyncHandler(async (req, res) => {
  const { jobId, status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = { recruiter: req.user._id };
  if (jobId) query.job = jobId;
  if (status) query.status = status;

  const [total, applications] = await Promise.all([
    Application.countDocuments(query),
    Application.find(query)
      .populate('job', 'title location workplaceType category')
      .populate(
        'candidate',
        'name email phone location avatar candidateProfile.skills candidateProfile.experienceYears candidateProfile.headline'
      )
      .select('+recruiterNotes')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      applications,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'Applications retrieved'
  );
});

/**
 * @desc    Get application by ID
 * @route   GET /api/v1/applications/:id
 * @access  Private (Candidate, Recruiter, Admin)
 */
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('job', 'title location workplaceType category company salary status')
    .populate(
      'candidate',
      'name email phone location avatar candidateProfile'
    )
    .populate('recruiter', 'name email avatar recruiterProfile')
    .select('+recruiterNotes');

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  const isCandidate = application.candidate._id.toString() === req.user._id.toString();
  const isRecruiter = application.recruiter._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCandidate && !isRecruiter && !isAdmin) {
    throw ApiError.forbidden('Access denied to this application');
  }

  // If candidate is viewing, hide internal recruiter notes
  const appObj = application.toObject();
  if (isCandidate && !isRecruiter && !isAdmin) {
    delete appObj.recruiterNotes;
  }

  return ApiResponse.success(res, { application: appObj }, 'Application retrieved');
});

/**
 * @desc    Update application status (Reviewing, Shortlisted, Rejected, Accepted)
 * @route   PATCH /api/v1/applications/:id/status
 * @access  Private (Recruiter only)
 */
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, feedback, recruiterNotes } = req.body;

  const application = await Application.findById(req.params.id).populate('job', 'title');

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  if (application.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to update this application.');
  }

  application.status = status;
  if (feedback !== undefined) application.feedback = feedback;
  if (recruiterNotes !== undefined) application.recruiterNotes = recruiterNotes;
  application.statusUpdatedAt = Date.now();

  await application.save();

  // Send real-time notification to the candidate
  await sendNotification({
    recipientId: application.candidate,
    senderId: req.user._id,
    type: 'APPLICATION_STATUS_UPDATED',
    title: 'Application Status Update',
    message: `Your application status for "${application.job?.title || 'Job'}" was updated to "${status}".`,
    data: {
      applicationId: application._id,
      jobId: application.job?._id,
      status,
      feedback: feedback || '',
    },
  });

  return ApiResponse.success(res, { application }, `Application status updated to ${status}`);
});

/**
 * @desc    Withdraw an application
 * @route   DELETE /api/v1/applications/:id
 * @access  Private (Candidate only)
 */
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  if (application.candidate.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You are not authorized to withdraw this application.');
  }

  if (application.status !== 'Pending' && application.status !== 'Reviewing') {
    throw ApiError.badRequest('Applications that have been processed cannot be withdrawn.');
  }

  await Application.findByIdAndDelete(application._id);

  // Decrement application count
  await Job.findByIdAndUpdate(application.job, { $inc: { applicationsCount: -1 } });

  return ApiResponse.success(res, null, 'Application withdrawn successfully');
});

module.exports = {
  applyJob,
  getCandidateApplications,
  getRecruiterApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
};
