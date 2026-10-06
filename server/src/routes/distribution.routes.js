const express = require('express');
const router = express.Router();
const { listDistributions } = require('../controllers/distribution.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('admin'), listDistributions);

module.exports = router;