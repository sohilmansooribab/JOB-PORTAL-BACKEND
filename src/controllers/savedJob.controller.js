const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Save/Bookmark a job
 * @route   POST /api/v1/saved-jobs/:jobId
 * @access  Private (Candidate only)
 */
const saveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    throw ApiError.notFound('Job not found');
  }

  const existing = await SavedJob.findOne({
    candidate: req.user._id,
    job: jobId,
  });

  if (existing) {
    return ApiResponse.success(res, { savedJob: existing }, 'Job is already saved');
  }

  const savedJob = await SavedJob.create({
    candidate: req.user._id,
    job: jobId,
  });

  return ApiResponse.created(res, { savedJob }, 'Job saved successfully');
});

/**
 * @desc    Remove job from saved list
 * @route   DELETE /api/v1/saved-jobs/:jobId
 * @access  Private (Candidate only)
 */
const unsaveJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  await SavedJob.findOneAndDelete({
    candidate: req.user._id,
    job: jobId,
  });

  return ApiResponse.success(res, null, 'Job removed from saved list');
});

/**
 * @desc    Get candidate's saved jobs list
 * @route   GET /api/v1/saved-jobs
 * @access  Private (Candidate only)
 */
const getSavedJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [total, savedJobs] = await Promise.all([
    SavedJob.countDocuments({ candidate: req.user._id }),
    SavedJob.find({ candidate: req.user._id })
      .populate({
        path: 'job',
        populate: { path: 'recruiter', select: 'name email avatar' },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      savedJobs,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'Saved jobs retrieved'
  );
});

module.exports = {
  saveJob,
  unsaveJob,
  getSavedJobs,
};
