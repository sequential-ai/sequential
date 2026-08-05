class EvidenceAggregator {
  /**
   * Aggregates a list of TaskEvidence records.
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

    // 3. Balance facts by source and confidence
    // Group aggregated facts by their primary source
    const factsBySource = {};
    for (const group of aggregated) {
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
}

module.exports = EvidenceAggregator;
