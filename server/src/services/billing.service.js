class BillingService {
  constructor() {
    this.mode = (process.env.BILLING_PRICING_MODE || 'markup').toLowerCase();
    this.markupPercent = parseFloat(process.env.BILLING_MARKUP_PERCENT) || 0;
    this.marginPercent = parseFloat(process.env.BILLING_MARGIN_PERCENT) || 0;
    this.minimumTaskCost = parseFloat(process.env.BILLING_MINIMUM_TASK_COST_USD) || 0;

    // Validate configuration
    if (this.mode === 'margin' && this.marginPercent >= 100) {
      throw new Error('BILLING_MARGIN_PERCENT must be less than 100');
    }
  }

  /**
   * Calculates the final billable cost from the actual cost based on the configured pricing policy.
   * @param {number} actualCost - The actual provider/infrastructure cost.
   * @returns {number} - The billable cost presented to the user.
   */
  calculateBillableCost(actualCost) {
    if (actualCost == null || isNaN(actualCost)) return 0;
    
    const cost = Number(actualCost);
    let calculatedBillable = cost;

    if (this.mode === 'markup') {
      calculatedBillable = cost * (1 + this.markupPercent / 100);
    } else if (this.mode === 'margin') {
      calculatedBillable = cost / (1 - this.marginPercent / 100);
    }

    const finalBillable = Math.max(calculatedBillable, this.minimumTaskCost);
    return Number(finalBillable.toFixed(6));
  }
}

module.exports = new BillingService();
