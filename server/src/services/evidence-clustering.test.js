/**
 * Tests for Evidence Clustering Service
 */

const evidenceClusteringService = require('./evidence-clustering.service');

describe('EvidenceClusteringService', () => {
  
  describe('clusterEvidence', () => {
    it('should cluster semantically similar claims', async () => {
      const evidence = [
        { claim: '40% of enterprise applications will use AI agents by 2026', sourceUrl: 'https://example.com/1', confidence: 'HIGH' },
        { claim: 'Gartner expects AI agents in 40% of enterprise apps by 2026', sourceUrl: 'https://example.com/2', confidence: 'HIGH' },
        { claim: 'AI agent adoption in enterprise will reach 40% by 2026', sourceUrl: 'https://example.com/3', confidence: 'MEDIUM' }
      ];

      const clusters = await evidenceClusteringService.clusterEvidence(evidence);
      
      expect(clusters).toHaveLength(1);
      expect(clusters[0].supportingEvidence).toHaveLength(3);
      expect(clusters[0].sourceCount).toBe(3);
    });

    it('should handle empty evidence array', async () => {
      const clusters = await evidenceClusteringService.clusterEvidence([]);
      expect(clusters).toHaveLength(0);
    });

    it('should keep unrelated claims separate', async () => {
      const evidence = [
        { claim: 'AI agents will be widely adopted', sourceUrl: 'https://example.com/1', confidence: 'HIGH' },
        { claim: 'The stock market reached record highs', sourceUrl: 'https://example.com/2', confidence: 'HIGH' },
        { claim: 'Climate change is accelerating', sourceUrl: 'https://example.com/3', confidence: 'HIGH' }
      ];

      const clusters = await evidenceClusteringService.clusterEvidence(evidence);
      
      expect(clusters.length).toBeGreaterThan(1);
    });
  });

  describe('extractAttributions', () => {
    it('should extract Gartner attribution', () => {
      const claim = 'According to Gartner, 40% of enterprise apps will use AI agents';
      const attributions = evidenceClusteringService.extractAttributions(claim);
      
      expect(attributions).toContain('Gartner');
    });

    it('should extract OpenAI attribution', () => {
      const claim = 'OpenAI announced GPT-5 with improved capabilities';
      const attributions = evidenceClusteringService.extractAttributions(claim);
      
      expect(attributions).toContain('OpenAI');
    });

    it('should extract McKinsey attribution', () => {
      const claim = 'McKinsey found that AI could generate $4.4T in value';
      const attributions = evidenceClusteringService.extractAttributions(claim);
      
      expect(attributions).toContain('McKinsey');
    });

    it('should handle claims without attributions', () => {
      const claim = 'AI agents are becoming more popular';
      const attributions = evidenceClusteringService.extractAttributions(claim);
      
      expect(attributions).toHaveLength(0);
    });
  });

  describe('calculateIndependentSources', () => {
    it('should count independent sources correctly', () => {
      const cluster = {
        sourceCount: 3,
        upstreamAttributions: ['Gartner', 'Forrester', 'IDC'],
        supportingEvidence: [
          { sourceUrl: 'https://example.com/1', claim: 'According to Gartner...' },
          { sourceUrl: 'https://example.com/2', claim: 'Forrester reports...' },
          { sourceUrl: 'https://example.com/3', claim: 'IDC states...' }
        ]
      };

      const independentCount = evidenceClusteringService.calculateIndependentSources(cluster);
      
      expect(independentCount).toBe(3);
    });

    it('should detect syndicated content', () => {
      const cluster = {
        sourceCount: 5,
        upstreamAttributions: ['Gartner', 'Gartner', 'Gartner', 'Gartner', 'Gartner'],
        supportingEvidence: [
          { sourceUrl: 'https://blog1.com', claim: 'According to Gartner...' },
          { sourceUrl: 'https://blog2.com', claim: 'Gartner predicts...' },
          { sourceUrl: 'https://blog3.com', claim: 'Gartner reports...' },
          { sourceUrl: 'https://blog4.com', claim: 'According to Gartner...' },
          { sourceUrl: 'https://blog5.com', claim: 'Gartner states...' }
        ]
      };

      const independentCount = evidenceClusteringService.calculateIndependentSources(cluster);
      
      // Should count as 1 independent source (all citing Gartner)
      expect(independentCount).toBe(1);
    });
  });

  describe('detectContradiction', () => {
    it('should detect numerical contradictions', () => {
      const clusterA = {
        canonicalClaim: 'Gartner predicts 40% adoption by 2026',
        supportingEvidence: []
      };

      const clusterB = {
        canonicalClaim: 'Forrester estimates 25% adoption by 2026',
        supportingEvidence: []
      };

      const contradiction = evidenceClusteringService.detectContradiction(clusterA, clusterB);
      
      expect(contradiction).not.toBeNull();
      expect(contradiction.type).toBe('numerical');
      expect(contradiction.severity).toBe('high');
    });

    it('should detect direct contradictions', () => {
      const clusterA = {
        canonicalClaim: 'AI agents failed to meet expectations',
        supportingEvidence: []
      };

      const clusterB = {
        canonicalClaim: 'AI agents succeeded in deployment',
        supportingEvidence: []
      };

      const contradiction = evidenceClusteringService.detectContradiction(clusterA, clusterB);
      
      expect(contradiction).not.toBeNull();
      expect(contradiction.type).toBe('contradiction');
    });

    it('should not contradict unrelated claims', () => {
      const clusterA = {
        canonicalClaim: 'AI adoption is increasing',
        supportingEvidence: []
      };

      const clusterB = {
        canonicalClaim: 'Cloud computing is growing',
        supportingEvidence: []
      };

      const contradiction = evidenceClusteringService.detectContradiction(clusterA, clusterB);
      
      expect(contradiction).toBeNull();
    });
  });

  describe('selectBestEvidence', () => {
    it('should select evidence with highest confidence', () => {
      const evidenceList = [
        { claim: 'Test claim', confidence: 'LOW', claim: 'Short claim' },
        { claim: 'Test claim with more detail', confidence: 'HIGH', claim: 'Much longer and more detailed claim with specific information' },
        { claim: 'Test claim', confidence: 'MEDIUM', claim: 'Medium length claim' }
      ];

      const best = evidenceClusteringService.selectBestEvidence(evidenceList);
      
      expect(best.confidence).toBe('HIGH');
    });

    it('should prefer evidence with numerical data', () => {
      const evidenceList = [
        { claim: 'AI adoption is growing', confidence: 'HIGH', claim: 'AI adoption is growing' },
        { claim: 'AI adoption reached 47% in 2024', confidence: 'HIGH', claim: 'AI adoption reached 47% in 2024' }
      ];

      const best = evidenceClusteringService.selectBestEvidence(evidenceList);
      
      expect(best.claim).toContain('47%');
    });
  });

  describe('confidence parsing', () => {
    it('should parse HIGH confidence', () => {
      const parsed = evidenceClusteringService.parseConfidence('HIGH');
      expect(parsed).toBe(0.85);
    });

    it('should parse MEDIUM confidence', () => {
      const parsed = evidenceClusteringService.parseConfidence('MEDIUM');
      expect(parsed).toBe(0.60);
    });

    it('should parse LOW confidence', () => {
      const parsed = evidenceClusteringService.parseConfidence('LOW');
      expect(parsed).toBe(0.35);
    });

    it('should handle numeric confidence', () => {
      const parsed = evidenceClusteringService.parseConfidence(0.75);
      expect(parsed).toBe(0.75);
    });

    it('should default to MEDIUM for invalid input', () => {
      const parsed = evidenceClusteringService.parseConfidence('INVALID');
      expect(parsed).toBe(0.60);
    });
  });

  describe('clusterToEvidence', () => {
    it('should convert cluster to evidence format', () => {
      const cluster = {
        id: 'cluster_0',
        canonicalClaim: 'Test claim',
        bestEvidence: { evidence: 'Supporting evidence', sourceUrl: 'https://example.com' },
        sourceUrls: ['https://example.com', 'https://example2.com'],
        sourceCount: 2,
        independentSourceCount: 2,
        confidence: 0.85,
        contradictions: [],
        upstreamAttributions: ['Gartner']
      };

      const evidence = evidenceClusteringService.clusterToEvidence(cluster);
      
      expect(evidence.claim).toBe('Test claim');
      expect(evidence.confidence).toBe('HIGH');
      expect(evidence.sourceUrls).toHaveLength(2);
      expect(evidence.independentSourceCount).toBe(2);
      expect(evidence.clusterId).toBe('cluster_0');
    });
  });
});