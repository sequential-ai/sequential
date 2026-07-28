class MetricsAggregator {
  /**
   * Aggregates tokens, cost, and execution duration across worker runs.
   * @param {Array<Object>} workerRuns - Array of worker run objects
   * @returns {Object} - Aggregated metrics
   */
  static aggregate(workerRuns) {
    if (!Array.isArray(workerRuns)) {
      return {
        totalCost: 0,
        totalTokens: 0,
        totalDurationMs: 0
      };
    }

    let totalCost = 0;
    let totalTokens = 0;
    let totalDurationMs = 0;

    for (const run of workerRuns) {
      if (run.cost) totalCost += Number(run.cost);
      if (run.tokensUsed) totalTokens += Number(run.tokensUsed);
      if (run.durationMs) totalDurationMs += Number(run.durationMs);
    }

    return {
      totalCost: Number(totalCost.toFixed(6)),
      totalTokens,
      totalDurationMs
    };
  }
}

module.exports = MetricsAggregator;
