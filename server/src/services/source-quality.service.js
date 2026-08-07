/**
 * Source quality scoring and ranking service
 * Improves research quality by prioritizing authoritative and diverse sources
 * Enhanced with content-aware classification for primary vs secondary sources
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

    // Content patterns for primary source detection
    this.primarySourcePatterns = [
      // Official documentation patterns
      /official\s+(documentation|docs|guide|reference|spec|specification)/i,
      /api\s+reference/i,
      /technical\s+specification/i,
      /white\s+paper/i,
      /research\s+paper/i,
      
      // Government/regulatory patterns
      /sec\s+(filing|report)/i,
      /10-\s*k/i,
      /form\s+\d+/i,
      /regulation|regulatory/i,
      /federal\s+register/i,
      
      // Academic patterns
      /abstract/i,
      /methodology/i,
      /results|findings/i,
      /doi:/i,
      /bibliography|references/i,
      /peer-reviewed/i,
      
      // Company official patterns
      /press\s+release/i,
      /official\s+(announcement|statement|blog)/i,
      /quarterly\s+earnings/i,
      /annual\s+report/i
    ];

    // Secondary source patterns
    this.secondarySourcePatterns = [
      /according\s+to/i,
      /reports?\s+that/i,
      /sources?\s+say/i,
      /announced\s+by/i,
      /stated\s+that/i,
      /mentioned\s+in/i,
      /citing\s+/i,
      /based\s+on\s+report/i
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
    score += authorityScore * 25; // 25% weight

    // Trust category scoring
    const trustScore = this.getTrustScore(domain);
    factors.trust = trustScore;
    score += trustScore * 20; // 20% weight

    // Freshness scoring
    const freshnessScore = this.getFreshnessScore(source);
    factors.freshness = freshnessScore;
    score += freshnessScore * 15; // 15% weight

    // Content quality scoring
    const contentScore = this.getContentScore(source);
    factors.content = contentScore;
    score += contentScore * 15; // 15% weight

    // Primary source bonus
    const primarySourceBonus = this.getPrimarySourceBonus(source);
    factors.primarySource = primarySourceBonus;
    score += primarySourceBonus * 15; // 15% weight

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
      url,
      sourceType: this.classifySourceType(source, domain)
    };
  }

  /**
   * Classify source type (PRIMARY, HIGH_AUTHORITY_SECONDARY, etc.)
   */
  classifySourceType(source, domain) {
    const domainLower = (domain || '').toLowerCase();
    const content = (source.content || source.snippet || source.title || '').toLowerCase();
    const url = (source.url || '').toLowerCase();

    // Check for primary source indicators
    const isPrimary = this.isPrimarySource(content, url, domainLower);
    
    if (isPrimary) {
      return 'PRIMARY';
    }

    // Check for high authority secondary
    if (this.isHighAuthoritySecondary(domainLower, content)) {
      return 'HIGH_AUTHORITY_SECONDARY';
    }

    // Check for reputable secondary
    if (this.isReputableSecondary(domainLower, content)) {
      return 'REPUTABLE_SECONDARY';
    }

    // Check for general secondary
    if (this.isGeneralSecondary(domainLower, content)) {
      return 'GENERAL_SECONDARY';
    }

    // Default to low authority
    return 'LOW_AUTHORITY';
  }

  /**
   * Determine if source is primary (original/official)
   */
  isPrimarySource(content, url, domain) {
    // Check domain patterns
    if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
      return true;
    }

    // Check URL patterns
    if (url.includes('docs.') || url.includes('developer.') || url.includes('official')) {
      return true;
    }

    // Check content patterns
    for (const pattern of this.primarySourcePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine if source is high authority secondary
   */
  isHighAuthoritySecondary(domain, content) {
    // Check against trusted news domains
    const trustedNews = this.trustedDomains.news || [];
    for (const newsDomain of trustedNews) {
      if (domain.includes(newsDomain)) {
        return true;
      }
    }

    // Check for major research organizations
    if (domain.includes('mckinsey') || domain.includes('deloitte') || 
        domain.includes('pwc') || domain.includes('ey.com') ||
        domain.includes('gartner') || domain.includes('forrester')) {
      return true;
    }

    return false;
  }

  /**
   * Determine if source is reputable secondary
   */
  isReputableSecondary(domain, content) {
    // Check against tech domains
    const techDomains = this.trustedDomains.tech || [];
    for (const techDomain of techDomains) {
      if (domain.includes(techDomain)) {
        return true;
      }
    }

    // Check for established publications
    if (domain.includes('.com') && !this.isLowAuthority(domain)) {
      // Has secondary attribution patterns
      for (const pattern of this.secondarySourcePatterns) {
        if (pattern.test(content)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Determine if source is general secondary
   */
  isGeneralSecondary(domain, content) {
    // Industry blogs, vendor blogs, personal expert blogs
    if (domain.includes('blog') || domain.includes('medium.com') || 
        domain.includes('substack.com')) {
      return true;
    }

    // Has secondary attribution but not clearly reputable
    for (const pattern of this.secondarySourcePatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Determine if source is low authority
   */
  isLowAuthority(domain) {
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(domain)) {
        return true;
      }
    }

    if (domain.endsWith('.info') || domain.endsWith('.biz') || 
        domain.endsWith('.xyz') || domain.endsWith('.top')) {
      return true;
    }

    return false;
  }

  /**
   * Get primary source bonus score
   */
  getPrimarySourceBonus(source) {
    const domain = this.extractDomain(source.url || source);
    const content = (source.content || source.snippet || '').toLowerCase();
    const url = (source.url || '').toLowerCase();

    if (this.isPrimarySource(content, url, domain)) {
      return 90; // High bonus for primary sources
    }

    if (this.isHighAuthoritySecondary(domain, content)) {
      return 70; // Good bonus for high authority secondary
    }

    if (this.isReputableSecondary(domain, content)) {
      return 50; // Moderate bonus for reputable secondary
    }

    if (this.isGeneralSecondary(domain, content)) {
      return 30; // Low bonus for general secondary
    }

    return 10; // Minimal bonus for low authority
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