const { body } = require('express-validator');

const createDistributionValidator = [
    body('task_id').trim().notEmpty().withMessage('task_id is required'),
    body('recipient_group').trim().notEmpty().withMessage('recipient_group is required'),
    body('quantity_distributed').trim().notEmpty().withMessage('quantity_distributed is required'),
    body('notes').optional({ checkFalsy: true }).trim(),
];

module.exports = { createDistributionValidator };