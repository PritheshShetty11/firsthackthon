import { Router } from 'express';
import { Family } from '../models/Family.js';
import { authenticateFirebaseToken } from '../middleware/auth.js';
import { ensureEmailPresent, getUserRoleInFamily } from '../utils/roles.js';

const router = Router();

// Create a family (current user becomes owner)
router.post('/', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const { familyName } = req.body;
  if (!familyName) return res.status(400).json({ error: 'familyName is required' });
  const family = await Family.create({ familyName, ownerGmail: email, admins: [], approvedUsers: [] });
  res.status(201).json(family);
});

// Get my families (owner or admin)
router.get('/mine', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const families = await Family.find({ $or: [ { ownerGmail: email }, { admins: email } ] });
  res.json(families);
});

// Get a family if viewer/admin/owner
router.get('/:id', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const { role, family } = await getUserRoleInFamily(req.params.id, email);
  if (role === 'none') return res.status(403).json({ error: 'Not authorized' });
  res.json(family);
});

// Update family metadata (owner/admin)
router.patch('/:id', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const { role } = await getUserRoleInFamily(req.params.id, email);
  if (!['owner', 'admin'].includes(role)) return res.status(403).json({ error: 'Not authorized' });
  const updates = { familyName: req.body.familyName };
  const updated = await Family.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json(updated);
});

// Manage roles (owner only)
router.post('/:id/roles', authenticateFirebaseToken, async (req, res) => {
  const email = ensureEmailPresent(req, res);
  if (!email) return;
  const { role } = await getUserRoleInFamily(req.params.id, email);
  if (role !== 'owner') return res.status(403).json({ error: 'Owner only' });
  const { addAdmin, removeAdmin, addViewer, removeViewer } = req.body;
  const family = await Family.findById(req.params.id);
  if (!family) return res.status(404).json({ error: 'Family not found' });

  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

  if (addAdmin) family.admins = uniq([...family.admins, addAdmin]);
  if (removeAdmin) family.admins = family.admins.filter(e => e !== removeAdmin);
  if (addViewer) family.approvedUsers = uniq([...family.approvedUsers, addViewer]);
  if (removeViewer) family.approvedUsers = family.approvedUsers.filter(e => e !== removeViewer);

  await family.save();
  res.json(family);
});

export default router;


