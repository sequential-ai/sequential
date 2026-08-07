/**
 * Answer Planning Service
 * Creates answer plans before synthesis to control LLM output
 * Pre-validates candidates for ranking queries to prevent synthesis from overriding them
 */

class AnswerPlanningService {
  constructor() {
    this.queryConstraintService = require('./query-constraint.service');
    this.entityValidationService = require('./entity-validation.service');
  }

  /**
   * Create answer plan for a query
   */
  async createAnswerPlan(query, evidence, mode = 'STANDARD') {
    // Extract query constraints
    const constraints = this.queryConstraintService.extractConstraints(query);

    // Create base plan
    const plan = {
      query,
      mode,
      constraints,
      strategy: this.determineStrategy(constraints),
      candidates: [],
      evidenceGroups: [],
      rankingCriteria: constraints.rankingCriteria
    };

    // If this is a ranking query, extract and validate candidates
    if (constraints.intent === 'rank_entities') {
      const extractedCandidates = this.extractCandidates(evidence);
      const validatedCandidates = this.entityValidationService.filterEligibleCandidates(
        extractedCandidates,
        constraints
      );

      // Rank candidates
      const rankedCandidates = this.rankCandidates(validatedCandidates, constraints.rankingCriteria);

      // Take top N based on query
      const topN = this.extractTopN(query);
      plan.candidates = rankedCandidates.slice(0, topN);
    } else {
      // For non-ranking queries, group evidence by topic
      plan.evidenceGroups = this.groupEvidenceByTopic(evidence, constraints);
    }

    return plan;
  }

  /**
   * Determine synthesis strategy based on query
   */
  determineStrategy(constraints) {
    if (constraints.intent === 'rank_entities') {
      return 'RANKING';
    } else if (constraints.intent === 'compare') {
      return 'COMPARISON';
    } else if (constraints.intent === 'list') {
      return 'LIST';
    } else {
      return 'SUMMARY';
    }
  }

  /**
   * Extract candidate entities from evidence
   */
  extractCandidates(evidence) {
    const candidates = [];
    const seen = new Set();

    for (const ev of evidence) {
      // Extract entity names from claim
      const entities = this.extractEntityNames(ev.claim || '');
      
      for (const entity of entities) {
        const entityLower = entity.toLowerCase();
        if (!seen.has(entityLower) && entity.length > 2) {
          seen.add(entityLower);
          candidates.push({
            name: entity,
            claim: ev.claim,
            evidence: ev.evidence || ev.evidenceText,
            sourceUrls: ev.sourceUrls || ev.sources,
            confidence: ev.enhancedConfidence || ev.confidence,
            sourceAuthority: ev.sourceAuthority
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Extract entity names from claim text
   */
  extractEntityNames(claim) {
    const entities = [];
    
    // Look for proper nouns (capitalized words)
    const words = claim.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Check if capitalized and not first word
      if (i > 0 && /^[A-Z]/.test(word) && word.length > 2) {
        // Check if it's part of a multi-word entity
        let entity = word;
        let j = i + 1;
        while (j < words.length && /^[A-Z]/.test(words[j])) {
          entity += ' ' + words[j];
          j++;
        }
        entities.push(entity);
      }
    }

    // Also look for patterns like "Company X" or "Product Y"
    const companyPatterns = [
      /([A-Z][a-zA-Z&\s]+)(?:Labs|Inc|Corp|LLC|Studio|AI|Agent)/gi,
      /([A-Z][a-zA-Z0-9]+)(?:\.ai|\.com|\.io)/gi
    ];

    for (const pattern of companyPatterns) {
      const matches = claim.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (match && match.length > 2 && !entities.includes(match)) {
            entities.push(match);
          }
        }
      }
    }

    return entities;
  }

  /**
   * Rank candidates based on criteria
   */
  rankCandidates(candidates, rankingCriteria) {
    if (!rankingCriteria || rankingCriteria.length === 0) {
      // Default ranking by query relevance
      return candidates.sort((a, b) => b.queryRelevance - a.queryRelevance);
    }

    // Score each candidate
    const scored = candidates.map(candidate => {
      let totalScore = 0;

      for (const criterion of rankingCriteria) {
        const criterionScore = this.getCriterionScore(candidate, criterion);
        totalScore += criterionScore * criterion.weight;
      }

      return {
        ...candidate,
        totalScore
      };
    });

    // Sort by total score
    return scored.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Get score for a specific criterion
   */
  getCriterionScore(candidate, criterion) {
    switch (criterion.name) {
      case 'query_relevance':
        return candidate.queryRelevance || 0.5;
      
      case 'authority':
        return candidate.sourceAuthority || 0.5;
      
      case 'confidence':
        const conf = candidate.enhancedConfidence || this.parseConfidence(candidate.confidence);
        return conf;
      
      case 'recency':
        // Would need date information
        return 0.5;
      
      case 'specificity':
        const claim = (candidate.claim || '').toLowerCase();
        if (/\d+/.test(claim)) return 0.8;
        if (claim.length > 50) return 0.6;
        return 0.4;
      
      case 'traction':
      case 'funding':
      case 'maturity':
      case 'technical_differentiation':
      case 'recent_activity':
      case 'features':
      case 'user_adoption':
      case 'pricing':
        // Would need structured data from evidence
        return 0.5;
      
      default:
        return 0.5;
    }
  }

  /**
   * Extract top N from query
   */
  extractTopN(query) {
    const match = query.match(/top\s+(\d+)/i);
    if (match) {
      return parseInt(match[1]);
    }
    const match2 = query.match(/best\s+(\d+)/i);
    if (match2) {
      return parseInt(match2[1]);
    }
    return 10; // Default
  }

  /**
   * Group evidence by topic for non-ranking queries
   */
  groupEvidenceByTopic(evidence, constraints) {
    const groups = {};

    for (const ev of evidence) {
      const category = ev.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(ev);
    }

    return groups;
  }

  /**
   * Parse confidence to numeric
   */
  parseConfidence(confidence) {
    if (typeof confidence === 'number') return confidence;
    if (typeof confidence === 'string') {
      const normalized = confidence.trim().toUpperCase();
      if (normalized === 'HIGH') return 0.85;
      if (normalized === 'MEDIUM') return 0.60;
      if (normalized === 'LOW') return 0.35;
    }
    return 0.60;
  }
}

module.exports = new AnswerPlanningService();