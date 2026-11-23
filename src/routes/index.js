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

// API root info
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Job Portal API v1',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      jobs: '/api/v1/jobs',
      applications: '/api/v1/applications',
      savedJobs: '/api/v1/saved-jobs',
      notifications: '/api/v1/notifications',
      reports: '/api/v1/reports',
      admin: '/api/v1/admin',
    },
  });
});

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
