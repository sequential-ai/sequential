/**
 * Evidence Selection and Budgeting Service
 * Ranks and selects the best evidence for synthesis to optimize token usage while maintaining quality
 * Implements mode-specific budgets and diversity constraints
 */

class EvidenceSelectionService {
  constructor() {
    // Mode-specific evidence budgets
    this.modeBudgets = {
      'FAST': 15,
      'STANDARD': 30,
      'DEEP': 50
    };

    // Scoring weights for evidence ranking
    this.scoringWeights = {
      relevance: 0.25,
      authority: 0.20,
      confidence: 0.20,
      specificity: 0.15,
      uniqueness: 0.10,
      corroboration: 0.10
    };
  }

  /**
   * Select best evidence for synthesis
   * @param {Array} evidence - Array of evidence objects
   * @param {string} query - Original research query
   * @param {string} mode - Research mode (FAST/STANDARD/DEEP)
   * @param {Array} researchDimensions - Research dimensions for diversity
   * @returns {Array} - Selected evidence
   */
  async selectEvidence(evidence, query, mode = 'STANDARD', researchDimensions = []) {
    if (!Array.isArray(evidence) || evidence.length === 0) {
      return [];
    }

    // Get budget for mode
    const budget = this.modeBudgets[mode] || this.modeBudgets['STANDARD'];

    // If evidence is within budget, return all (with basic ranking)
    if (evidence.length <= budget) {
      return this.rankEvidence(evidence, query);
    }

    // Score and rank evidence
    const scoredEvidence = this.scoreEvidence(evidence, query);

    // Apply diversity constraints if research dimensions provided
    if (researchDimensions.length > 0) {
      return this.selectWithDiversity(scoredEvidence, budget, researchDimensions);
    }

    // Select top evidence by score
    return scoredEvidence.slice(0, budget);
  }

  /**
   * Score evidence based on multiple factors
   */
  scoreEvidence(evidence, query) {
    const queryLower = query.toLowerCase();

    return evidence.map(ev => {
      let totalScore = 0;
      const factors = {};

      // Query constraint match (highest priority - 30%)
      const constraintScore = this.calculateConstraintMatch(ev, queryLower);
      factors.constraintMatch = constraintScore;
      totalScore += constraintScore * 0.30;

      // Relevance score (20%)
      const relevanceScore = this.calculateRelevance(ev, queryLower);
      factors.relevance = relevanceScore;
      totalScore += relevanceScore * 0.20;

      // Authority score (15%)
      const authorityScore = this.calculateAuthority(ev);
      factors.authority = authorityScore;
      totalScore += authorityScore * 0.15;

      // Confidence score (15%)
      const confidenceScore = this.calculateConfidence(ev);
      factors.confidence = confidenceScore;
      totalScore += confidenceScore * 0.15;

      // Specificity score (10%)
      const specificityScore = this.calculateSpecificity(ev);
      factors.specificity = specificityScore;
      totalScore += specificityScore * 0.10;

      // Uniqueness score (5%)
      const uniquenessScore = this.calculateUniqueness(ev, evidence);
      factors.uniqueness = uniquenessScore;
      totalScore += uniquenessScore * 0.05;

      // Corroboration score (5%)
      const corroborationScore = this.calculateCorroboration(ev);
      factors.corroboration = corroborationScore;
      totalScore += corroborationScore * 0.05;

      return {
        ...ev,
        totalScore,
        factors
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate constraint match score
   */
  calculateConstraintMatch(evidence, queryLower) {
    const claim = (evidence.claim || '').toLowerCase();
    const evidenceText = (evidence.evidence || evidence.evidenceText || '').toLowerCase();
    const fullText = claim + ' ' + evidenceText;

    // Extract key constraint terms from query
    const constraintTerms = this.extractConstraintTerms(queryLower);
    
    let matchCount = 0;
    for (const term of constraintTerms) {
      if (fullText.includes(term)) {
        matchCount++;
      }
    }

    return constraintTerms.length > 0 ? matchCount / constraintTerms.length : 0.5;
  }

  /**
   * Extract constraint terms from query
   */
  extractConstraintTerms(queryLower) {
    const terms = [];
    
    // Remove common words
    const stopWords = ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or', 'but', 'with', 'by', 'top', 'best', 'leading'];
    const words = queryLower.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

    // Important terms (startup, saas, autonomous, agent, infrastructure, etc.)
    const importantTerms = words.filter(w => 
      ['startup', 'saas', 'autonomous', 'agent', 'infrastructure', 'platform', 
       'framework', 'tool', 'software', 'service', 'company', 'product'].includes(w)
    );

    return importantTerms.length > 0 ? importantTerms : words.slice(0, 5);
  }

  /**
   * Calculate relevance score based on query match
   */
  calculateRelevance(evidence, queryLower) {
    const claimLower = (evidence.claim || '').toLowerCase();
    const evidenceLower = (evidence.evidence || evidence.evidenceText || '').toLowerCase();

    // Direct keyword matching
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);
    let matchCount = 0;

    for (const word of queryWords) {
      if (claimLower.includes(word) || evidenceLower.includes(word)) {
        matchCount++;
      }
    }

    const keywordScore = queryWords.length > 0 ? matchCount / queryWords.length : 0.5;

    // Category relevance (if available)
    const categoryScore = evidence.category && this.isCategoryRelevant(evidence.category, queryLower) ? 0.9 : 0.5;

    // Relevance from original extraction (if available)
    const originalRelevance = this.parseRelevance(evidence.relevance);

    return (keywordScore * 0.4) + (categoryScore * 0.3) + (originalRelevance * 0.3);
  }

  /**
   * Calculate authority score based on source quality
   */
  calculateAuthority(evidence) {
    // Use enhanced confidence if available
    if (evidence.sourceAuthority) {
      return evidence.sourceAuthority;
    }

    // Use cluster information if available
    if (evidence.independentSourceCount && evidence.independentSourceCount > 1) {
      return Math.min(1.0, 0.6 + (evidence.independentSourceCount * 0.1));
    }

    // Default medium authority
    return 0.5;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(evidence) {
    // Use enhanced confidence if available
    if (evidence.enhancedConfidence) {
      return evidence.enhancedConfidence;
    }

    // Parse string confidence
    const confStr = (evidence.confidence || 'MEDIUM').toUpperCase();
    if (confStr === 'HIGH') return 0.85;
    if (confStr === 'MEDIUM') return 0.60;
    if (confStr === 'LOW') return 0.35;

    return 0.60;
  }

  /**
   * Calculate specificity score (prefer specific, detailed claims)
   */
  calculateSpecificity(evidence) {
    const claim = evidence.claim || '';
    let score = 0.5; // Base score

    // Longer claims are often more specific
    if (claim.length > 100) score += 0.2;
    else if (claim.length > 50) score += 0.1;

    // Numerical data increases specificity
    if (/\d+/.test(claim)) score += 0.2;

    // Specific entities (proper nouns)
    const properNouns = claim.match(/\b[A-Z][a-z]+\b/g);
    if (properNouns && properNouns.length > 2) score += 0.1;

    // Direct quotes are highly specific
    if (claim.includes('"') || (evidence.evidence || '').includes('"')) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate uniqueness score (prefer non-duplicate claims)
   */
  calculateUniqueness(evidence, allEvidence) {
    // If clustered, use cluster information
    if (evidence.clusterId) {
      // Check if this is the best evidence in its cluster
      const clusterEvidence = allEvidence.filter(ev => ev.clusterId === evidence.clusterId);
      if (clusterEvidence.length > 1) {
        // If this is the best (highest confidence), give high uniqueness
        const maxConfidence = Math.max(...clusterEvidence.map(ev => this.calculateConfidence(ev)));
        if (this.calculateConfidence(evidence) === maxConfidence) {
          return 0.9;
        }
        // Penalize duplicates
        return 0.3;
      }
    }

    // Check for exact duplicates
    const exactDuplicates = allEvidence.filter(ev => 
      ev.claim === evidence.claim && ev !== evidence
    );

    if (exactDuplicates.length > 0) {
      return 0.2;
    }

    // Check for near duplicates
    const nearDuplicates = allEvidence.filter(ev => 
      this.stringSimilarity(ev.claim || '', evidence.claim || '') > 0.85 && ev !== evidence
    );

    if (nearDuplicates.length > 0) {
      return 0.4;
    }

    return 0.8; // High uniqueness for unique claims
  }

  /**
   * Calculate corroboration score
   */
  calculateCorroboration(evidence) {
    // Use independent source count if available
    if (evidence.independentSourceCount) {
      return Math.min(1.0, 0.4 + (evidence.independentSourceCount * 0.15));
    }

    // Use source count if available
    if (evidence.sourceCount && evidence.sourceCount > 1) {
      return Math.min(1.0, 0.4 + (evidence.sourceCount * 0.1));
    }

    return 0.4; // Base score for single-source claims
  }

  /**
   * Select evidence with diversity constraints across research dimensions
   */
  selectWithDiversity(scoredEvidence, budget, researchDimensions) {
    const selected = [];
    const dimensionCounts = {};
    const dimensionBudget = Math.ceil(budget / researchDimensions.length);

    // Initialize dimension counts
    for (const dimension of researchDimensions) {
      dimensionCounts[dimension] = 0;
    }

    // Sort evidence by score
    const sortedEvidence = [...scoredEvidence].sort((a, b) => b.totalScore - a.totalScore);

    // Select evidence with dimension diversity
    for (const evidence of sortedEvidence) {
      if (selected.length >= budget) break;

      // Determine which dimension this evidence belongs to
      const dimension = this.assignToDimension(evidence, researchDimensions);

      if (dimension && dimensionCounts[dimension] < dimensionBudget) {
        selected.push(evidence);
        dimensionCounts[dimension]++;
      } else if (!dimension) {
        // Evidence doesn't fit any dimension, add if under budget
        selected.push(evidence);
      }
    }

    // If we haven't filled the budget, add remaining top evidence
    if (selected.length < budget) {
      const remaining = sortedEvidence.filter(ev => !selected.includes(ev));
      const remainingSlots = budget - selected.length;
      selected.push(...remaining.slice(0, remainingSlots));
    }

    return selected;
  }

  /**
   * Assign evidence to a research dimension
   */
  assignToDimension(evidence, dimensions) {
    const claim = (evidence.claim || '').toLowerCase();
    const evidenceText = (evidence.evidence || evidence.evidenceText || '').toLowerCase();
    const combined = claim + ' ' + evidenceText;

    for (const dimension of dimensions) {
      const dimensionLower = dimension.toLowerCase();
      if (combined.includes(dimensionLower)) {
        return dimension;
      }
    }

    return null;
  }

  /**
   * Simple string similarity for duplicate detection
   */
  stringSimilarity(strA, strB) {
    if (!strA || !strB) return 0;

    const wordsA = new Set(strA.toLowerCase().split(/\s+/));
    const wordsB = new Set(strB.toLowerCase().split(/\s+/));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Check if category is relevant to query
   */
  isCategoryRelevant(category, queryLower) {
    const categoryLower = category.toLowerCase();
    return queryLower.includes(categoryLower) || categoryLower.includes(queryLower.split(' ')[0]);
  }

  /**
   * Parse relevance string to numeric
   */
  parseRelevance(relevance) {
    if (typeof relevance === 'number') return relevance / 100;
    if (typeof relevance === 'string') {
      const normalized = relevance.trim().toUpperCase();
      if (normalized === 'HIGH') return 0.85;
      if (normalized === 'MEDIUM') return 0.60;
      if (normalized === 'LOW') return 0.35;
    }
    return 0.60;
  }

  /**
   * Rank evidence without selection (for when within budget)
   */
  rankEvidence(evidence, query) {
    return this.scoreEvidence(evidence, query);
  }

  /**
   * Get selection statistics for observability
   */
  getSelectionStats(selectedEvidence, totalEvidence, mode) {
    return {
      totalEvidence,
      selectedEvidence: selectedEvidence.length,
      budget: this.modeBudgets[mode],
      selectionRate: totalEvidence > 0 ? selectedEvidence.length / totalEvidence : 0,
      averageScore: selectedEvidence.reduce((sum, ev) => sum + (ev.totalScore || 0), 0) / selectedEvidence.length,
      mode
    };
  }
}

module.exports = new EvidenceSelectionService();