// Temporarily disable contradiction resolution to fix hang
// const contradictionResolutionService = require("../services/contradiction-resolution.service");

class EvidenceAggregator {
  /**
   * Aggregates a list of TaskEvidence records with conflict detection and resolution.
   * @param {Array<Object>} taskEvidences 
   * @returns {Array<Object>}
   */
  static aggregate(taskEvidences) {
    if (!Array.isArray(taskEvidences)) return [];

    // 1. Filter out LOW relevance
    const filtered = taskEvidences.filter(e => {
      const rel = (e.relevance || '').toUpperCase();
      return rel !== 'LOW';
    });

    // 2. Conservative deduplication & grouping
    const aggregated = [];

    for (const ev of filtered) {
      let matchedGroup = null;

      // Extremely conservative deduplication: only merge if claim is practically identical
      for (const group of aggregated) {
        if (group.claim.trim().toLowerCase() === ev.claim.trim().toLowerCase()) {
          matchedGroup = group;
          break;
        }
      }

      if (matchedGroup) {
        // Distinguish evidence type based on evidence similarity (simplified)
        const isDuplicateEvidence = matchedGroup.evidenceText.toLowerCase() === ev.evidence.toLowerCase();
        
        if (!matchedGroup.sources.includes(ev.sourceUrl)) {
          matchedGroup.sources.push(ev.sourceUrl);
        }

        if (!isDuplicateEvidence) {
          matchedGroup.evidenceText += `\n[Supporting]: ${ev.evidence}`;
          matchedGroup.type = 'supporting';
        } else {
          matchedGroup.type = 'duplicate';
        }
      } else {
        aggregated.push({
          claim: ev.claim,
          evidenceText: ev.evidence,
          confidence: ev.confidence,
          category: ev.category,
          type: 'unique',
          sources: [ev.sourceUrl]
        });
      }
    }

    // 3. Detect conflicts between aggregated facts
    const withConflicts = this.detectConflicts(aggregated);

    // 4. Temporarily disable contradiction resolution to fix hang
    // const withResolutions = contradictionResolutionService.resolveContradictions(withConflicts);
    const withResolutions = withConflicts;

    // 5. Balance facts by source and confidence
    // Group aggregated facts by their primary source
    const factsBySource = {};
    for (const group of withResolutions) {
      const primarySource = group.sources[0];
      if (!factsBySource[primarySource]) factsBySource[primarySource] = [];
      factsBySource[primarySource].push(group);
    }
    
    // Sort facts within each source by confidence (HIGH > MEDIUM > LOW)
    const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    for (const source in factsBySource) {
      factsBySource[source].sort((a, b) => 
        (confWeight[(b.confidence || '').toUpperCase()] || 0) - (confWeight[(a.confidence || '').toUpperCase()] || 0)
      );
    }

    // Round-robin selection to ensure diversity
    const finalBalancedFacts = [];
    const MAX_FACTS = 50;
    const sources = Object.keys(factsBySource);
    let round = 0;
    let addedInRound = true;

    while (addedInRound && finalBalancedFacts.length < MAX_FACTS) {
      addedInRound = false;
      for (const source of sources) {
        if (finalBalancedFacts.length >= MAX_FACTS) break;
        if (factsBySource[source].length > round) {
          finalBalancedFacts.push(factsBySource[source][round]);
          addedInRound = true;
        }
      }
      round++;
    }

    return finalBalancedFacts;
  }

  /**
   * Detect conflicts between facts
   */
  static detectConflicts(facts) {
    const conflictPatterns = [
      // Numerical conflicts
      (claim) => /\$\s*\d+/.test(claim) || /\d+\s*(percent|%|dollars|eur|gb|mb)/i.test(claim),
      // Temporal conflicts
      (claim) => /\d{4}/.test(claim) || /(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(claim),
      // Binary conflicts
      (claim) => /^(yes|no|true|false|enabled|disabled|active|inactive)/i.test(claim.trim())
    ];

    const withConflicts = facts.map(fact => ({
      ...fact,
      conflicts: [],
      conflictLevel: 'none'
    }));

    for (let i = 0; i < withConflicts.length; i++) {
      for (let j = i + 1; j < withConflicts.length; j++) {
        const factA = withConflicts[i];
        const factB = withConflicts[j];

        // Skip if from same source (likely same information)
        if (factA.sources[0] === factB.sources[0]) continue;

        // Check for conflicts
        const conflict = this.detectConflict(factA, factB, conflictPatterns);
        if (conflict) {
          factA.conflicts.push({
            with: factB.claim,
            source: factB.sources[0],
            type: conflict.type,
            severity: conflict.severity
          });
          
          factB.conflicts.push({
            with: factA.claim,
            source: factA.sources[0],
            type: conflict.type,
            severity: conflict.severity
          });

          // Update conflict levels
          if (conflict.severity === 'high') {
            factA.conflictLevel = 'high';
            factB.conflictLevel = 'high';
          } else if (factA.conflictLevel !== 'high' && factB.conflictLevel !== 'high') {
            factA.conflictLevel = 'medium';
            factB.conflictLevel = 'medium';
          }
        }
      }
    }

    return withConflicts;
  }

  /**
   * Detect conflict between two facts
   */
  static detectConflict(factA, factB, conflictPatterns) {
    // Check if facts discuss similar topics
    const similarity = this.calculateSimilarity(factA.claim, factB.claim);
    if (similarity < 0.3) return null; // Too different to be in conflict

    // Extract key information from both claims
    const infoA = this.extractKeyInfo(factA.claim);
    const infoB = this.extractKeyInfo(factB.claim);

    // Check for numerical conflicts
    if (infoA.numbers.length > 0 && infoB.numbers.length > 0) {
      for (const numA of infoA.numbers) {
        for (const numB of infoB.numbers) {
          if (Math.abs(numA - numB) > Math.max(numA, numB) * 0.1) { // More than 10% difference
            return {
              type: 'numerical',
              severity: 'high',
              details: `Conflicting values: ${numA} vs ${numB}`
            };
          }
        }
      }
    }

    // Check for temporal conflicts
    if (infoA.dates.length > 0 && infoB.dates.length > 0) {
      for (const dateA of infoA.dates) {
        for (const dateB of infoB.dates) {
          if (dateA !== dateB) {
            return {
              type: 'temporal',
              severity: 'medium',
              details: `Conflicting dates: ${dateA} vs ${dateB}`
            };
          }
        }
      }
    }

    // Check for binary conflicts
    if (infoA.binary && infoB.binary && infoA.binary !== infoB.binary) {
      return {
        type: 'binary',
        severity: 'high',
        details: `Conflicting binary values: ${infoA.binary} vs ${infoB.binary}`
      };
    }

    // Check for direct contradictions in text
    const contradictionPatterns = [
      /not\s+/i,
      /never\s+/i,
      /no\s+/i,
      /failed\s+/i,
      /successful\s+/i
    ];

    const hasNegationA = contradictionPatterns.some(p => p.test(factA.claim));
    const hasNegationB = contradictionPatterns.some(p => p.test(factB.claim));

    if (hasNegationA && !hasNegationB && similarity > 0.5) {
      return {
        type: 'contradiction',
        severity: 'high',
        details: 'Direct contradiction detected'
      };
    }

    return null;
  }

  /**
   * Calculate similarity between two claims (simplified)
   */
  static calculateSimilarity(claimA, claimB) {
    const wordsA = new Set(claimA.toLowerCase().split(/\s+/));
    const wordsB = new Set(claimB.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
  }

  /**
   * Extract key information from a claim
   */
  static extractKeyInfo(claim) {
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
}

module.exports = EvidenceAggregator;
