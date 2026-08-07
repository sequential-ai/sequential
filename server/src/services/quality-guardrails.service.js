/**
 * Quality Guardrails Service
 * Performs lightweight validation before returning final response
 * Checks for citation integrity, confidence calibration, source diversity, contradictions, etc.
 */

class QualityGuardrailsService {
  constructor() {
    this.validationRules = {
      citationIntegrity: true,
      confidenceCalibration: true,
      sourceDiversity: true,
      contradictionHandling: true,
      evidenceCoverage: true,
      noFakeCitations: true
    };
  }

  /**
   * Run quality guardrails on synthesis result
   * @param {Object} synthesisResult - The synthesis output
   * @param {Array} evidence - The evidence used
   * @param {Array} sources - The sources available
   * @param {string} query - Original query
   * @returns {Object} - Validation result with any issues found
   */
  async validateSynthesis(synthesisResult, evidence, sources, query) {
    const issues = [];
    const warnings = [];

    // Check citation integrity
    if (this.validationRules.citationIntegrity) {
      const citationCheck = this.checkCitationIntegrity(synthesisResult, sources);
      if (!citationCheck.passed) {
        issues.push(...citationCheck.issues);
      }
    }

    // Check confidence calibration
    if (this.validationRules.confidenceCalibration) {
      const confidenceCheck = this.checkConfidenceCalibration(evidence);
      if (!confidenceCheck.passed) {
        warnings.push(...confidenceCheck.warnings);
      }
    }

    // Check source diversity
    if (this.validationRules.sourceDiversity) {
      const diversityCheck = this.checkSourceDiversity(sources);
      if (!diversityCheck.passed) {
        warnings.push(...diversityCheck.warnings);
      }
    }

    // Check contradiction handling
    if (this.validationRules.contradictionHandling) {
      const contradictionCheck = this.checkContradictionHandling(evidence, synthesisResult);
      if (!contradictionCheck.passed) {
        warnings.push(...contradictionCheck.warnings);
      }
    }

    // Check evidence coverage
    if (this.validationRules.evidenceCoverage) {
      const coverageCheck = this.checkEvidenceCoverage(evidence, query);
      if (!coverageCheck.passed) {
        warnings.push(...coverageCheck.warnings);
      }
    }

    // Check for fake citations
    if (this.validationRules.noFakeCitations) {
      const fakeCitationCheck = this.checkFakeCitations(synthesisResult, sources);
      if (!fakeCitationCheck.passed) {
        issues.push(...fakeCitationCheck.issues);
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      warnings,
      summary: this.generateValidationSummary(issues, warnings)
    };
  }

  /**
   * Check citation integrity - ensure all cited sources exist
   */
  checkCitationIntegrity(synthesisResult, sources) {
    const issues = [];
    const sourceUrls = new Set(sources.map(s => s.url));

    // Extract URLs from synthesis result
    const usedUrls = this.extractUrls(synthesisResult);

    for (const url of usedUrls) {
      if (!sourceUrls.has(url)) {
        issues.push({
          type: 'invalid_citation',
          message: `Citation uses invalid URL: ${url}`,
          severity: 'high'
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Check confidence calibration - ensure HIGH confidence is appropriate
   */
  checkConfidenceCalibration(evidence) {
    const warnings = [];

    for (const ev of evidence) {
      const confidence = ev.enhancedConfidence || this.parseConfidence(ev.confidence);
      
      // Check for HIGH confidence without strong evidence
      if (confidence >= 0.75) {
        if (!ev.originalSourceVerified && this.extractAttribution(ev.claim)) {
          warnings.push({
            type: 'overconfident',
            message: `HIGH confidence for claim with unverified attribution: "${ev.claim.substring(0, 50)}..."`,
            severity: 'medium'
          });
        }

        if (ev.independentSourceCount === 1 && !ev.originalSourceVerified) {
          warnings.push({
            type: 'overconfident',
            message: `HIGH confidence for single-source claim without verification: "${ev.claim.substring(0, 50)}..."`,
            severity: 'low'
          });
        }
      }
    }

    return {
      passed: true, // Warnings don't fail validation
      warnings
    };
  }

  /**
   * Check source diversity - ensure no single domain dominates
   */
  checkSourceDiversity(sources) {
    const warnings = [];
    const domainCounts = {};

    for (const source of sources) {
      const domain = this.extractDomain(source.url);
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }

    const totalSources = sources.length;
    const maxCount = Math.max(...Object.values(domainCounts));
    const dominanceRatio = maxCount / totalSources;

    if (dominanceRatio > 0.6 && totalSources > 3) {
      const dominantDomain = Object.keys(domainCounts).find(d => domainCounts[d] === maxCount);
      warnings.push({
        type: 'low_diversity',
        message: `Single domain dominates: ${dominantDomain} (${maxCount}/${totalSources} sources)`,
        severity: 'medium'
      });
    }

    return {
      passed: true,
      warnings
    };
  }

  /**
   * Check contradiction handling - ensure contradictions are surfaced
   */
  checkContradictionHandling(evidence, synthesisResult) {
    const warnings = [];
    const contradictoryEvidence = evidence.filter(ev => 
      ev.contradictions && ev.contradictions.length > 0
    );

    if (contradictoryEvidence.length > 0) {
      // Check if synthesis acknowledges contradictions
      const synthesisText = JSON.stringify(synthesisResult).toLowerCase();
      const acknowledgesContradiction = 
        synthesisText.includes('vary') ||
        synthesisText.includes('differ') ||
        synthesisText.includes('disagree') ||
        synthesisText.includes('conflict') ||
        synthesisText.includes('estimate') ||
        synthesisText.includes('range');

      if (!acknowledgesContradiction) {
        warnings.push({
          type: 'hidden_contradiction',
          message: `${contradictoryEvidence.length} contradictory claims may not be properly acknowledged`,
          severity: 'medium'
        });
      }
    }

    return {
      passed: true,
      warnings
    };
  }

  /**
   * Check evidence coverage - ensure major query dimensions are covered
   */
  checkEvidenceCoverage(evidence, query) {
    const warnings = [];
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    // Check if major query terms appear in evidence
    const coverage = {};
    for (const word of queryWords) {
      const relevantEvidence = evidence.filter(ev => 
        (ev.claim || '').toLowerCase().includes(word) ||
        (ev.evidence || ev.evidenceText || '').toLowerCase().includes(word)
      );
      coverage[word] = relevantEvidence.length;
    }

    const uncoveredTerms = Object.entries(coverage)
      .filter(([word, count]) => count === 0)
      .map(([word]) => word);

    if (uncoveredTerms.length > 0 && queryWords.length > 2) {
      warnings.push({
        type: 'low_coverage',
        message: `Query terms not well covered: ${uncoveredTerms.join(', ')}`,
        severity: 'low'
      });
    }

    return {
      passed: true,
      warnings
    };
  }

  /**
   * Check for fake citations - fabricated URLs
   */
  checkFakeCitations(synthesisResult, sources) {
    const issues = [];
    const sourceUrls = new Set(sources.map(s => s.url));
    const usedUrls = this.extractUrls(synthesisResult);

    for (const url of usedUrls) {
      // Check for obviously fake URLs
      if (this.isLikelyFakeUrl(url)) {
        issues.push({
          type: 'fake_citation',
          message: `Likely fake citation detected: ${url}`,
          severity: 'high'
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Extract all URLs from an object
   */
  extractUrls(obj, urls = new Set()) {
    if (typeof obj === "string" && obj.startsWith("http")) {
      urls.add(obj);
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.extractUrls(item, urls));
    } else if (typeof obj === "object" && obj !== null) {
      Object.values(obj).forEach(val => this.extractUrls(val, urls));
    }
    return urls;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    if (!url) return 'unknown';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
      return 'invalid';
    }
  }

  /**
   * Extract attribution from claim
   */
  extractAttribution(claim) {
    const patterns = [
      /according to\s+([A-Z][a-zA-Z\s&]+)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+(reported|found|announced|stated|said|predicted|estimated)/gi
    ];

    for (const pattern of patterns) {
      const match = claim.match(pattern);
      if (match) return match[1];
    }

    return null;
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

  /**
   * Check if URL is likely fake
   */
  isLikelyFakeUrl(url) {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /example\.com/,
      /test\.com/,
      /fake\./,
      /placeholder\./,
      /^http:\/\/localhost/,
      /^http:\/\/127\.0\.0\.1/
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) return true;
    }

    // Check for obviously malformed URLs
    try {
      new URL(url);
    } catch (e) {
      return true;
    }

    return false;
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(issues, warnings) {
    const summary = {
      totalIssues: issues.length,
      totalWarnings: warnings.length,
      criticalIssues: issues.filter(i => i.severity === 'high').length,
      canProceed: issues.filter(i => i.severity === 'high').length === 0
    };

    if (summary.totalIssues === 0 && summary.totalWarnings === 0) {
      summary.message = 'All quality checks passed';
    } else if (summary.totalIssues === 0) {
      summary.message = `${summary.totalWarnings} warning(s) detected, synthesis can proceed`;
    } else {
      summary.message = `${summary.totalIssues} issue(s) detected, review required`;
    }

    return summary;
  }

  /**
   * Enable/disable specific validation rules
   */
  setValidationRule(rule, enabled) {
    if (this.validationRules.hasOwnProperty(rule)) {
      this.validationRules[rule] = enabled;
    }
  }

  /**
   * Get current validation rules
   */
  getValidationRules() {
    return { ...this.validationRules };
  }
}

module.exports = new QualityGuardrailsService();