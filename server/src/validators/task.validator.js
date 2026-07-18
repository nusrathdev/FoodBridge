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
];

// const updateTaskStatusValidator = [
//     body('status')
//         .isIn(['collected', 'delivered', 'cancelled'])
//         .withMessage('status must be collected, delivered, or cancelled'),
// ];
const updateTaskStatusValidator = [
    body('status')
        .isIn(['collected', 'cancelled'])
        .withMessage('status must be collected or cancelled'),
];

module.exports = { createTaskValidator, updateTaskStatusValidator };