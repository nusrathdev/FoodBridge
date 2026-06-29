require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const donorRoutes = require('./routes/donor.routes');
const foodPostRoutes = require('./routes/foodpost.routes');

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

// rate limit auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many requests, try again later' }
});

app.use('/api/auth', authLimiter, authRoutes);

// health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/donors', donorRoutes);
app.use('/api/food-posts', foodPostRoutes);

// global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;