/**
 * Research Planning Service
 * Generates query-aware research dimensions and subqueries for comprehensive coverage
 * Tracks evidence coverage across dimensions to guide research depth
 */

class ResearchPlanningService {
  constructor() {
    // Common research dimension templates
    this.dimensionTemplates = {
      'technology': ['architecture', 'implementation', 'integration', 'performance', 'scalability'],
      'business': ['market', 'adoption', 'economics', 'competition', 'trends'],
      'regulatory': ['compliance', 'standards', 'regulations', 'legal', 'governance'],
      'research': ['methodology', 'findings', 'limitations', 'future work', 'citations'],
      'product': ['features', 'pricing', 'availability', 'support', 'roadmap'],
      'industry': ['players', 'consolidation', 'innovation', 'challenges', 'opportunities']
    };
  }

  /**
   * Generate research dimensions based on query analysis
   * @param {string} query - Original research query
   * @param {string} mode - Research mode (FAST/STANDARD/DEEP)
   * @returns {Array} - Research dimensions
   */
  async generateResearchDimensions(query, mode = 'STANDARD') {
    const queryLower = query.toLowerCase();

    // Analyze query to identify research domain
    const domain = this.identifyDomain(queryLower);

    // Get base dimensions for domain
    const baseDimensions = this.dimensionTemplates[domain] || this.getDefaultDimensions();

    // Customize dimensions based on query specifics
    const customizedDimensions = this.customizeDimensions(baseDimensions, queryLower, mode);

    // Limit dimensions based on mode
    const maxDimensions = mode === 'FAST' ? 3 : mode === 'STANDARD' ? 6 : 10;
    return customizedDimensions.slice(0, maxDimensions);
  }

  /**
   * Identify research domain from query
   */
  identifyDomain(queryLower) {
    const domainKeywords = {
      'technology': ['api', 'architecture', 'implementation', 'framework', 'platform', 'system', 'infrastructure'],
      'business': ['market', 'company', 'industry', 'enterprise', 'business', 'startup', 'investment'],
      'regulatory': ['law', 'regulation', 'compliance', 'standard', 'policy', 'government', 'legal'],
      'research': ['study', 'research', 'paper', 'finding', 'methodology', 'academic', 'university'],
      'product': ['product', 'feature', 'pricing', 'software', 'tool', 'service', 'application']
    };

    let bestDomain = 'business'; // Default
    let maxMatches = 0;

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const matches = keywords.filter(keyword => queryLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestDomain = domain;
      }
    }

    return bestDomain;
  }

  /**
   * Get default dimensions when domain can't be identified
   */
  getDefaultDimensions() {
    return ['overview', 'key features', 'benefits', 'challenges', 'examples', 'future outlook'];
  }

  /**
   * Customize dimensions based on query specifics
   */
  customizeDimensions(baseDimensions, queryLower, mode) {
    const customized = [];

    for (const dimension of baseDimensions) {
      // Customize dimension name based on query content
      const customDimension = this.customizeDimensionName(dimension, queryLower);
      customized.push(customDimension);
    }

    // Add mode-specific dimensions
    if (mode === 'DEEP') {
      customized.push('risks and limitations');
      customized.push('expert opinions');
      customized.push('case studies');
    }

    return customized;
  }

  /**
   * Customize individual dimension name
   */
  customizeDimensionName(dimension, queryLower) {
    // Extract key terms from query
    const terms = this.extractKeyTerms(queryLower);

    // If we have meaningful terms, prepend to dimension
    if (terms.length > 0 && terms.length <= 2) {
      const termString = terms.join(' ');
      return `${termString} ${dimension}`;
    }

    return dimension;
  }

  /**
   * Extract key terms from query
   */
  extractKeyTerms(queryLower) {
    // Remove common words
    const stopWords = ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or', 'but', 'with', 'by'];
    const words = queryLower.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

    // Return most significant terms (proper nouns, longer words)
    return words.filter(w => /^[A-Z]/.test(w) || w.length > 5).slice(0, 3);
  }

  /**
   * Track evidence coverage across dimensions
   * @param {Array} evidence - Evidence array
   * @param {Array} dimensions - Research dimensions
   * @returns {Object} - Coverage statistics per dimension
   */
  trackCoverage(evidence, dimensions) {
    const coverage = {};

    for (const dimension of dimensions) {
      const dimensionLower = dimension.toLowerCase();
      const relevantEvidence = evidence.filter(ev => {
        const claim = (ev.claim || '').toLowerCase();
        const evidenceText = (ev.evidence || ev.evidenceText || '').toLowerCase();
        return claim.includes(dimensionLower) || evidenceText.includes(dimensionLower);
      });

      coverage[dimension] = {
        evidenceCount: relevantEvidence.length,
        totalEvidence: evidence.length,
        coverageRate: evidence.length > 0 ? relevantEvidence.length / evidence.length : 0,
        averageConfidence: this.calculateAverageConfidence(relevantEvidence)
      };
    }

    return coverage;
  }

  /**
   * Calculate average confidence for evidence
   */
  calculateAverageConfidence(evidence) {
    if (!evidence || evidence.length === 0) return 0;

    const confidences = evidence.map(ev => {
      if (ev.enhancedConfidence) return ev.enhancedConfidence;
      const confStr = (ev.confidence || 'MEDIUM').toUpperCase();
      if (confStr === 'HIGH') return 0.85;
      if (confStr === 'MEDIUM') return 0.60;
      return 0.35;
    });

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Identify dimensions with insufficient coverage
   * @param {Object} coverage - Coverage statistics
   * @param {number} threshold - Minimum coverage threshold
   * @returns {Array} - Dimensions needing more research
   */
  identifyGaps(coverage, threshold = 0.3) {
    const gaps = [];

    for (const [dimension, stats] of Object.entries(coverage)) {
      if (stats.coverageRate < threshold) {
        gaps.push({
          dimension,
          coverageRate: stats.coverageRate,
          evidenceCount: stats.evidenceCount,
          priority: this.calculateGapPriority(stats, threshold)
        });
      }
    }

    // Sort by priority
    return gaps.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Calculate priority for filling a coverage gap
   */
  calculateGapPriority(stats, threshold) {
    const gapSize = threshold - stats.coverageRate;
    const confidenceBonus = stats.averageConfidence > 0.7 ? 0.1 : 0;
    
    return gapSize + confidenceBonus;
  }

  /**
   * Generate targeted subqueries for filling coverage gaps
   * @param {Array} gaps - Coverage gaps
   * @param {string} originalQuery - Original research query
   * @returns {Array} - Targeted subqueries
   */
  generateGapFillingQueries(gaps, originalQuery) {
    const queries = [];

    for (const gap of gaps.slice(0, 3)) { // Limit to top 3 gaps
      const query = `${originalQuery} ${gap.dimension}`;
      queries.push({
        query,
        purpose: `Fill gap in ${gap.dimension}`,
        priority: gap.priority
      });
    }

    return queries;
  }

  /**
   * Generate comprehensive research plan
   * @param {string} query - Original research query
   * @param {string} mode - Research mode
   * @returns {Object} - Complete research plan
   */
  async generateResearchPlan(query, mode = 'STANDARD') {
    const dimensions = await this.generateResearchDimensions(query, mode);

    return {
      query,
      mode,
      dimensions,
      recommendedSubqueries: this.generateInitialSubqueries(dimensions, query),
      coverageTargets: this.generateCoverageTargets(dimensions, mode)
    };
  }

  /**
   * Generate initial subqueries based on dimensions
   */
  generateInitialSubqueries(dimensions, query) {
    return dimensions.map(dimension => ({
      query: `${query} ${dimension}`,
      purpose: dimension,
      priority: 'medium'
    }));
  }

  /**
   * Generate coverage targets based on mode
   */
  generateCoverageTargets(dimensions, mode) {
    const baseTarget = mode === 'FAST' ? 0.3 : mode === 'STANDARD' ? 0.5 : 0.7;
    const targets = {};

    for (const dimension of dimensions) {
      targets[dimension] = baseTarget;
    }

    return targets;
  }

  /**
   * Update research plan based on gathered evidence
   * @param {Object} plan - Current research plan
   * @param {Array} evidence - Gathered evidence
   * @returns {Object} - Updated research plan
   */
  updateResearchPlan(plan, evidence) {
    const coverage = this.trackCoverage(evidence, plan.dimensions);
    const gaps = this.identifyGaps(coverage, 0.4); // 40% threshold

    return {
      ...plan,
      coverage,
      gaps,
      additionalQueries: gaps.length > 0 ? this.generateGapFillingQueries(gaps, plan.query) : [],
      isComplete: gaps.length === 0
    };
  }
}

module.exports = new ResearchPlanningService();