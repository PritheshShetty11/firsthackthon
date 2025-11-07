import { Family } from '../models/Family.js';

export async function getUserRoleInFamily(familyId, userEmail) {
  const family = await Family.findById(familyId);
  if (!family) return { role: 'none', family: null };
  if (family.ownerGmail === userEmail) return { role: 'owner', family };
  if (family.admins.includes(userEmail)) return { role: 'admin', family };
  if (family.approvedUsers.includes(userEmail)) return { role: 'viewer', family };
  return { role: 'none', family };
}

export function ensureEmailPresent(req, res) {
  const email = req.user?.email;
  if (!email) {
    res.status(403).json({ error: 'Email is required on user token' });
    return null;
  }
  return email;
}


