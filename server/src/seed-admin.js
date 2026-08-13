require('dotenv').config();
const pool = require('./config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seedAdmin() {
    const name = 'System Admin';
    const email = 'admin@foodbridge.com ';
    const password = 'ChangeThisPassword123'; // change after first login in real life

    const [[existing]] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
        console.log('Admin already exists, skipping.');
        process.exit(0);
    }

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 12);

    await pool.execute(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [id, name, email, hash, 'admin']
    );

    console.log('✅ Admin created:', email);
    process.exit(0);
}

seedAdmin();