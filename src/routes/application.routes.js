const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  updateApplicationStatusSchema,
} = require('../validations/application.validation');

// Candidate routes
router.get(
  '/my-applications',
  protect,
  authorize('candidate'),
  applicationController.getCandidateApplications
);

// Recruiter routes
router.get(
  '/recruiter',
  protect,
  authorize('recruiter'),
  applicationController.getRecruiterApplications
);

// Application details
router.get('/:id', protect, applicationController.getApplicationById);

// Update status (Recruiter or Admin)
router.patch(
  '/:id/status',
  protect,
  authorize('recruiter', 'admin'),
  validate(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus
);

// Withdraw application (Candidate only)
router.delete(
  '/:id',
  protect,
  authorize('candidate'),
  applicationController.withdrawApplication
);

module.exports = router;
