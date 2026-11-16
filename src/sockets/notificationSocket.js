const { getIO } = require('./socketManager');
const Notification = require('../models/Notification');

/**
 * Create and send real-time notification to a user
 */
const sendNotification = async ({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  data = {},
}) => {
  try {
    // 1. Persist notification in database
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      data,
    });

    // 2. Emit real-time WebSocket event
    try {
      const io = getIO();
      io.to(`user_${recipientId.toString()}`).emit('notification:new', notification);
    } catch {
      // Socket might not be initialized during seed or background operations
    }

    return notification;
  } catch (error) {
    console.error('[Notification Socket Error]', error.message);
  }
};

/**
 * Emit real-time job broadcast
 */
const broadcastNewJob = (job) => {
  try {
    const io = getIO();
    io.emit('job:new', job);
  } catch {
    // Silently ignore if socket not ready
  }
};

/**
 * Emit alert to admins
 */
const notifyAdmins = (event, payload) => {
  try {
    const io = getIO();
    io.to('admin_channel').emit(event, payload);
  } catch {
    // Silently ignore if socket not ready
  }
};

module.exports = {
  sendNotification,
  broadcastNewJob,
  notifyAdmins,
};
