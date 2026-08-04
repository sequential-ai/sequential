const express = require("express");
const router = express.Router();
const tasksController = require("../../controllers/tasks.controller");
const streamController = require("../../controllers/stream.controller");
const { protectOrApiKey } = require("../../middlewares/auth.middleware");

// Create a new task and start pipeline
router.post("/", protectOrApiKey, tasksController.createTask);

// Get all tasks
router.get("/", protectOrApiKey, tasksController.getTasks);

// Get task status
router.get("/:id", protectOrApiKey, tasksController.getTaskStatus);

// Stream task events
router.get("/:id/stream", protectOrApiKey, streamController.streamTaskEvents);

module.exports = router;
