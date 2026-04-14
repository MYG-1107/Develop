/**
 * FinanceFit Backend – Express API Server
 *
 * Endpoints:
 *   POST /api/scores        Save a financial health score snapshot
 *   GET  /api/scores/:id    Retrieve a saved snapshot by ID
 *   GET  /api/health        Server health check
 *
 * Run:
 *   npm start       (production)
 *   npm run dev     (development with file watch)
 *
 * Environment variables (.env):
 *   PORT         – server port (default 3000)
 *   ALLOWED_ORIGIN – frontend origin for CORS (default http://localhost:8080)
 */

'use strict';

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const scoresRouter = require('./routes/scores');

/* ── App Setup ─────────────────────────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security headers ───────────────────────────────────────────────────── */
app.use(helmet());

/* ── CORS ───────────────────────────────────────────────────────────────── */
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:8080';
app.use(cors({
  origin: [
    allowedOrigin,
    'https://myg-1107.github.io', // GitHub Pages production URL
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

/* ── JSON parsing ───────────────────────────────────────────────────────── */
app.use(express.json({ limit: '16kb' }));

/* ── Global rate limiter ────────────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests – please try again later.' },
});
app.use(limiter);

/* ── API Routes ─────────────────────────────────────────────────────────── */
app.use('/api/scores', scoresRouter);

/* ── Health check ───────────────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ── 404 handler ────────────────────────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

/* ── Global error handler ───────────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[FinanceFit API Error]', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || 'Internal server error.' });
});

/* ── Start server ───────────────────────────────────────────────────────── */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FinanceFit API running on http://localhost:${PORT}`);
  });
}

module.exports = app; // export for testing
