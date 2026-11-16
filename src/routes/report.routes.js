const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createReportSchema } = require('../validations/report.validation');

router.post('/', protect, validate(createReportSchema), reportController.createReport);
router.get('/my-reports', protect, reportController.getMyReports);

module.exports = router;
