const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

// POST /api/food-posts  (verified donor only)
const createFoodPost = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        // confirm donor is approved
        const [[donor]] = await pool.execute(
            'SELECT id, status FROM donors WHERE user_id = ?', [req.user.id]
        );
        if (!donor) return res.status(404).json({ error: 'Donor profile not found' });
        if (donor.status !== 'approved')
            return res.status(403).json({ error: 'Donor not yet verified' });

        const { food_type, quantity, pickup_address, pickup_window_start, pickup_window_end } = req.body;
        const id = uuidv4();

        await pool.execute(
            `INSERT INTO food_posts
       (id, donor_id, food_type, quantity, pickup_address, pickup_window_start, pickup_window_end)
       VALUES (?,?,?,?,?,?,?)`,
            [id, donor.id, food_type, quantity, pickup_address, pickup_window_start, pickup_window_end]
        );

        res.status(201).json({ message: 'Food post created', id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/food-posts  (donor sees own, admin sees all)
const listFoodPosts = async (req, res) => {
    try {
        let query = `
      SELECT fp.*, d.org_name, u.name AS donor_name
      FROM food_posts fp
      JOIN donors d ON d.id = fp.donor_id
      JOIN users u ON u.id = d.user_id
    `;
        const params = [];

        if (req.user.role === 'donor') {
            query += ' WHERE u.id = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY fp.created_at DESC';

        const [posts] = await pool.execute(query, params);
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/food-posts/:id
const getFoodPost = async (req, res) => {
    try {
        const [[post]] = await pool.execute(
            `SELECT fp.*, d.org_name, u.name AS donor_name
       FROM food_posts fp
       JOIN donors d ON d.id = fp.donor_id
       JOIN users u ON u.id = d.user_id
       WHERE fp.id = ?`,
            [req.params.id]
        );
        if (!post) return res.status(404).json({ error: 'Food post not found' });
        res.json(post);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// PATCH /api/food-posts/:id  (donor, own post, only while available)
const updateFoodPost = async (req, res) => {
    try {
        const [[post]] = await pool.execute(
            `SELECT fp.* FROM food_posts fp
       JOIN donors d ON d.id = fp.donor_id
       WHERE fp.id = ? AND d.user_id = ?`,
            [req.params.id, req.user.id]
        );
        if (!post) return res.status(404).json({ error: 'Food post not found' });
        if (post.status !== 'available')
            return res.status(400).json({ error: 'Can only edit posts that are still available' });

        const fields = ['food_type', 'quantity', 'pickup_address', 'pickup_window_start', 'pickup_window_end'];
        const updates = [];
        const values = [];

        fields.forEach(f => {
            if (req.body[f] !== undefined) {
                updates.push(`${f} = ?`);
                values.push(req.body[f]);
            }
        });

        if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

        values.push(req.params.id);
        await pool.execute(`UPDATE food_posts SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Food post updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createFoodPost, listFoodPosts, getFoodPost, updateFoodPost };