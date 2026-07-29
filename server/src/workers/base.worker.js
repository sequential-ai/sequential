const EventMapper = require("../sse/EventMapper");

class BaseWorker {
  constructor(workerId) {
    this.workerId = workerId || this.constructor.name;
  }

  /**
   * Executes the worker's business logic while automatically tracking metrics
   * and delegating lifecycle events to the EventMapper.
   */
  async execute(taskId, input, taskContext) {
    if (!taskContext) throw new Error("TaskExecutionContext is required");

    try {
      taskContext.recordWorkerState('started');
      
      const { content, facts, taskSpec, ...lightweightInput } = input || {};
      EventMapper.mapWorkerStarted(taskId, this.workerId, { ...lightweightInput, timestamp: new Date().toISOString() });
      
      const result = await this.run(input, taskContext);
      
      taskContext.recordWorkerState('completed');
      
      return result;
    } catch (error) {
      taskContext.recordWorkerState('failed');
      throw error;
    }
  }

  /**
   * Abstract method to be implemented by subclasses.
   * Workers should return a Domain Model and update taskContext if needed.
   */
  async run(input, taskContext) {
    throw new Error("run() must be implemented by subclasses");
  }
}

module.exports = BaseWorker;
