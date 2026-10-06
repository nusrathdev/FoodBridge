const express = require('express');
const router = express.Router();
const { createTask, listTasks, updateTaskStatus } = require('../controllers/task.controller');
const { createTaskValidator, updateTaskStatusValidator } = require('../validators/task.validator');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, requireRole('admin'), createTaskValidator, createTask);
router.get('/', verifyToken, requireRole('admin', 'volunteer'), listTasks);
router.patch('/:id/status', verifyToken, requireRole('volunteer'), updateTaskStatusValidator, updateTaskStatus);

module.exports = router;