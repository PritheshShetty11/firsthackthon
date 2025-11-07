import { Router } from 'express';
import { Family } from '../models/Family.js';
import { authenticateFirebaseToken } from '../middleware/auth.js';
import { ensureEmailPresent, getUserRoleInFamily } from '../utils/roles.js';

const router = Router();

// Mock payment endpoint: mark family as paid for 30 days (owner/admin)
router.post('/mock', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const { familyId } = req.body;
  if (!familyId) return res.status(400).json({ error: 'familyId required' });
  const { role, family } = await getUserRoleInFamily(familyId, email);
  if (!['owner', 'admin'].includes(role)) return res.status(403).json({ error: 'Not authorized' });

  const due = new Date();
  due.setDate(due.getDate() + 30);
  family.isPaid = true;
  family.paymentDueDate = due;
  await family.save();
  res.json({ ok: true, family });
});

export default router;


