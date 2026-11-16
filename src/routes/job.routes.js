const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const applicationController = require('../controllers/application.controller');
const { protect, optionalAuth } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { uploadResume } = require('../middlewares/upload.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
} = require('../validations/job.validation');
const { applyJobSchema } = require('../validations/application.validation');

// Public routes (with optional auth to detect saved/applied status)
router.get('/', optionalAuth, validate(jobQuerySchema), jobController.getJobs);
router.get('/categories', jobController.getJobCategories);

// Recruiter specific routes
router.get(
  '/recruiter/my-jobs',
  protect,
  authorize('recruiter'),
  jobController.getRecruiterJobs
);

router.post(
  '/',
  protect,
  authorize('recruiter'),
  validate(createJobSchema),
  jobController.createJob
);

router.get('/:id', optionalAuth, jobController.getJobById);

router.put(
  '/:id',
  protect,
  authorize('recruiter', 'admin'),
  validate(updateJobSchema),
  jobController.updateJob
);

router.delete(
  '/:id',
  protect,
  authorize('recruiter', 'admin'),
  jobController.deleteJob
);

// Apply for a job route
router.post(
  '/:jobId/apply',
  protect,
  authorize('candidate'),
  uploadLimiter,
  uploadResume.single('resume'),
  validate(applyJobSchema),
  applicationController.applyJob
);

module.exports = router;
