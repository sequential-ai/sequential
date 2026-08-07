/**
 * Original-Source Resolution Service
 * Detects attributions to primary sources (Gartner, OpenAI, etc.) and attempts to locate original publications
 * Prioritizes original sources over secondary reporting for improved confidence calibration
 */

const { SearchWorker } = require('../workers/search.worker');

class OriginalSourceService {
  constructor() {
    this.searchWorker = new SearchWorker();
    
    // Important entities that trigger original-source resolution
    this.importantEntities = [
      'gartner', 'forrester', 'mckinsey', 'deloitte', 'pwc', 'ey',
      'openai', 'anthropic', 'google deepmind', 'microsoft research',
      'stanford', 'mit', 'carnegie mellon', 'berkeley',
      'sec', 'federal reserve', 'european central bank',
      'who', 'cdc', 'nih', 'fda',
      'ipcc', 'un', 'oecd', 'imf', 'world bank'
    ];

    // Claim types that prioritize original-source resolution
    this.priorityClaimTypes = [
      'statistics', 'percentages', 'market size', 'growth rate',
      'financial data', 'revenue', 'valuation', 'funding',
      'predictions', 'forecasts', 'projections',
      'benchmarks', 'performance metrics', 'survey results',
      'regulatory', 'compliance', 'legal standards'
    ];
  }

  /**
   * Resolve original sources for a list of claims
   * @param {Array} claims - Array of claim objects with claim, sourceUrl, etc.
   * @param {string} mode - Research mode (FAST/STANDARD/DEEP)
   * @returns {Array} - Claims with original source information added
   */
  async resolveOriginalSources(claims, mode = 'STANDARD') {
    if (!Array.isArray(claims) || claims.length === 0) {
      return [];
    }

    // In FAST mode, only resolve for very high-priority claims
    if (mode === 'FAST') {
      const highPriorityClaims = claims.filter(claim => 
        this.isHighPriorityClaim(claim)
      );
      return await this.processClaims(highPriorityClaims, claims, mode);
    }

    // In STANDARD mode, resolve for most important claims
    if (mode === 'STANDARD') {
      const priorityClaims = claims.filter(claim => 
        this.isPriorityClaim(claim)
      );
      return await this.processClaims(priorityClaims, claims, mode);
    }

    // In DEEP mode, resolve for all claims with attributions
    const attributedClaims = claims.filter(claim => 
      this.extractAttribution(claim.claim)
    );
    return await this.processClaims(attributedClaims, claims, mode);
  }

  /**
   * Process claims to resolve original sources
   */
  async processClaims(targetClaims, allClaims, mode) {
    const resolvedClaims = [...allClaims];
    const resolvedMap = new Map();

    // Process each target claim
    for (const claim of targetClaims) {
      const attribution = this.extractAttribution(claim.claim);
      
      if (!attribution) continue;

      // Check if we've already resolved this attribution
      if (resolvedMap.has(attribution.toLowerCase())) {
        const existing = resolvedMap.get(attribution.toLowerCase());
        this.applyResolutionToClaim(claim, existing);
        continue;
      }

      // Attempt to resolve original source
      const resolution = await this.resolveOriginalSource(attribution, claim.claim, mode);
      
      if (resolution) {
        resolvedMap.set(attribution.toLowerCase(), resolution);
        this.applyResolutionToClaim(claim, resolution);
      }
    }

    return resolvedClaims;
  }

  /**
   * Resolve original source for a specific attribution
   */
  async resolveOriginalSource(attribution, claim, mode) {
    // Generate search queries for original source
    const searchQueries = this.generateOriginalSourceQueries(attribution, claim);
    
    let bestResult = null;
    let bestScore = 0;

    // Try each search query (limit attempts based on mode)
    const maxAttempts = mode === 'DEEP' ? 3 : mode === 'STANDARD' ? 2 : 1;
    
    for (let i = 0; i < Math.min(searchQueries.length, maxAttempts); i++) {
      try {
        const results = await this.searchWorker.run({ query: searchQueries[i] });
        
        for (const result of results) {
          const score = this.scoreOriginalSourceResult(result, attribution);
          
          if (score > bestScore && score > 0.6) {
            bestScore = score;
            bestResult = {
              originalSource: attribution,
              originalUrl: result.url,
              originalTitle: result.title,
              originalDomain: result.domain,
              verified: true,
              confidence: score
            };
          }
        }
      } catch (error) {
        console.error(`[OriginalSourceService] Search failed for query: ${searchQueries[i]}`, error);
      }

      // If we found a high-confidence result, stop searching
      if (bestResult && bestResult.confidence > 0.85) {
        break;
      }
    }

    return bestResult;
  }

  /**
   * Generate search queries for finding original sources
   */
  generateOriginalSourceQueries(attribution, claim) {
    const queries = [];
    const claimKeywords = this.extractKeywords(claim);

    // Query 1: Direct attribution + site: search
    queries.push(`site:${attribution.toLowerCase().replace(/\s+/g, '')}.com ${claimKeywords.join(' ')}`);

    // Query 2: Attribution + official/report/document
    queries.push(`${attribution} official report ${claimKeywords.join(' ')}`);

    // Query 3: Attribution + specific claim type
    if (this.containsStatistics(claim)) {
      queries.push(`${attribution} statistics ${claimKeywords.join(' ')}`);
    } else if (this.containsFinancialData(claim)) {
      queries.push(`${attribution} financial data ${claimKeywords.join(' ')}`);
    } else {
      queries.push(`${attribution} research ${claimKeywords.join(' ')}`);
    }

    // Query 4: Attribution + PDF (often official reports)
    queries.push(`${attribution} filetype:pdf ${claimKeywords.join(' ')}`);

    return queries;
  }

  /**
   * Score a search result as a potential original source
   */
  scoreOriginalSourceResult(result, attribution) {
    let score = 0;
    const domain = (result.domain || '').toLowerCase();
    const title = (result.title || '').toLowerCase();
    const url = (result.url || '').toLowerCase();

    // High score for official domain
    if (domain.includes(attribution.toLowerCase().replace(/\s+/g, ''))) {
      score += 0.4;
    }

    // Bonus for official indicators in URL
    if (url.includes('official') || url.includes('docs') || url.includes('research')) {
      score += 0.2;
    }

    // Bonus for report/document indicators in title
    if (title.includes('report') || title.includes('research') || title.includes('study') || 
        title.includes('white paper') || title.includes('analysis')) {
      score += 0.2;
    }

    // Bonus for PDF (often official documents)
    if (url.includes('.pdf')) {
      score += 0.1;
    }

    // Penalty for obvious secondary sources
    if (title.includes('according to') || title.includes('reports that') || title.includes('says')) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Apply resolution information to a claim
   */
  applyResolutionToClaim(claim, resolution) {
    claim.originalSource = resolution.originalSource;
    claim.originalSourceVerified = resolution.verified;
    claim.originalUrl = resolution.originalUrl;
    claim.originalTitle = resolution.originalTitle;
    claim.originalDomain = resolution.originalDomain;
    claim.originalSourceConfidence = resolution.confidence;
    
    // Adjust confidence based on original source verification
    if (resolution.verified && resolution.confidence > 0.7) {
      claim.confidence = this.boostConfidence(claim.confidence);
    }
  }

  /**
   * Extract attribution from claim text
   */
  extractAttribution(claim) {
    const attributionPatterns = [
      /according to\s+([A-Z][a-zA-Z\s&]+)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+(reported|found|announced|stated|said|predicted|estimated)/gi,
      /([A-Z][a-zA-Z\s&]+)\s+(report|study|research|analysis|survey)/gi,
      /data from\s+([A-Z][a-zA-Z\s&]+)/gi
    ];

    for (const pattern of attributionPatterns) {
      const match = claim.match(pattern);
      if (match) {
        const cleaned = match[1]
          .replace(/according to\s+/gi, '')
          .replace(/\s+(reported|found|announced|stated|said|predicted|estimated)/gi, '')
          .replace(/\s+(report|study|research|analysis|survey)/gi, '')
          .replace(/data from\s+/gi, '')
          .trim();
        
        if (cleaned.length > 2) {
          return cleaned;
        }
      }
    }

    return null;
  }

  /**
   * Extract keywords from claim for search
   */
  extractKeywords(claim) {
    // Remove attribution phrases
    const cleaned = claim
      .replace(/according to\s+[A-Z][a-zA-Z\s&]+/gi, '')
      .replace(/\s+(reported|found|announced|stated|said|predicted|estimated)/gi, '')
      .replace(/\s+(report|study|research|analysis|survey)/gi, '')
      .replace(/data from\s+[A-Z][a-zA-Z\s&]+/gi, '')
      .trim();

    // Extract important terms (numbers, proper nouns, key terms)
    const words = cleaned.split(/\s+/);
    const keywords = [];

    for (const word of words) {
      // Keep numbers and percentages
      if (/\d+/.test(word) || /%/.test(word)) {
        keywords.push(word);
      }
      // Keep capitalized words (likely proper nouns)
      else if (/^[A-Z]/.test(word)) {
        keywords.push(word);
      }
      // Keep longer words (likely meaningful terms)
      else if (word.length > 5) {
        keywords.push(word);
      }
    }

    return keywords.slice(0, 5); // Limit to top 5 keywords
  }

  /**
   * Check if claim is high priority for original-source resolution
   */
  isHighPriorityClaim(claim) {
    const attribution = this.extractAttribution(claim.claim);
    if (!attribution) return false;

    const attributionLower = attribution.toLowerCase();
    
    // Check for important entities
    for (const entity of this.importantEntities) {
      if (attributionLower.includes(entity)) {
        return this.containsImportantData(claim.claim);
      }
    }

    return false;
  }

  /**
   * Check if claim is priority for original-source resolution
   */
  isPriorityClaim(claim) {
    const attribution = this.extractAttribution(claim.claim);
    if (!attribution) return false;

    // Priority if contains statistics or financial data
    return this.containsImportantData(claim.claim);
  }

  /**
   * Check if claim contains important data (statistics, financials, etc.)
   */
  containsImportantData(claim) {
    return this.containsStatistics(claim) || 
           this.containsFinancialData(claim) ||
           this.containsPredictions(claim);
  }

  /**
   * Check if claim contains statistics
   */
  containsStatistics(claim) {
    return /\d+[%]|percent|statistics|survey|benchmark/i.test(claim);
  }

  /**
   * Check if claim contains financial data
   */
  containsFinancialData(claim) {
    return /\$|\d+\s*(million|billion|trillion)|revenue|valuation|funding|investment/i.test(claim);
  }

  /**
   * Check if claim contains predictions
   */
  containsPredictions(claim) {
    return /predict|forecast|project|estimate|expect|will be|by \d{4}/i.test(claim);
  }

  /**
   * Boost confidence when original source is verified
   */
  boostConfidence(currentConfidence) {
    const numericConf = this.parseConfidence(currentConfidence);
    const boosted = Math.min(1.0, numericConf + 0.15);
    return this.confidenceToString(boosted);
  }

  /**
   * Parse confidence string to numeric
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
   * Convert numeric confidence to string
   */
  confidenceToString(confidence) {
    if (confidence >= 0.75) return 'HIGH';
    if (confidence >= 0.45) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = new OriginalSourceService();