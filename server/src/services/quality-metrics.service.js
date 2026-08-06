/**
 * Quality metrics and feedback loops service
 * Tracks pipeline performance and research quality for continuous improvement
 */
class QualityMetricsService {
  constructor() {
    this.metrics = {
      pipeline: {
        averageLatency: 0,
        averageTokenUsage: 0,
        averageCost: 0,
        successRate: 0,
        cacheHitRate: 0
      },
      research: {
        averageSourceQuality: 0,
        averageFactConfidence: 0,
        contradictionRate: 0,
        verificationPassRate: 0,
        sourceDiversityScore: 0
      },
      sources: {
        totalProcessed: 0,
        highQualityCount: 0,
        mediumQualityCount: 0,
        lowQualityCount: 0,
        averageQualityScore: 0
      }
    };

    this.feedbackLoops = {
      modelPerformance: {},
      sourceReliability: {},
      queryPatterns: {}
    };
  }

  /**
   * Record pipeline metrics
   */
  recordPipelineMetrics(taskId, metrics) {
    if (!metrics) return;

    const { latency, tokens, cost, success, cacheHits } = metrics;

    if (latency) {
      this.metrics.pipeline.averageLatency = this.updateAverage(
        this.metrics.pipeline.averageLatency,
        latency,
        this.metrics.pipeline.totalTasks || 0
      );
    }

    if (tokens) {
      this.metrics.pipeline.averageTokenUsage = this.updateAverage(
        this.metrics.pipeline.averageTokenUsage,
        tokens,
        this.metrics.pipeline.totalTasks || 0
      );
    }

    if (cost) {
      this.metrics.pipeline.averageCost = this.updateAverage(
        this.metrics.pipeline.averageCost,
        cost,
        this.metrics.pipeline.totalTasks || 0
      );
    }

    if (success !== undefined) {
      this.metrics.pipeline.successRate = this.updateAverage(
        this.metrics.pipeline.successRate,
        success ? 1 : 0,
        this.metrics.pipeline.totalTasks || 0
      );
    }

    if (cacheHits !== undefined) {
      this.metrics.pipeline.cacheHitRate = this.updateAverage(
        this.metrics.pipeline.cacheHitRate,
        cacheHits,
        this.metrics.pipeline.totalTasks || 0
      );
    }

    this.metrics.pipeline.totalTasks = (this.metrics.pipeline.totalTasks || 0) + 1;

    console.log(`[QualityMetrics] Pipeline metrics updated for task ${taskId}`);
  }

  /**
   * Record research quality metrics
   */
  recordResearchMetrics(taskId, metrics) {
    if (!metrics) return;

    const { sourceQuality, factConfidence, contradictionRate, verificationPass, sourceDiversity } = metrics;

    if (sourceQuality) {
      this.metrics.research.averageSourceQuality = this.updateAverage(
        this.metrics.research.averageSourceQuality,
        sourceQuality,
        this.metrics.research.totalTasks || 0
      );
    }

    if (factConfidence) {
      this.metrics.research.averageFactConfidence = this.updateAverage(
        this.metrics.research.averageFactConfidence,
        factConfidence,
        this.metrics.research.totalTasks || 0
      );
    }

    if (contradictionRate !== undefined) {
      this.metrics.research.contradictionRate = this.updateAverage(
        this.metrics.research.contradictionRate,
        contradictionRate,
        this.metrics.research.totalTasks || 0
      );
    }

    if (verificationPass !== undefined) {
      this.metrics.research.verificationPassRate = this.updateAverage(
        this.metrics.research.verificationPassRate,
        verificationPass,
        this.metrics.research.totalTasks || 0
      );
    }

    if (sourceDiversity) {
      this.metrics.research.sourceDiversityScore = this.updateAverage(
        this.metrics.research.sourceDiversityScore,
        sourceDiversity,
        this.metrics.research.totalTasks || 0
      );
    }

    this.metrics.research.totalTasks = (this.metrics.research.totalTasks || 0) + 1;

    console.log(`[QualityMetrics] Research metrics updated for task ${taskId}`);
  }

  /**
   * Record source quality metrics
   */
  recordSourceMetrics(sources) {
    if (!Array.isArray(sources) || sources.length === 0) return;

    let totalQuality = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const source of sources) {
      const quality = source.quality || source.score || 50;
      totalQuality += quality;

      if (quality >= 70) highCount++;
      else if (quality >= 50) mediumCount++;
      else lowCount++;
    }

    this.metrics.sources.totalProcessed += sources.length;
    this.metrics.sources.highQualityCount += highCount;
    this.metrics.sources.mediumQualityCount += mediumCount;
    this.metrics.sources.lowQualityCount += lowCount;
    this.metrics.sources.averageQualityScore = totalQuality / sources.length;

    console.log(`[QualityMetrics] Source metrics updated: ${sources.length} sources processed`);
  }

  /**
   * Record model performance feedback
   */
  recordModelPerformance(model, taskType, performance) {
    if (!this.feedbackLoops.modelPerformance[model]) {
      this.feedbackLoops.modelPerformance[model] = {};
    }

    if (!this.feedbackLoops.modelPerformance[model][taskType]) {
      this.feedbackLoops.modelPerformance[model][taskType] = {
        averageLatency: 0,
        averageQuality: 0,
        averageCost: 0,
        usageCount: 0
      };
    }

    const modelMetrics = this.feedbackLoops.modelPerformance[model][taskType];

    if (performance.latency) {
      modelMetrics.averageLatency = this.updateAverage(
        modelMetrics.averageLatency,
        performance.latency,
        modelMetrics.usageCount
      );
    }

    if (performance.quality) {
      modelMetrics.averageQuality = this.updateAverage(
        modelMetrics.averageQuality,
        performance.quality,
        modelMetrics.usageCount
      );
    }

    if (performance.cost) {
      modelMetrics.averageCost = this.updateAverage(
        modelMetrics.averageCost,
        performance.cost,
        modelMetrics.usageCount
      );
    }

    modelMetrics.usageCount++;

    console.log(`[QualityMetrics] Model performance recorded: ${model} for ${taskType}`);
  }

  /**
   * Record source reliability feedback
   */
  recordSourceReliability(domain, reliability) {
    if (!this.feedbackLoops.sourceReliability[domain]) {
      this.feedbackLoops.sourceReliability[domain] = {
        averageReliability: 0,
        usageCount: 0,
        lastUpdated: new Date()
      };
    }

    const domainMetrics = this.feedbackLoops.sourceReliability[domain];
    domainMetrics.averageReliability = this.updateAverage(
      domainMetrics.averageReliability,
      reliability,
      domainMetrics.usageCount
    );
    domainMetrics.usageCount++;
    domainMetrics.lastUpdated = new Date();

    console.log(`[QualityMetrics] Source reliability recorded: ${domain} - ${reliability}`);
  }

  /**
   * Record query pattern feedback
   */
  recordQueryPattern(queryPattern, performance) {
    if (!this.feedbackLoops.queryPatterns[queryPattern]) {
      this.feedbackLoops.queryPatterns[queryPattern] = {
        averageSuccess: 0,
        averageIterations: 0,
        averageSources: 0,
        usageCount: 0
      };
    }

    const patternMetrics = this.feedbackLoops.queryPatterns[queryPattern];

    if (performance.success !== undefined) {
      patternMetrics.averageSuccess = this.updateAverage(
        patternMetrics.averageSuccess,
        performance.success ? 1 : 0,
        patternMetrics.usageCount
      );
    }

    if (performance.iterations) {
      patternMetrics.averageIterations = this.updateAverage(
        patternMetrics.averageIterations,
        performance.iterations,
        patternMetrics.usageCount
      );
    }

    if (performance.sources) {
      patternMetrics.averageSources = this.updateAverage(
        patternMetrics.averageSources,
        performance.sources,
        patternMetrics.usageCount
      );
    }

    patternMetrics.usageCount++;

    console.log(`[QualityMetrics] Query pattern recorded: ${queryPattern}`);
  }

  /**
   * Get quality score for a task
   */
  getTaskQualityScore(taskMetrics) {
    if (!taskMetrics) return 50;

    let score = 0;
    const weights = {
      sourceQuality: 0.3,
      factConfidence: 0.25,
      verificationPass: 0.2,
      sourceDiversity: 0.15,
      contradictionRate: -0.1 // Negative weight
    };

    if (taskMetrics.sourceQuality) {
      score += taskMetrics.sourceQuality * weights.sourceQuality;
    }

    if (taskMetrics.factConfidence) {
      score += taskMetrics.factConfidence * weights.factConfidence;
    }

    if (taskMetrics.verificationPass !== undefined) {
      score += taskMetrics.verificationPass * weights.verificationPass;
    }

    if (taskMetrics.sourceDiversity) {
      score += taskMetrics.sourceDiversity * weights.sourceDiversity;
    }

    if (taskMetrics.contradictionRate !== undefined) {
      score -= taskMetrics.contradictionRate * weights.contradictionRate;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get recommended model for task type based on performance
   */
  getRecommendedModel(taskType) {
    const modelPerformance = this.feedbackLoops.modelPerformance;
    let bestModel = null;
    let bestScore = -1;

    for (const [model, taskMetrics] of Object.entries(modelPerformance)) {
      if (taskMetrics[taskType]) {
        const metrics = taskMetrics[taskType];
        // Score based on quality and cost, with preference for quality
        const score = (metrics.averageQuality * 0.7) - (metrics.averageCost * 0.3);
        
        if (score > bestScore) {
          bestScore = score;
          bestModel = model;
        }
      }
    }

    return bestModel;
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    return {
      pipeline: { ...this.metrics.pipeline },
      research: { ...this.metrics.research },
      sources: { ...this.metrics.sources },
      feedbackLoops: {
        modelPerformance: this.feedbackLoops.modelPerformance,
        sourceReliability: this.feedbackLoops.sourceReliability,
        queryPatterns: this.feedbackLoops.queryPatterns
      },
      summary: this.generateSummary()
    };
  }

  /**
   * Generate summary of current performance
   */
  generateSummary() {
    const summary = {
      overallHealth: 'good',
      recommendations: [],
      alerts: []
    };

    // Check pipeline health
    if (this.metrics.pipeline.successRate < 0.8) {
      summary.overallHealth = 'degraded';
      summary.alerts.push('Low pipeline success rate detected');
    }

    if (this.metrics.pipeline.cacheHitRate < 0.3) {
      summary.recommendations.push('Consider increasing cache TTL to improve hit rate');
    }

    // Check research quality
    if (this.metrics.research.averageSourceQuality < 60) {
      summary.overallHealth = 'degraded';
      summary.alerts.push('Low average source quality detected');
    }

    if (this.metrics.research.contradictionRate > 0.2) {
      summary.recommendations.push('High contradiction rate - consider improving source diversity');
    }

    // Check source quality distribution
    const totalSources = this.metrics.sources.totalProcessed;
    if (totalSources > 0) {
      const highQualityRatio = this.metrics.sources.highQualityCount / totalSources;
      if (highQualityRatio < 0.3) {
        summary.recommendations.push('Consider prioritizing higher quality sources');
      }
    }

    return summary;
  }

  /**
   * Update average with new value
   */
  updateAverage(currentAverage, newValue, count) {
    if (count === 0) return newValue;
    return (currentAverage * count + newValue) / (count + 1);
  }

  /**
   * Reset metrics (for testing or fresh start)
   */
  resetMetrics() {
    this.metrics = {
      pipeline: {
        averageLatency: 0,
        averageTokenUsage: 0,
        averageCost: 0,
        successRate: 0,
        cacheHitRate: 0
      },
      research: {
        averageSourceQuality: 0,
        averageFactConfidence: 0,
        contradictionRate: 0,
        verificationPassRate: 0,
        sourceDiversityScore: 0
      },
      sources: {
        totalProcessed: 0,
        highQualityCount: 0,
        mediumQualityCount: 0,
        lowQualityCount: 0,
        averageQualityScore: 0
      }
    };

    this.feedbackLoops = {
      modelPerformance: {},
      sourceReliability: {},
      queryPatterns: {}
    };

    console.log('[QualityMetrics] All metrics have been reset');
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      feedbackLoops: this.feedbackLoops
    };
  }
}

module.exports = new QualityMetricsService();