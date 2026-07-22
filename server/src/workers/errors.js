class WorkerError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "WorkerError";
    this.code = options.code || "WORKER_ERROR";
    this.status = options.status || 500;
    this.retryable = options.retryable === true;
    this.cause = options.cause;
  }
}

module.exports = { WorkerError };
