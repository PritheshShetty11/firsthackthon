import { Router } from 'express';
import { Member } from '../models/Member.js';
import { authenticateFirebaseToken } from '../middleware/auth.js';
import { ensureEmailPresent, getUserRoleInFamily } from '../utils/roles.js';

const router = Router();

// Create member (admin/owner)
router.post('/', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const { familyId, name, ...rest } = req.body;
  if (!familyId || !name) return res.status(400).json({ error: 'familyId and name required' });
  const { role } = await getUserRoleInFamily(familyId, email);
  if (!['owner', 'admin'].includes(role)) return res.status(403).json({ error: 'Not authorized' });
  const member = await Member.create({ familyId, name, ...rest });
  res.status(201).json(member);
});

// List members (viewer/admin/owner)
router.get('/family/:familyId', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const { role } = await getUserRoleInFamily(req.params.familyId, email);
  if (role === 'none') return res.status(403).json({ error: 'Not authorized' });
  const members = await Member.find({ familyId: req.params.familyId });
  res.json(members);
});

// Update member (admin/owner)
router.patch('/:id', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const existing = await Member.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Member not found' });
  const { role } = await getUserRoleInFamily(existing.familyId, email);
  if (!['owner', 'admin'].includes(role)) return res.status(403).json({ error: 'Not authorized' });
  const updated = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete member (admin/owner)
router.delete('/:id', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const existing = await Member.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Member not found' });
  const { role } = await getUserRoleInFamily(existing.familyId, email);
  if (!['owner', 'admin'].includes(role)) return res.status(403).json({ error: 'Not authorized' });
  await Member.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;


