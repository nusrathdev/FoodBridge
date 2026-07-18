require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const donorRoutes = require('./routes/donor.routes');
const foodPostRoutes = require('./routes/foodpost.routes');
const taskRoutes = require('./routes/task.routes');
const volunteerRoutes = require('./routes/volunteer.routes');
const distributionRoutes = require('./routes/distribution.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const reportRoutes = require('./routes/report.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// --- Security headers ---
app.use(helmet());

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
// --- Bound request body size — prevents memory exhaustion from oversized payloads ---
app.use(express.json({ limit: '10kb' }));

// rate limit auth endpoints - for auth — brute-force protection on login/register ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many requests, try again later' }
});

// --- Looser, general limiter for everything else under /api ---
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // generous enough for normal dashboard use, still blocks scripted abuse
    message: { error: 'Too many requests, try again later' },
});

app.use('/api/auth', authLimiter, authRoutes);

// general limiter applies to every other /api/* route registered after this line
app.use('/api', generalLimiter);

// health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/donors', donorRoutes);
app.use('/api/food-posts', foodPostRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/distributions', distributionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// --- Explicit 404 for anything unmatched ---
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// --- Global error handler — last middleware, catches anything thrown/passed via next(err) ---
app.use((err, req, res, next) => {
    console.error(err); // full detail stays server-side only
    // Never expose err.message or err.stack to the client — that can leak SQL syntax,
    // file paths, or internal logic to an attacker probing your API.
    res.status(err.status || 500).json({ error: 'Something went wrong' });
});

module.exports = app;