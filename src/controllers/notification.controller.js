const Notification = require('../models/Notification');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') {
    query.read = false;
  }

  const [total, unreadCount, notifications] = await Promise.all([
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.user._id, read: false }),
    Notification.find(query)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  return ApiResponse.success(
    res,
    {
      notifications,
      unreadCount,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    },
    'Notifications retrieved'
  );
});

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  notification.read = true;
  await notification.save();

  return ApiResponse.success(res, { notification }, 'Notification marked as read');
});

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });

  return ApiResponse.success(res, null, 'All notifications marked as read');
});

/**
 * @desc    Get count of unread notifications
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false });

  return ApiResponse.success(res, { unreadCount: count }, 'Unread notifications count');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
