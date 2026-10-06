const { body } = require('express-validator');

// Column limits from schema.sql — checked here so an over-long value is a clean 400, not a MySQL error.
const FOOD_TYPE_MAX = 200;
const QUANTITY_MAX = 100;

const createFoodPostValidator = [
    body('food_type').trim().notEmpty().withMessage('food_type is required')
        .isLength({ max: FOOD_TYPE_MAX }).withMessage(`food_type must be at most ${FOOD_TYPE_MAX} characters`),
    body('quantity').trim().notEmpty().withMessage('quantity is required')
        .isLength({ max: QUANTITY_MAX }).withMessage(`quantity must be at most ${QUANTITY_MAX} characters`),
    body('pickup_address').trim().notEmpty().withMessage('pickup_address is required'),
    body('pickup_window_start').isISO8601().withMessage('pickup_window_start must be a valid date'),
    body('pickup_window_end').isISO8601().withMessage('pickup_window_end must be a valid date').bail()
        .custom((end, { req }) => {
            // A window that closes before it opens, or has already closed, can never be collected.
            if (new Date(end) <= new Date(req.body.pickup_window_start))
                throw new Error('pickup_window_end must be after pickup_window_start');
            if (new Date(end) <= new Date())
                throw new Error('pickup_window_end must be in the future');
            return true;
        }),
];

// Every field is optional on update, but a field that IS sent must still be valid.
// The start/end ordering is checked in the controller, where the stored values are known.
const updateFoodPostValidator = [
    body('food_type').optional().trim().notEmpty().withMessage('food_type cannot be empty')
        .isLength({ max: FOOD_TYPE_MAX }).withMessage(`food_type must be at most ${FOOD_TYPE_MAX} characters`),
    body('quantity').optional().trim().notEmpty().withMessage('quantity cannot be empty')
        .isLength({ max: QUANTITY_MAX }).withMessage(`quantity must be at most ${QUANTITY_MAX} characters`),
    body('pickup_address').optional().trim().notEmpty().withMessage('pickup_address cannot be empty'),
    body('pickup_window_start').optional().isISO8601().withMessage('pickup_window_start must be a valid date'),
    body('pickup_window_end').optional().isISO8601().withMessage('pickup_window_end must be a valid date'),
];

module.exports = { createFoodPostValidator, updateFoodPostValidator };
