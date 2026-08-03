const crypto = require('crypto');
const prisma = require('../db/db-connection');

const VALID_ROLES = ['ADMIN', 'MEMBER'];

const normalizeRole = (role) => {
  if (!role) return 'MEMBER';
  const upper = role.toUpperCase().trim();
  if (upper === 'ADMIN' || upper === 'OWNER') return 'ADMIN';
  return 'MEMBER';
};

/**
 * Helper: Resolve requesting user & verify workspace access.
 * Only considers organizations that have NOT been soft-deleted (deletedAt is null).
 */
const resolveUserAndOrg = async (clerkUserId, orgId) => {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      memberships: {
        where: { organization: { deletedAt: null } },
        include: {
          organization: {
            include: {
              settings: true,
              subscription: { include: { plan: true } },
              creditLedger: { select: { amount: true } },
            }
          }
        }
      }
    }
  });

  if (!user || !user.memberships || user.memberships.length === 0) {
    return { error: { status: 404, message: 'User or workspace not found' } };
  }

  let membership;
  if (orgId && orgId !== 'current' && orgId !== 'active') {
    membership = user.memberships.find(m => m.organizationId === orgId || m.organization?.slug === orgId || m.organization?.id === orgId);
    if (!membership) {
      return { error: { status: 403, message: 'You do not have access to this workspace' } };
    }
  } else {
    membership = user.memberships[0];
  }

  return { user, org: membership.organization, userRole: membership.role, membership };
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
        isOwner: m.role === 'ADMIN',
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
    const { email, role = 'MEMBER' } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = normalizeRole(role);

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { user, org, userRole } = authCheck;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only workspace Admins can invite new members.' });
    }

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

    // Check if a PENDING invite already exists for this email
    const existingInvite = await prisma.organizationInvite.findFirst({
      where: {
        organizationId: org.id,
        email: normalizedEmail,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      }
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        message: `An invitation has already been sent to ${normalizedEmail}. They haven't accepted it yet.`
      });
    }

    // Create or refresh OrganizationInvite as PENDING
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
    }).catch(() => {});

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
 * @desc    Update a member's role (ADMIN or MEMBER)
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

    const { user, org, userRole } = authCheck;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only workspace Admins can update member roles' });
    }

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: org.id },
      include: { user: true }
    });

    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found in this workspace' });
    }

    // If target member is ADMIN and changing to MEMBER, ensure at least one other ADMIN remains
    if (targetMember.role === 'ADMIN' && normalizedRole !== 'ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: { organizationId: org.id, role: 'ADMIN' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the sole workspace Admin' });
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

    const { user, org, userRole } = authCheck;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only workspace Admins can remove members' });
    }

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId: org.id },
      include: { user: true }
    });

    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (targetMember.role === 'ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: { organizationId: org.id, role: 'ADMIN' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot remove the sole workspace Admin' });
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

    const { user, org, userRole } = authCheck;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only workspace Admins can cancel invites' });
    }

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

/**
 * @desc    Get organization settings & metadata
 * @route   GET /api/v1/organizations/:orgId/settings
 */
const getOrganizationSettings = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId } = req.params;

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { org, userRole } = authCheck;

    // Ensure settings record exists
    let settings = await prisma.organizationSettings.findUnique({
      where: { organizationId: org.id }
    });

    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: {
          organizationId: org.id,
          timezone: 'UTC',
          theme: 'system',
          defaultAiModel: 'deep'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        metadata: org.metadata || {},
        settings,
        userRole,
        isAdmin: userRole === 'ADMIN',
      }
    });
  } catch (error) {
    console.error('Get Organization Settings Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Update organization name, settings & metadata
 * @route   PATCH /api/v1/organizations/:orgId/settings
 */
const updateOrganizationSettings = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId } = req.params;
    const { name, timezone, defaultAiModel, theme, allowedDomains, ssoEnabled, mfaRequired, metadata } = req.body;

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { user, org, userRole } = authCheck;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only workspace Admins can update organization settings.' });
    }

    // 1. Update core organization attributes if provided
    const orgUpdateData = {};
    if (name && name.trim() && name.trim() !== org.name) {
      orgUpdateData.name = name.trim();
    }
    if (metadata && typeof metadata === 'object') {
      orgUpdateData.metadata = { ...(org.metadata || {}), ...metadata };
    }

    let updatedOrg = org;
    if (Object.keys(orgUpdateData).length > 0) {
      updatedOrg = await prisma.organization.update({
        where: { id: org.id },
        data: orgUpdateData
      });
    }

    // 2. Upsert OrganizationSettings
    const settingsUpdate = {};
    if (timezone !== undefined) settingsUpdate.timezone = timezone;
    if (defaultAiModel !== undefined) settingsUpdate.defaultAiModel = defaultAiModel;
    if (theme !== undefined) settingsUpdate.theme = theme;
    if (allowedDomains !== undefined) settingsUpdate.allowedDomains = Array.isArray(allowedDomains) ? allowedDomains : [];
    if (ssoEnabled !== undefined) settingsUpdate.ssoEnabled = Boolean(ssoEnabled);
    if (mfaRequired !== undefined) settingsUpdate.mfaRequired = Boolean(mfaRequired);

    const updatedSettings = await prisma.organizationSettings.upsert({
      where: { organizationId: org.id },
      update: settingsUpdate,
      create: {
        organizationId: org.id,
        timezone: timezone || 'UTC',
        defaultAiModel: defaultAiModel || 'deep',
        theme: theme || 'system',
        allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
        ssoEnabled: Boolean(ssoEnabled),
        mfaRequired: Boolean(mfaRequired),
      }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        actorUserId: user.id,
        category: 'SETTINGS',
        action: 'organization.updated',
        metadata: {
          name: updatedOrg.name,
          settingsUpdated: Object.keys(settingsUpdate),
        }
      }
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Workspace settings updated successfully',
      data: {
        organization: {
          id: updatedOrg.id,
          name: updatedOrg.name,
          slug: updatedOrg.slug,
          logoUrl: updatedOrg.logoUrl,
          metadata: updatedOrg.metadata,
          settings: updatedSettings,
        }
      }
    });
  } catch (error) {
    console.error('Update Organization Settings Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/**
 * @desc    Delete an organization and cascade all related data
 * @route   DELETE /api/v1/organizations/:orgId
 */
const deleteOrganization = async (req, res) => {
  try {
    const clerkUserId = req.user.id;
    const { orgId } = req.params;

    const authCheck = await resolveUserAndOrg(clerkUserId, orgId);
    if (authCheck.error) {
      return res.status(authCheck.error.status).json({ success: false, message: authCheck.error.message });
    }

    const { user, org, userRole } = authCheck;

    if (userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only workspace Admins can delete this organization.' });
    }

    // Soft-delete: set deletedAt so the org is excluded from active queries
    // but ownership history is preserved for free-credit eligibility checks.
    // All related data (creditLedger, tasks, etc.) stays in the DB but the
    // org is treated as gone from the product's perspective.
    await prisma.organization.update({
      where: { id: org.id },
      data: { deletedAt: new Date(), isActive: false }
    });

    // Fetch remaining active memberships for the user
    const remainingMemberships = await prisma.organizationMember.findMany({
      where: {
        userId: user.id,
        organization: { deletedAt: null }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            clerkOrgId: true,
            metadata: true,
            createdAt: true,
            settings: true,
            subscription: { include: { plan: true } },
            creditLedger: { select: { amount: true } }
          }
        }
      }
    });

    const nextOrgId = remainingMemberships.length > 0 ? remainingMemberships[0].organization.id : null;

    res.status(200).json({
      success: true,
      message: `Organization "${org.name}" was permanently deleted`,
      data: {
        deletedOrgId: org.id,
        remainingMemberships,
        nextOrgId,
        hasRemainingWorkspaces: remainingMemberships.length > 0
      }
    });
  } catch (error) {
    console.error('Delete Organization Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getOrganizationMembers,
  addOrganizationMember,
  updateMemberRole,
  removeOrganizationMember,
  revokeInvite,
  getOrganizationSettings,
  updateOrganizationSettings,
  deleteOrganization,
};

