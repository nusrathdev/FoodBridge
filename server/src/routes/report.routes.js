const express = require('express');
const router = express.Router();
const { exportCsv, exportPdf } = require('../controllers/report.controller');
const { dateRangeValidator } = require('../validators/report.validator');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/distributions.csv', verifyToken, requireRole('admin'), dateRangeValidator, exportCsv);
router.get('/distributions.pdf', verifyToken, requireRole('admin'), dateRangeValidator, exportPdf);

module.exports = router;