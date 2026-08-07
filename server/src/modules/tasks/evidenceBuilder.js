const sourceQualityService = require('../../services/source-quality.service');

class EvidenceBuilder {
  /**
   * Maps facts to structured Evidence formats with multi-factor confidence scoring.
   * @param {Array<Object>} facts - The extracted facts array
   * @param {Array<Object>} sources - The processed sources array from SourceManager
   * @returns {Array<Object>} - Structured evidence with enhanced confidence
   */
  static buildEvidence(facts, sources) {
    if (!Array.isArray(facts)) return [];

    return facts.map(fact => {
      // Find the source by matching the URL
      const source = sources.find(s => s.url === fact.sourceUrl);
      const sourceId = source ? source.id : null;

      // Calculate multi-factor confidence with error handling
      let enhancedConfidence;
      try {
        enhancedConfidence = this.calculateEnhancedConfidence(fact, source);
      } catch (error) {
        console.error('[EvidenceBuilder] Error calculating enhanced confidence:', error);
        // Fallback to simple confidence
        enhancedConfidence = {
          finalConfidence: this.parseConfidence(fact.confidence),
          sourceAuthority: 0.5,
          claimSupport: 0.6,
          corroborationScore: 0.5,
          originalSource: this.extractOriginalSource(fact.claim),
          originalSourceVerified: false
        };
      }

      return {
        claim: fact.claim,
        confidence: this.confidenceToString(enhancedConfidence.finalConfidence), // Use enhanced confidence
        enhancedConfidence: enhancedConfidence.finalConfidence,
        sourceId,
        sourceAuthority: enhancedConfidence.sourceAuthority,
        claimSupport: enhancedConfidence.claimSupport,
        corroborationScore: enhancedConfidence.corroborationScore,
        originalSource: enhancedConfidence.originalSource,
        originalSourceVerified: enhancedConfidence.originalSourceVerified
      };
    });
  }

  /**
   * Calculate enhanced multi-factor confidence
   * Considers: source authority, claim support, corroboration, original source verification
   */
  static calculateEnhancedConfidence(fact, source) {
    if (!fact) {
      return {
        finalConfidence: 0.5,
        sourceAuthority: 0.5,
        claimSupport: 0.5,
        corroborationScore: 0.5,
        originalSource: null,
        originalSourceVerified: false
      };
    }

    // Parse original confidence
    const baseConfidence = this.parseConfidence(fact.confidence);

    // Get source authority score with fallback
    let sourceAuthority = 0.5; // Default medium
    if (source) {
      try {
        const qualityScore = sourceQualityService.calculateSourceScore(source);
        sourceAuthority = qualityScore.score / 100;
      } catch (error) {
        console.warn('[EvidenceBuilder] Could not calculate source quality score:', error);
      }
    }

    // Determine claim support type with null safety
    const claimSupport = this.determineClaimSupport(fact);

    // Calculate corroboration (will be enhanced with clustering data)
    const corroborationScore = 0.5; // Default, will be updated by clustering

    // Extract original source if attribution exists with null safety
    const originalSource = this.extractOriginalSource(fact.claim);
    const originalSourceVerified = false; // Will be updated by original-source service

    // Calculate final confidence
    const finalConfidence = this.combineConfidenceFactors({
      baseConfidence,
      sourceAuthority,
      claimSupport,
      corroborationScore,
      originalSourceVerified,
      originalSource
    });

    return {
      finalConfidence,
      sourceAuthority,
      claimSupport,
      corroborationScore,
      originalSource,
      originalSourceVerified
    };
  }

  /**
   * Determine claim support type (DIRECT, INDIRECT, ATTRIBUTED, etc.)
   */
  static determineClaimSupport(fact) {
    if (!fact) return 0.50; // Default to WEAK if fact is null/undefined

    const evidence = (fact.evidence || '').toLowerCase();
    const claim = fact.claim || ''; // Keep original case for pattern matching

    // Direct quote or explicit statement
    if (evidence.includes('"') || evidence.includes('stated') || evidence.includes('announced')) {
      return 0.95; // DIRECT
    }

    // Contains attribution but not direct
    if (this.extractOriginalSource(claim)) {
      return 0.75; // ATTRIBUTED
    }

    // General paraphrase
    if (evidence.includes('according to') || evidence.includes('reports')) {
      return 0.65; // INDIRECT
    }

    // Weak support
    return 0.50; // WEAK
  }

  /**
   * Extract original source from claim text
   */
  static extractOriginalSource(claim) {
    if (!claim || typeof claim !== 'string') return null;

    const attributionPatterns = [
      /according to\s+([A-Z][a-zA-Z\s&]+)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+(reported|found|announced|stated|said|predicted|estimated)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+(report|study|research|analysis|survey)/gi
    ];

    for (const pattern of attributionPatterns) {
      const match = claim.match(pattern);
      if (match && match[1]) {
        const cleaned = match[1]
          .replace(/according to\s+/gi, '')
          .replace(/\s+(reported|found|announced|stated|said|predicted|estimated)/gi, '')
          .replace(/\s+(report|study|research|analysis|survey)/gi, '')
          .trim();
        
        if (cleaned && cleaned.length > 2) {
          return cleaned;
        }
      }
    }

    return null;
  }

  /**
   * Combine confidence factors into final score
   */
  static combineConfidenceFactors({ baseConfidence, sourceAuthority, claimSupport, corroborationScore, originalSourceVerified, originalSource }) {
    let finalConfidence = baseConfidence;

    // Apply source authority weight (30%)
    finalConfidence = (finalConfidence * 0.7) + (sourceAuthority * 0.3);

    // Apply claim support weight (20%)
    finalConfidence = (finalConfidence * 0.8) + (claimSupport * 0.2);

    // Apply corroboration boost (15%)
    if (corroborationScore > 0.7) {
      finalConfidence = Math.min(1.0, finalConfidence + 0.1);
    }

    // Apply original source verification penalty
    // If there's an original source attribution but it's not verified, penalize
    if (originalSource && !originalSourceVerified) {
      finalConfidence = Math.max(0.1, finalConfidence - 0.15);
    }

    return Math.max(0, Math.min(1, finalConfidence));
  }

  /**
   * Parse confidence string to numeric value
   */
  static parseConfidence(confidence) {
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
   * Convert numeric confidence to string
   */
  static confidenceToString(confidence) {
    if (confidence >= 0.75) return 'HIGH';
    if (confidence >= 0.45) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = EvidenceBuilder;
