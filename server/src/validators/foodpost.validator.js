const { body } = require('express-validator');

const createFoodPostValidator = [
    body('food_type').trim().notEmpty().withMessage('food_type is required'),
    body('quantity').trim().notEmpty().withMessage('quantity is required'),
    body('pickup_address').trim().notEmpty().withMessage('pickup_address is required'),
    body('pickup_window_start').isISO8601().withMessage('pickup_window_start must be a valid date'),
    body('pickup_window_end').isISO8601().withMessage('pickup_window_end must be a valid date'),
];

module.exports = { createFoodPostValidator };