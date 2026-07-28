const express = require("express");
const router = express.Router();
const apikeysController = require("../../controllers/apikeys.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Get all API keys
router.get("/", protect, apikeysController.getApiKeys);

// Create a new API key
router.post("/", protect, apikeysController.createApiKey);

// Toggle API key (enable/disable)
router.patch("/:id/toggle", protect, apikeysController.toggleApiKey);

// Soft delete API key
router.delete("/:id", protect, apikeysController.deleteApiKey);

module.exports = router;
