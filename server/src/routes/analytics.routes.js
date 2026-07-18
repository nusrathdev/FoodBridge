const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/analytics.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/summary', verifyToken, requireRole('admin'), getSummary);

module.exports = router;