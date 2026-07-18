const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// Legal forward-only transitions. Anything not listed here is rejected.
// const ALLOWED_TRANSITIONS = {
//     assigned: ['collected', 'cancelled'],
//     collected: ['delivered'],
//     delivered: [], // terminal state — no further changes
//     cancelled: [], // terminal state
// };

const ALLOWED_TRANSITIONS = {
    assigned: ['collected', 'cancelled'],
    collected: [], // delivered is now only set via POST /api/distributions, not by the volunteer directly
    delivered: [],
    cancelled: [],
};

// POST /api/tasks  (admin only)
const createTask = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { food_post_id, volunteer_id } = req.body;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Lock the food post row so two admins can't assign it at the same instant.
        const [[post]] = await conn.execute(
            'SELECT * FROM food_posts WHERE id = ? FOR UPDATE',
            [food_post_id]
        );
        if (!post) {
            await conn.rollback();
            return res.status(404).json({ error: 'Food post not found' });
        }
        if (post.status !== 'available') {
            await conn.rollback();
            return res.status(409).json({ error: `Food post is ${post.status}, not available for assignment` });
        }

        // Confirm the target user actually exists and is a volunteer.
        const [[volunteer]] = await conn.execute(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [volunteer_id, 'volunteer']
        );
        if (!volunteer) {
            await conn.rollback();
            return res.status(404).json({ error: 'Volunteer not found' });
        }

        const taskId = uuidv4();
        await conn.execute(
            `INSERT INTO collection_tasks (id, food_post_id, volunteer_id, assigned_by, status)
       VALUES (?, ?, ?, ?, 'assigned')`,
            [taskId, food_post_id, volunteer_id, req.user.id]
        );

        await conn.execute(
            'UPDATE food_posts SET status = ? WHERE id = ?',
            ['assigned', food_post_id]
        );

        await conn.execute(
            'INSERT INTO audit_logs (id, actor_id, action, entity, entity_id) VALUES (UUID(), ?, ?, ?, ?)',
            [req.user.id, 'task_assigned', 'collection_tasks', taskId]
        );

        await conn.commit();
        res.status(201).json({ message: 'Task assigned', id: taskId });
    } catch (err) {
        await conn.rollback();
        // MySQL throws ER_DUP_ENTRY if the unique constraint catches a race condition
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'This food post was just assigned by someone else' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
};

// GET /api/tasks  (admin sees all, volunteer sees own)
const listTasks = async (req, res) => {
    try {
        let query = `
      SELECT t.id, t.status, t.assigned_at, t.collected_at, t.delivered_at,
             fp.id AS food_post_id, fp.food_type, fp.quantity, fp.pickup_address,
             fp.pickup_window_start, fp.pickup_window_end,
             vol.name AS volunteer_name, vol.id AS volunteer_id,
             d.org_name AS donor_org
      FROM collection_tasks t
      JOIN food_posts fp ON fp.id = t.food_post_id
      JOIN users vol ON vol.id = t.volunteer_id
      JOIN donors d ON d.id = fp.donor_id
    `;
        const params = [];

        if (req.user.role === 'volunteer') {
            query += ' WHERE t.volunteer_id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY t.assigned_at DESC';

        const [tasks] = await pool.execute(query, params);
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PATCH /api/tasks/:id/status  (volunteer, own task only)
const updateTaskStatus = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { status: nextStatus } = req.body;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // Ownership is enforced INSIDE the query, not as a separate check after fetching.
        const [[task]] = await conn.execute(
            'SELECT * FROM collection_tasks WHERE id = ? AND volunteer_id = ? FOR UPDATE',
            [id, req.user.id]
        );

        if (!task) {
            await conn.rollback();
            // Same error whether the task doesn't exist or belongs to someone else —
            // don't leak which one it is, that's an information disclosure issue.
            return res.status(404).json({ error: 'Task not found' });
        }

        const allowedNext = ALLOWED_TRANSITIONS[task.status] || [];
        if (!allowedNext.includes(nextStatus)) {
            await conn.rollback();
            return res.status(400).json({
                error: `Cannot move from "${task.status}" to "${nextStatus}"`,
                allowedNext,
            });
        }

        const timestampColumn = nextStatus === 'collected' ? 'collected_at'
            : nextStatus === 'delivered' ? 'delivered_at'
                : null;

        if (timestampColumn) {
            await conn.execute(
                `UPDATE collection_tasks SET status = ?, ${timestampColumn} = NOW() WHERE id = ?`,
                [nextStatus, id]
            );
        } else {
            await conn.execute(
                'UPDATE collection_tasks SET status = ? WHERE id = ?',
                [nextStatus, id]
            );
        }

        // Keep food_posts.status in sync with the task lifecycle.
        if (nextStatus === 'collected') {
            await conn.execute('UPDATE food_posts SET status = ? WHERE id = ?', ['collected', task.food_post_id]);
        } else if (nextStatus === 'cancelled') {
            // Volunteer dropped out — release the post back to the pool instead of leaving it stuck.
            await conn.execute('UPDATE food_posts SET status = ? WHERE id = ?', ['available', task.food_post_id]);
        }

        await conn.execute(
            'INSERT INTO audit_logs (id, actor_id, action, entity, entity_id) VALUES (UUID(), ?, ?, ?, ?)',
            [req.user.id, `task_${nextStatus}`, 'collection_tasks', id]
        );

        await conn.commit();
        res.json({ message: `Task marked ${nextStatus}` });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
};

module.exports = { createTask, listTasks, updateTaskStatus };