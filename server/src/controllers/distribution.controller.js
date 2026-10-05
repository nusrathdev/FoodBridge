const pool = require('../config/db');

// Distributions are recorded by the volunteer when they mark a task delivered
// (PATCH /api/tasks/:id/status). The admin reads them here.

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
        recorder.name AS recorded_by
      FROM distributions dist
      JOIN collection_tasks t ON t.id = dist.task_id
      JOIN food_posts fp ON fp.id = t.food_post_id
      JOIN donors donor ON donor.id = fp.donor_id
      JOIN users vol ON vol.id = t.volunteer_id
      JOIN users recorder ON recorder.id = dist.distributed_by
      ORDER BY dist.distributed_at DESC
    `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { listDistributions };