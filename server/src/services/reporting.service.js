const pool = require('../config/db');

// Builds the WHERE clause + params for date filtering, reused everywhere.
function buildDateFilter(from, to) {
    const conditions = [];
    const params = [];
    if (from) {
        conditions.push('dist.distributed_at >= ?');
        params.push(from);
    }
    if (to) {
        conditions.push('dist.distributed_at <= ?');
        params.push(to);
    }
    return {
        clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
        params,
    };
}

// The single source of truth for "what got distributed, to whom, by whom, from whom."
async function getDistributionRecords({ from, to } = {}) {
    const { clause, params } = buildDateFilter(from, to);
    const [rows] = await pool.execute(
        `
    SELECT
      dist.id,
      dist.recipient_group,
      dist.quantity_distributed,
      dist.distributed_at,
      dist.notes,
      fp.food_type,
      fp.quantity AS original_quantity,
      donor.org_name AS donor_org,
      vol.name AS collected_by_volunteer,
      admin.name AS logged_by_admin
    FROM distributions dist
    JOIN collection_tasks t ON t.id = dist.task_id
    JOIN food_posts fp ON fp.id = t.food_post_id
    JOIN donors donor ON donor.id = fp.donor_id
    JOIN users vol ON vol.id = t.volunteer_id
    JOIN users admin ON admin.id = dist.distributed_by
    ${clause}
    ORDER BY dist.distributed_at DESC
    `,
        params
    );
    return rows;
}

// Dashboard-level metrics: the questions an NGO admin actually asks.
async function getSummaryMetrics({ from, to } = {}) {
    const dateFilterPosts = [];
    const dateParams = [];
    if (from) { dateFilterPosts.push('created_at >= ?'); dateParams.push(from); }
    if (to)   { dateFilterPosts.push('created_at <= ?'); dateParams.push(to); }
    const postsWhere = dateFilterPosts.length ? `WHERE ${dateFilterPosts.join(' AND ')}` : '';

    const [[postCounts]] = await pool.execute(
        `
    SELECT
      COUNT(*) AS total_posts,
      SUM(CASE WHEN status = 'available'   THEN 1 ELSE 0 END) AS available_count,
      SUM(CASE WHEN status = 'assigned'    THEN 1 ELSE 0 END) AS assigned_count,
      SUM(CASE WHEN status = 'collected'   THEN 1 ELSE 0 END) AS collected_count,
      SUM(CASE WHEN status = 'distributed' THEN 1 ELSE 0 END) AS distributed_count,
      SUM(CASE WHEN status = 'expired'     THEN 1 ELSE 0 END) AS expired_count
    FROM food_posts ${postsWhere}
    `,
        dateParams
    );

    const { clause, params } = buildDateFilter(from, to);
    const [[distCounts]] = await pool.execute(
        `SELECT COUNT(*) AS total_distributions FROM distributions dist ${clause}`,
        params
    );

    const [topDonors] = await pool.execute(
        `
    SELECT donor.org_name, COUNT(fp.id) AS posts_donated
    FROM food_posts fp
    JOIN donors donor ON donor.id = fp.donor_id
    GROUP BY donor.id, donor.org_name
    ORDER BY posts_donated DESC
    LIMIT 5
    `
    );

    const totalPosts = postCounts.total_posts || 0;
    const expiredCount = postCounts.expired_count || 0;
    const distributedCount = postCounts.distributed_count || 0;

    return {
        food_posts: {
            total: totalPosts,
            available: postCounts.available_count || 0,
            assigned: postCounts.assigned_count || 0,
            collected: postCounts.collected_count || 0,
            distributed: distributedCount,
            expired: expiredCount,
        },
        rates: {
            // these are the operational health numbers an NGO board cares about
            collection_rate: totalPosts ? +((distributedCount / totalPosts) * 100).toFixed(1) : 0,
            waste_rate: totalPosts ? +((expiredCount / totalPosts) * 100).toFixed(1) : 0,
        },
        total_distributions: distCounts.total_distributions || 0,
        top_donors: topDonors,
    };
}

module.exports = { getDistributionRecords, getSummaryMetrics, buildDateFilter };