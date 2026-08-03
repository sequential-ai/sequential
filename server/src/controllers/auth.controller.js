const prisma = require('../db/db-connection');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret-for-dev-only', {
        expiresIn: '30d',
    });
};

const userInclude = {
    memberships: {
        where: { organization: { deletedAt: null } },
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
                    subscription: {
                        include: { plan: true }
                    },
                    creditLedger: {
                        select: { amount: true }
                    }
                }
            }
        }
    }
};

/**
 * Helper: Fetch pending invitations for an email
 */
const getPendingInvitesForEmail = async (email) => {
    if (!email) return [];
    try {
        const rawInvites = await prisma.organizationInvite.findMany({
            where: {
                email: email.toLowerCase().trim(),
                status: 'PENDING',
                expiresAt: { gt: new Date() }
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true
                    }
                },
                invitedByUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return rawInvites.map(inv => ({
            id: inv.id,
            inviteId: inv.id,
            token: inv.token,
            email: inv.email,
            role: inv.role,
            status: inv.status,
            expiresAt: inv.expiresAt,
            createdAt: inv.createdAt,
            organization: inv.organization,
            invitedBy: inv.invitedByUser
                ? `${inv.invitedByUser.firstName || ''} ${inv.invitedByUser.lastName || ''}`.trim() || inv.invitedByUser.email
                : null
        }));
    } catch (err) {
        console.error("Get Pending Invites Error:", err);
        return [];
    }
};

/**
 * @desc    Register a new user in database
 * @route   POST /api/v1/auth/register
 */
const registerUser = async (req, res) => {
    try {
        const { clerkUserId, email, firstName, lastName, imageUrl } = req.body;

        if (!clerkUserId || !email) {
            return res.status(400).json({ success: false, message: "clerkUserId and email are required" });
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: userInclude
        });

        if (user) {
            const pendingInvites = await getPendingInvitesForEmail(user.email);
            user.pendingInvites = pendingInvites;
            const token = generateToken(user.clerkUserId);
            return res.status(200).json({
                success: true,
                message: "User already exists",
                token,
                data: user
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Transaction to create User and check pending invites
        const newUser = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    clerkUserId,
                    email: normalizedEmail,
                    firstName: firstName || null,
                    lastName: lastName || null,
                    imageUrl: imageUrl || null,
                }
            });

            return createdUser;
        });

        const pendingInvites = await getPendingInvitesForEmail(newUser.email);

        const fullyPopulatedUser = await prisma.user.findUnique({
            where: { id: newUser.id },
            include: userInclude
        });

        if (fullyPopulatedUser) {
            fullyPopulatedUser.pendingInvites = pendingInvites;
        }

        const token = generateToken(newUser.clerkUserId);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            data: fullyPopulatedUser
        });
    } catch (error) {
        if (error.code === 'P2002') {
            console.warn(`[Warning] Duplicate registration attempt for ${req.body.email}. Ignoring.`);
            return res.status(400).json({ success: false, message: "User already exists (duplicate request)" });
        }
        console.error("Register Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Login user (Retrieve user info from our DB using Clerk ID)
 * @route   POST /api/v1/auth/login
 */
const loginUser = async (req, res) => {
    try {
        const { clerkUserId } = req.body;

        if (!clerkUserId) {
            return res.status(400).json({ success: false, message: "clerkUserId is required" });
        }

        // Find user by clerkUserId
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: userInclude
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found in database. Please register first." });
        }

        const pendingInvites = await getPendingInvitesForEmail(user.email);
        user.pendingInvites = pendingInvites;

        const token = generateToken(user.clerkUserId);

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            data: user
        });
    } catch (error) {
        console.error("Login Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Logout user (Handle backend cleanup if necessary)
 * @route   POST /api/v1/auth/logout
 */
const logoutUser = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    } catch (error) {
        console.error("Logout Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 */
const getProfile = async (req, res) => {
    try {
        const clerkUserId = req.user.id;

        if (!clerkUserId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: userInclude
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const pendingInvites = await getPendingInvitesForEmail(user.email);
        user.pendingInvites = pendingInvites;

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Get Profile Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Create a new organization for the user
 * @route   POST /api/v1/auth/organization
 */
const createOrganization = async (req, res) => {
    try {
        const clerkUserId = req.user.id;
        const { name, invites = [], surveyAnswers = [] } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Organization name is required" });
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        const clerkOrgId = `org_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        const newOrg = await prisma.$transaction(async (tx) => {
            // 1. Create Organization
            const org = await tx.organization.create({
                data: {
                    clerkOrgId,
                    name: name.trim(),
                    slug: orgSlug,
                    metadata: {
                        surveyAnswers,
                        onboarded: true,
                        onboardedAt: new Date().toISOString()
                    }
                }
            });

            // 2. Add creator as ADMIN
            await tx.organizationMember.create({
                data: {
                    organizationId: org.id,
                    userId: user.id,
                    role: 'ADMIN'
                }
            });

            // 3. Create default OrganizationSettings
            await tx.organizationSettings.create({
                data: {
                    organizationId: org.id,
                    timezone: 'UTC',
                    theme: 'system',
                    defaultAiModel: 'deep'
                }
            });

            // 4. Free plan & subscription
            const freePlan = await tx.plan.upsert({
                where: { key: 'free' },
                update: {},
                create: {
                    key: 'free',
                    name: 'Free Plan',
                    monthlyPrice: 0,
                    yearlyPrice: 0,
                    maxMembers: 5,
                    maxApiKeys: 2,
                    maxProjects: 3,
                    storageLimitGb: 2,
                    monthlyCredits: 100,
                    monthlyRequestLimit: 1000,
                    rateLimitPerMinute: 60,
                }
            });

            await tx.subscription.create({
                data: {
                    organizationId: org.id,
                    planId: freePlan.id,
                    provider: 'Razorpay',
                    status: 'ACTIVE'
                }
            });

            // 5. Initial credits — only granted on user's very first organization.
            // We check all orgs where this user has EVER been an ADMIN (including
            // soft-deleted orgs via deletedAt) to prevent credit farming.
            const previousAdminOrgs = await tx.organizationMember.count({
                where: {
                    userId: user.id,
                    role: 'ADMIN',
                    // Exclude the org we just created so we count only prior ones
                    organizationId: { not: org.id },
                }
            });

            const isFirstOrg = previousAdminOrgs === 0;

            if (isFirstOrg) {
                await tx.creditLedgerEntry.create({
                    data: {
                        organizationId: org.id,
                        amount: 100,
                        balanceAfter: 100,
                        type: 'GRANT',
                        reason: 'Organization Creation Welcome Grant'
                    }
                });
            }
            // Subsequent orgs start with 0 credits — no ledger entry created.

            // 6. If invites provided, create invites
            if (Array.isArray(invites) && invites.length > 0) {
                for (const inv of invites) {
                    const email = typeof inv === 'string' ? inv : inv.email;
                    const role = typeof inv === 'object' && inv.role ? inv.role : 'MEMBER';
                    if (email && email.trim()) {
                        const upperRole = String(role || 'MEMBER').toUpperCase().trim();
                        const normalizedRole = upperRole === 'ADMIN' ? 'ADMIN' : 'MEMBER';

                        await tx.organizationInvite.create({
                            data: {
                                organizationId: org.id,
                                email: email.trim().toLowerCase(),
                                role: normalizedRole,
                                token: crypto.randomBytes(32).toString('hex'),
                                invitedByUserId: user.id,
                                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                            }
                        }).catch(e => console.warn('Invite creation notice:', e.message));
                    }
                }
            }

            return org;
        });

        // Fetch refreshed user profile with all memberships
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: userInclude
        });

        const pendingInvites = await getPendingInvitesForEmail(user.email);
        if (updatedUser) {
            updatedUser.pendingInvites = pendingInvites;
        }

        res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: {
                organization: newOrg,
                user: updatedUser
            }
        });
    } catch (error) {
        console.error("Create Org Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Accept an organization invite
 * @route   POST /api/v1/auth/invites/:inviteId/accept
 */
const acceptOrganizationInvite = async (req, res) => {
    try {
        const clerkUserId = req.user.id;
        const { inviteId } = req.params;

        const user = await prisma.user.findUnique({
            where: { clerkUserId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Find the pending invite by ID matching user's email
        const invite = await prisma.organizationInvite.findFirst({
            where: {
                id: inviteId,
                status: 'PENDING'
            },
            include: {
                organization: true
            }
        });

        if (!invite) {
            return res.status(404).json({ success: false, message: "Invitation not found or already accepted/expired" });
        }

        // Check if user is already a member
        const existingMember = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: invite.organizationId,
                    userId: user.id
                }
            }
        });

        if (!existingMember) {
            // Create membership
            await prisma.organizationMember.create({
                data: {
                    organizationId: invite.organizationId,
                    userId: user.id,
                    role: invite.role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
                }
            });
        }

        // Update invite to ACCEPTED
        await prisma.organizationInvite.update({
            where: { id: invite.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date()
            }
        });

        // Record audit log
        await prisma.auditLog.create({
            data: {
                organizationId: invite.organizationId,
                actorUserId: user.id,
                category: 'MEMBER',
                action: 'member.joined',
                metadata: {
                    email: user.email,
                    role: invite.role,
                    inviteId: invite.id
                }
            }
        }).catch(e => console.warn('AuditLog error:', e.message));

        // Fetch refreshed user profile
        const updatedUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: userInclude
        });

        const pendingInvites = await getPendingInvitesForEmail(user.email);
        if (updatedUser) {
            updatedUser.pendingInvites = pendingInvites;
        }

        res.status(200).json({
            success: true,
            message: `Successfully joined ${invite.organization?.name || 'organization'}!`,
            data: {
                organization: invite.organization,
                user: updatedUser
            }
        });
    } catch (error) {
        console.error("Accept Invite Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Decline an organization invite
 * @route   POST /api/v1/auth/invites/:inviteId/decline
 */
const declineOrganizationInvite = async (req, res) => {
    try {
        const clerkUserId = req.user.id;
        const { inviteId } = req.params;

        const user = await prisma.user.findUnique({
            where: { clerkUserId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const invite = await prisma.organizationInvite.findFirst({
            where: {
                id: inviteId,
                status: 'PENDING'
            }
        });

        if (!invite) {
            return res.status(404).json({ success: false, message: "Invitation not found" });
        }

        await prisma.organizationInvite.update({
            where: { id: invite.id },
            data: { status: 'REVOKED' }
        });

        const pendingInvites = await getPendingInvitesForEmail(user.email);

        res.status(200).json({
            success: true,
            message: "Invitation declined",
            data: { pendingInvites }
        });
    } catch (error) {
        console.error("Decline Invite Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Get pending invites for currently logged-in user
 * @route   GET /api/v1/auth/invites/pending
 */
const getPendingUserInvites = async (req, res) => {
    try {
        const clerkUserId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { clerkUserId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const pendingInvites = await getPendingInvitesForEmail(user.email);
        res.status(200).json({
            success: true,
            data: pendingInvites
        });
    } catch (error) {
        console.error("Get Pending Invites Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    createOrganization,
    acceptOrganizationInvite,
    declineOrganizationInvite,
    getPendingUserInvites,
};
