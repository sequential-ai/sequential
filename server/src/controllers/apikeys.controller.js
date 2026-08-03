const crypto = require("crypto");
const prisma = require("../db/db-connection");

/**
 * @desc    Get all API keys for the user's organization
 * @route   GET /api/v1/apikeys
 */
const getApiKeys = async (req, res) => {
    try {
        const clerkUserId = req.user.id;

        // Find user and their primary organization
        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: {
                memberships: true,
            }
        });

        if (!user || user.memberships.length === 0) {
            return res.status(404).json({ success: false, message: "User or organization not found" });
        }

        const organizationId = user.memberships[0].organizationId;

        // Fetch API keys (excluding the hash for security)
        const apiKeys = await prisma.apiKey.findMany({
            where: { organizationId, deletedAt: null },
            select: {
                id: true,
                name: true,
                description: true,
                keyPrefix: true,
                environment: true,
                scopes: true,
                lastUsedAt: true,
                createdAt: true,
                revokedAt: true,
                expiresAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: apiKeys });
    } catch (error) {
        console.error("Get API Keys Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Create a new API Key
 * @route   POST /api/v1/apikeys
 */
const createApiKey = async (req, res) => {
    try {
        const { name = "New API Key", description } = req.body;
        const clerkUserId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: { memberships: true }
        });

        if (!user || user.memberships.length === 0) {
            return res.status(404).json({ success: false, message: "User or organization not found" });
        }

        const organizationId = user.memberships[0].organizationId;

        // Generate the raw key
        const rawKey = 'sk_live_' + crypto.randomBytes(24).toString('hex');
        const keyPrefix = rawKey.substring(0, 16); // e.g. sk_live_abc1234
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        const newApiKey = await prisma.apiKey.create({
            data: {
                organizationId,
                createdByUserId: user.id,
                name,
                description,
                keyPrefix,
                keyHash,
                environment: "LIVE",
                scopes: ["*"]
            },
            select: {
                id: true,
                name: true,
                description: true,
                keyPrefix: true,
                createdAt: true,
            }
        });

        // Return the raw key ONCE
        res.status(201).json({ 
            success: true, 
            message: "API Key created successfully. Please copy it now, it will not be shown again.",
            data: newApiKey,
            rawKey 
        });
    } catch (error) {
        console.error("Create API Key Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Toggle API Key status (Enable / Disable)
 * @route   PATCH /api/v1/apikeys/:id/toggle
 */
const toggleApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const { enable } = req.body; // boolean
        const clerkUserId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: { memberships: true }
        });

        if (!user || user.memberships.length === 0) {
            return res.status(404).json({ success: false, message: "User or organization not found" });
        }

        const organizationId = user.memberships[0].organizationId;

        const apiKey = await prisma.apiKey.findFirst({
            where: { id, organizationId, deletedAt: null }
        });

        if (!apiKey) {
            return res.status(404).json({ success: false, message: "API Key not found" });
        }

        const updatedKey = await prisma.apiKey.update({
            where: { id },
            data: {
                revokedAt: enable ? null : new Date()
            },
            select: {
                id: true,
                name: true,
                revokedAt: true
            }
        });

        res.status(200).json({ 
            success: true, 
            message: `API Key ${enable ? 'enabled' : 'disabled'} successfully`,
            data: updatedKey 
        });
    } catch (error) {
        console.error("Toggle API Key Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Delete API Key
 * @route   DELETE /api/v1/apikeys/:id
 */
const deleteApiKey = async (req, res) => {
    try {
        const { id } = req.params;
        const clerkUserId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: { memberships: true }
        });

        if (!user || user.memberships.length === 0) {
            return res.status(404).json({ success: false, message: "User or organization not found" });
        }

        const organizationId = user.memberships[0].organizationId;

        const apiKey = await prisma.apiKey.findFirst({
            where: { id, organizationId, deletedAt: null }
        });

        if (!apiKey) {
            return res.status(404).json({ success: false, message: "API Key not found" });
        }

        // Soft delete
        await prisma.apiKey.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        res.status(200).json({ success: true, message: "API Key deleted successfully" });
    } catch (error) {
        console.error("Delete API Key Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Bulk Toggle API Keys status (Enable / Disable)
 * @route   PATCH /api/v1/apikeys/bulk/toggle
 */
const bulkToggleApiKeys = async (req, res) => {
    try {
        const { ids, enable } = req.body;
        const clerkUserId = req.user.id;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No API key IDs provided" });
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: { memberships: true }
        });

        if (!user || user.memberships.length === 0) {
            return res.status(404).json({ success: false, message: "User or organization not found" });
        }

        const organizationId = user.memberships[0].organizationId;

        await prisma.apiKey.updateMany({
            where: {
                id: { in: ids },
                organizationId,
                deletedAt: null
            },
            data: {
                revokedAt: enable ? null : new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: `${ids.length} API key(s) ${enable ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error) {
        console.error("Bulk Toggle API Keys Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Bulk Delete API Keys (Soft delete)
 * @route   POST /api/v1/apikeys/bulk/delete
 */
const bulkDeleteApiKeys = async (req, res) => {
    try {
        const { ids } = req.body;
        const clerkUserId = req.user.id;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No API key IDs provided" });
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            include: { memberships: true }
        });

        if (!user || user.memberships.length === 0) {
            return res.status(404).json({ success: false, message: "User or organization not found" });
        }

        const organizationId = user.memberships[0].organizationId;

        await prisma.apiKey.updateMany({
            where: {
                id: { in: ids },
                organizationId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            message: `${ids.length} API key(s) deleted successfully`
        });
    } catch (error) {
        console.error("Bulk Delete API Keys Error: ", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

module.exports = {
    getApiKeys,
    createApiKey,
    toggleApiKey,
    deleteApiKey,
    bulkToggleApiKeys,
    bulkDeleteApiKeys
};
