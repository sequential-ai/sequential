const prisma = require("../db/db-connection");
const { enqueuePlanJob } = require("../orchestrator/queue");

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
      id: task.id,
      run_id: task.id,
      status: task.status,
      mode: task.mode,
      output: null,
      sources: [],
      usage: {
        tokens: { input: 0, output: 0, cached: 0, total: 0 },
        cost: 0,
        duration_ms: null
      },
      created_at: task.createdAt,
      completed_at: null
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

    const usage = {
      tokens: task.usage?.tokens || { input: 0, output: 0, cached: 0, total: task.tokensUsed || 0 },
      cost: Number(task.billableCost || task.costTotal || 0),
      duration_ms: task.executionTimeMs || null
    };

    const includes = (req.query.include || "").split(",");
    const includeMetadata = includes.includes("metadata");
    const includeTraceData = includes.includes("trace");

    const responsePayload = {
      id: task.id,
      run_id: task.id,
      status: task.status,
      mode: task.mode,
      output: isCompleted
        ? {
            type: responseFormat,
            content: task.output?.answer || task.resultAnswer || null,
            ...(basis !== undefined && { basis }),
          }
        : null,
      sources: taskSources,
      usage,
      created_at: task.createdAt,
      completed_at: task.completedAt || null,
    };

    if (includeMetadata) {
      const exec = task.execution || {};
      responsePayload.metadata = {
        run: {
          id: task.id,
          attempt: 1,
          status: task.status,
          started_at: task.startedAt || task.createdAt,
          completed_at: task.completedAt || null,
          duration_ms: task.executionTimeMs || null
        },
        executionSummary: {
          workers: {
            total: task.workerRuns?.length || 0,
            completed: task.workerRuns?.filter(r => r.status === "COMPLETED").length || 0,
            failed: task.workerRuns?.filter(r => r.status === "FAILED").length || 0
          },
          searches: exec.metrics?.sources?.discovered || 0,
          sources: {
            discovered: exec.metrics?.sources?.discovered || 0,
            fetched: exec.metrics?.sources?.fetched || 0,
            failed: exec.metrics?.sources?.failed || 0
          },
          facts: {
            extracted: exec.metrics?.facts || 0
          }
        }
      };
    }

    if (includeTraceData) {
      responsePayload.trace = {
        workers: (task.workerRuns || []).map((run, index) => {
          const w = {
            sequence: index + 1,
            id: run.id,
            type: run.workerType.toLowerCase(),
            status: run.status.toLowerCase(),
            started_at: run.startedAt,
            completed_at: run.completedAt,
            duration_ms: run.durationMs,
          };
          if (run.usage && run.usage.tokens && run.usage.tokens.total > 0) {
            w.usage = { tokens: run.usage.tokens };
          } else if (run.tokensUsed > 0) {
            w.usage = { tokens: { input: 0, output: 0, total: run.tokensUsed } };
          }
          if (run.status === "FAILED") {
            w.error = {
              code: "WORKER_FAILED",
              message: run.errorMessage || "Worker failed during execution"
            };
          }
          return w;
        })
      };
    }

    res.json(responsePayload);
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

    const formattedTasks = tasks.map(task => {
      const taskInput = task.input || {};
      const responseFormat = taskInput.responseFormat || "markdown";
      const includeTrace = Boolean(taskInput.includeTrace);
      const isCompleted = task.status === "COMPLETED";

      const usage = {
        tokens: task.usage?.tokens || { input: 0, output: 0, cached: 0, total: task.tokensUsed || 0 },
        cost: Number(task.billableCost || task.costTotal || 0),
        duration_ms: task.executionTimeMs || null
      };

      return {
        id: task.id,
        run_id: task.id,
        category: 'task',
        query: task.query,
        status: task.status,
        mode: task.mode,
        output: isCompleted ? {
            type: responseFormat,
            content: task.output?.answer || task.resultAnswer || null,
        } : null,
        usage,
        created_at: task.createdAt,
        completed_at: task.completedAt || null,
      };
    });

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
