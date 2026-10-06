const { validationResult } = require('express-validator');
const { getSummaryMetrics } = require('../services/reporting.service');

// GET /api/analytics/summary?from=2026-01-01&to=2026-06-30  (admin only)
const getSummary = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { from, to } = req.query;
        const summary = await getSummaryMetrics({ from, to });
        res.json(summary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getSummary };