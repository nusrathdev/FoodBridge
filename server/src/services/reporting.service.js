const pool = require('../config/db');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Builds the WHERE clause + params for date filtering, reused everywhere.
function buildDateFilter(from, to, column = 'dist.distributed_at') {
    const conditions = [];
    const params = [];
    if (from) {
        conditions.push(`${column} >= ?`);
        params.push(from);
    }
    if (to) {
        // A date-only `to` (2026-06-30) means "through the end of that day". A plain <= compares
        // against midnight and silently drops everything that happened during the day itself.
        conditions.push(DATE_ONLY.test(to)
            ? `${column} < DATE_ADD(?, INTERVAL 1 DAY)`
            : `${column} <= ?`);
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
    const { clause: postsWhere, params: dateParams } = buildDateFilter(from, to, 'created_at');

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

    // Top donors follow the same date range as the rest of the summary.
    const { clause: donorsWhere, params: donorParams } = buildDateFilter(from, to, 'fp.created_at');
    const [topDonors] = await pool.execute(
        `
    SELECT donor.org_name, COUNT(fp.id) AS posts_donated
    FROM food_posts fp
    JOIN donors donor ON donor.id = fp.donor_id
    ${donorsWhere}
    GROUP BY donor.id, donor.org_name
    ORDER BY posts_donated DESC
    LIMIT 5
    `,
        donorParams
    );

    // SUM() comes back from MySQL as a DECIMAL, which mysql2 hands over as a string ("4").
    // Convert so the API returns real numbers.
    const totalPosts = Number(postCounts.total_posts) || 0;
    const expiredCount = Number(postCounts.expired_count) || 0;
    const distributedCount = Number(postCounts.distributed_count) || 0;

    return {
        food_posts: {
            total: totalPosts,
            available: Number(postCounts.available_count) || 0,
            assigned: Number(postCounts.assigned_count) || 0,
            collected: Number(postCounts.collected_count) || 0,
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