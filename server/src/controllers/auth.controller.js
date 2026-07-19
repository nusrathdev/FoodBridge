const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role, org_name, food_handling_cert } = req.body;

    try {
        // check if email already exists
        const [[existing]] = await pool.execute(
            'SELECT id FROM users WHERE email = ?', [email]
        );
        if (existing)
            return res.status(409).json({ error: 'Email already registered' });

        const id = uuidv4();
        const hash = await bcrypt.hash(password, +process.env.BCRYPT_ROUNDS);

        await pool.execute(
            'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, hash, role]
        );

        // if donor, create donor record
        if (role === 'donor') {
            await pool.execute(
                'INSERT INTO donors (id, user_id, org_name, food_handling_cert) VALUES (?, ?, ?, ?)',
                [uuidv4(), id, org_name ?? null, food_handling_cert ?? null]
            );
        }

        res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        const [[user]] = await pool.execute(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (!user || !(await bcrypt.compare(password, user.password_hash)))
            return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, role: user.role, name: user.name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const me = async (req, res) => {
    try {
        const [[user]] = await pool.execute(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { register, login, me };