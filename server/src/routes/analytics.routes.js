const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/analytics.controller');
const { dateRangeValidator } = require('../validators/report.validator');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/summary', verifyToken, requireRole('admin'), dateRangeValidator, getSummary);

module.exports = router;