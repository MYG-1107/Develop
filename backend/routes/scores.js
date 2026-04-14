/**
 * FinanceFit – Scores Router
 * In-memory store for demo purposes. Replace with a real database in production.
 *
 * Routes:
 *   POST /api/scores        – Save a score snapshot, returns { id }
 *   GET  /api/scores/:id    – Retrieve snapshot by ID
 */

'use strict';

const express = require('express');
const crypto  = require('crypto');

const router = express.Router();

/* ── In-memory store (replace with DB in production) ─────────────────── */
// Map<id: string, { score, grade, metrics, createdAt, expiresAt }>
const store = new Map();

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/* ── Helpers ─────────────────────────────────────────────────────────── */

/**
 * Generate a short URL-safe random ID (12 hex chars).
 */
function generateId() {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * Validate the incoming score payload.
 * @param {object} body
 * @returns {string|null} error message or null if valid
 */
function validatePayload(body) {
  const { score, grade } = body;
  if (typeof score !== 'number' || !isFinite(score) || score < 0 || score > 100) {
    return 'score must be a number between 0 and 100.';
  }
  if (typeof grade !== 'string' || grade.trim().length === 0) {
    return 'grade must be a non-empty string.';
  }
  return null;
}

/**
 * Strip expired entries from the store (simple GC).
 */
function pruneExpired() {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(id);
  }
}

/* ── POST /api/scores ────────────────────────────────────────────────── */
router.post('/', (req, res) => {
  const error = validatePayload(req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  const { score, grade, metrics = {} } = req.body;

  // Sanitise metrics – only allow primitive number/string values
  const safeMetrics = {};
  if (typeof metrics === 'object' && metrics !== null) {
    for (const [key, val] of Object.entries(metrics)) {
      if (
        typeof key === 'string' &&
        key.length <= 40 &&
        (typeof val === 'number' || typeof val === 'string') &&
        String(val).length <= 100
      ) {
        safeMetrics[key] = val;
      }
    }
  }

  pruneExpired();

  // Limit store size to prevent memory exhaustion
  if (store.size >= 10000) {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
  }

  const id        = generateId();
  const now       = Date.now();
  const expiresAt = now + TTL_MS;

  store.set(id, {
    score:     Math.round(score),
    grade:     grade.trim().slice(0, 20),
    metrics:   safeMetrics,
    createdAt: new Date(now).toISOString(),
    expiresAt,
  });

  return res.status(201).json({ id, expiresAt: new Date(expiresAt).toISOString() });
});

/* ── GET /api/scores/:id ─────────────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // Validate ID format (12 lowercase hex chars)
  if (!/^[0-9a-f]{12}$/.test(id)) {
    return res.status(400).json({ error: 'Invalid score ID format.' });
  }

  const entry = store.get(id);

  if (!entry) {
    return res.status(404).json({ error: 'Score not found or has expired.' });
  }

  if (entry.expiresAt < Date.now()) {
    store.delete(id);
    return res.status(404).json({ error: 'Score not found or has expired.' });
  }

  return res.json({
    id,
    score:     entry.score,
    grade:     entry.grade,
    metrics:   entry.metrics,
    createdAt: entry.createdAt,
  });
});

module.exports = router;
