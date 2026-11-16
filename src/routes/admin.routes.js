const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateReportStatusSchema } = require('../validations/report.validation');

// All admin routes require authentication and admin role
router.use(protect, authorize('admin'));

router.get('/analytics', adminController.getSystemAnalytics);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/block', adminController.toggleBlockUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/jobs', adminController.getAllJobs);
router.delete('/jobs/:id', adminController.deleteJobByAdmin);

router.get('/reports', adminController.getAllReports);
router.patch(
  '/reports/:id',
  validate(updateReportStatusSchema),
  adminController.updateReportStatus
);

module.exports = router;
