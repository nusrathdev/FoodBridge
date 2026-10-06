const express = require('express');
const router = express.Router();
const { listVolunteers } = require('../controllers/volunteer.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('admin'), listVolunteers);

module.exports = router;