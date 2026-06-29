const pool = require('../config/db');

// GET /api/donors  (admin only, optional ?status= filter)
const listDonors = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
      SELECT d.id, d.org_name, d.food_handling_cert, d.status, d.rejection_reason,
             u.name, u.email
      FROM donors d
      JOIN users u ON u.id = d.user_id
    `;
        const params = [];

        if (status) {
            query += ' WHERE d.status = ?';
            params.push(status);
        }

        const [donors] = await pool.execute(query, params);
        res.json(donors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/donors/me  (donor only)
const myStatus = async (req, res) => {
    try {
        const [[donor]] = await pool.execute(
            'SELECT id, org_name, status, rejection_reason FROM donors WHERE user_id = ?',
            [req.user.id]
        );
        if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
        res.json(donor);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PATCH /api/donors/:id/verify  (admin only)
const verifyDonor = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, reason } = req.body; // decision: 'approved' | 'rejected'

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ error: 'decision must be approved or rejected' });
        }
        if (decision === 'rejected' && !reason) {
            return res.status(400).json({ error: 'reason is required when rejecting' });
        }

        const [[donor]] = await pool.execute('SELECT * FROM donors WHERE id = ?', [id]);
        if (!donor) return res.status(404).json({ error: 'Donor not found' });

        await pool.execute(
            'UPDATE donors SET status = ?, rejection_reason = ?, verified_at = NOW() WHERE id = ?',
            [decision, decision === 'rejected' ? reason : null, id]
        );

        // audit log
        await pool.execute(
            'INSERT INTO audit_logs (id, actor_id, action, entity, entity_id) VALUES (UUID(), ?, ?, ?, ?)',
            [req.user.id, `donor_${decision}`, 'donors', id]
        );

        res.json({ message: `Donor ${decision}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { listDonors, myStatus, verifyDonor };