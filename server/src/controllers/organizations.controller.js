const crypto = require('crypto');
const prisma = require('../db/db-connection');

const VALID_ROLES = ['OWNER', 'ADMIN', 'DEVELOPER', 'ANALYST', 'BILLING', 'VIEWER'];

const normalizeRole = (role) => {
  if (!role) return 'DEVELOPER';
  const upper = role.toUpperCase().trim();
  if (VALID_ROLES.includes(upper)) return upper;
  if (upper === 'MEMBER' || upper === 'DEV') return 'DEVELOPER';
  if (upper === 'READONLY' || upper === 'READ_ONLY') return 'ANALYST';
  return 'DEVELOPER';
};

/**
 * Helper: Resolve requesting user & verify workspace access
 */
const resolveUserAndOrg = async (clerkUserId, orgId) => {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      memberships: {
        include: {
          organization: true
        }
      }
    }
  });

  if (!user || !user.memberships || user.memberships.length === 0) {
    return { error: { status: 404, message: 'User or workspace not found' } };
  }

  let membership;
  if (orgId && orgId !== 'current' && orgId !== 'active') {
    membership = user.memberships.find(m => m.organizationId === orgId || m.organization?.slug === orgId);
    if (!membership) {
      return { error: { status: 403, message: 'You do not have access to this workspace' } };
    }
  } else {
    membership = user.memberships[0];
  }

  return { user, org: membership.organization, userRole: membership.role };
};

/**
 * @desc    Get all members and pending invites for an organization
 * @route   GET /api/v1/organizations/:orgId/members
 */
const getOrganizationMembers = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId } = req.params;

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { user, org, userRole } = authCheck;

    // Fetch active members
    const rawMembers = await prisma.organizationMember.findMany({
      where: { organizationId: org.id },
      include: {
        user: {
          select: {
            id: true,
            clerkUserId: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            systemRole: true,
            createdAt: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Fetch pending invites
    const rawInvites = await prisma.organizationInvite.findMany({
      where: {
        organizationId: org.id,
        status: 'PENDING'
      },
      include: {
        invitedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format active members
    const members = rawMembers.map(m => {
      const u = m.user || {};
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      return {
        id: m.id,
        userId: m.userId,
        name: fullName || (u.email ? u.email.split('@')[0] : 'Team Member'),
        email: u.email || '',
        role: m.role,
        avatar: u.imageUrl || '',
        joinedAt: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : 'Recent',
        status: 'ACTIVE',
        isCurrentUser: u.clerkUserId === clerkUserId,
        isOwner: m.role === 'OWNER',
        createdAt: m.createdAt,
      };
    });

    // Format pending invites
    const invites = rawInvites.map(inv => ({
      id: inv.id,
      inviteId: inv.id,
      name: inv.email.split('@')[0],
      email: inv.email,
      role: inv.role,
      avatar: '',
      joinedAt: 'Pending',
      status: 'INVITED',
      expiresAt: inv.expiresAt,
      invitedBy: inv.invitedByUser ? `${inv.invitedByUser.firstName || ''} ${inv.invitedByUser.lastName || ''}`.trim() || inv.invitedByUser.email : null,
      isInvite: true,
      createdAt: inv.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logoUrl: org.logoUrl,
        },
        members,
        invites,
        allMembers: [...members, ...invites],
        totalMembers: members.length,
        totalInvites: invites.length,
        currentUserRole: userRole,
      }
    });
  } catch (error) {
    console.error('Get Organization Members Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Invite or Add a member to the organization
 * @route   POST /api/v1/organizations/:orgId/members
 */
const addOrganizationMember = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId } = req.params;
    const { email, role = 'DEVELOPER' } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { user, org } = authCheck;

    // Check if user is already an active member of this organization
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: org.id,
        user: { email: normalizedEmail }
      },
      include: { user: true }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: `${normalizedEmail} is already a member of this workspace.`
      });
    }

    // Check if an invite already exists
    const existingInvite = await prisma.organizationInvite.findFirst({
      where: {
        organizationId: org.id,
        email: normalizedEmail,
        status: 'PENDING'
      }
    });

    // Create or refresh OrganizationInvite as PENDING (even if user already registered)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.organizationInvite.upsert({
      where: {
        organizationId_email: {
          organizationId: org.id,
          email: normalizedEmail,
        }
      },
      update: {
        role: normalizedRole,
        token,
        status: 'PENDING',
        invitedByUserId: user.id,
        expiresAt,
      },
      create: {
        organizationId: org.id,
        email: normalizedEmail,
        role: normalizedRole,
        token,
        status: 'PENDING',
        invitedByUserId: user.id,
        expiresAt,
      }
    });

    const resultMember = {
      id: invite.id,
      inviteId: invite.id,
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: invite.role,
      avatar: '',
      joinedAt: 'Pending',
      status: 'INVITED',
      expiresAt: invite.expiresAt,
      invitedBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      isInvite: true,
      createdAt: invite.createdAt,
    };

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        actorUserId: user.id,
        category: 'MEMBER',
        action: 'member.invited',
        metadata: {
          email: normalizedEmail,
          role: normalizedRole,
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${normalizedEmail}`,
      data: resultMember
    });
  } catch (error) {
    console.error('Add Organization Member Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Update a member's role
 * @route   PATCH /api/v1/organizations/:orgId/members/:memberId
 */
const updateMemberRole = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId, memberId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    const normalizedRole = normalizeRole(role);

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { user, org } = authCheck;

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: org.id },
      include: { user: true }
    });

    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found in this workspace' });
    }

    // If target member is currently OWNER and role is changing, ensure at least one other OWNER exists
    if (targetMember.role === 'OWNER' && normalizedRole !== 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId: org.id, role: 'OWNER' }
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the sole workspace Owner' });
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: normalizedRole },
      include: { user: true }
    });

    const fullName = `${updated.user.firstName || ''} ${updated.user.lastName || ''}`.trim();

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: {
        id: updated.id,
        userId: updated.userId,
        name: fullName || updated.user.email.split('@')[0],
        email: updated.user.email,
        role: updated.role,
        avatar: updated.user.imageUrl || '',
        status: 'ACTIVE',
      }
    });
  } catch (error) {
    console.error('Update Member Role Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Remove a member from the organization
 * @route   DELETE /api/v1/organizations/:orgId/members/:memberId
 */
const removeOrganizationMember = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId, memberId } = req.params;

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { user, org } = authCheck;

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: org.id },
      include: { user: true }
    });

    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (targetMember.role === 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId: org.id, role: 'OWNER' }
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot remove the primary workspace Owner' });
      }
    }

    await prisma.organizationMember.delete({
      where: { id: memberId }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        actorUserId: user.id,
        category: 'MEMBER',
        action: 'member.removed',
        metadata: {
          removedUserId: targetMember.userId,
          email: targetMember.user?.email,
          role: targetMember.role,
        }
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Member removed from workspace'
    });
  } catch (error) {
    console.error('Remove Organization Member Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Revoke / cancel a pending invite
 * @route   DELETE /api/v1/organizations/:orgId/invites/:inviteId
 */
const revokeInvite = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId, inviteId } = req.params;

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { org } = authCheck;

    const targetInvite = await prisma.organizationInvite.findFirst({
      where: { id: inviteId, organizationId: org.id }
    });

    if (!targetInvite) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    await prisma.organizationInvite.delete({
      where: { id: inviteId }
    });

    res.status(200).json({
      success: true,
      message: 'Invitation canceled successfully'
    });
  } catch (error) {
    console.error('Revoke Invite Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
  revokeInvite,
};
