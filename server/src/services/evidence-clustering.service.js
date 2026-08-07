/**
 * Evidence Clustering Service
 * Groups semantically similar claims and detects source dependencies
 * to distinguish independent corroboration from syndicated content.
 */

let embeddingService = null;
try {
  embeddingService = require('./embedding.service');
} catch (error) {
  console.warn('[EvidenceClustering] Embedding service not available, using text-based clustering');
}

class EvidenceClusteringService {
  constructor() {
    this.similarityThreshold = 0.75; // Threshold for semantic similarity
    this.exactMatchThreshold = 0.95; // Threshold for exact duplicates
  }

  /**
   * Cluster evidence claims by semantic similarity
   * @param {Array} evidence - Array of evidence objects with claim, sourceUrl, etc.
   * @returns {Array} Array of claim clusters
   */
  async clusterEvidence(evidence) {
    if (!Array.isArray(evidence) || evidence.length === 0) {
      return [];
    }

    // Use text-based clustering if embedding service is not available
    if (!embeddingService) {
      console.log('[EvidenceClustering] Using text-based clustering fallback');
      return this.textBasedClustering(evidence);
    }

    // Generate embeddings for all claims
    const claims = evidence.map(ev => ev.claim);
    const { embeddings } = await embeddingService.generateEmbeddingsWithUsage(claims);

    // Initialize clusters
    const clusters = [];
    const processed = new Set();

    for (let i = 0; i < evidence.length; i++) {
      if (processed.has(i)) continue;

      const currentEvidence = evidence[i];
      const currentEmbedding = embeddings[i];
      
      // Start a new cluster
      const cluster = {
        id: `cluster_${clusters.length}`,
        canonicalClaim: currentEvidence.claim,
        supportingEvidence: [currentEvidence],
        sourceUrls: [currentEvidence.sourceUrl],
        sourceCount: 1,
        independentSourceCount: 1,
        bestEvidence: currentEvidence,
        confidence: this.parseConfidence(currentEvidence.confidence),
        contradictions: [],
        upstreamAttributions: this.extractAttributions(currentEvidence.claim)
      };

      processed.add(i);

      // Find similar claims
      for (let j = i + 1; j < evidence.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.cosineSimilarity(currentEmbedding, embeddings[j]);
        
        if (similarity >= this.similarityThreshold) {
          const similarEvidence = evidence[j];
          
          cluster.supportingEvidence.push(similarEvidence);
          
          if (!cluster.sourceUrls.includes(similarEvidence.sourceUrl)) {
            cluster.sourceUrls.push(similarEvidence.sourceUrl);
            cluster.sourceCount++;
          }

          // Extract attributions to detect syndicated content
          const attributions = this.extractAttributions(similarEvidence.claim);
          cluster.upstreamAttributions.push(...attributions);

          processed.add(j);
        }
      }

      // Detect source dependencies and calculate independent sources
      cluster.independentSourceCount = this.calculateIndependentSources(cluster);
      
      // Select best evidence from cluster
      cluster.bestEvidence = this.selectBestEvidence(cluster.supportingEvidence);
      
      // Calculate cluster confidence
      cluster.confidence = this.calculateClusterConfidence(cluster);

      clusters.push(cluster);
    }

    // Detect contradictions between clusters
    this.detectClusterContradictions(clusters);

    // Emit clustering events for observability
    for (const cluster of clusters) {
      EventMapper.mapEvidenceClustered('system', 'clustering', cluster);
    }

    return clusters;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embeddingA, embeddingB) {
    if (!embeddingA || !embeddingB || embeddingA.length !== embeddingB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embeddingA.length; i++) {
      dotProduct += embeddingA[i] * embeddingB[i];
      normA += embeddingA[i] * embeddingA[i];
      normB += embeddingB[i] * embeddingB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Extract attributions from claim text
   * e.g., "according to Gartner", "OpenAI announced", "McKinsey found"
   */
  extractAttributions(claim) {
    const attributionPatterns = [
      /according to\s+([A-Z][a-zA-Z\s&]+)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+(reported|found|announced|stated|said|predicted|estimated)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+(report|study|research|analysis|survey)/gi,
      /data from\s+([A-Z][a-zA-Z\s&]+)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+data/gi
    ];

    const attributions = new Set();

    for (const pattern of attributionPatterns) {
      const matches = claim.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Clean up the attribution
          const cleaned = match
            .replace(/according to\s+/gi, '')
            .replace(/\s+(reported|found|announced|stated|said|predicted|estimated)/gi, '')
            .replace(/\s+(report|study|research|analysis|survey)/gi, '')
            .replace(/data from\s+/gi, '')
            .replace(/\s+data/gi, '')
            .trim();
          
          if (cleaned.length > 2) {
            attributions.add(cleaned);
          }
        }
      }
    }

    return Array.from(attributions);
  }

  /**
   * Calculate independent source count considering upstream attributions
   * If multiple sources cite the same upstream source, count as 1 independent
   */
  calculateIndependentSources(cluster) {
    if (cluster.upstreamAttributions.length === 0) {
      // No clear attributions, treat each source as independent
      return cluster.sourceCount;
    }

    // Group sources by their upstream attributions
    const attributionGroups = new Map();
    
    for (const evidence of cluster.supportingEvidence) {
      const attributions = this.extractAttributions(evidence.claim);
      
      if (attributions.length > 0) {
        // Has attribution - group by attribution
        const key = attributions[0].toLowerCase();
        if (!attributionGroups.has(key)) {
          attributionGroups.set(key, new Set());
        }
        attributionGroups.get(key).add(evidence.sourceUrl);
      } else {
        // No attribution - unique source
        const key = `direct_${evidence.sourceUrl}`;
        if (!attributionGroups.has(key)) {
          attributionGroups.set(key, new Set());
        }
        attributionGroups.get(key).add(evidence.sourceUrl);
      }
    }

    // Count independent groups
    return attributionGroups.size;
  }

  /**
   * Text-based clustering fallback (without embeddings)
   */
  textBasedClustering(evidence) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < evidence.length; i++) {
      if (used.has(i)) continue;

      const cluster = {
        id: `cluster_${clusters.length}`,
        canonicalClaim: evidence[i].claim,
        supportingEvidence: [evidence[i]],
        sourceUrls: [evidence[i].sourceUrl],
        sourceCount: 1,
        independentSourceCount: 1,
        confidence: this.parseConfidence(evidence[i].confidence),
        contradictions: [],
        upstreamAttributions: []
      };
      used.add(i);

      // Find similar claims using text similarity
      for (let j = i + 1; j < evidence.length; j++) {
        if (used.has(j)) continue;

        const similarity = this.calculateTextSimilarity(evidence[i].claim, evidence[j].claim);
        if (similarity > 0.6) { // 60% similarity threshold for text-based
          cluster.supportingEvidence.push(evidence[j]);
          if (!cluster.sourceUrls.includes(evidence[j].sourceUrl)) {
            cluster.sourceUrls.push(evidence[j].sourceUrl);
            cluster.sourceCount++;
            cluster.independentSourceCount++;
          }
          used.add(j);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Calculate text similarity (word overlap-based)
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Select the best evidence from a cluster
   * Considers: confidence, source authority, specificity, recency
   */
  selectBestEvidence(evidenceList) {
    if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
      return null;
    }

    // Score each evidence
    const scored = evidenceList.map(ev => {
      let score = 0;

      // Confidence score
      const confScore = this.parseConfidence(ev.confidence);
      score += confScore * 3;

      // Specificity score (longer, more detailed claims)
      if (ev.claim && ev.claim.length > 100) score += 2;
      else if (ev.claim && ev.claim.length > 50) score += 1;

      // Numerical data (more specific)
      if (ev.claim && /\d+/.test(ev.claim)) score += 1;

      // Source authority (if available)
      if (ev.sourceAuthority) score += ev.sourceAuthority * 2;

      // Direct quote vs indirect
      if (ev.evidence && ev.evidence.includes('"')) score += 1;

      return { evidence: ev, score };
    });

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].evidence;
  }

  /**
   * Calculate cluster confidence based on evidence
   * Considers: independent sources, individual confidence, corroboration
   */
  calculateClusterConfidence(cluster) {
    if (cluster.supportingEvidence.length === 0) return 0;

    // Base confidence from best evidence
    let confidence = cluster.confidence;

    // Boost for independent corroboration
    if (cluster.independentSourceCount > 1) {
      const corroborationBoost = Math.min(0.2, (cluster.independentSourceCount - 1) * 0.05);
      confidence += corroborationBoost;
    }

    // Penalty for syndicated content (many sources but few independent)
    if (cluster.sourceCount > cluster.independentSourceCount * 2) {
      const syndicationPenalty = Math.min(0.15, (cluster.sourceCount - cluster.independentSourceCount) * 0.03);
      confidence -= syndicationPenalty;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Detect contradictions between clusters
   */
  detectClusterContradictions(clusters) {
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const clusterA = clusters[i];
        const clusterB = clusters[j];

        const contradiction = this.detectContradiction(clusterA, clusterB);
        if (contradiction) {
          clusterA.contradictions.push({
            with: clusterB.id,
            claim: clusterB.canonicalClaim,
            severity: contradiction.severity,
            type: contradiction.type
          });
          
          clusterB.contradictions.push({
            with: clusterA.id,
            claim: clusterA.canonicalClaim,
            severity: contradiction.severity,
            type: contradiction.type
          });

          // Reduce confidence for contradictory clusters
          clusterA.confidence *= 0.8;
          clusterB.confidence *= 0.8;
        }
      }
    }
  }

  /**
   * Detect contradiction between two clusters
   */
  detectContradiction(clusterA, clusterB) {
    const claimA = clusterA.canonicalClaim.toLowerCase();
    const claimB = clusterB.canonicalClaim.toLowerCase();

    // Check for numerical contradictions
    const numbersA = this.extractNumbers(claimA);
    const numbersB = this.extractNumbers(claimB);

    if (numbersA.length > 0 && numbersB.length > 0) {
      // Check if claims are semantically similar but have different numbers
      const similarity = this.stringSimilarity(claimA, claimB);
      if (similarity > 0.5) {
        for (const numA of numbersA) {
          for (const numB of numbersB) {
            if (Math.abs(numA - numB) > Math.max(numA, numB) * 0.15) {
              return {
                type: 'numerical',
                severity: 'high',
                details: `Conflicting values: ${numA} vs ${numB}`
              };
            }
          }
        }
      }
    }

    // Check for direct contradictions
    const contradictionPatterns = [
      { pattern: /not\s+/gi, antonym: /yes|true|supported|enabled/gi },
      { pattern: /never\s+/gi, antonym: /always|frequently|regularly/gi },
      { pattern: /failed\s+/gi, antonym: /succeeded|successful|completed/gi },
      { pattern: /decreased|declined|fell/gi, antonym: /increased|grew|rose/gi }
    ];

    for (const { pattern, antonym } of contradictionPatterns) {
      const hasNegationA = pattern.test(claimA);
      const hasNegationB = pattern.test(claimB);
      const hasAntonymA = antonym.test(claimA);
      const hasAntonymB = antonym.test(claimB);

      if ((hasNegationA && hasAntonymB) || (hasNegationB && hasAntonymA)) {
        const similarity = this.stringSimilarity(claimA, claimB);
        if (similarity > 0.4) {
          return {
            type: 'contradiction',
            severity: 'high',
            details: 'Direct contradiction detected'
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract numbers from text
   */
  extractNumbers(text) {
    const numbers = [];
    const pattern = /\$?\s*\d+(?:,\d{3})*(?:\.\d+)?|%?\d+%?/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const numStr = match[0].replace(/[$,%]/g, '').replace(/,/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }

    return numbers;
  }

  /**
   * Simple string similarity (Jaccard-like)
   */
  stringSimilarity(strA, strB) {
    const wordsA = new Set(strA.toLowerCase().split(/\s+/));
    const wordsB = new Set(strB.toLowerCase().split(/\s+/));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Parse confidence string to numeric value
   */
  parseConfidence(confidence) {
    if (typeof confidence === 'number') {
      return Math.max(0, Math.min(1, confidence));
    }

    if (typeof confidence === 'string') {
      const normalized = confidence.trim().toUpperCase();
      if (normalized === 'HIGH') return 0.85;
      if (normalized === 'MEDIUM') return 0.60;
      if (normalized === 'LOW') return 0.35;
    }

    return 0.60; // Default to MEDIUM
  }

  /**
   * Convert cluster back to evidence format for compatibility
   */
  clusterToEvidence(cluster) {
    return {
      claim: cluster.canonicalClaim,
      evidence: cluster.bestEvidence?.evidence || '',
      confidence: this.confidenceToString(cluster.confidence),
      sourceUrl: cluster.bestEvidence?.sourceUrl || cluster.sourceUrls[0],
      sourceUrls: cluster.sourceUrls,
      sourceCount: cluster.sourceCount,
      independentSourceCount: cluster.independentSourceCount,
      clusterId: cluster.id,
      contradictions: cluster.contradictions,
      upstreamAttributions: cluster.upstreamAttributions
    };
  }

  /**
   * Convert numeric confidence to string
   */
  confidenceToString(confidence) {
    if (confidence >= 0.75) return 'HIGH';
    if (confidence >= 0.45) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = new EvidenceClusteringService();