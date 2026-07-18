const express = require('express');
const router = express.Router();
const { exportCsv, exportPdf } = require('../controllers/report.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/distributions.csv', verifyToken, requireRole('admin'), exportCsv);
router.get('/distributions.pdf', verifyToken, requireRole('admin'), exportPdf);

module.exports = router;