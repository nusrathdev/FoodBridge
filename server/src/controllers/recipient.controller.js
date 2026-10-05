const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// GET /api/recipients
//   admin: every recipient, active first, with how often each has received food
//   volunteer: only active recipients, to choose from when delivering
const listRecipients = async (req, res) => {
    try {
        if (req.user.role === 'volunteer') {
            const [rows] = await pool.execute(
                'SELECT id, name, address FROM recipients WHERE active = TRUE ORDER BY name'
            );
            return res.json(rows);
        }

        const [rows] = await pool.execute(`
      SELECT r.id, r.name, r.address, r.contact_phone, r.active, r.created_at,
             COUNT(dist.id) AS deliveries
      FROM recipients r
      LEFT JOIN distributions dist ON dist.recipient_id = r.id
      GROUP BY r.id, r.name, r.address, r.contact_phone, r.active, r.created_at
      ORDER BY r.active DESC, r.name ASC
    `);
        // BOOLEAN is a TINYINT in MySQL, so it arrives as 1/0
        res.json(rows.map(r => ({ ...r, active: Boolean(r.active) })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/recipients  (admin only)
const createRecipient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, address, contact_phone } = req.body;
    try {
        const id = uuidv4();
        await pool.execute(
            'INSERT INTO recipients (id, name, address, contact_phone) VALUES (?, ?, ?, ?)',
            [id, name, address, contact_phone || null]
        );
        await pool.execute(
            'INSERT INTO audit_logs (id, actor_id, action, entity, entity_id) VALUES (UUID(), ?, ?, ?, ?)',
            [req.user.id, 'recipient_created', 'recipients', id]
        );
        res.status(201).json({ message: 'Recipient added', id });
    } catch (err) {
        // Names are unique so the destination list on the assignment screen is never ambiguous.
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: 'A recipient with this name already exists' });
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PATCH /api/recipients/:id  (admin only) — body: { active: true | false }
// Recipients are retired rather than deleted, because tasks and distributions point at them.
const setRecipientActive = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { active } = req.body;
    try {
        const [result] = await pool.execute(
            'UPDATE recipients SET active = ? WHERE id = ?', [active, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Recipient not found' });

        await pool.execute(
            'INSERT INTO audit_logs (id, actor_id, action, entity, entity_id) VALUES (UUID(), ?, ?, ?, ?)',
            [req.user.id, active ? 'recipient_reactivated' : 'recipient_deactivated', 'recipients', req.params.id]
        );
        res.json({ message: active ? 'Recipient reactivated' : 'Recipient deactivated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { listRecipients, createRecipient, setRecipientActive };
