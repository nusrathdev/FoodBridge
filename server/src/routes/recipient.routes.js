const express = require('express');
const router = express.Router();
const { listRecipients, createRecipient, setRecipientActive } = require('../controllers/recipient.controller');
const { createRecipientValidator, setRecipientActiveValidator } = require('../validators/recipient.validator');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('admin', 'volunteer'), listRecipients);
router.post('/', verifyToken, requireRole('admin'), createRecipientValidator, createRecipient);
router.patch('/:id', verifyToken, requireRole('admin'), setRecipientActiveValidator, setRecipientActive);

module.exports = router;
