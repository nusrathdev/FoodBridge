const { body } = require('express-validator');

const createDistributionValidator = [
    body('task_id').trim().notEmpty().withMessage('task_id is required'),
    body('recipient_group').trim().notEmpty().withMessage('recipient_group is required')
        .isLength({ max: 200 }).withMessage('recipient_group must be at most 200 characters'),
    body('quantity_distributed').trim().notEmpty().withMessage('quantity_distributed is required')
        .isLength({ max: 100 }).withMessage('quantity_distributed must be at most 100 characters'),
    body('notes').optional({ checkFalsy: true }).trim(),
];

module.exports = { createDistributionValidator };
