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




module.exports = {
  authenticateApiKey,
  protect
};
