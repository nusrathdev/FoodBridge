const { body } = require('express-validator');

const createTaskValidator = [
    body('food_post_id')
        .trim()
        .notEmpty()
        .withMessage('food_post_id is required'),
    body('volunteer_id')
        .trim()
        .notEmpty()
        .withMessage('volunteer_id is required'),
    // optional suggested destination; the volunteer makes the final choice
    body('recipient_id').optional({ checkFalsy: true }).trim(),
];

// const updateTaskStatusValidator = [
//     body('status')
//         .isIn(['collected', 'delivered', 'cancelled'])
//         .withMessage('status must be collected, delivered, or cancelled'),
// ];
const updateTaskStatusValidator = [
    body('status')
        .isIn(['collected', 'delivered', 'cancelled'])
        .withMessage('status must be collected, delivered or cancelled'),

    // Delivery details, only checked when the volunteer marks the task delivered.
    // Who received it is either recipient_id (from the list) or recipient_group (typed in);
    // the controller checks that one of the two is present.
    body('quantity_distributed')
        .if(body('status').equals('delivered'))
        .trim()
        .notEmpty().withMessage('quantity_distributed is required')
        .isLength({ max: 100 }).withMessage('quantity_distributed must be at most 100 characters'),
    body('recipient_id').optional({ checkFalsy: true }).trim(),
    body('recipient_group').optional({ checkFalsy: true }).trim()
        .isLength({ max: 200 }).withMessage('recipient_group must be at most 200 characters'),
    body('notes').optional({ checkFalsy: true }).trim()
        .isLength({ max: 1000 }).withMessage('notes must be at most 1000 characters'),
];

module.exports = { createTaskValidator, updateTaskStatusValidator };