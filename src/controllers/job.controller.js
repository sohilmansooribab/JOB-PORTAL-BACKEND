const Job = require('../models/Job');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getCache, setCache, clearCachePattern } = require('../utils/cache');
const { broadcastNewJob } = require('../sockets/notificationSocket');

/**
 * @desc    Create a new job posting
 * @route   POST /api/v1/jobs
 * @access  Private (Recruiter only)
 */
const createJob = asyncHandler(async (req, res) => {
  const recruiter = req.user;

  // Use recruiter profile company details as default
  const companyInfo = {
    name: recruiter.recruiterProfile?.companyName || recruiter.name,
    logo: recruiter.recruiterProfile?.companyLogo || recruiter.avatar || '',
    website: recruiter.recruiterProfile?.companyWebsite || '',
    location: recruiter.recruiterProfile?.location || recruiter.location || req.body.location,
  };

  const jobData = {
    ...req.body,
    recruiter: recruiter._id,
    company: companyInfo,
  };

  const job = await Job.create(jobData);

  // Invalidate Redis job caches
  await clearCachePattern('jobs:*');

  // Broadcast new job via WebSockets
  broadcastNewJob({
    id: job._id,
    title: job.title,
    company: job.company.name,
    location: job.location,
    jobType: job.jobType,
    workplaceType: job.workplaceType,
    createdAt: job.createdAt,
  });

  return ApiResponse.created(res, { job }, 'Job created successfully');
});

/**
 * @desc    Get all jobs with advanced search, filter, and pagination
 * @route   GET /api/v1/jobs
 * @access  Public (Optional auth for bookmarks / applied status)
 */
const getJobs = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    workplaceType,
    jobType,
    experienceLevel,
    location,
    minSalary,
    maxSalary,
    page = 1,
    limit = 10,
    sort = 'newest',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Build filter query
  const query = { status: 'Active' };

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { 'company.name': searchRegex },
      { skillsRequired: { $in: [searchRegex] } },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (workplaceType) {
    query.workplaceType = workplaceType;
  }

  if (jobType) {
    query.jobType = jobType;
  }

  if (experienceLevel) {
    query.experienceLevel = experienceLevel;
  }

  if (location) {
    query.location = new RegExp(location.trim(), 'i');
  }

  if (minSalary || maxSalary) {
    query['salary.max'] = {};
    if (minSalary) query['salary.max'].$gte = Number(minSalary);
    if (maxSalary) query['salary.min'] = { $lte: Number(maxSalary) };
  }

  // Sort options
  let sortCriteria = { createdAt: -1 };
  if (sort === 'oldest') {
    sortCriteria = { createdAt: 1 };
  } else if (sort === 'salary_high') {
    sortCriteria = { 'salary.max': -1, createdAt: -1 };
  } else if (sort === 'salary_low') {
    sortCriteria = { 'salary.min': 1, createdAt: -1 };
  }

  // Cache key for anonymous search
  const cacheKey = `jobs:${JSON.stringify(req.query)}:p${pageNum}:l${limitNum}`;
  let cachedData = null;

  if (!req.user) {
    cachedData = await getCache(cacheKey);
    if (cachedData) {
      return ApiResponse.success(res, cachedData, 'Jobs retrieved from cache');
    }
  }

  const [totalJobs, jobs] = await Promise.all([
    Job.countDocuments(query),
    Job.find(query)
      .populate('recruiter', 'name email avatar recruiterProfile.companyName')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const totalPages = Math.ceil(totalJobs / limitNum);

  // If candidate is logged in, attach isSaved and hasApplied status
  let enrichedJobs = jobs;
  if (req.user && req.user.role === 'candidate') {
    const jobIds = jobs.map((j) => j._id);
    const [savedJobs, userApplications] = await Promise.all([
      SavedJob.find({ candidate: req.user._id, job: { $in: jobIds } }).select('job'),
      Application.find({ candidate: req.user._id, job: { $in: jobIds } }).select('job status'),
    ]);

    const savedSet = new Set(savedJobs.map((s) => s.job.toString()));
    const appliedMap = new Map(userApplications.map((a) => [a.job.toString(), a.status]));

    enrichedJobs = jobs.map((j) => ({
      ...j,
      isSaved: savedSet.has(j._id.toString()),
      hasApplied: appliedMap.has(j._id.toString()),
      applicationStatus: appliedMap.get(j._id.toString()) || null,
    }));
  }

  const resultData = {
    jobs: enrichedJobs,
    pagination: {
      totalJobs,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    },
  };

  // Cache public anonymous results for 2 minutes
  if (!req.user) {
    await setCache(cacheKey, resultData, 120);
  }

  return ApiResponse.success(res, resultData, 'Jobs retrieved successfully');
});

/**
 * @desc    Get job details by ID
 * @route   GET /api/v1/jobs/:id
 * @access  Public (Optional auth for application status)
 */
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    'recruiter',
    'name email avatar recruiterProfile'
  );

  if (!job) {
    throw ApiError.notFound('Job posting not found');
  }

  // Increment views count asynchronously
  Job.findByIdAndUpdate(job._id, { $inc: { viewsCount: 1 } }).exec();

  const jobObject = job.toObject();

  // If candidate logged in, check if saved or applied
  if (req.user && req.user.role === 'candidate') {
    const [saved, application] = await Promise.all([
      SavedJob.findOne({ candidate: req.user._id, job: job._id }),
      Application.findOne({ candidate: req.user._id, job: job._id }),
    ]);

    jobObject.isSaved = Boolean(saved);
    jobObject.hasApplied = Boolean(application);
    jobObject.applicationStatus = application?.status || null;
  }

  return ApiResponse.success(res, { job: jobObject }, 'Job details retrieved');
});

/**
 * @desc    Update a job posting
 * @route   PUT /api/v1/jobs/:id
 * @access  Private (Recruiter only)
 */
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw ApiError.notFound('Job not found');
  }

  // Check ownership
  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to update this job posting.');
  }

  Object.assign(job, req.body);
  await job.save();

  // Invalidate cache
  await clearCachePattern('jobs:*');

  return ApiResponse.success(res, { job }, 'Job updated successfully');
});

/**
 * @desc    Delete a job posting
 * @route   DELETE /api/v1/jobs/:id
 * @access  Private (Recruiter or Admin)
 */
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw ApiError.notFound('Job not found');
  }

  // Check ownership
  if (job.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('You are not authorized to delete this job posting.');
  }

  await Job.findByIdAndDelete(job._id);
  await clearCachePattern('jobs:*');

  return ApiResponse.success(res, null, 'Job deleted successfully');
});

/**
 * @desc    Get recruiter's own posted jobs
 * @route   GET /api/v1/jobs/recruiter/my-jobs
 * @access  Private (Recruiter only)
 */
const getRecruiterJobs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = { recruiter: req.user._id };
  if (status) {
    query.status = status;
  }

  const [totalJobs, jobs] = await Promise.all([
    Job.countDocuments(query),
    Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      jobs,
      pagination: {
        totalJobs,
        totalPages: Math.ceil(totalJobs / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'Recruiter jobs retrieved'
  );
});

/**
 * @desc    Get available job categories and counts
 * @route   GET /api/v1/jobs/categories
 * @access  Public
 */
const getJobCategories = asyncHandler(async (req, res) => {
  const cachedCategories = await getCache('job_categories');
  if (cachedCategories) {
    return ApiResponse.success(res, cachedCategories, 'Job categories retrieved from cache');
  }

  const categories = await Job.aggregate([
    { $match: { status: 'Active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const formatted = categories.map((cat) => ({
    name: cat._id,
    count: cat.count,
  }));

  await setCache('job_categories', formatted, 300);

  return ApiResponse.success(res, formatted, 'Job categories retrieved');
});

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getRecruiterJobs,
  getJobCategories,
};
