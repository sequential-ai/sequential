class TaskExecutionContext {
  constructor(taskId) {
    this.taskId = taskId;
    this.state = {
      sources: { discovered: 0, fetched: 0, failed: 0 },
      facts: 0,
      workers: { running: 0, completed: 0, failed: 0 }
    };
    this.workerUsages = new Map();
  }

  recordWorkerUsage(workerId, tokens = { prompt: 0, completion: 0, cached: 0, total: 0 }, cost = 0) {
    this.workerUsages.set(workerId, { tokens, cost });
  }

  getTokens() {
    const tokens = { input: 0, output: 0, cached: 0, total: 0 };
    for (const usage of this.workerUsages.values()) {
      if (usage.tokens) {
        tokens.input += usage.tokens.input || usage.tokens.prompt || 0;
        tokens.output += usage.tokens.output || usage.tokens.completion || 0;
        tokens.cached += usage.tokens.cached || 0;
        tokens.total += usage.tokens.total || 0;
      }
    }
    return tokens;
  }

  getCost() {
    let total = 0;
    for (const usage of this.workerUsages.values()) {
      total += usage.cost || 0;
    }
    return { total };
  }

  recordSource(status) {
    // status can be 'discovered', 'fetched', 'failed'
    if (this.state.sources[status] !== undefined) {
      this.state.sources[status] += 1;
    }
  }

  recordFact(count = 1) {
    this.state.facts += count;
  }

  recordWorkerState(status) {
    // status can be 'started', 'completed', 'failed'
    if (status === 'started') {
      this.state.workers.running += 1;
    } else if (status === 'completed') {
      this.state.workers.running = Math.max(0, this.state.workers.running - 1);
      this.state.workers.completed += 1;
    } else if (status === 'failed') {
      this.state.workers.running = Math.max(0, this.state.workers.running - 1);
      this.state.workers.failed += 1;
    }
  }

  getMetrics() {
    return { 
      ...this.state, 
      tokens: this.getTokens(), 
      cost: this.getCost() 
    };
  }
}

module.exports = TaskExecutionContext;
