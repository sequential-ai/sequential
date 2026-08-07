const contradictionResolutionService = require("../../services/contradiction-resolution.service");

class EvidenceAggregator {
  /**
   * Aggregates a list of TaskEvidence records with conflict detection and resolution.
   * @param {Array<Object>} taskEvidences 
   * @returns {Array<Object>}
   */
  static async aggregate(taskEvidences) {
    if (!Array.isArray(taskEvidences)) return [];

    // 1. Filter out LOW relevance
    const filtered = taskEvidences.filter(e => {
      const rel = (e.relevance || '').toUpperCase();
      return rel !== 'LOW';
    });

    // 2. Try semantic clustering, fallback to simple aggregation
    let clusters;
    try {
      const evidenceClusteringService = require("../../services/evidence-clustering.service");
      const evidenceForClustering = filtered.map(ev => ({
        claim: ev.claim,
        evidence: ev.evidence,
        sourceUrl: ev.sourceUrl,
        confidence: ev.confidence,
        category: ev.category
      }));
      clusters = await evidenceClusteringService.clusterEvidence(evidenceForClustering);
      console.log(`[EvidenceAggregator] Semantic clustering successful: ${clusters.length} clusters`);
    } catch (error) {
      console.warn('[EvidenceAggregator] Clustering failed, using fallback:', error.message);
      clusters = this.fallbackAggregation(filtered);
    }

    // 3. Convert clusters to evidence format
    const aggregated = clusters.map(cluster => this.clusterToEvidence(cluster));

    // 4. Apply contradiction resolution
    try {
      const withResolutions = contradictionResolutionService.resolveContradictions(aggregated);
      console.log(`[EvidenceAggregator] Applied contradiction resolution to ${withResolutions.length} facts`);
      aggregated.length = 0;
      aggregated.push(...withResolutions);
    } catch (error) {
      console.error('[EvidenceAggregator] Contradiction resolution failed, proceeding without it:', error);
      // Continue without contradiction resolution if it fails
    }

    // 5. Apply source balancing (keep existing logic)
    const finalBalancedFacts = this.balanceBySource(aggregated);

    return finalBalancedFacts;
  }

  /**
   * Fallback simple aggregation if clustering fails
   */
  static fallbackAggregation(filtered) {
    const aggregated = [];

    for (const ev of filtered) {
      let matchedGroup = null;

      // Extremely conservative deduplication: only merge if claim is practically identical
      for (const group of aggregated) {
        if (group.canonicalClaim.trim().toLowerCase() === ev.claim.trim().toLowerCase()) {
          matchedGroup = group;
          break;
        }
      }

      if (matchedGroup) {
        if (!matchedGroup.sourceUrls.includes(ev.sourceUrl)) {
          matchedGroup.sourceUrls.push(ev.sourceUrl);
          matchedGroup.sourceCount++;
        }
        matchedGroup.supportingEvidence.push(ev);
      } else {
        aggregated.push({
          id: `fallback_${aggregated.length}`,
          canonicalClaim: ev.claim,
          supportingEvidence: [ev],
          sourceUrls: [ev.sourceUrl],
          sourceCount: 1,
          independentSourceCount: 1,
          bestEvidence: ev,
          confidence: this.parseConfidence(ev.confidence),
          contradictions: [],
          upstreamAttributions: []
        });
      }
    }

    return aggregated;
  }

  /**
   * Balance facts by source to ensure diversity
   */
  static balanceBySource(aggregated) {
    // Group aggregated facts by their primary source
    const factsBySource = {};
    for (const group of aggregated) {
      const primarySource = group.sourceUrls[0];
      if (!factsBySource[primarySource]) factsBySource[primarySource] = [];
      factsBySource[primarySource].push(group);
    }
    
    // Sort facts within each source by confidence (numeric)
    for (const source in factsBySource) {
      factsBySource[source].sort((a, b) => b.confidence - a.confidence);
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
   * Convert cluster to evidence format
   */
  static clusterToEvidence(cluster) {
    return {
      claim: cluster.canonicalClaim,
      evidence: cluster.bestEvidence?.evidence || cluster.bestEvidence?.evidenceText || '',
      confidence: this.confidenceToString(cluster.confidence),
      sourceUrls: cluster.sourceUrls,
      sources: cluster.sourceUrls, // Backward compatibility
      sourceCount: cluster.sourceCount,
      independentSourceCount: cluster.independentSourceCount,
      clusterId: cluster.id,
      contradictions: cluster.contradictions,
      upstreamAttributions: cluster.upstreamAttributions
    };
  }

  /**
   * Parse confidence to numeric
   */
  static parseConfidence(confidence) {
    if (typeof confidence === 'number') return confidence;
    if (typeof confidence === 'string') {
      const normalized = confidence.trim().toUpperCase();
      if (normalized === 'HIGH') return 0.85;
      if (normalized === 'MEDIUM') return 0.60;
      if (normalized === 'LOW') return 0.35;
    }
    return 0.60;
  }

  /**
   * Convert numeric confidence to string
   */
  static confidenceToString(confidence) {
    if (confidence >= 0.75) return 'HIGH';
    if (confidence >= 0.45) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = EvidenceAggregator;
