const crypto = require("crypto");
const prisma = require("../db/db-connection");
const jwt = require('jsonwebtoken');


const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-for-dev-only');

            // Get user from the token
            req.user = decoded; // Will contain { id: "clerkUserId" }

            next();
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

/**
 * Middleware to authenticate API requests using an API Key.
 * Checks the 'x-api-key' or 'Authorization' header.
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    let rawKey = req.headers["x-api-key"];

    // Fallback to Bearer token
    if (!rawKey && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        rawKey = authHeader.split(" ")[1];
      }
    }

    if (!rawKey) {
      return res.status(401).json({ error: "Missing API Key. Please provide 'x-api-key' header." });
    }

    // Hash the key to match against the DB
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKey) {
      return res.status(401).json({ error: "Invalid API Key." });
    }

    // Optionally check if revoked or expired
    if (apiKey.revokedAt) {
      return res.status(401).json({ error: "API Key has been revoked." });
    }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return res.status(401).json({ error: "API Key has expired." });
    }

    // Update last used asynchronously (don't await to save latency)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: {
        lastUsedAt: new Date(),
        lastUsedIp: req.ip || req.connection.remoteAddress,
      }
    }).catch(console.error);

    // Attach organization context to request
    req.organizationId = apiKey.organizationId;
    req.apiKey = apiKey;

    next();
  } catch (error) {
    console.error("API Key Authentication error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};




/**
 * Combined Middleware: Accepts EITHER a valid API Key OR a valid Session JWT.
 * - Used for routes like `/tasks` that are called both programmatically and via the dashboard Playground.
 */
const protectOrApiKey = async (req, res, next) => {
  try {
    const rawKey = req.headers["x-api-key"];
    const authHeader = req.headers.authorization;
    
    // 1. Try API Key Auth first if x-api-key is explicitly provided
    if (rawKey) {
      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });

      if (!apiKey || apiKey.revokedAt || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
        return res.status(401).json({ error: "Invalid, revoked, or expired API Key." });
      }

      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date(), lastUsedIp: req.ip || req.connection.remoteAddress }
      }).catch(console.error);

      req.organizationId = apiKey.organizationId;
      req.apiKey = apiKey;
      return next();
    }

    // 2. Fallback to JWT Session Auth
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-for-dev-only');
      req.user = decoded;
      
      // Dashboard sends x-organization-id for session requests
      let orgId = req.headers['x-organization-id'];
      
      if (!orgId && decoded.id) {
        // Fallback for tools like Thunder Client: use the user's first organization
        const user = await prisma.user.findUnique({
          where: { clerkUserId: decoded.id },
          include: { memberships: true }
        });
        if (user && user.memberships && user.memberships.length > 0) {
          orgId = user.memberships[0].organizationId;
        }
      }

      if (!orgId) {
        return res.status(400).json({ error: "Missing x-organization-id header for session request, and user has no default organization." });
      }
      req.organizationId = orgId;
      return next();
    }

    return res.status(401).json({ error: "Unauthorized. Missing API Key or Session Token." });
  } catch (error) {
    console.error("protectOrApiKey Middleware Error:", error);
    res.status(401).json({ error: "Not authorized, token failed" });
  }
};

module.exports = {
  authenticateApiKey,
  protect,
  protectOrApiKey
};
