const express = require('express');
const {
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
  revokeInvite,
  getOrganizationSettings,
  updateOrganizationSettings,
  deleteOrganization,
} = require('../../controllers/organizations.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

// All organization routes require authentication
router.use(protect);

// GET /api/v1/organizations/:orgId/settings (Get settings & metadata)
router.get('/:orgId/settings', getOrganizationSettings);

// PATCH /api/v1/organizations/:orgId/settings (Update name, settings & metadata)
router.patch('/:orgId/settings', updateOrganizationSettings);

// DELETE /api/v1/organizations/:orgId (Delete workspace)
router.delete('/:orgId', deleteOrganization);

// GET /api/v1/organizations/:orgId/members
router.get('/:orgId/members', getOrganizationMembers);

// POST /api/v1/organizations/:orgId/members (Add/Invite member)
router.post('/:orgId/members', addOrganizationMember);

// PATCH /api/v1/organizations/:orgId/members/:memberId (Update member role)
router.patch('/:orgId/members/:memberId', updateMemberRole);

// DELETE /api/v1/organizations/:orgId/members/:memberId (Remove member)
router.delete('/:orgId/members/:memberId', removeOrganizationMember);

// DELETE /api/v1/organizations/:orgId/invites/:inviteId (Revoke invite)
router.delete('/:orgId/invites/:inviteId', revokeInvite);

module.exports = router;

