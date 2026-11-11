const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Report = require('../models/Report');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { clearCachePattern } = require('../utils/cache');

/**
 * @desc    Get system-wide metrics and analytics
 * @route   GET /api/v1/admin/analytics
 * @access  Private (Admin only)
 */
const getSystemAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCandidates,
    totalRecruiters,
    blockedUsers,
    totalJobs,
    activeJobs,
    closedJobs,
    totalApplications,
    pendingReports,
    applicationsByStatus,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'candidate' }),
    User.countDocuments({ role: 'recruiter' }),
    User.countDocuments({ isBlocked: true }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'Active' }),
    Job.countDocuments({ status: 'Closed' }),
    Application.countDocuments(),
    Report.countDocuments({ status: 'Pending' }),
    Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const appStatusSummary = {};
  applicationsByStatus.forEach((item) => {
    appStatusSummary[item._id] = item.count;
  });

  return ApiResponse.success(
    res,
    {
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        recruiters: totalRecruiters,
        blocked: blockedUsers,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        closed: closedJobs,
      },
      applications: {
        total: totalApplications,
        byStatus: appStatusSummary,
      },
      moderation: {
        pendingReports,
      },
    },
    'System analytics retrieved'
  );
});

/**
 * @desc    Get all users with search, filtering and pagination
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isBlocked, search, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (role) query.role = role;
  if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { email: regex }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      users,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'Users list retrieved'
  );
});

/**
 * @desc    Block or unblock a user
 * @route   PATCH /api/v1/admin/users/:id/block
 * @access  Private (Admin only)
 */
const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Prevent admin from blocking self
  if (user._id.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot block your own account.');
  }

  // Toggle or set block status
  const blockState = req.body.isBlocked !== undefined ? req.body.isBlocked : !user.isBlocked;
  user.isBlocked = blockState;
  await user.save();

  return ApiResponse.success(
    res,
    { user },
    `User has been ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`
  );
});

/**
 * @desc    Delete user account and related records
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot delete your own admin account.');
  }

  // Clean up associated records
  if (user.role === 'recruiter') {
    await Job.deleteMany({ recruiter: user._id });
    await Application.deleteMany({ recruiter: user._id });
  } else if (user.role === 'candidate') {
    await Application.deleteMany({ candidate: user._id });
  }

  await User.findByIdAndDelete(user._id);
  await clearCachePattern('jobs:*');

  return ApiResponse.success(res, null, 'User and associated data deleted successfully');
});

/**
 * @desc    Get all jobs (including draft and closed)
 * @route   GET /api/v1/admin/jobs
 * @access  Private (Admin only)
 */
const getAllJobs = asyncHandler(async (req, res) => {
  const { status, category, search, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ title: regex }, { 'company.name': regex }];
  }

  const [total, jobs] = await Promise.all([
    Job.countDocuments(query),
    Job.find(query)
      .populate('recruiter', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      jobs,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'All jobs retrieved'
  );
});

/**
 * @desc    Delete a job by Admin (Content moderation)
 * @route   DELETE /api/v1/admin/jobs/:id
 * @access  Private (Admin only)
 */
const deleteJobByAdmin = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    throw ApiError.notFound('Job not found');
  }

  await Job.findByIdAndDelete(job._id);
  await Application.deleteMany({ job: job._id });
  await clearCachePattern('jobs:*');

  return ApiResponse.success(res, null, 'Job removed by administrator');
});

/**
 * @desc    Get all reports
 * @route   GET /api/v1/admin/reports
 * @access  Private (Admin only)
 */
const getAllReports = asyncHandler(async (req, res) => {
  const { status, targetType, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;

  const [total, reports] = await Promise.all([
    Report.countDocuments(query),
    Report.find(query)
      .populate('reporter', 'name email avatar')
      .populate('targetJob', 'title company status')
      .populate('targetUser', 'name email role isBlocked')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      reports,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'Reports retrieved'
  );
});

/**
 * @desc    Update report status (Resolve / Dismiss)
 * @route   PATCH /api/v1/admin/reports/:id
 * @access  Private (Admin only)
 */
const updateReportStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw ApiError.notFound('Report not found');
  }

  report.status = status;
  if (adminNotes !== undefined) report.adminNotes = adminNotes;
  report.resolvedBy = req.user._id;
  report.resolvedAt = Date.now();

  await report.save();

  return ApiResponse.success(res, { report }, `Report status updated to ${status}`);
});

module.exports = {
  getSystemAnalytics,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getAllJobs,
  deleteJobByAdmin,
  getAllReports,
  updateReportStatus,
};
