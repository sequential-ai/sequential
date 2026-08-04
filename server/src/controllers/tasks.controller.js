const prisma = require("../db/db-connection");
const { enqueuePlanJob } = require("../orchestrator/queue");
const { mapTaskDetailResponse, mapTaskSummaryResponse } = require("../modules/tasks/response/TaskResponseMapper");

// ─────────────────────────────────────────────────────────────
// POST /v1/tasks
// Body: { query, mode?, taskSpec?, responseFormat?, includeTrace? }
//
// responseFormat: "markdown" (default) | "json"
//   Tells the LLM synthesizer which format to produce — only ONE format
//   is generated per call so no tokens are wasted on double-generation.
//
// includeTrace: false (default) | true
//   When true, the GET response includes a `basis` array with the agent's
//   reasoning, per-source citations and a confidence score. Omitted by
//   default to keep payloads small for programmatic consumers.
// ─────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const {
      query,
      mode = "FAST",
      taskSpec,
      responseFormat = "markdown",
      includeTrace = false,
    } = req.body;

    const organizationId = req.organizationId;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const validModes = ["FAST", "STANDARD", "DEEP"];
    if (!validModes.includes(mode.toUpperCase())) {
      return res
        .status(400)
        .json({ error: "Invalid mode. Must be FAST, STANDARD, or DEEP" });
    }

    const validFormats = ["markdown", "json"];
    if (!validFormats.includes(responseFormat.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "Invalid responseFormat. Must be 'markdown' or 'json'" });
    }

    const task = await prisma.task.create({
      data: {
        organizationId,
        query,
        status: "PENDING",
        mode: mode.toUpperCase(),
        // Persist caller preferences so the synthesizer and GET endpoint can
        // honour them without requiring the client to re-send them.
        input: {
          query,
          mode: mode.toUpperCase(),
          taskSpec: taskSpec || null,
          responseFormat: responseFormat.toLowerCase(),
          includeTrace: Boolean(includeTrace),
        },
      },
    });

    // Kick off the research pipeline — pass responseFormat so the SYNTHESIZE
    // worker knows which format to generate (avoids wasting LLM tokens).
    await enqueuePlanJob(
      task.id,
      organizationId,
      query,
      mode.toUpperCase(),
      taskSpec,
      responseFormat.toLowerCase()
    );

    res.status(201).json({
      run: {
        run_id: task.id,
        status: task.status,
        mode: task.mode,
        processor: task.mode,
        metadata: {
          responseFormat: responseFormat.toLowerCase(),
          includeTrace: Boolean(includeTrace),
        },
        created_at: task.createdAt,
        modified_at: task.updatedAt,
      },
      output: null,
    });
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /v1/tasks/:id
// Returns the task in the canonical { run, output } envelope.
// The `basis` reasoning trace is only included when includeTrace was
// set to true at creation time — keeps bandwidth low for simple polls.
// ─────────────────────────────────────────────────────────────
const getTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { workerRuns: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Read per-task settings that were persisted at creation time.
    const taskInput = task.input || {};
    const responseFormat = taskInput.responseFormat || "markdown";
    const includeTrace = Boolean(taskInput.includeTrace);

    // Build the basis array only when the caller opted in AND the task is done.
    const taskSources = Array.isArray(task.sources) ? task.sources : [];
    let basis;
    if (includeTrace && task.status === "COMPLETED") {
      basis = [
        {
          field: "output",
          citations: taskSources.map((src) => ({
            title: src.title || null,
            url: src.url || null,
            excerpts: Array.isArray(src.excerpts) ? src.excerpts : [],
          })),
          reasoning: task.execution?.synthesisReasoning || null,
          confidence: task.execution?.confidence || null,
        },
      ];
    }

    const isCompleted = task.status === "COMPLETED";

    // Use TaskResponseMapper to build the detail response
    const publicResponse = mapTaskDetailResponse(task, { includeTrace });
    
    // Legacy support for basis injection if needed (usually handled manually or in trace mapping, but keeping it for backward compatibility)
    if (basis !== undefined && publicResponse.output) {
      publicResponse.output.basis = basis;
    }

    res.json(publicResponse);
  } catch (err) {
    console.error("Error fetching task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /v1/tasks
// Returns the list of tasks for the organization
// ─────────────────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const tasks = await prisma.task.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedTasks = tasks.map(task => mapTaskSummaryResponse(task));

    res.json(formattedTasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createTask,
  getTaskStatus,
  getTasks,
};
