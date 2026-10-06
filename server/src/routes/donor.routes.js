const express = require('express');
const router = express.Router();
const { listDonors, myStatus, verifyDonor } = require('../controllers/donor.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/me', verifyToken, requireRole('donor'), myStatus);
router.get('/', verifyToken, requireRole('admin'), listDonors);
router.patch('/:id/verify', verifyToken, requireRole('admin'), verifyDonor);

module.exports = router;