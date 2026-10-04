const pool = require('../config/db');

// Marks food posts as expired once their pickup window has closed with nobody assigned.
// Only 'available' posts expire — an assigned or collected post is already in a volunteer's hands.
async function expireStalePosts() {
    const [result] = await pool.execute(
        `UPDATE food_posts SET status = 'expired'
     WHERE status = 'available' AND pickup_window_end < NOW()`
    );
    return result.affectedRows;
}

// Runs the sweep now and then once a minute for as long as the server is up.
function startExpiryJob(intervalMs = 60 * 1000) {
    const run = async () => {
        try {
            const expired = await expireStalePosts();
            if (expired > 0) console.log(`⏰ Expired ${expired} food post(s) past their pickup window`);
        } catch (err) {
            // A failed sweep must never take the server down — log it and try again next minute.
            console.error('Expiry job failed:', err.message);
        }
    };
    run();
    return setInterval(run, intervalMs);
}

module.exports = { expireStalePosts, startExpiryJob };
