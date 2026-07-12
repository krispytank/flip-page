import {
  verifyCredentials,
  createSessionToken,
  verifySessionToken,
  getAuthTokenFromRequest,
  setSessionCookie,
  clearSessionCookie,
} from '../../lib/auth';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return handleLogin(req, res);
    case 'GET':
      return handleSession(req, res);
    case 'DELETE':
      return handleLogout(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function handleLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (!verifyCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = createSessionToken(username);
  setSessionCookie(res, token);

  return res.status(200).json({ success: true, username });
}

function handleSession(req, res) {
  const token = getAuthTokenFromRequest(req);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true, username: session.username });
}

function handleLogout(req, res) {
  clearSessionCookie(res);
  return res.status(200).json({ success: true });
}
