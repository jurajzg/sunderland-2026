const SESSION_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const MAX_PDF_BYTES = 5 * 1024 * 1024;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
  });
}
function hex(bytes) { return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function sha256(value) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))); }
function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function verifyPin(pin, stored) {
  // Format: pbkdf2-sha256$iterations$saltHex$derivedKeyHex
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000 || !/^[0-9a-f]{32,128}$/i.test(parts[2]) || !/^[0-9a-f]{64}$/i.test(parts[3])) return false;
  const salt = Uint8Array.from(parts[2].match(/.{2}/g), x => parseInt(x, 16));
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, 256);
  const actual = hex(bits);
  return constantTimeEqual(actual, parts[3].toLowerCase());
}
function cookie(req, name) {
  return (req.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(name + '='))?.slice(name.length + 1);
}
// API is served from the Pages site itself: no cross-site cookies or permissive CORS.
function setCookie(value, maxAge = 900) {
  return `sunderland_session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
function sameOriginPost(req, env, allowNoOrigin = false) {
  const origin = req.headers.get('Origin');
  const expected = env.ALLOWED_ORIGIN || new URL(req.url).origin;
  if (new URL(req.url).origin !== expected) return false;
  return origin ? origin === expected : allowNoOrigin;
}
async function getSession(req, env) {
  const id = cookie(req, 'sunderland_session');
  if (!id) return null;
  const row = await env.DB.prepare('SELECT id,pin_fingerprint,last_seen,revoked FROM ticket_sessions WHERE id=?').bind(id).first();
  if (!row || row.revoked || row.pin_fingerprint !== env.TICKET_PIN_HASH || Date.now() - row.last_seen >= SESSION_MINUTES * 60000) {
    if (row) await env.DB.prepare('UPDATE ticket_sessions SET revoked=1 WHERE id=?').bind(id).run();
    return null;
  }
  await env.DB.prepare('UPDATE ticket_sessions SET last_seen=? WHERE id=?').bind(Date.now(), id).run();
  return row;
}
async function isAdmin(req, env) {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || !env.ADMIN_TOKEN_HASH) return false;
  const actual = await sha256(token);
  return constantTimeEqual(actual, env.ADMIN_TOKEN_HASH.toLowerCase());
}
export async function handle(req, env) {
  const url = new URL(req.url);
  const path = url.pathname;
  const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
  if (path === '/api/health' && req.method === 'GET') return json({ ok: true, service: 'sunderland-2026' });

  if (path === '/api/unlock' && req.method === 'POST') {
    if (!sameOriginPost(req, env)) return json({ error: 'Nedozvoljen izvor zahtjeva.' }, 403);
    if (!env.TICKET_PIN_HASH) return json({ error: 'PIN sustav nije konfiguriran.' }, 503);
    const lock = await env.DB.prepare('SELECT failures,locked_until FROM ticket_unlock_attempts WHERE ip=?').bind(ip).first();
    if (lock?.locked_until > Date.now()) return json({ error: 'Previše pokušaja. Pokušajte za 15 minuta.' }, 429);
    const body = await req.json().catch(() => ({}));
    const submitted = typeof body.pin === 'string' ? body.pin : '';
    const valid = submitted.length >= 1 && submitted.length <= 64 && await verifyPin(submitted, env.TICKET_PIN_HASH);
    if (!valid) {
      const now = Date.now();
      await env.DB.prepare(`INSERT INTO ticket_unlock_attempts(ip,failures,locked_until) VALUES(?,1,0)
        ON CONFLICT(ip) DO UPDATE SET
        failures=CASE WHEN ticket_unlock_attempts.locked_until<=? THEN 1 ELSE ticket_unlock_attempts.failures+1 END,
        locked_until=CASE WHEN ticket_unlock_attempts.locked_until<=? THEN 0
          WHEN ticket_unlock_attempts.failures+1>=? THEN ? ELSE ticket_unlock_attempts.locked_until END`)
        .bind(ip, now, now, MAX_ATTEMPTS, now + LOCK_MINUTES * 60000).run();
      return json({ error: 'PIN nije ispravan.' }, 401);
    }
    await env.DB.prepare('DELETE FROM ticket_unlock_attempts WHERE ip=?').bind(ip).run();
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO ticket_sessions(id,pin_fingerprint,last_seen,revoked) VALUES(?,?,?,0)')
      .bind(id, env.TICKET_PIN_HASH, Date.now()).run();
    return json({ ok: true }, 200, { 'Set-Cookie': setCookie(id, 86400) });
  }

  if (path === '/api/lock' && req.method === 'POST') {
    if (!sameOriginPost(req, env)) return json({ error: 'Nedozvoljen izvor zahtjeva.' }, 403);
    const id = cookie(req, 'sunderland_session');
    if (id) await env.DB.prepare('UPDATE ticket_sessions SET revoked=1 WHERE id=?').bind(id).run();
    return json({ ok: true }, 200, { 'Set-Cookie': setCookie('', 0) });
  }

  if (path === '/api/tickets' && req.method === 'GET') {
    if (!await getSession(req, env)) return json({ error: 'Sesija je zaključana. Ponovno unesite PIN.' }, 401);
    const rows = await env.DB.prepare('SELECT id,person,category,filename FROM tickets ORDER BY person,category,id').all();
    return json({ tickets: rows.results || [] });
  }

  const ticketMatch = path.match(/^\/api\/tickets\/(\d+)$/);
  if (ticketMatch && req.method === 'GET') {
    if (!await getSession(req, env)) return json({ error: 'Sesija je zaključana. Ponovno unesite PIN.' }, 401);
    const row = await env.DB.prepare('SELECT object_key,filename FROM tickets WHERE id=?').bind(Number(ticketMatch[1])).first();
    if (!row) return json({ error: 'Ulaznica nije pronađena.' }, 404);
    const obj = await env.BUCKET.get(row.object_key);
    if (!obj) return json({ error: 'PDF nije pronađen.' }, 404);
    return new Response(obj.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${String(row.filename).replace(/[\r\n"\\]/g, '_')}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  }

  if (path === '/api/admin/tickets' && (req.method === 'POST' || req.method === 'DELETE')) {
    if (!sameOriginPost(req, env, true)) return json({ error: 'Nedozvoljen izvor zahtjeva.' }, 403);
    if (!await isAdmin(req, env)) return json({ error: 'Nedozvoljeno.' }, 401);
    const contentLength = Number(req.headers.get('Content-Length') || 0);
    if (contentLength > Math.ceil(MAX_PDF_BYTES * 4 / 3) + 16384) return json({ error: 'Zahtjev je prevelik.' }, 413);
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: 'Neispravan JSON.' }, 400);
    if (req.method === 'DELETE') {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id < 1) return json({ error: 'Neispravan ID.' }, 400);
      const row = await env.DB.prepare('SELECT object_key FROM tickets WHERE id=?').bind(id).first();
      if (!row) return json({ error: 'Ulaznica nije pronađena.' }, 404);
      await env.BUCKET.delete(row.object_key);
      await env.DB.prepare('DELETE FROM tickets WHERE id=?').bind(id).run();
      return json({ ok: true });
    }
    const { person, category, filename, base64 } = body;
    if (!['Juraj', 'Buco'].includes(person) || !['flight', 'train', 'match'].includes(category) || typeof base64 !== 'string' || base64.length > Math.ceil(MAX_PDF_BYTES * 4 / 3) + 8) {
      return json({ error: 'Neispravni podaci.' }, 400);
    }
    let bytes;
    try { bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0)); } catch { return json({ error: 'Neispravna PDF datoteka.' }, 400); }
    if (!bytes.length || bytes.length > MAX_PDF_BYTES || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      return json({ error: 'Datoteka nije valjan PDF ili je prevelika (maks. 5 MB).' }, 400);
    }
    const safeName = typeof filename === 'string' ? filename.replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 120) : 'ulaznica.pdf';
    const key = `${person.toLowerCase()}/${category}/${crypto.randomUUID()}.pdf`;
    await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: 'application/pdf', cacheControl: 'private, no-store' } });
    await env.DB.prepare('INSERT INTO tickets(person,category,object_key,filename) VALUES(?,?,?,?)').bind(person, category, key, safeName || 'ulaznica.pdf').run();
    return json({ ok: true }, 201);
  }
  return json({ error: 'Not found' }, 404);
}
export default { fetch(req, env) { return handle(req, env).catch(() => json({ error: 'Interna pogreška.' }, 500)); } };
