require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');
const { startExpiryJob } = require('./services/expiry.service');

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        const conn = await pool.getConnection(); // test DB connection
        conn.release(); // hand it back, otherwise one pool slot stays occupied forever
        console.log('✅ Database connected');
        startExpiryJob();
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    } catch (err) {
        console.error('❌ Failed to connect to database:', err.message);
        process.exit(1);
    }
}
start();