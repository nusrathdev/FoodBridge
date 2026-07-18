const pool = require('../config/db');

// GET /api/volunteers  (admin only)
const listVolunteers = async (req, res) => {
    try {
        // Show volunteers along with how many active (non-terminal) tasks they currently hold,
        // so the admin can see workload at a glance before assigning more work to someone.
        const [volunteers] = await pool.execute(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(CASE WHEN t.status = 'assigned' THEN 1 END) AS active_tasks,
        COUNT(CASE WHEN t.status = 'delivered' THEN 1 END) AS completed_tasks
      FROM users u
      LEFT JOIN collection_tasks t ON t.volunteer_id = u.id
      WHERE u.role = 'volunteer'
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY active_tasks ASC, u.name ASC
    `);
        res.json(volunteers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { listVolunteers };