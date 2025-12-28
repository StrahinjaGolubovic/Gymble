import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const DB_PATH = process.env.DATABASE_PATH || './data/gymble.db';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function formatDateSerbia(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Belgrade',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA gives YYYY-MM-DD
  return fmt.format(date);
}

function tokenForUserId(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/maintenance/status`, { cache: 'no-store' });
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(500);
  }
  throw new Error(`Server not reachable at ${BASE_URL}`);
}

function dbEnsureUser(db, username, password) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing?.id) return existing.id;

  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = formatDateSerbia();
  const res = db
    .prepare('INSERT INTO users (username, password_hash, credits, created_at) VALUES (?, ?, 0, ?)')
    .run(username, passwordHash, createdAt);
  return Number(res.lastInsertRowid);
}

async function apiFetch(path, { token, method = 'GET', headers = {}, body } = {}) {
  const h = new Headers(headers);
  if (token) h.set('cookie', `token=${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { method, headers: h, body, cache: 'no-store' });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-json
  }
  return { res, text, json };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log(`[smoke] base=${BASE_URL}`);
  console.log(`[smoke] db=${DB_PATH}`);
  await waitForServer();
  console.log('[smoke] server OK');

  const db = new Database(DB_PATH);

  // Admin must be one of lib/admin.ts usernames. Use "admin".
  const adminId = dbEnsureUser(db, 'admin', 'admin_admin_admin');
  const adminToken = tokenForUserId(adminId);

  const suffix = Math.random().toString(16).slice(2, 8);
  const userName = `smoke_${suffix}`;
  const userId = dbEnsureUser(db, userName, 'smoke_password_123');
  const userToken = tokenForUserId(userId);

  const uploadUserName = `smoke_upl_${suffix}`;
  const uploadUserId = dbEnsureUser(db, uploadUserName, 'smoke_password_123');
  const uploadUserToken = tokenForUserId(uploadUserId);

  console.log(
    `[smoke] user=${userName} (id=${userId}) uploadUser=${uploadUserName} (id=${uploadUserId}) adminId=${adminId}`
  );

  // Dashboard
  {
    const { res, json, text } = await apiFetch('/api/dashboard', { token: userToken });
    assert(res.ok, `dashboard failed: ${res.status} ${text}`);
    assert(json?.challenge?.id, 'dashboard missing challenge.id');
    assert(json?.progress?.days?.length === 7, 'dashboard progress days not 7');
    assert(typeof json?.server_serbia_today === 'string', 'dashboard missing server_serbia_today');
    console.log('[smoke] dashboard OK');
  }

  const today = formatDateSerbia();

  // Use rest day (should succeed unless user already used it today)
  {
    const { res, json, text } = await apiFetch('/api/rest-day', {
      token: userToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today }),
    });
    assert(res.ok, `rest-day failed: ${res.status} ${text}`);
    assert(json?.success === true, 'rest-day did not return success=true');
    console.log('[smoke] rest-day OK');
  }

  // Upload should fail if a rest day is already used for today (must be 400, not 500)
  {
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0pP0kAAAAASUVORK5CYII=';
    const pngBytes = Buffer.from(pngBase64, 'base64');
    const form = new FormData();
    form.append('date', today);
    form.append('metadata', JSON.stringify({ smoke: true }));
    form.append('photo', new Blob([pngBytes], { type: 'image/png' }), 'smoke.png');

    const { res, json, text } = await apiFetch('/api/upload', { token: userToken, method: 'POST', body: form });
    assert(res.status === 400, `expected 400 when uploading after rest day, got ${res.status}: ${text}`);
    assert(json?.error === 'Rest day already used for this date', `unexpected upload-after-rest-day error: ${text}`);
    console.log('[smoke] upload after rest-day correctly blocked (400)');
  }

  // Upload (small PNG) with a fresh user
  let uploadId = null;
  {
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0pP0kAAAAASUVORK5CYII=';
    const pngBytes = Buffer.from(pngBase64, 'base64');
    const form = new FormData();
    form.append('date', today);
    form.append('metadata', JSON.stringify({ smoke: true }));
    form.append('photo', new Blob([pngBytes], { type: 'image/png' }), 'smoke.png');

    const { res, json, text } = await apiFetch('/api/upload', { token: uploadUserToken, method: 'POST', body: form });
    assert(res.ok, `upload failed: ${res.status} ${text}`);
    uploadId = json?.upload?.id;
    assert(uploadId, 'upload response missing upload.id');
    console.log(`[smoke] upload OK (id=${uploadId})`);
  }

  // Approve -> reject -> approve toggle (tests streak recompute + trophy idempotency)
  for (const status of ['approved', 'rejected', 'approved']) {
    const { res, text } = await apiFetch('/api/admin/verify-upload', {
      token: adminToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, status }),
    });
    assert(res.ok, `verify-upload ${status} failed: ${res.status} ${text}`);
    console.log(`[smoke] verify-upload ${status} OK`);
  }

  // Maintenance toggle should 503 user API calls when ON
  {
    const on = await apiFetch('/api/admin/maintenance', {
      token: adminToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true }),
    });
    assert(on.res.ok, `maintenance enable failed: ${on.res.status} ${on.text}`);

    const blocked = await apiFetch('/api/dashboard', { token: userToken });
    assert(blocked.res.status === 503, `expected 503 during maintenance, got ${blocked.res.status}: ${blocked.text}`);
    console.log('[smoke] maintenance ON blocks user API OK');

    const off = await apiFetch('/api/admin/maintenance', {
      token: adminToken,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    assert(off.res.ok, `maintenance disable failed: ${off.res.status} ${off.text}`);

    const okAgain = await apiFetch('/api/dashboard', { token: userToken });
    assert(okAgain.res.ok, `dashboard after maintenance failed: ${okAgain.res.status} ${okAgain.text}`);
    console.log('[smoke] maintenance OFF restores API OK');
  }

  console.log('[smoke] PASS');
}

main().catch((e) => {
  console.error('[smoke] FAIL:', e?.stack || e?.message || String(e));
  process.exit(1);
});


