const express = require('express');
const router = express.Router();
const savedJobController = require('../controllers/savedJob.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.use(protect, authorize('candidate'));

router.get('/', savedJobController.getSavedJobs);
router.post('/:jobId', savedJobController.saveJob);
router.delete('/:jobId', savedJobController.unsaveJob);

module.exports = router;
