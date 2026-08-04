const BillingService = require('../../services/billing.service');

class MetricsAggregator {
  /**
   * Aggregates tokens, cost, and execution duration across worker runs.
   * @param {Array<Object>} workerRuns - Array of worker run objects
   * @returns {Object} - Aggregated metrics
   */
  static aggregate(workerRuns) {
    if (!Array.isArray(workerRuns)) {
      return {
        actualCost: 0,
        billableCost: 0,
        tokens: { input: 0, output: 0, cached: 0, total: 0 }
      };
    }

    let actualCost = 0;
    const tokens = { input: 0, output: 0, cached: 0, total: 0 };

    for (const run of workerRuns) {
      // Only aggregate accepted worker runs. FAILED or canceled ones shouldn't contribute unless specifically required.
      if (run.status !== 'COMPLETED') {
        continue;
      }

      if (run.cost) actualCost += Number(run.cost);
      
      if (run.usage && run.usage.tokens) {
        tokens.input += run.usage.tokens.input || 0;
        tokens.output += run.usage.tokens.output || 0;
        tokens.cached += run.usage.tokens.cached || 0;
        tokens.total += run.usage.tokens.total || 0;
      } else if (run.usage && run.usage.input !== undefined) {
        tokens.input += run.usage.input || 0;
        tokens.output += run.usage.output || 0;
        tokens.cached += run.usage.cached || 0;
        tokens.total += run.usage.total || 0;
      } else if (run.tokensUsed) {
        // Fallback for older worker runs or manual tokensUsed
        tokens.total += Number(run.tokensUsed);
      }
    }

    const totalActualCost = Number(actualCost.toFixed(6));
    const billableCost = BillingService.calculateBillableCost(totalActualCost);

    return {
      actualCost: totalActualCost,
      billableCost,
      tokens
    };
  }
}

module.exports = MetricsAggregator;
