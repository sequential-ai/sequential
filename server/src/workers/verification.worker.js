const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const modelSelectionService = require("../services/model-selection.service");

const VERIFICATION_SYSTEM_PROMPT = `
You are a cross-source verification specialist. Your task is to verify facts by comparing claims across multiple sources and assess their reliability.

Rules:
- Compare the claim against evidence from multiple sources
- Assess the consistency of information across sources
- Identify discrepancies or contradictions
- Evaluate the reliability of each source (authority, recency, specificity)
- Determine if the claim is supported, contradicted, or uncertain
- Provide a confidence level based on cross-source agreement
- Note any nuances or conditions that affect the claim's validity

For each claim, provide:
- verificationStatus: "SUPPORTED" | "CONTRADICTED" | "UNCERTAIN" | "INSUFFICIENT_EVIDENCE"
- confidence: "HIGH" | "MEDIUM" | "LOW"
- sourceAgreement: number of sources that support the claim
- sourceDisagreement: number of sources that contradict the claim
- details: specific reasoning about the verification
- correctedClaim: if appropriate, a more accurate version of the claim

Prioritize claims that have multiple supporting sources over those with single sources.
Be conservative - if evidence is mixed or unclear, mark as UNCERTAIN rather than forcing a conclusion.

Return JSON only:
{
  "verifications": [
    {
      "originalClaim": "...",
      "verificationStatus": "SUPPORTED",
      "confidence": "HIGH",
      "sourceAgreement": 3,
      "sourceDisagreement": 0,
      "details": "...",
      "correctedClaim": null
    }
  ]
}
`;

class VerificationWorker extends BaseWorker {
  constructor(options = {}) {
    super("verification");
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
    this.mode = options.mode || 'STANDARD';
  }

  async run(input, taskContext) {
    if (!input.claims || !Array.isArray(input.claims) || input.claims.length === 0) {
      throw new WorkerError("Claims array is required for verification", {
        code: "INVALID_VERIFICATION_INPUT",
        status: 400,
      });
    }

    if (!input.sources || !Array.isArray(input.sources) || input.sources.length === 0) {
      throw new WorkerError("Sources array is required for verification", {
        code: "INVALID_VERIFICATION_SOURCES",
        status: 400,
      });
    }

    // Use model selection service for cost-effective model choice
    const selectedModel = input.model || this.model || 
      modelSelectionService.getWorkerModel('verification', this.mode);

    console.log(`[VerificationWorker] Using model: ${selectedModel} for cross-source verification`);

    // Prepare claims with their source information
    const claimsWithSources = input.claims.map(claim => {
      const claimSources = input.sources.filter(source => 
        source.claimId === claim.id || 
        source.claim === claim.claim ||
        (claim.sources && claim.sources.includes(source.url))
      );

      return {
        ...claim,
        sourceCount: claimSources.length,
        sources: claimSources.map(s => ({
          url: s.url || s.sourceUrl,
          confidence: s.confidence || 'MEDIUM',
          evidence: s.evidence || s.evidenceText
        }))
      };
    });

    // Prioritize claims for verification (most important first)
    const prioritizedClaims = this.prioritizeClaims(claimsWithSources);

    // Verify in batches to manage context window
    const batchSize = 5;
    const allVerifications = [];

    for (let i = 0; i < prioritizedClaims.length; i += batchSize) {
      const batch = prioritizedClaims.slice(i, i + batchSize);
      const batchResult = await this.verifyBatch(batch, input.query, selectedModel);
      allVerifications.push(...batchResult);
    }

    return {
      verifications: allVerifications,
      usage: { total: 0, cached: false } // Usage would be tracked in actual implementation
    };
  }

  /**
   * Prioritize claims for verification
   */
  prioritizeClaims(claims) {
    return claims.sort((a, b) => {
      // Prioritize claims with more sources (likely more important)
      if (b.sourceCount !== a.sourceCount) {
        return b.sourceCount - a.sourceCount;
      }

      // Prioritize higher confidence claims
      const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const confA = confWeight[a.confidence] || 2;
      const confB = confWeight[b.confidence] || 2;
      
      if (confB !== confA) {
        return confB - confA;
      }

      // Prioritize claims with numerical data
      const hasNumbersA = /\d/.test(a.claim);
      const hasNumbersB = /\d/.test(b.claim);
      
      if (hasNumbersA && !hasNumbersB) return -1;
      if (!hasNumbersA && hasNumbersB) return 1;

      return 0;
    });
  }

  /**
   * Verify a batch of claims
   */
  async verifyBatch(claims, query, model) {
    const result = await this.llm.run({
      model: model,
      temperature: 0.1,
      maxTokens: 4000,
      responseFormat: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: VERIFICATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({
            query: query || "",
            claims: claims.map(c => ({
              claim: c.claim,
              sources: c.sources,
              sourceCount: c.sourceCount
            }))
          }),
        },
      ],
    });

    const output = parseJsonContent(result.content, "INVALID_VERIFICATION_OUTPUT");

    if (!output.verifications || !Array.isArray(output.verifications)) {
      throw new WorkerError("Invalid verification output format", {
        code: "INVALID_VERIFICATION_OUTPUT",
        status: 502,
      });
    }

    // Map verifications back to original claims
    return output.verifications.map((verification, index) => ({
      ...verification,
      originalClaimId: claims[index].id,
      originalClaim: claims[index].claim
    }));
  }

  /**
   * Aggregate verification results
   */
  static aggregateVerifications(verifications) {
    const stats = {
      total: verifications.length,
      supported: 0,
      contradicted: 0,
      uncertain: 0,
      insufficient: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0
    };

    for (const verification of verifications) {
      const status = verification.verificationStatus?.toUpperCase();
      const confidence = verification.confidence?.toUpperCase();

      if (status === 'SUPPORTED') stats.supported++;
      else if (status === 'CONTRADICTED') stats.contradicted++;
      else if (status === 'UNCERTAIN') stats.uncertain++;
      else if (status === 'INSUFFICIENT_EVIDENCE') stats.insufficient++;

      if (confidence === 'HIGH') stats.highConfidence++;
      else if (confidence === 'MEDIUM') stats.mediumConfidence++;
      else if (confidence === 'LOW') stats.lowConfidence++;
    }

    return stats;
  }

  /**
   * Filter claims based on verification results
   */
  static filterByVerification(claims, verifications, minConfidence = 'MEDIUM') {
    const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const minConfWeight = confWeight[minConfidence] || 2;

    const verificationMap = new Map(
      verifications.map(v => [v.originalClaimId, v])
    );

    return claims.filter(claim => {
      const verification = verificationMap.get(claim.id);
      if (!verification) return true; // Keep if not verified

      const confWeight = confWeight[verification.confidence] || 0;
      
      // Filter out contradicted claims unless high confidence
      if (verification.verificationStatus === 'CONTRADICTED' && confWeight < 3) {
        return false;
      }

      // Filter out uncertain/insufficient unless medium+ confidence
      if ((verification.verificationStatus === 'UNCERTAIN' || 
           verification.verificationStatus === 'INSUFFICIENT_EVIDENCE') && 
          confWeight < minConfWeight) {
        return false;
      }

      return confWeight >= minConfWeight;
    });
  }
}

module.exports = { VerificationWorker };