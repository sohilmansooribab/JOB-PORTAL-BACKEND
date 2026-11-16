const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const jobRoutes = require('./job.routes');
const applicationRoutes = require('./application.routes');
const adminRoutes = require('./admin.routes');
const reportRoutes = require('./report.routes');
const savedJobRoutes = require('./savedJob.routes');
const notificationRoutes = require('./notification.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Job Portal API is healthy and operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);
router.use('/saved-jobs', savedJobRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
