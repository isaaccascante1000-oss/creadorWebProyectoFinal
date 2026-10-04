import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import './env.js';

const SESSION_TTL_MS = 15 * 60 * 1000;
const sessions = new Map();
const rateLimits = new Map();

const setCorsHeaders = (request, response) => {
  if (!request.headers.origin) return;
  response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Vary', 'Origin');
};

const allowedDomains = process.env.ALLOWED_EMAIL_DOMAIN
  ?.split(',')
  .map((domain) => domain.trim().replace(/^@/, '').toLowerCase())
  .filter(Boolean);
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
);

export const isInstitutionalEmail = (email) => (
  typeof email === 'string' &&
  email.length <= 254 &&
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email) &&
  (!allowedDomains?.length || allowedDomains.includes(email.slice(email.lastIndexOf('@') + 1).toLowerCase()))
);

export const isStrongPassword = (password) => (
  typeof password === 'string' && password.length >= 12 && password.length <= 128 &&
  /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
);

export const assignRole = (email) => adminEmails.has(email.toLowerCase()) ? 'admin' : 'user';

export const createSession = (user, termsAcceptedAt) => {
  const id = randomBytes(32).toString('base64url');
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: assignRole(user.email),
    termsAcceptedAt,
  };
  sessions.set(id, { user: safeUser, expiresAt: Date.now() + SESSION_TTL_MS });
  return { id, user: safeUser };
};

const readCookie = (request, name) => {
  const cookie = request.headers.cookie || '';
  const value = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : null;
};

export const getSession = (request) => {
  const id = readCookie(request, 'canvasai_session');
  const session = id && sessions.get(id);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(id);
    return null;
  }
  return { id, ...session };
};

export const destroySession = (request) => {
  const session = getSession(request);
  if (session) sessions.delete(session.id);
};

export const sessionCookie = (id) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `canvasai_session=${encodeURIComponent(id)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}${secure}`;
};

export const clearedSessionCookie = () => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `canvasai_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`;
};

export const requireAuth = (request, response) => {
  const session = getSession(request);
  if (session) return session;
  setCorsHeaders(request, response);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.statusCode = 401;
  response.end(JSON.stringify({ error: 'Autenticación requerida.' }));
  return null;
};

export const requireRole = (...roles) => (request, response) => {
  const session = requireAuth(request, response);
  if (!session) return null;
  if (!roles.includes(session.user.role)) {
    setCorsHeaders(request, response);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.statusCode = 403;
    response.end(JSON.stringify({ error: 'Permisos insuficientes.' }));
    return null;
  }
  return session;
};

export const requireResourceOwner = (getOwnerId) => (request, response, session) => {
  if (session.user.role === 'admin' || String(getOwnerId()) === String(session.user.id)) return true;
  setCorsHeaders(request, response);
  response.statusCode = 404;
  response.end(JSON.stringify({ error: 'Recurso no encontrado.' }));
  return false;
};

export const setSecurityHeaders = (response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if (process.env.NODE_ENV === 'production') {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

export const isRateLimited = (key, limit, windowMs) => {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || entry.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
};

export const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const cleanSecurityState = () => {
  const now = Date.now();
  for (const [id, session] of sessions) if (session.expiresAt <= now) sessions.delete(id);
  for (const [key, entry] of rateLimits) if (entry.resetAt <= now) rateLimits.delete(key);
};