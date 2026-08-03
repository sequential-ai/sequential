const express = require("express");
const router = express.Router();
const apikeysController = require("../../controllers/apikeys.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { requireTenant } = require("../../middlewares/tenant.middleware");

// All API key routes require authentication + tenant resolution
router.use(protect);
router.use(requireTenant);

// Get all API keys
router.get("/", apikeysController.getApiKeys);

// Create a new API key
router.post("/", apikeysController.createApiKey);

// Bulk operations
router.patch("/bulk/toggle", apikeysController.bulkToggleApiKeys);
router.post("/bulk/delete", apikeysController.bulkDeleteApiKeys);

// Toggle API key (enable/disable)
router.patch("/:id/toggle", apikeysController.toggleApiKey);

// Soft delete API key
router.delete("/:id", apikeysController.deleteApiKey);

module.exports = router;
