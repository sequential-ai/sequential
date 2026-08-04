/**
 * TaskResponseMapper
 * 
 * Responsible for mapping the raw Prisma database entity to the canonical 
 * public response. It is a stateless presentation layer.
 */

function normalizeLegacyOutput(task) {
  // If task has the new canonical task.output, use it.
  if (task.output && task.output.format) {
    return task.output;
  }

  // Legacy fallback
  const responseFormat = task.input?.responseFormat || "markdown";
  if (responseFormat === "markdown") {
    return {
      format: "markdown",
      content: task.resultAnswer || ""
    };
  }

  // Legacy JSON fallback
  let parsedContent = {};
  if (task.output && (task.output.data || task.output.output)) {
    // Old structure stored the object in output.data
    parsedContent = task.output.data || task.output.output || task.output;
  } else if (task.resultAnswer) {
    try {
      parsedContent = JSON.parse(task.resultAnswer);
    } catch (e) {
      // Unrecoverable legacy state, return as string
      parsedContent = task.resultAnswer;
    }
  }

  return {
    format: "json",
    content: parsedContent
  };
}

function mapTaskSummaryResponse(task) {
  return {
    id: task.id,
    category: 'task',
    status: task.status.toLowerCase(),
    mode: task.mode.toLowerCase(),
    query: task.query,
    created_at: task.createdAt,
    modified_at: task.updatedAt,
    completed_at: task.completedAt || null
  };
}

function mapTaskDetailResponse(task, options = {}) {
  const { includeTrace = false } = options;
  const isCompleted = task.status === "COMPLETED";
  const isFailed = task.status === "FAILED";
  
  const response = {
    id: task.id,
    status: task.status.toLowerCase(),
    mode: task.mode.toLowerCase(),
    query: task.query,
    created_at: task.createdAt,
    completed_at: task.completedAt || null
  };

  if (isFailed && task.errorDetails) {
    // Canonical Task Error
    // Assuming errorDetails contains code, message, retryable
    response.error = {
      code: task.errorDetails.code || "UNKNOWN_ERROR",
      message: task.errorMessage || "An unknown error occurred",
      retryable: task.errorDetails.retryable !== false
    };
  } else if (isFailed) {
    response.error = {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      retryable: false
    };
  }

  if (isCompleted) {
    const canonicalOutput = normalizeLegacyOutput(task);
    
    response.output = {
      type: canonicalOutput.format,
      content: canonicalOutput.content
    };

    response.sources = Array.isArray(task.sources) ? task.sources : [];

    // Map usage
    response.usage = {
      tokens: {
        input: task.execution?.metrics?.tokens?.prompt || 0,
        output: task.execution?.metrics?.tokens?.completion || 0,
        total: task.tokensUsed || 0
      },
      cost: Number(task.costTotal) || 0,
      duration_ms: task.executionTimeMs || task.execution?.metrics?.cost?.totalDurationMs || 0
    };
  }

  if (includeTrace && task.execution?.workerRuns) {
    response.trace = {
      workers: mapTaskTrace(task.execution.workerRuns)
    };
  }

  return response;
}

function mapTaskTrace(workerRuns) {
  if (!Array.isArray(workerRuns)) return [];
  
  return workerRuns.map(run => ({
    id: run.id,
    type: (run.type || run.workerType || "UNKNOWN").toLowerCase(),
    status: (run.status || "UNKNOWN").toLowerCase(),
    duration_ms: run.duration || run.durationMs || 0,
    tokens: run.tokensUsed || run.tokens || 0
  }));
}

module.exports = {
  mapTaskSummaryResponse,
  mapTaskDetailResponse,
  mapTaskTrace,
  normalizeLegacyOutput
};
