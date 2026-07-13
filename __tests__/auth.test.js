/**
 * @jest-environment node
 */

describe('Auth Library', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.ADMIN_USERNAME = 'testadmin';
    process.env.ADMIN_PASSWORD = 'testpass123';
    process.env.SESSION_SECRET = 'test-secret-key';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  function getAuth() {
    return require('../lib/auth');
  }

  describe('verifyCredentials', () => {
    it('returns true for valid credentials', () => {
      const { verifyCredentials } = getAuth();
      expect(verifyCredentials('testadmin', 'testpass123')).toBe(true);
    });

    it('returns false for invalid username', () => {
      const { verifyCredentials } = getAuth();
      expect(verifyCredentials('wronguser', 'testpass123')).toBe(false);
    });

    it('returns false for invalid password', () => {
      const { verifyCredentials } = getAuth();
      expect(verifyCredentials('testadmin', 'wrongpass')).toBe(false);
    });

    it('returns false for empty credentials', () => {
      const { verifyCredentials } = getAuth();
      expect(verifyCredentials('', '')).toBe(false);
    });
  });

  describe('createSessionToken', () => {
    it('returns a string token with two parts', () => {
      const { createSessionToken } = getAuth();
      const token = createSessionToken('testadmin');
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(2);
    });

    it('payload contains username', () => {
      const { createSessionToken } = getAuth();
      const token = createSessionToken('testadmin');
      const [payloadB64] = token.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
      expect(payload.username).toBe('testadmin');
    });

    it('payload contains iat timestamp', () => {
      const { createSessionToken } = getAuth();
      const token = createSessionToken('testadmin');
      const [payloadB64] = token.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
      expect(typeof payload.iat).toBe('number');
    });
  });

  describe('verifySessionToken', () => {
    it('returns null for null token', () => {
      const { verifySessionToken } = getAuth();
      expect(verifySessionToken(null)).toBe(null);
    });

    it('returns null for empty string', () => {
      const { verifySessionToken } = getAuth();
      expect(verifySessionToken('')).toBe(null);
    });

    it('returns null for invalid token format', () => {
      const { verifySessionToken } = getAuth();
      expect(verifySessionToken('invalid')).toBe(null);
    });

    it('returns null for tampered token', () => {
      const { createSessionToken, verifySessionToken } = getAuth();
      const token = createSessionToken('testadmin');
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(verifySessionToken(tampered)).toBe(null);
    });

    it('returns session data for valid token', () => {
      const { createSessionToken, verifySessionToken } = getAuth();
      const token = createSessionToken('testadmin');
      const session = verifySessionToken(token);
      expect(session).not.toBe(null);
      expect(session.username).toBe('testadmin');
    });

    it('returns null for expired token', () => {
      const { verifySessionToken, SESSION_MAX_AGE } = getAuth();
      const crypto = require('crypto');
      const payload = JSON.stringify({
        username: 'testadmin',
        iat: Date.now() - (SESSION_MAX_AGE * 1000 + 1000),
      });
      const hmac = crypto.createHmac('sha256', 'test-secret-key');
      hmac.update(payload);
      const signature = hmac.digest('hex');
      const token = Buffer.from(payload).toString('base64') + '.' + signature;
      expect(verifySessionToken(token)).toBe(null);
    });
  });

  describe('getAuthTokenFromRequest', () => {
    it('returns null when no cookie header', () => {
      const { getAuthTokenFromRequest } = getAuth();
      expect(getAuthTokenFromRequest({ headers: {} })).toBe(null);
    });

    it('returns null when admin_session cookie not present', () => {
      const { getAuthTokenFromRequest } = getAuth();
      expect(getAuthTokenFromRequest({ headers: { cookie: 'other_cookie=value' } })).toBe(null);
    });

    it('extracts admin_session token from cookie', () => {
      const { getAuthTokenFromRequest } = getAuth();
      const token = 'test-token-abc';
      const req = { headers: { cookie: `admin_session=${token}; other=val` } };
      expect(getAuthTokenFromRequest(req)).toBe(token);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no session cookie', () => {
      const { isAuthenticated } = getAuth();
      expect(isAuthenticated({ headers: {} })).toBe(false);
    });

    it('returns true for valid session', () => {
      const { isAuthenticated, createSessionToken } = getAuth();
      const token = createSessionToken('testadmin');
      expect(isAuthenticated({ headers: { cookie: `admin_session=${token}` } })).toBe(true);
    });

    it('returns false for expired session', () => {
      const { isAuthenticated, verifySessionToken, SESSION_MAX_AGE } = getAuth();
      const crypto = require('crypto');
      const payload = JSON.stringify({
        username: 'testadmin',
        iat: Date.now() - (SESSION_MAX_AGE * 1000 + 1000),
      });
      const hmac = crypto.createHmac('sha256', 'test-secret-key');
      hmac.update(payload);
      const signature = hmac.digest('hex');
      const token = Buffer.from(payload).toString('base64') + '.' + signature;
      expect(isAuthenticated({ headers: { cookie: `admin_session=${token}` } })).toBe(false);
    });
  });

  describe('setSessionCookie', () => {
    it('sets cookie header with token', () => {
      const { setSessionCookie } = getAuth();
      const res = { setHeader: jest.fn() };
      setSessionCookie(res, 'my-token');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('admin_session=my-token')
      );
    });

    it('sets HttpOnly and SameSite flags', () => {
      const { setSessionCookie } = getAuth();
      const res = { setHeader: jest.fn() };
      setSessionCookie(res, 'tok');
      const cookieStr = res.setHeader.mock.calls[0][1];
      expect(cookieStr).toContain('HttpOnly');
      expect(cookieStr).toContain('SameSite=Lax');
    });
  });

  describe('clearSessionCookie', () => {
    it('clears the admin_session cookie', () => {
      const { clearSessionCookie } = getAuth();
      const res = { setHeader: jest.fn() };
      clearSessionCookie(res);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('Max-Age=0')
      );
    });
  });

  describe('SESSION_MAX_AGE', () => {
    it('is set to 8 hours in seconds', () => {
      const { SESSION_MAX_AGE } = getAuth();
      expect(SESSION_MAX_AGE).toBe(60 * 60 * 8);
    });
  });
});
