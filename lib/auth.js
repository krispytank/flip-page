import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET) {
  console.warn('Warning: ADMIN_USERNAME, ADMIN_PASSWORD, and SESSION_SECRET environment variables should be set.');
}
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export function verifyCredentials(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createSessionToken(username) {
  const payload = JSON.stringify({ username, iat: Date.now() });
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

export function verifySessionToken(token) {
  if (!token) return null;
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, 'base64').toString('utf8');
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) return null;

    const data = JSON.parse(payload);
    const age = (Date.now() - data.iat) / 1000;
    if (age > SESSION_MAX_AGE) return null;

    return data;
  } catch {
    return null;
  }
}

export function getAuthTokenFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  return match ? match[1] : null;
}

export function isAuthenticated(req) {
  const token = getAuthTokenFromRequest(req);
  return verifySessionToken(token) !== null;
}

export function setSessionCookie(res, token) {
  const cookie = `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  res.setHeader('Set-Cookie', cookie);
}

export { SESSION_MAX_AGE };
