const { body } = require('express-validator');

const createRecipientValidator = [
    body('name').trim().notEmpty().withMessage('name is required')
        .isLength({ max: 200 }).withMessage('name must be at most 200 characters'),
    body('address').trim().notEmpty().withMessage('address is required')
        .isLength({ max: 500 }).withMessage('address must be at most 500 characters'),
    body('contact_phone').optional({ checkFalsy: true }).trim()
        .isLength({ max: 50 }).withMessage('contact_phone must be at most 50 characters')
        .matches(/^[0-9+()\-\s]+$/).withMessage('contact_phone may only contain digits, spaces, +, - and brackets'),
];

const setRecipientActiveValidator = [
    body('active').isBoolean({ strict: true }).withMessage('active must be true or false').toBoolean(true),
];

module.exports = { createRecipientValidator, setRecipientActiveValidator };
