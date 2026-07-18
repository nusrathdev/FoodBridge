const { body } = require('express-validator');

const registerValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['donor', 'volunteer']).withMessage('Role must be donor or volunteer'),

    body('org_name')
        .if(body('role').equals('donor'))
        .trim()
        .notEmpty()
        .withMessage('org_name is required for donor registration'),

    // now optional — only validate format IF provided
    body('food_handling_cert')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ min: 4, max: 255 })
        .withMessage('food_handling_cert must be between 4 and 255 characters'),
];

const loginValidator = [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidator, loginValidator };