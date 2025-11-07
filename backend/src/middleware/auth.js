import { initFirebaseAdmin, getFirebaseInitError } from '../config/firebase.js';

export async function authenticateFirebaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing Authorization header' });

    const admin = initFirebaseAdmin();
    const initErr = getFirebaseInitError();
    if (initErr) {
      return res.status(500).json({ error: 'Auth not configured on server', detail: initErr.message });
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
      picture: decoded.picture || null
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}


