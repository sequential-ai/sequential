/**
 * Entity Validation Service
 * Validates candidates against query constraints and entity types
 * Prevents products/models from being treated as startups, etc.
 */

class EntityValidationService {
  constructor() {
    this.largeIncumbents = [
      'microsoft', 'google', 'alphabet', 'amazon', 'meta', 'facebook', 'apple',
      'salesforce', 'oracle', 'ibm', 'sap', 'adobe', 'intel', 'nvidia', 'amd',
      'tesla', 'uber', 'airbnb', 'stripe', 'shopify', 'atlassian', 'snowflake'
    ];

    this.genericModels = [
      'gpt', 'claude', 'gemini', 'llama', 'mistral', 'cohere', 'huggingface',
      'chatgpt', 'bard', 'palm', 'dall-e', 'midjourney', 'stable diffusion'
    ];

    this.unrelatedAutomation = [
      'workato', 'zapier', 'ifttt', 'make', 'integromat', 'n8n', 'tray.io'
    ];
  }

  /**
   * Validate a candidate against query constraints
   */
  validateCandidate(candidate, constraints) {
    const name = (candidate.name || candidate.claim || '').toLowerCase();
    
    // Determine entity type
    const entityType = this.detectEntityType(name, candidate);

    // Check if entity type matches required type
    const typeMatch = this.checkEntityTypeMatch(entityType, constraints.entityType);

    // Check constraint matches
    const constraintMatches = this.checkConstraintMatches(name, candidate, constraints);

    // Check if excluded
    const isExcluded = this.checkExcluded(name, constraints.excludedTypes);

    // Calculate evidence coverage
    const evidenceCoverage = this.calculateEvidenceCoverage(candidate);

    // Calculate query relevance
    const queryRelevance = this.calculateQueryRelevance(name, constraints);

    // Determine eligibility
    let eligibility = 'ELIGIBLE';
    
    if (isExcluded) {
      eligibility = 'REJECTED';
    } else if (!typeMatch) {
      eligibility = 'REJECTED';
    } else if (constraintMatches.verifiedRequired < constraintMatches.totalRequired) {
      eligibility = 'UNCERTAIN';
    }

    return {
      name: candidate.name || candidate.claim,
      entityType,
      eligibility,
      typeMatch,
      constraintMatches,
      evidenceCoverage,
      queryRelevance,
      details: {
        isExcluded,
        verifiedConstraints: constraintMatches.verifiedRequired,
        totalRequired: constraintMatches.totalRequired
      }
    };
  }

  /**
   * Detect entity type from name and context
   */
  detectEntityType(name, candidate) {
    const nameLower = name.toLowerCase();
    const claimLower = (candidate.claim || '').toLowerCase();
    const evidenceLower = (candidate.evidence || candidate.evidenceText || '').toLowerCase();

    // Check for large incumbents
    if (this.largeIncumbents.some(inc => nameLower.includes(inc))) {
      // Could be company or product, check context
      if (evidenceLower.includes('product') || evidenceLower.includes('platform') || 
          claimLower.includes('studio') || claimLower.includes('service')) {
        return 'PRODUCT';
      }
      return 'COMPANY';
    }

    // Check for generic models
    if (this.genericModels.some(model => nameLower.includes(model))) {
      return 'MODEL';
    }

    // Check for products/tools
    if (evidenceLower.includes('product') || evidenceLower.includes('tool') || 
        evidenceLower.includes('platform') || claimLower.includes('studio') ||
        nameLower.includes('studio') || nameLower.includes('platform')) {
      return 'PRODUCT';
    }

    // Check for startups
    if (evidenceLower.includes('startup') || evidenceLower.includes('founded') || 
        evidenceLower.includes('seed') || evidenceLower.includes('series a') ||
        evidenceLower.includes('series b') || evidenceLower.includes('venture')) {
      return 'STARTUP';
    }

    // Check for frameworks
    if (evidenceLower.includes('framework') || evidenceLower.includes('library') || 
        evidenceLower.includes('sdk') || nameLower.includes('framework')) {
      return 'FRAMEWORK';
    }

    // Check for open source
    if (evidenceLower.includes('open source') || evidenceLower.includes('github') ||
        evidenceLower.includes('oss') || nameLower.includes('github')) {
      return 'OPEN_SOURCE_PROJECT';
    }

    // Default to company if unclear
    return 'COMPANY';
  }

  /**
   * Check if entity type matches required type
   */
  checkEntityTypeMatch(detectedType, requiredType) {
    if (!requiredType || requiredType === 'entity') {
      return true;
    }

    // Startup can be a company
    if (requiredType === 'startup' && detectedType === 'COMPANY') {
      return true;
    }

    // Product can be a model
    if (requiredType === 'product' && detectedType === 'MODEL') {
      return true;
    }

    return detectedType === requiredType;
  }

  /**
   * Check constraint matches
   */
  checkConstraintMatches(name, candidate, constraints) {
    const matches = {};
    let verifiedRequired = 0;
    let totalRequired = 0;

    for (const constraint of constraints.requiredConstraints) {
      if (constraint.source === 'implicit') continue; // Skip implicit type constraint
      totalRequired++;

      const matched = this.checkSingleConstraint(name, candidate, constraint);
      matches[constraint.type] = matched;
      if (matched) verifiedRequired++;
    }

    return {
      matches,
      verifiedRequired,
      totalRequired
    };
  }

  /**
   * Check single constraint
   */
  checkSingleConstraint(name, candidate, constraint) {
    const nameLower = name.toLowerCase();
    const claimLower = (candidate.claim || '').toLowerCase();
    const evidenceLower = (candidate.evidence || candidate.evidenceText || '').toLowerCase();
    const fullText = nameLower + ' ' + claimLower + ' ' + evidenceLower;

    switch (constraint.type) {
      case 'startup':
        return fullText.includes('startup') || fullText.includes('founded') || 
               fullText.includes('seed') || fullText.includes('venture');

      case 'active':
        return fullText.includes('active') || fullText.includes('operating') || 
               fullText.includes('current') || fullText.includes('live');

      case 'ai':
        return fullText.includes('ai') || fullText.includes('artificial intelligence') ||
               fullText.includes('machine learning') || fullText.includes('ml');

      case 'saas':
        return fullText.includes('saas') || fullText.includes('software as a service') ||
               fullText.includes('subscription') || fullText.includes('cloud');

      case 'autonomous':
        return fullText.includes('autonomous') || fullText.includes('self-driving') ||
               fullText.includes('independent');

      case 'agent':
        return fullText.includes('agent') || fullText.includes('bot') || 
               fullText.includes('assistant') || fullText.includes('copilot');

      case 'infrastructure':
        return fullText.includes('infrastructure') || fullText.includes('platform') ||
               fullText.includes('framework') || fullText.includes('tool');

      case 'location':
        return fullText.includes(constraint.value.toLowerCase());

      case 'time':
        const yearMatch = fullText.match(/\b(20\d{2})\b/g);
        if (yearMatch) {
          for (const year of yearMatch) {
            const yearNum = parseInt(year);
            if (constraint.type === 'after' && yearNum >= parseInt(constraint.value)) return true;
            if (constraint.type === 'before' && yearNum <= parseInt(constraint.value)) return true;
          }
        }
        return false;

      case 'size':
        // Would need numeric data from evidence
        return true; // Default to pass if can't verify

      default:
        return fullText.includes(constraint.type);
    }
  }

  /**
   * Check if entity is excluded
   */
  checkExcluded(name, excludedTypes) {
    const nameLower = name.toLowerCase();

    for (const excluded of excludedTypes) {
      if (excluded.type === 'large_incumbent' && 
          this.largeIncumbents.some(inc => nameLower.includes(inc))) {
        return true;
      }
      if (excluded.type === 'generic_model' && 
          this.genericModels.some(model => nameLower.includes(model))) {
        return true;
      }
      if (excluded.type === 'unrelated_automation' && 
          this.unrelatedAutomation.some(automation => nameLower.includes(automation))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate evidence coverage
   */
  calculateEvidenceCoverage(candidate) {
    if (!candidate.evidence && !candidate.evidenceText) {
      return 0.5; // Default
    }

    const evidence = (candidate.evidence || candidate.evidenceText || '').toLowerCase();
    let score = 0.5;

    // Longer evidence = better coverage
    if (evidence.length > 200) score += 0.2;
    else if (evidence.length > 100) score += 0.1;

    // Numerical data = better coverage
    if (/\d+/.test(evidence)) score += 0.2;

    // Specific details = better coverage
    if (evidence.includes('founded') || evidence.includes('launched') || 
        evidence.includes('funding') || evidence.includes('users')) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  /**
   * Calculate query relevance
   */
  calculateQueryRelevance(name, constraints) {
    const nameLower = name.toLowerCase();
    let score = 0.5;

    // Check constraint keywords in name
    for (const constraint of constraints.requiredConstraints) {
      if (nameLower.includes(constraint.type)) {
        score += 0.1;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * Validate multiple candidates and return only eligible ones
   */
  filterEligibleCandidates(candidates, constraints) {
    const validated = candidates.map(c => this.validateCandidate(c, constraints));
    
    // Return only ELIGIBLE candidates
    return validated.filter(v => v.eligibility === 'ELIGIBLE');
  }
}

module.exports = new EntityValidationService();