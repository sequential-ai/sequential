const eventPipeline = require("./EventPipeline");

class EventMapper {
  /**
   * Generates a unique sequence number or handles correlation.
   * Note: EventPipeline will assign the strict sequence number per task to ensure ordering.
   */
  static _buildBaseEvent(taskId, workerId, type, payload, correlationId) {
    return {
      schemaVersion: "2.0",
      timestamp: new Date().toISOString(),
      taskId,
      workerId,
      correlationId: correlationId || `req_${Date.now()}`,
      type,
      payload
    };
  }

  // --- Task Lifecycle ---

  static mapTaskStarted(taskId, mode, query) {
    const event = this._buildBaseEvent(taskId, 'system', 'task.started', { mode, query });
    eventPipeline.push(event);
  }

  static mapTaskCompleted(taskId, status, durationMs) {
    const event = this._buildBaseEvent(taskId, 'system', 'task.completed', { status, durationMs });
    eventPipeline.push(event);
  }

  // --- Worker Lifecycle ---

  static mapWorkerStarted(taskId, workerId, input) {
    const event = this._buildBaseEvent(taskId, workerId, 'worker.started', { input });
    eventPipeline.push(event);
  }

  static mapWorkerProgress(taskId, workerId, completed, total) {
    const event = this._buildBaseEvent(taskId, workerId, 'worker.progress', { completed, total });
    eventPipeline.push(event);
  }

  static mapWorkerCompleted(taskId, workerId, outputSummary) {
    const event = this._buildBaseEvent(taskId, workerId, 'worker.completed', outputSummary);
    eventPipeline.push(event);
  }

  static mapWorkerFailed(taskId, workerId, errorMessage) {
    const event = this._buildBaseEvent(taskId, workerId, 'worker.failed', { error: errorMessage });
    eventPipeline.push(event);
  }

  // --- Domain: Search ---

  static mapSearchResults(taskId, workerId, searchResults, correlationId) {
    // searchResults is Domain Model: SearchResult[]
    for (const result of searchResults) {
      const event = this._buildBaseEvent(taskId, workerId, 'search.result', {
        id: result.id,
        title: result.title,
        url: result.url,
        domain: result.domain,
        snippet: result.snippet
      }, correlationId);
      eventPipeline.push(event);
    }
  }

  // --- Domain: Facts ---

  static mapFactsExtracted(taskId, workerId, facts, correlationId) {
    // facts is Domain Model: ExtractedFact[]
    // Send to EventPipeline, which will handle batching into `facts.batch`
    for (const fact of facts) {
      const event = this._buildBaseEvent(taskId, workerId, 'internal.fact.found', {
        id: fact.id,
        claim: fact.claim,
        confidence: fact.confidence,
        sourceId: fact.sourceId || fact.sourceUrl
      }, correlationId);
      eventPipeline.push(event);
    }
  }

  // --- Domain: Source ---

  static mapSourceLifecycle(taskId, workerId, sourceUrl, status, correlationId) {
    // status: discovered, fetching, fetched, failed
    const type = `source.${status}`;
    const event = this._buildBaseEvent(taskId, workerId, type, { url: sourceUrl }, correlationId);
    eventPipeline.push(event);
  }

  // --- Domain: Synthesis / JSON ---

  static mapSynthesisDelta(taskId, workerId, deltaStr, correlationId) {
    const event = this._buildBaseEvent(taskId, workerId, 'synthesis.delta', { delta: deltaStr }, correlationId);
    eventPipeline.push(event);
  }

  // --- Metrics ---

  static mapMetricsUpdated(taskId, workerId, metricsContext) {
    const metrics = metricsContext.getMetrics();
    
    eventPipeline.push(this._buildBaseEvent(taskId, workerId, 'execution.progress', {
      pagesFetched: metrics.sources.fetched,
      pagesExtracted: metrics.sources.fetched, // Assuming identical for now
      factsFound: metrics.facts,
      tokens: metrics.tokens.total,
      cost: metrics.cost.total,
      workersRunning: metrics.workers.running,
      workersCompleted: metrics.workers.completed
    }));
  }
}

module.exports = EventMapper;
