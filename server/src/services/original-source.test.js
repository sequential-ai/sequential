/**
 * Tests for Original-Source Resolution Service
 */

const originalSourceService = require('./original-source.service');

describe('OriginalSourceService', () => {
  
  describe('extractAttribution', () => {
    it('should extract Gartner attribution', () => {
      const claim = 'According to Gartner, 40% of enterprise apps will use AI agents';
      const attribution = originalSourceService.extractAttribution(claim);
      
      expect(attribution).toBe('Gartner');
    });

    it('should extract OpenAI attribution', () => {
      const claim = 'OpenAI announced GPT-5 with improved capabilities';
      const attribution = originalSourceService.extractAttribution(claim);
      
      expect(attribution).toBe('OpenAI');
    });

    it('should extract McKinsey attribution', () => {
      const claim = 'McKinsey found that AI could generate $4.4T in value';
      const attribution = originalSourceService.extractAttribution(claim);
      
      expect(attribution).toBe('McKinsey');
    });

    it('should return null for claims without attribution', () => {
      const claim = 'AI agents are becoming more popular';
      const attribution = originalSourceService.extractAttribution(claim);
      
      expect(attribution).toBeNull();
    });
  });

  describe('isHighPriorityClaim', () => {
    it('should identify high priority claims with important entities', () => {
      const claim = { 
        claim: 'According to Gartner, AI adoption will reach 40% by 2026' 
      };
      
      const isHighPriority = originalSourceService.isHighPriorityClaim(claim);
      expect(isHighPriority).toBe(true);
    });

    it('should not prioritize claims without important data', () => {
      const claim = { 
        claim: 'According to Gartner, AI is interesting technology' 
      };
      
      const isHighPriority = originalSourceService.isHighPriorityClaim(claim);
      expect(isHighPriority).toBe(false);
    });

    it('should not prioritize claims without attribution', () => {
      const claim = { 
        claim: 'AI adoption will reach 40% by 2026' 
      };
      
      const isHighPriority = originalSourceService.isHighPriorityClaim(claim);
      expect(isHighPriority).toBe(false);
    });
  });

  describe('containsImportantData', () => {
    it('should detect statistics', () => {
      const claim = '40% of companies use AI';
      expect(originalSourceService.containsImportantData(claim)).toBe(true);
    });

    it('should detect financial data', () => {
      const claim = 'AI market valued at $4.4 trillion';
      expect(originalSourceService.containsImportantData(claim)).toBe(true);
    });

    it('should detect predictions', () => {
      const claim = 'AI adoption will reach 80% by 2030';
      expect(originalSourceService.containsImportantData(claim)).toBe(true);
    });

    it('should not detect important data in general claims', () => {
      const claim = 'AI is becoming popular in enterprises';
      expect(originalSourceService.containsImportantData(claim)).toBe(false);
    });
  });

  describe('generateOriginalSourceQueries', () => {
    it('should generate site-specific search query', () => {
      const queries = originalSourceService.generateOriginalSourceQueries(
        'Gartner', 
        'Gartner predicts 40% AI adoption by 2026'
      );
      
      expect(queries[0]).toContain('site:gartner.com');
      expect(queries[0]).toContain('AI');
    });

    it('should generate official report query', () => {
      const queries = originalSourceService.generateOriginalSourceQueries(
        'McKinsey', 
        'McKinsey reports AI value'
      );
      
      expect(queries[1]).toContain('official report');
    });

    it('should generate PDF query', () => {
      const queries = originalSourceService.generateOriginalSourceQueries(
        'OpenAI', 
        'OpenAI research paper'
      );
      
      expect(queries[3]).toContain('filetype:pdf');
    });
  });

  describe('scoreOriginalSourceResult', () => {
    it('should score official domain highly', () => {
      const result = {
        domain: 'gartner.com',
        title: 'Gartner AI Adoption Report 2024',
        url: 'https://www.gartner.com/en/documents/ai-adoption'
      };
      
      const score = originalSourceService.scoreOriginalSourceResult(result, 'Gartner');
      expect(score).toBeGreaterThan(0.5);
    });

    it('should score secondary sources lower', () => {
      const result = {
        domain: 'techcrunch.com',
        title: 'According to Gartner, AI adoption is growing',
        url: 'https://techcrunch.com/2024/ai-adoption-gartner'
      };
      
      const score = originalSourceService.scoreOriginalSourceResult(result, 'Gartner');
      expect(score).toBeLessThan(0.5);
    });

    it('should score PDF documents higher', () => {
      const result = {
        domain: 'mckinsey.com',
        title: 'AI Value Creation Report',
        url: 'https://mckinsey.com/ai-value-report.pdf'
      };
      
      const score = originalSourceService.scoreOriginalSourceResult(result, 'McKinsey');
      expect(score).toBeGreaterThan(0.5);
    });
  });

  describe('extractKeywords', () => {
    it('should extract numbers and percentages', () => {
      const keywords = originalSourceService.extractKeywords('40% adoption by 2026');
      expect(keywords).toContain('40%');
    });

    it('should extract proper nouns', () => {
      const keywords = originalSourceService.extractKeywords('Enterprise AI adoption in Fortune 500');
      expect(keywords).toContain('Fortune');
    });

    it('should extract meaningful terms', () => {
      const keywords = originalSourceService.extractKeywords('Artificial intelligence in healthcare');
      expect(keywords).toContain('Artificial');
      expect(keywords).toContain('intelligence');
    });
  });

  describe('confidence parsing', () => {
    it('should parse HIGH confidence', () => {
      const parsed = originalSourceService.parseConfidence('HIGH');
      expect(parsed).toBe(0.85);
    });

    it('should parse MEDIUM confidence', () => {
      const parsed = originalSourceService.parseConfidence('MEDIUM');
      expect(parsed).toBe(0.60);
    });

    it('should parse numeric confidence', () => {
      const parsed = originalSourceService.parseConfidence(0.75);
      expect(parsed).toBe(0.75);
    });
  });

  describe('boostConfidence', () => {
    it('should boost MEDIUM to HIGH', () => {
      const boosted = originalSourceService.boostConfidence('MEDIUM');
      expect(boosted).toBe('HIGH');
    });

    it('should not exceed HIGH', () => {
      const boosted = originalSourceService.boostConfidence('HIGH');
      expect(boosted).toBe('HIGH');
    });

    it('should boost LOW to MEDIUM', () => {
      const boosted = originalSourceService.boostConfidence('LOW');
      expect(boosted).toBe('MEDIUM');
    });
  });
});