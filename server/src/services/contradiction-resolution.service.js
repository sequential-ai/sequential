/**
 * Contradiction detection and resolution service
 * Identifies conflicting information and provides resolution strategies
 */
class ContradictionResolutionService {
  constructor() {
    this.resolutionStrategies = {
      'numerical': this.resolveNumericalContradiction,
      'temporal': this.resolveTemporalContradiction,
      'binary': this.resolveBinaryContradiction,
      'contradiction': this.resolveDirectContradiction,
      'semantic': this.resolveSemanticContradiction
    };
  }

  /**
   * Analyze and resolve contradictions in aggregated facts
   */
  resolveContradictions(facts) {
    const withContradictions = facts.map(fact => ({
      ...fact,
      contradictions: [],
      resolution: null,
      resolvedValue: null
    }));

    // Group related facts for comparison
    const factGroups = this.groupRelatedFacts(withContradictions);

    // Analyze each group for contradictions
    for (const group of factGroups) {
      if (group.length < 2) continue;

      const contradictions = this.detectGroupContradictions(group);
      
      for (const contradiction of contradictions) {
        this.applyResolutionStrategy(contradiction, withContradictions);
      }
    }

    return withContradictions;
  }

  /**
   * Group related facts by similarity
   */
  groupRelatedFacts(facts) {
    const groups = [];
    const used = new Set();

    for (let i = 0; i < facts.length; i++) {
      if (used.has(i)) continue;

      const group = [facts[i]];
      used.add(i);

      for (let j = i + 1; j < facts.length; j++) {
        if (used.has(j)) continue;

        const similarity = this.calculateSimilarity(facts[i].claim, facts[j].claim);
        if (similarity > 0.4) { // 40% similarity threshold
          group.push(facts[j]);
          used.add(j);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  /**
   * Detect contradictions within a group of related facts
   */
  detectGroupContradictions(group) {
    const contradictions = [];

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const factA = group[i];
        const factB = group[j];

        const contradiction = this.detectContradiction(factA, factB);
        if (contradiction) {
          contradictions.push({
            type: contradiction.type,
            severity: contradiction.severity,
            facts: [factA, factB],
            details: contradiction.details
          });
        }
      }
    }

    return contradictions;
  }

  /**
   * Detect contradiction between two facts
   */
  detectContradiction(factA, factB) {
    // Extract key information
    const infoA = this.extractKeyInfo(factA.claim);
    const infoB = this.extractKeyInfo(factB.claim);

    // Numerical contradictions
    if (infoA.numbers.length > 0 && infoB.numbers.length > 0) {
      for (const numA of infoA.numbers) {
        for (const numB of infoB.numbers) {
          const diff = Math.abs(numA - numB);
          const maxVal = Math.max(numA, numB);
          
          if (diff > maxVal * 0.15) { // More than 15% difference
            return {
              type: 'numerical',
              severity: diff > maxVal * 0.5 ? 'high' : 'medium',
              details: `Numerical discrepancy: ${numA} vs ${numB} (${((diff/maxVal)*100).toFixed(1)}% difference)`
            };
          }
        }
      }
    }

    // Temporal contradictions
    if (infoA.dates.length > 0 && infoB.dates.length > 0) {
      for (const dateA of infoA.dates) {
        for (const dateB of infoB.dates) {
          if (dateA !== dateB) {
            return {
              type: 'temporal',
              severity: 'medium',
              details: `Temporal discrepancy: ${dateA} vs ${dateB}`
            };
          }
        }
      }
    }

    // Binary contradictions
    if (infoA.binary && infoB.binary && infoA.binary !== infoB.binary) {
      return {
        type: 'binary',
        severity: 'high',
        details: `Binary contradiction: ${infoA.binary} vs ${infoB.binary}`
      };
    }

    // Direct textual contradictions
    const negationA = this.hasNegation(factA.claim);
    const negationB = this.hasNegation(factB.claim);

    if (negationA !== negationB) {
      const similarity = this.calculateSimilarity(factA.claim, factB.claim);
      if (similarity > 0.5) {
        return {
          type: 'contradiction',
          severity: 'high',
          details: 'Direct textual contradiction detected'
        };
      }
    }

    // Semantic contradictions (opposite meanings)
    const semanticOpposites = [
      ['increase', 'decrease'],
      ['growth', 'decline'],
      ['success', 'failure'],
      ['profit', 'loss'],
      ['improve', 'worsen'],
      ['expand', 'shrink'],
      ['rise', 'fall'],
      ['gain', 'lose']
    ];

    for (const [termA, termB] of semanticOpposites) {
      const hasA = factA.claim.toLowerCase().includes(termA) && factB.claim.toLowerCase().includes(termB);
      const hasB = factA.claim.toLowerCase().includes(termB) && factB.claim.toLowerCase().includes(termA);
      
      if (hasA || hasB) {
        return {
          type: 'semantic',
          severity: 'medium',
          details: `Semantic contradiction: ${termA} vs ${termB}`
        };
      }
    }

    return null;
  }

  /**
   * Apply resolution strategy based on contradiction type
   */
  applyResolutionStrategy(contradiction, allFacts) {
    const strategy = this.resolutionStrategies[contradiction.type];
    if (!strategy) return;

    const resolution = strategy.call(this, contradiction);
    
    // Apply resolution to the involved facts
    for (const fact of contradiction.facts) {
      const factIndex = allFacts.findIndex(f => f.claim === fact.claim);
      if (factIndex !== -1) {
        allFacts[factIndex].contradictions.push({
          type: contradiction.type,
          severity: contradiction.severity,
          details: contradiction.details,
          resolution: resolution.strategy
        });
        
        if (resolution.resolvedValue && fact === contradiction.facts[0]) {
          allFacts[factIndex].resolvedValue = resolution.resolvedValue;
          allFacts[factIndex].resolution = resolution.strategy;
        }
      }
    }
  }

  /**
   * Resolve numerical contradictions
   */
  resolveNumericalContradiction(contradiction) {
    const factA = contradiction.facts[0];
    const factB = contradiction.facts[1];

    const infoA = this.extractKeyInfo(factA.claim);
    const infoB = this.extractKeyInfo(factB.claim);

    const numA = infoA.numbers[0];
    const numB = infoB.numbers[0];

    // Strategy: prefer the value from the higher confidence source
    const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const confA = confWeight[factA.confidence] || 2;
    const confB = confWeight[factB.confidence] || 2;

    if (confA > confB) {
      return {
        strategy: 'prefer_higher_confidence',
        resolvedValue: numA,
        reasoning: `Preferred value ${numA} from higher confidence source`
      };
    } else if (confB > confA) {
      return {
        strategy: 'prefer_higher_confidence',
        resolvedValue: numB,
        reasoning: `Preferred value ${numB} from higher confidence source`
      };
    }

    // If equal confidence, use average
    const average = (numA + numB) / 2;
    return {
      strategy: 'use_average',
      resolvedValue: average,
      reasoning: `Used average ${average} due to equal confidence`
    };
  }

  /**
   * Resolve temporal contradictions
   */
  resolveTemporalContradiction(contradiction) {
    const factA = contradiction.facts[0];
    const factB = contradiction.facts[1];

    const infoA = this.extractKeyInfo(factA.claim);
    const infoB = this.extractKeyInfo(factB.claim);

    const dateA = infoA.dates[0];
    const dateB = infoB.dates[0];

    // Strategy: prefer the more recent date
    const yearA = parseInt(dateA);
    const yearB = parseInt(dateB);

    if (yearA > yearB) {
      return {
        strategy: 'prefer_recent',
        resolvedValue: dateA,
        reasoning: `Preferred more recent date ${dateA}`
      };
    } else {
      return {
        strategy: 'prefer_recent',
        resolvedValue: dateB,
        reasoning: `Preferred more recent date ${dateB}`
      };
    }
  }

  /**
   * Resolve binary contradictions
   */
  resolveBinaryContradiction(contradiction) {
    const factA = contradiction.facts[0];
    const factB = contradiction.facts[1];

    // Strategy: prefer higher confidence, or mark as uncertain
    const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const confA = confWeight[factA.confidence] || 2;
    const confB = confWeight[factB.confidence] || 2;

    if (confA >= 3 && confB < 3) {
      return {
        strategy: 'prefer_higher_confidence',
        resolvedValue: factA.claim,
        reasoning: 'Preferred high-confidence source over lower confidence'
      };
    } else if (confB >= 3 && confA < 3) {
      return {
        strategy: 'prefer_higher_confidence',
        resolvedValue: factB.claim,
        reasoning: 'Preferred high-confidence source over lower confidence'
      };
    }

    // If both high confidence or both low confidence, mark as uncertain
    return {
      strategy: 'mark_uncertain',
      resolvedValue: null,
      reasoning: 'Marked as uncertain due to conflicting high-confidence sources'
    };
  }

  /**
   * Resolve direct contradictions
   */
  resolveDirectContradiction(contradiction) {
    // Strategy: prefer source with more supporting evidence
    const factA = contradiction.facts[0];
    const factB = contradiction.facts[1];

    const sourcesA = factA.sources ? factA.sources.length : 1;
    const sourcesB = factB.sources ? factB.sources.length : 1;

    if (sourcesA > sourcesB) {
      return {
        strategy: 'prefer_more_sources',
        resolvedValue: factA.claim,
        reasoning: `Preferred claim with ${sourcesA} sources over ${sourcesB}`
      };
    } else if (sourcesB > sourcesA) {
      return {
        strategy: 'prefer_more_sources',
        resolvedValue: factB.claim,
        reasoning: `Preferred claim with ${sourcesB} sources over ${sourcesA}`
      };
    }

    // Default to higher confidence
    const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const confA = confWeight[factA.confidence] || 2;
    const confB = confWeight[factB.confidence] || 2;

    if (confA > confB) {
      return {
        strategy: 'prefer_higher_confidence',
        resolvedValue: factA.claim,
        reasoning: 'Preferred higher confidence source'
      };
    }

    return {
      strategy: 'mark_uncertain',
      resolvedValue: null,
      reasoning: 'Unable to resolve - marked as uncertain'
    };
  }

  /**
   * Resolve semantic contradictions
   */
  resolveSemanticContradiction(contradiction) {
    // Strategy: present both perspectives with context
    return {
      strategy: 'present_both',
      resolvedValue: null,
      reasoning: 'Presenting both perspectives due to semantic conflict'
    };
  }

  /**
   * Extract key information from a claim
   */
  extractKeyInfo(claim) {
    const numbers = [];
    const dates = [];
    let binary = null;

    // Extract numbers
    const numberPattern = /\$?\s*\d+(?:,\d{3})*(?:\.\d+)?|%?\d+%?/g;
    let match;
    while ((match = numberPattern.exec(claim)) !== null) {
      const numStr = match[0].replace(/[$,%]/g, '').replace(/,/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }

    // Extract years
    const yearPattern = /\b(19|20)\d{2}\b/g;
    while ((match = yearPattern.exec(claim)) !== null) {
      dates.push(match[0]);
    }

    // Extract binary values
    if (/^(yes|true|enabled|active|supported)/i.test(claim.trim())) {
      binary = 'positive';
    } else if (/^(no|false|disabled|inactive|unsupported)/i.test(claim.trim())) {
      binary = 'negative';
    }

    return { numbers, dates, binary };
  }

  /**
   * Check if claim has negation
   */
  hasNegation(claim) {
    const negationPatterns = [
      /\bnot\b/i,
      /\bnever\b/i,
      /\bno\b/i,
      /\bfailed\b/i,
      /\bunsuccessful\b/i,
      /\bwithout\b/i
    ];

    return negationPatterns.some(pattern => pattern.test(claim));
  }

  /**
   * Calculate similarity between two claims
   */
  calculateSimilarity(claimA, claimB) {
    const wordsA = new Set(claimA.toLowerCase().split(/\s+/));
    const wordsB = new Set(claimB.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }

  /**
   * Generate contradiction report
   */
  generateReport(facts) {
    const contradictions = facts.filter(f => f.contradictions.length > 0);
    
    const byType = {};
    for (const fact of contradictions) {
      for (const contradiction of fact.contradictions) {
        if (!byType[contradiction.type]) {
          byType[contradiction.type] = 0;
        }
        byType[contradiction.type]++;
      }
    }

    const bySeverity = { high: 0, medium: 0, low: 0 };
    for (const fact of contradictions) {
      for (const contradiction of fact.contradictions) {
        bySeverity[contradiction.severity]++;
      }
    }

    const resolved = facts.filter(f => f.resolution).length;
    const unresolved = contradictions.length - resolved;

    return {
      totalContradictions: contradictions.length,
      byType,
      bySeverity,
      resolved,
      unresolved,
      resolutionRate: contradictions.length > 0 ? (resolved / contradictions.length * 100).toFixed(1) : 0
    };
  }
}

module.exports = new ContradictionResolutionService();