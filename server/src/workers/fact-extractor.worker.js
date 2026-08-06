const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const { EXTRACTER_SYSTEM_PROMPT } = require("./prompts");
const modelSelectionService = require("../services/model-selection.service");

class FactExtractorWorker extends BaseWorker {
  constructor(options = {}) {
    super("extract");
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
    this.maxFacts = options.maxFacts || 20;
    this.mode = options.mode || 'STANDARD';
  }

  /**
   * Detect content type for specialized extraction
   */
  detectContentType(content, url) {
    const contentLower = content.toLowerCase();
    const urlLower = url ? url.toLowerCase() : '';

    // Academic content
    if (urlLower.includes('.edu') || urlLower.includes('arxiv.org') || urlLower.includes('scholar.google.com') ||
        contentLower.includes('abstract') || contentLower.includes('methodology') || contentLower.includes('results') ||
        contentLower.includes('citation') || contentLower.includes('references')) {
      return 'academic';
    }

    // News content
    if (urlLower.includes('news') || urlLower.includes('reuters') || urlLower.includes('apnews') ||
        contentLower.includes('breaking') || contentLower.includes('reported') || contentLower.includes('according to') ||
        contentLower.includes('journalist') || contentLower.includes('editor')) {
      return 'news';
    }

    // Technical content
    if (urlLower.includes('github') || urlLower.includes('stackoverflow') || urlLower.includes('documentation') ||
        contentLower.includes('function') || contentLower.includes('class') || contentLower.includes('api') ||
        contentLower.includes('code') || contentLower.includes('programming') || contentLower.includes('developer')) {
      return 'technical';
    }

    // Financial content
    if (urlLower.includes('finance') || urlLower.includes('stock') || urlLower.includes('market') ||
        contentLower.includes('$') || contentLower.includes('revenue') || contentLower.includes('profit') ||
        contentLower.includes('investment') || contentLower.includes('financial') || contentLower.includes('earnings')) {
      return 'financial';
    }

    return 'general';
  }

  /**
   * Get specialized prompt for content type
   */
  getSpecializedPrompt(contentType) {
    const specializedPrompts = {
      'academic': `
You are an academic research extractor. Extract structured facts from academic content with special attention to:
- Research findings and methodologies
- Statistical data and sample sizes
- Author credentials and institutional affiliations
- Publication details (journal, year, volume)
- Citations and references
- Limitations and future work mentioned

Prioritize precise numerical data, statistical significance, and methodological details.
`,
      'news': `
You are a news extraction specialist. Extract structured facts from news articles with focus on:
- Key events and their timing
- Named entities (people, organizations, locations)
- Direct quotes and attributions
- Statistical claims and data points
- Source reliability indicators
- Context and background information

Be precise about who said what and when. Distinguish between facts and opinions.
`,
      'technical': `
You are a technical documentation extractor. Extract structured facts from technical content with emphasis on:
- API specifications and parameters
- Function signatures and return types
- Configuration options and defaults
- System requirements and dependencies
- Performance characteristics
- Version information and compatibility

Focus on actionable technical details rather than general descriptions.
`,
      'financial': `
You are a financial data extractor. Extract structured facts from financial content with priority on:
- Financial figures (revenue, profit, margins, growth rates)
- Stock prices and market data
- Fiscal periods and reporting dates
- Company financial metrics
- Market comparisons and benchmarks
- Risk factors and guidance

Ensure numerical precision and proper units. Distinguish between GAAP and non-GAAP measures.
`
    };

    return specializedPrompts[contentType] || '';
  }

  getEventPrefix() {
    return "extract";
  }

  async run(input, taskContext) {
    if (typeof input?.content !== "string" || !input.content.trim()) {
      throw new WorkerError("Page content is required", {
        code: "INVALID_FACT_INPUT",
        status: 400,
      });
    }

    const sourceUrl = input.sourceUrl || input.url || null;

    // Detect content type for specialized extraction
    const contentType = this.detectContentType(input.content, sourceUrl);
    console.log(`[FactExtractor] Detected content type: ${contentType}`);

    // Get specialized prompt for content type
    const specializedPrompt = this.getSpecializedPrompt(contentType);
    const enhancedSystemPrompt = EXTRACTER_SYSTEM_PROMPT + specializedPrompt;

    // Use model selection service for cost-effective model choice
    const selectedModel = input.model || this.model || 
      modelSelectionService.getWorkerModel('extract', this.mode);

    console.log(`[FactExtractor] Using model: ${selectedModel} for ${contentType} extraction`);

    const result = await this.llm.run({
      model: selectedModel,
      temperature: input.temperature ?? 0,
      maxTokens: input.maxTokens,
      responseFormat: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: enhancedSystemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            mainQuery:  input.query || "",
            subQuery: input.subQuery || "",
            purpose: input.purpose || "",
            sourceUrl,
            maxFacts: this.maxFacts,
            content: input.content,
            contentType: contentType
          }),
        },
      ],
    });

    const output = parseJsonContent(
      result.content,
      "INVALID_FACT_OUTPUT"
    );

    const facts = Array.isArray(output.facts)
      ? output.facts
          .filter(
            (fact) =>
              fact &&
              typeof fact.claim === "string" &&
              fact.claim.trim() &&
              typeof fact.evidence === "string" &&
              fact.evidence.trim()
          )
          .slice(0, this.maxFacts)
          .map((fact, index) => ({
            id: `fact_${index + 1}`,

            claim: fact.claim.trim(),
            evidence: fact.evidence.trim(),

            confidence: normalizeLevel(
              fact.confidence,
              "MEDIUM"
            ),

            relevance: normalizeLevel(
              fact.relevance,
              "MEDIUM"
            ),

            category:
              typeof fact.category === "string"
                ? fact.category.trim().toLowerCase()
                : "other",

            entities: Array.isArray(fact.entities)
              ? fact.entities
                  .filter((entity) => typeof entity === "string")
                  .map((entity) => entity.trim())
                  .filter(Boolean)
              : [],

            date: fact.date || null,

            // Always trust the worker input URL,
            // not an LLM-generated URL.
            sourceUrl,
          }))
      : [];

    return {
      usage: result.usage,
      facts,
    };
  }
}

function normalizeLevel(value, fallback = "MEDIUM") {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();

    if (["HIGH", "MEDIUM", "LOW"].includes(normalized)) {
      return normalized;
    }
  }

  const number = Number(value);

  if (Number.isFinite(number)) {
    if (number >= 0.8) return "HIGH";
    if (number >= 0.5) return "MEDIUM";
    return "LOW";
  }

  return fallback;
}

module.exports = { FactExtractorWorker };