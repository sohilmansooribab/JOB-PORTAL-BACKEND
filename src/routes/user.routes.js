const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { uploadResume, uploadImage } = require('../middlewares/upload.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  updateProfileBasicSchema,
  updateCandidateProfileSchema,
  updateRecruiterProfileSchema,
} = require('../validations/user.validation');

// Public recruiter profile
router.get('/recruiter/:id', userController.getRecruiterPublicProfile);

// Secure resume download route
router.get('/resume/:filename', protect, userController.downloadResume);

// Authenticated routes
router.get('/:id', protect, userController.getUserProfile);
router.put('/profile/basic', protect, validate(updateProfileBasicSchema), userController.updateProfileBasic);
router.put(
  '/profile/candidate',
  protect,
  authorize('candidate'),
  validate(updateCandidateProfileSchema),
  userController.updateCandidateProfile
);
router.put(
  '/profile/recruiter',
  protect,
  authorize('recruiter'),
  validate(updateRecruiterProfileSchema),
  userController.updateRecruiterProfile
);
router.post(
  '/upload-resume',
  protect,
  authorize('candidate'),
  uploadLimiter,
  uploadResume.single('resume'),
  userController.uploadResume
);
router.post(
  '/upload-avatar',
  protect,
  uploadLimiter,
  uploadImage.single('avatar'),
  userController.uploadAvatar
);

module.exports = router;
