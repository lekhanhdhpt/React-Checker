import { verifyToken } from '../services/authService.js';

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(e.status || 401).json({ message: e.message || 'Unauthorized' });
  }
}
