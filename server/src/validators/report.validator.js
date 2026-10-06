const { query } = require('express-validator');

// ?from= and ?to= are both optional, but if sent they must be real dates (2026-06-30 or a full ISO timestamp).
const dateRangeValidator = [
    query('from').optional({ checkFalsy: true }).isISO8601().withMessage('from must be a valid date'),
    query('to').optional({ checkFalsy: true }).isISO8601().withMessage('to must be a valid date'),
];

module.exports = { dateRangeValidator };
