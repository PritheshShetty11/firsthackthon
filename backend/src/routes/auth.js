import { Router } from 'express';
import { authenticateFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.get('/verify', authenticateFirebaseToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;


