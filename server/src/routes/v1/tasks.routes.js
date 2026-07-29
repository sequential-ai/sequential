const express = require("express");
const router = express.Router();
const tasksController = require("../../controllers/tasks.controller");
const streamController = require("../../controllers/stream.controller");
const { authenticateApiKey } = require("../../middlewares/auth.middleware");

// Create a new task and start pipeline
router.post("/", authenticateApiKey, tasksController.createTask);

// Get task status
router.get("/:id", authenticateApiKey, tasksController.getTaskStatus);

// Stream task events
router.get("/:id/stream", authenticateApiKey, streamController.streamTaskEvents);

module.exports = router;
