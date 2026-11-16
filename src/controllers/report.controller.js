const Report = require('../models/Report');
const Job = require('../models/Job');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { notifyAdmins } = require('../sockets/notificationSocket');

/**
 * @desc    Submit a report for inappropriate job or suspicious user
 * @route   POST /api/v1/reports
 * @access  Private
 */
const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetJob, targetUser, reason, description } = req.body;

  if (targetType === 'Job') {
    if (!targetJob) {
      throw ApiError.badRequest('Target job ID is required when reporting a job.');
    }
    const jobExists = await Job.findById(targetJob);
    if (!jobExists) {
      throw ApiError.notFound('Reported job does not exist.');
    }
  } else if (targetType === 'User') {
    if (!targetUser) {
      throw ApiError.badRequest('Target user ID is required when reporting a user.');
    }
    const userExists = await User.findById(targetUser);
    if (!userExists) {
      throw ApiError.notFound('Reported user does not exist.');
    }
  }

  const report = await Report.create({
    reporter: req.user._id,
    targetType,
    targetJob,
    targetUser,
    reason,
    description,
  });

  // Notify admins in real-time
  notifyAdmins('report:new', {
    reportId: report._id,
    reporter: req.user.name,
    targetType,
    reason,
    createdAt: report.createdAt,
  });

  return ApiResponse.created(res, { report }, 'Report submitted successfully. Our team will review it.');
});

/**
 * @desc    Get reports filed by current user
 * @route   GET /api/v1/reports/my-reports
 * @access  Private
 */
const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id })
    .populate('targetJob', 'title company')
    .populate('targetUser', 'name email role')
    .sort({ createdAt: -1 });

  return ApiResponse.success(res, { reports }, 'My submitted reports');
});

module.exports = {
  createReport,
  getMyReports,
};
