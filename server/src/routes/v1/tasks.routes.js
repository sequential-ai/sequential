const express = require("express");
const router = express.Router();
const tasksController = require("../../controllers/tasks.controller");
const { authenticateApiKey } = require("../../middlewares/auth.middleware");

// Create a new task and start pipeline
router.post("/", authenticateApiKey, tasksController.createTask);

// Get task status
router.get("/:id", authenticateApiKey, tasksController.getTaskStatus);

module.exports = router;
