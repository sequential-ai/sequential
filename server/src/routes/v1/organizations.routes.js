const express = require('express');
const {
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
  revokeInvite,
} = require('../../controllers/organizations.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

// All organization routes require authentication
router.use(protect);

// GET /api/v1/organizations/:orgId/members
router.get('/:orgId/members', protect, getOrganizationMembers);

// POST /api/v1/organizations/:orgId/members (Add/Invite member)
router.post('/:orgId/members', protect, addOrganizationMember);

// PATCH /api/v1/organizations/:orgId/members/:memberId (Update member role)
router.patch('/:orgId/members/:memberId', protect, updateMemberRole);

// DELETE /api/v1/organizations/:orgId/members/:memberId (Remove member)
router.delete('/:orgId/members/:memberId', protect, removeOrganizationMember);

// DELETE /api/v1/organizations/:orgId/invites/:inviteId (Revoke invite)
router.delete('/:orgId/invites/:inviteId', protect, revokeInvite);

module.exports = router;
