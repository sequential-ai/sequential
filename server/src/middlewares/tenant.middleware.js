const prisma = require("../db/db-connection");

/**
 * Middleware to require and validate tenant (organization) access for an authenticated user.
 * Must be preceded by the `protect` auth middleware.
 *
 * Attaches to req:
 * - req.dbUser (database User object)
 * - req.organizationId (target organization ID)
 * - req.organization (target Organization object)
 * - req.userRole (user's role in this organization: OWNER, ADMIN, DEVELOPER, etc.)
 * - req.membership (the OrganizationMember record)
 */
const requireTenant = async (req, res, next) => {
  try {
    const clerkUserId = req.user?.id;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User session missing",
      });
    }

    // Fetch user and their memberships
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found in database",
      });
    }

    if (!Array.isArray(user.memberships) || user.memberships.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No organization memberships found. Please create or join an organization first.",
      });
    }

    // Determine target organization ID
    const requestedOrgId =
      req.headers["x-organization-id"] ||
      req.params.orgId ||
      req.query.organizationId ||
      req.body?.organizationId;

    let targetMembership = null;

    if (
      requestedOrgId &&
      requestedOrgId !== "current" &&
      requestedOrgId !== "active" &&
      requestedOrgId !== "undefined" &&
      requestedOrgId !== "null"
    ) {
      targetMembership = user.memberships.find(
        (m) =>
          m.organizationId === requestedOrgId ||
          m.organization?.id === requestedOrgId ||
          m.organization?.slug === requestedOrgId
      );

      if (!targetMembership) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You are not a member of the requested organization",
        });
      }
    } else {
      // Default to the first active membership
      targetMembership = user.memberships[0];
    }

    // Attach resolved tenant context to request
    req.dbUser = user;
    req.membership = targetMembership;
    req.organizationId = targetMembership.organizationId;
    req.organization = targetMembership.organization;
    req.userRole = targetMembership.role;

    next();
  } catch (error) {
    console.error("requireTenant Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during tenant authorization",
      error: error.message,
    });
  }
};

/**
 * Role-based permission guard middleware factory
 * Example: requireRole('ADMIN', 'OWNER')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Organization role not resolved",
      });
    }

    const normalizedRole = req.userRole.toUpperCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowed.includes(normalizedRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of [${allowedRoles.join(", ")}] role. Your role: ${req.userRole}`,
      });
    }

    next();
  };
};

module.exports = {
  requireTenant,
  requireRole,
};
