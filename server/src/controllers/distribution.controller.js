const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// POST /api/distributions  (admin only)
const createDistribution = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { task_id, recipient_group, quantity_distributed, notes } = req.body;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [[task]] = await conn.execute(
            'SELECT * FROM collection_tasks WHERE id = ? FOR UPDATE',
            [task_id]
        );
        if (!task) {
            await conn.rollback();
            return res.status(404).json({ error: 'Task not found' });
        }
        if (task.status !== 'collected') {
            await conn.rollback();
            return res.status(409).json({
                error: `Task must be in "collected" status before logging a distribution (currently "${task.status}")`
            });
        }

        // One distribution per task — prevents duplicate/double-logged entries.
        const [[existingDist]] = await conn.execute(
            'SELECT id FROM distributions WHERE task_id = ?',
            [task_id]
        );
        if (existingDist) {
            await conn.rollback();
            return res.status(409).json({ error: 'A distribution has already been logged for this task' });
        }

        const distId = uuidv4();
        await conn.execute(
            `INSERT INTO distributions (id, task_id, recipient_group, quantity_distributed, distributed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [distId, task_id, recipient_group, quantity_distributed, req.user.id, notes || null]
        );

        // Move the task to delivered (completes its lifecycle) and the food post to distributed.
        await conn.execute(
            `UPDATE collection_tasks SET status = 'delivered', delivered_at = NOW() WHERE id = ?`,
            [task_id]
        );
        await conn.execute(
            `UPDATE food_posts SET status = 'distributed' WHERE id = ?`,
            [task.food_post_id]
        );

        await conn.execute(
            'INSERT INTO audit_logs (id, actor_id, action, entity, entity_id) VALUES (UUID(), ?, ?, ?, ?)',
            [req.user.id, 'distribution_logged', 'distributions', distId]
        );

        await conn.commit();
        res.status(201).json({ message: 'Distribution logged', id: distId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
};

// GET /api/distributions  (admin only)
const listDistributions = async (req, res) => {
    try {
        const [rows] = await pool.execute(`
      SELECT
        dist.id, dist.recipient_group, dist.quantity_distributed,
        dist.distributed_at, dist.notes,
        fp.food_type, fp.quantity AS original_quantity,
        donor.org_name AS donor_org,
        vol.name AS collected_by_volunteer,
        admin.name AS logged_by_admin
      FROM distributions dist
      JOIN collection_tasks t ON t.id = dist.task_id
      JOIN food_posts fp ON fp.id = t.food_post_id
      JOIN donors donor ON donor.id = fp.donor_id
      JOIN users vol ON vol.id = t.volunteer_id
      JOIN users admin ON admin.id = dist.distributed_by
      ORDER BY dist.distributed_at DESC
    `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createDistribution, listDistributions };