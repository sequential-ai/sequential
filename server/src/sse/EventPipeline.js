const executionTimeline = require("./ExecutionTimeline");

class EventPipeline {
  constructor() {
    // Basic in-memory buffer for batching facts per task
    // Format: { [taskId]: { facts: [] } }
    this.buffers = {};
    
    // Configurable batch sizes
    this.FACT_BATCH_SIZE = 10;
  }

  /**
   * Pushes an event into the pipeline.
   * Handles batching for specific event types (like facts).
   */
  push(event) {
    if (event.type === 'internal.fact.found') {
      this._handleFactBatching(event);
    } else {
      // Pass directly to timeline
      executionTimeline.append(event);
    }
  }

  _handleFactBatching(factEvent) {
    const { taskId, workerId, correlationId, parentEventId, payload } = factEvent;
    
    if (!this.buffers[taskId]) {
      this.buffers[taskId] = { facts: [] };
    }

    this.buffers[taskId].facts.push(payload);

    if (this.buffers[taskId].facts.length >= this.FACT_BATCH_SIZE) {
      this.flushFacts(taskId, workerId, correlationId, parentEventId);
    }
  }

  /**
   * Flushes any pending batched events for a task.
   * Called automatically when the task or extraction worker finishes.
   */
  flushFacts(taskId, workerId, correlationId, parentEventId) {
    if (!this.buffers[taskId] || this.buffers[taskId].facts.length === 0) return;

    const batchedEvent = {
      schemaVersion: "2.0",
      timestamp: new Date().toISOString(),
      taskId,
      workerId: workerId || 'system',
      correlationId: correlationId || `req_${Date.now()}`,
      parentEventId: parentEventId || null,
      type: 'facts.batch',
      payload: {
        facts: [...this.buffers[taskId].facts]
      }
    };

    this.buffers[taskId].facts = [];
    executionTimeline.append(batchedEvent);
  }
}

const pipeline = new EventPipeline();
module.exports = pipeline;
