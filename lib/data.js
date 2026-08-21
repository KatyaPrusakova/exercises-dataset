const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const EXERCISES = JSON.parse(readFileSync(join(process.cwd(), 'data/exercises.en.json'), 'utf8'));
const BY_ID = new Map(EXERCISES.map(ex => [ex.id, ex]));

function getOrigin(req) {
  const host = req.headers.host || 'localhost:3000';
  return process.env.PUBLIC_BASE_URL || `https://${host}`;
}

function withAbsoluteMedia(ex, origin) {
  return {
    ...ex,
    image: ex.image ? `${origin}/${ex.image}` : '',
    gif_url: ex.gif_url ? `${origin}/${ex.gif_url}` : '',
  };
}

function paginate(items, limit, offset) {
  return {
    total: items.length,
    limit,
    offset,
    count: Math.min(limit, Math.max(items.length - offset, 0)),
    items: items.slice(offset, offset + limit),
  };
}

function parseLimit(v, def = 50, max = 200) {
  const n = parseInt(v || '', 10);
  return Math.min(Math.max(Number.isFinite(n) ? n : def, 1), max);
}

function parseOffset(v) {
  const n = parseInt(v || '', 10);
  return Math.max(Number.isFinite(n) ? n : 0, 0);
}

function parseBool(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return null;
}

function queryParams(req) {
  const host = req.headers.host || 'localhost:3000';
  return new URL(req.url || '/', `https://${host}`).searchParams;
}

function pathParam(req, key) {
  const raw = req.query[key];
  const val = Array.isArray(raw) ? raw[0] : raw;
  return decodeURIComponent(String(val || '')).toLowerCase().trim();
}

module.exports = {
  EXERCISES,
  BY_ID,
  getOrigin,
  withAbsoluteMedia,
  paginate,
  parseLimit,
  parseOffset,
  parseBool,
  queryParams,
  pathParam,
};
