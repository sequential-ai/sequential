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
        include: {
            organization: {
                include: {
                    subscription: {
                        include: { plan: true }
                    },
                    apiKeys: true,
                    creditLedger: true
                }
            }
        }
    }
};

/**
 * @desc    Register a new user (Sync from Clerk to our DB)
 * @route   POST /api/v1/auth/register
 */
const registerUser = async (req, res) => {
    try {
        const { clerkUserId, email, firstName, lastName, imageUrl } = req.body;

        if (!clerkUserId || !email) {
            return res.status(400).json({ success: false, message: "clerkUserId and email are required" });
        }

        // Check if user already exists by clerkUserId or email
        const existingUser = await prisma.user.findFirst({
            where: { 
                OR: [
                    { clerkUserId },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Run everything in a transaction to ensure all or nothing
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the User
            const newUser = await tx.user.create({
                data: {
                    clerkUserId,
                    email,
                    firstName,
                    lastName,
                    imageUrl,
                }
            });

            // 2. Create the Organization (Personal Workspace)
            const orgName = `${firstName || 'User'}'s Workspace`;
            const orgSlug = `workspace-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const clerkOrgId = `org_${Date.now()}_${clerkUserId}`;

            const newOrg = await tx.organization.create({
                data: {
                    clerkOrgId,
                    name: orgName,
                    slug: orgSlug,
                }
            });

            // 3. Add User to Organization as OWNER
            await tx.organizationMember.create({
                data: {
                    organizationId: newOrg.id,
                    userId: newUser.id,
                    role: 'OWNER',
                }
            });

            // 4. Create or fetch Free Plan and Subscription
            const freePlan = await tx.plan.upsert({
                where: { key: 'free' },
                update: {},
                create: {
                    key: 'free',
                    name: 'Free Plan',
                    monthlyPrice: 0,
                    yearlyPrice: 0,
                    maxMembers: 1,
                    maxApiKeys: 1,
                    maxProjects: 1,
                    storageLimitGb: 1,
                    monthlyCredits: 100, // default credits
                    monthlyRequestLimit: 1000,
                    rateLimitPerMinute: 60,
                }
            });

            await tx.subscription.create({
                data: {
                    organizationId: newOrg.id,
                    planId: freePlan.id,
                    provider: 'Razorpay', // As per enum
                    status: 'ACTIVE',
                }
            });

            // Initial Credit Grant
            await tx.creditLedgerEntry.create({
                data: {
                    organizationId: newOrg.id,
                    amount: freePlan.monthlyCredits,
                    balanceAfter: freePlan.monthlyCredits,
                    type: 'GRANT',
                    reason: 'Initial Signup Grant'
                }
            });

            return { newUser };
        });

        const fullyPopulatedUser = await prisma.user.findUnique({
            where: { id: result.newUser.id },
            include: userInclude
        });

        const token = generateToken(fullyPopulatedUser.clerkUserId);

        res.status(201).json({
            success: true,
            message: "User registered and workspace provisioned successfully",
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
        // Since Clerk handles the actual authentication session, 
        // this endpoint can be used to clear any custom backend sessions, cookies, or perform logging.
        // For now, we'll just return a success message.
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

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Get Profile Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getProfile
};
