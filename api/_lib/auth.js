import crypto from 'node:crypto';
import { SESSION_DURATION_DAYS } from '../../shared/constants.js';

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET no configurado');
  return s;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

/** Minimal self-issued session token — no session store needed for 3 fixed users. */
export function issueToken(userId) {
  const expiresAt = Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${expiresAt}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString('base64url');
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const [userId, expiresAtStr, sig] = Buffer.from(token, 'base64url').toString('utf8').split('.');
    if (!userId || !expiresAtStr || !sig) return null;
    const expected = Buffer.from(sign(`${userId}.${expiresAtStr}`), 'hex');
    const given = Buffer.from(sig, 'hex');
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
    if (Date.now() > Number(expiresAtStr)) return null;
    return userId;
  } catch {
    return null;
  }
}

/** Returns the authenticated userId, or null. Any of the 3 users' tokens counts as "logged in". */
export function requireAuth(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return verifyToken(token);
}
