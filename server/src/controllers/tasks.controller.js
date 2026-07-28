const prisma = require("../db/db-connection");
const { enqueuePlanJob } = require("../orchestrator/queue");

const createTask = async (req, res) => {
  try {
    const { query, mode = "FAST" } = req.body;
    const organizationId = req.organizationId;
    
    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const validModes = ["FAST", "STANDARD", "DEEP"];
    if (!validModes.includes(mode.toUpperCase())) {
      return res.status(400).json({ error: "Invalid mode. Must be FAST, STANDARD, or DEEP" });
    }

    const task = await prisma.task.create({
      data: {
        organizationId,
        query,
        status: "PENDING",
        mode: mode.toUpperCase(),
      },
    });

    // Kick off the research pipeline
    await enqueuePlanJob(task.id, organizationId, query, mode.toUpperCase());

    res.status(201).json({
      message: "Task created and pipeline started",
      task,
    });
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        workerRuns: true,
      }
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createTask,
  getTaskStatus
};
