const prisma = require("../db/db-connection");
const { enqueuePlanJob } = require("../orchestrator/queue");

const createTask = async (req, res) => {
  try {
    const { query, mode = "FAST", taskSpec } = req.body;
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
        input: { query, mode: mode.toUpperCase(), taskSpec: taskSpec || null },
      },
    });

    // Kick off the research pipeline
    await enqueuePlanJob(task.id, organizationId, query, mode.toUpperCase(), taskSpec);

    res.status(201).json({
      message: "Task created and pipeline started",
      task: {
        id: task.id,
        status: task.status,
        input: task.input,
        execution: task.execution,
        output: task.output,
        sources: task.sources
      },
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

    // Return the V2 format, but include workerRuns inside execution
    res.json({
      id: task.id,
      status: task.status,
      input: task.input || { query: task.query, mode: task.mode },
      execution: task.execution || { workerRuns: task.workerRuns, costTotal: task.costTotal, tokensUsed: task.tokensUsed, executionTimeMs: task.executionTimeMs },
      output: task.output || { answer: task.resultAnswer },
      sources: task.sources || [],
    });
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createTask,
  getTaskStatus
};
