const express = require('express');
const router = express.Router();
const { createDistribution, listDistributions } = require('../controllers/distribution.controller');
const { createDistributionValidator } = require('../validators/distribution.validator');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, requireRole('admin'), createDistributionValidator, createDistribution);
router.get('/', verifyToken, requireRole('admin'), listDistributions);

module.exports = router;