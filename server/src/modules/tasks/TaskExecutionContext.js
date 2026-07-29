class TaskExecutionContext {
  constructor(taskId) {
    this.taskId = taskId;
    this.state = {
      tokens: { prompt: 0, completion: 0, cached: 0, total: 0 },
      cost: { planning: 0, search: 0, extraction: 0, synthesis: 0, total: 0 },
      sources: { discovered: 0, fetched: 0, failed: 0 },
      facts: 0,
      workers: { running: 0, completed: 0, failed: 0 }
    };
  }

  recordTokens(prompt = 0, completion = 0, cached = 0) {
    this.state.tokens.prompt += prompt;
    this.state.tokens.completion += completion;
    this.state.tokens.cached += cached;
    this.state.tokens.total += (prompt + completion + cached);
  }

  recordCost(category, amount) {
    if (this.state.cost[category] !== undefined) {
      this.state.cost[category] += amount;
    }
    this.state.cost.total += amount;
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
    return { ...this.state };
  }
}

module.exports = TaskExecutionContext;
