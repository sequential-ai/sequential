/**
 * Source quality scoring and ranking service
 * Improves research quality by prioritizing authoritative and diverse sources
 */

// Domain lists for authority tiers (must be defined before class)
const majorNewsDomains = [
  'reuters.com', 'apnews.com', 'bbc.com', 'nytimes.com', 'wsj.com', 
  'economist.com', 'ft.com', 'bloomberg.com', 'cnn.com', 'nbcnews.com'
];

const techDomains = [
  'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com', 
  'venturebeat.com', 'zdnet.com', 'engadget.com'
];

const academicDomains = [
  'nature.com', 'science.org', 'ieee.org', 'acm.org', 'springer.com', 
  'wiley.com', 'nejm.org', 'bmj.com', 'thelancet.com'
];

const suspiciousPatterns = [
  (domain) => /bit\.ly|tinyurl\.com|short\.link/.test(domain),
  (domain) => /-blog\.spot\.com|wordpress\.com|medium\.com\/@/.test(domain),
  (domain) => /\.info$|\.xyz$|\.top$|\.tk$/.test(domain)
];

class SourceQualityService {
  constructor() {
    // Domain authority tiers (simplified - in production would use actual metrics)
    this.authorityTiers = {
      'highest': ['.gov', '.edu', '.mil', 'who.int', 'un.org', 'oecd.org', 'imf.org', 'worldbank.org'],
      'high': ['.org', 'nature.com', 'science.org', 'ieee.org', 'acm.org', 'springer.com', 'wiley.com', 'nejm.org', 'bmj.com', 'thelancet.com'],
      'medium-high': ['.com', majorNewsDomains, techDomains, academicDomains],
      'medium': ['.net', '.io', '.co', '.ai'],
      'low': ['.info', '.biz', '.xyz', suspiciousPatterns]
    };

    // Trusted domains by category
    this.trustedDomains = {
      'government': ['.gov', '.gov.uk', '.gov.au', '.gc.ca', '.go.jp', '.gov.in', '.europa.eu'],
      'academic': ['.edu', '.ac.uk', '.edu.au', 'scholar.google.com', 'researchgate.net', 'arxiv.org', 'pubmed.ncbi.nlm.nih.gov'],
      'news': ['reuters.com', 'apnews.com', 'bbc.com', 'nytimes.com', 'wsj.com', 'economist.com', 'ft.com', 'bloomberg.com'],
      'tech': ['techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com', 'venturebeat.com'],
      'finance': ['sec.gov', 'investor.gov', 'morningstar.com', 'yahoo.com', 'marketwatch.com']
    };

    // Suspicious patterns
    this.suspiciousPatterns = [
      /bit\.ly/, /tinyurl\.com/, /short\.link/,
      /-blog\.spot\.com/, /wordpress\.com/, /medium\.com\/@/,
      /\.info$/, /\.xyz$/, /\.top$/, /\.tk$/
    ];
  }

  /**
   * Calculate overall quality score for a source
   */
  calculateSourceScore(source) {
    const url = source.url || source;
    const domain = this.extractDomain(url);
    
    let score = 0;
    const factors = {};

    // Authority tier scoring
    const authorityScore = this.getAuthorityScore(domain);
    factors.authority = authorityScore;
    score += authorityScore * 30; // 30% weight

    // Trust category scoring
    const trustScore = this.getTrustScore(domain);
    factors.trust = trustScore;
    score += trustScore * 25; // 25% weight

    // Freshness scoring
    const freshnessScore = this.getFreshnessScore(source);
    factors.freshness = freshnessScore;
    score += freshnessScore * 15; // 15% weight

    // Content quality scoring
    const contentScore = this.getContentScore(source);
    factors.content = contentScore;
    score += contentScore * 20; // 20% weight

    // Diversity penalty (avoid too many sources from same domain)
    // This would be applied during ranking, not individual scoring

    // Suspicious pattern penalty
    const suspiciousPenalty = this.getSuspiciousPenalty(url);
    factors.suspicious = suspiciousPenalty;
    score -= suspiciousPenalty * 10; // -10% weight

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      domain,
      url
    };
  }

  /**
   * Get authority score based on domain tier
   */
  getAuthorityScore(domain) {
    if (!domain) return 50;

    // Check against authority tiers
    for (const [tier, domains] of Object.entries(this.authorityTiers)) {
      for (const pattern of domains) {
        if (typeof pattern === 'string' && pattern.startsWith('.')) {
          if (domain.endsWith(pattern)) {
            return this.getTierScore(tier);
          }
        } else if (typeof pattern === 'function') {
          if (pattern(domain)) {
            return this.getTierScore(tier);
          }
        } else if (domain === pattern || domain.includes(pattern)) {
          return this.getTierScore(tier);
        }
      }
    }

    return 50; // Default medium score
  }

  /**
   * Get score value for authority tier
   */
  getTierScore(tier) {
    const tierScores = {
      'highest': 95,
      'high': 85,
      'medium-high': 70,
      'medium': 55,
      'low': 30
    };
    return tierScores[tier] || 50;
  }

  /**
   * Get trust score based on trusted categories
   */
  getTrustScore(domain) {
    if (!domain) return 50;

    for (const [category, domains] of Object.entries(this.trustedDomains)) {
      for (const trustedDomain of domains) {
        if (domain.includes(trustedDomain) || domain.endsWith(trustedDomain)) {
          return 80;
        }
      }
    }

    return 50;
  }

  /**
   * Get freshness score based on publication date
   */
  getFreshnessScore(source) {
    if (!source.publishedAt) return 50;

    const pubDate = new Date(source.publishedAt);
    const now = new Date();
    const ageInDays = (now - pubDate) / (1000 * 60 * 60 * 24);

    if (ageInDays < 7) return 95; // Very fresh
    if (ageInDays < 30) return 85; // Fresh
    if (ageInDays < 90) return 70; // Recent
    if (ageInDays < 365) return 55; // Moderately recent
    if (ageInDays < 1825) return 40; // Old but potentially valid
    return 25; // Very old
  }

  /**
   * Get content quality score based on content characteristics
   */
  getContentScore(source) {
    let score = 50;

    // Check for content length (longer articles often more substantive)
    if (source.content) {
      const contentLength = source.content.length;
      if (contentLength > 5000) score += 20;
      else if (contentLength > 2000) score += 15;
      else if (contentLength > 1000) score += 10;
      else if (contentLength > 500) score += 5;
    }

    // Check for structured content
    if (source.title && source.title.length > 20) score += 5;
    if (source.snippet && source.snippet.length > 100) score += 5;

    // Check for citations/references (heuristic)
    if (source.content && (source.content.includes('[') || source.content.includes('('))) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Get suspicious pattern penalty
   */
  getSuspiciousPenalty(url) {
    if (!url) return 0;

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(url)) {
        return 50; // High penalty
      }
    }

    return 0;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (e) {
      return null;
    }
  }

  /**
   * Rank sources by quality score
   */
  rankSources(sources) {
    const scoredSources = sources.map(source => ({
      source,
      quality: this.calculateSourceScore(source)
    }));

    // Sort by quality score (highest first)
    scoredSources.sort((a, b) => b.quality.score - a.quality.score);

    return scoredSources;
  }

  /**
   * Apply diversity constraints to ranked sources
   * Ensures representation from different domains
   */
  applyDiversityConstraints(rankedSources, maxPerDomain = 3) {
    const domainCounts = {};
    const diversified = [];

    for (const { source, quality } of rankedSources) {
      const domain = quality.domain;
      
      if (!domainCounts[domain]) {
        domainCounts[domain] = 0;
      }

      if (domainCounts[domain] < maxPerDomain) {
        diversified.push({ source, quality });
        domainCounts[domain]++;
      }
    }

    return diversified;
  }

  /**
   * Select top N sources with quality and diversity constraints
   */
  selectTopSources(sources, topN = 10, maxPerDomain = 3) {
    const ranked = this.rankSources(sources);
    const diversified = this.applyDiversityConstraints(ranked, maxPerDomain);
    return diversified.slice(0, topN);
  }

  /**
   * Get quality report for a set of sources
   */
  getQualityReport(sources) {
    const ranked = this.rankSources(sources);
    
    const total = ranked.length;
    const highQuality = ranked.filter(r => r.quality.score >= 70).length;
    const mediumQuality = ranked.filter(r => r.quality.score >= 50 && r.quality.score < 70).length;
    const lowQuality = ranked.filter(r => r.quality.score < 50).length;

    const domainDistribution = {};
    for (const { quality } of ranked) {
      const domain = quality.domain || 'unknown';
      domainDistribution[domain] = (domainDistribution[domain] || 0) + 1;
    }

    return {
      total,
      qualityDistribution: {
        high: highQuality,
        medium: mediumQuality,
        low: lowQuality
      },
      averageScore: ranked.reduce((sum, r) => sum + r.quality.score, 0) / total,
      domainDistribution,
      topSources: ranked.slice(0, 5)
    };
  }
}

module.exports = new SourceQualityService();