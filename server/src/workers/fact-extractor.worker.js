const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const { EXTRACTER_SYSTEM_PROMPT } = require("./prompts");

class FactExtractorWorker extends BaseWorker {
  constructor(options = {}) {
    super("extract");
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
    this.maxFacts = options.maxFacts || 20;
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

    const result = await this.llm.run({
      model: input.model || this.model,
      temperature: input.temperature ?? 0,
      maxTokens: input.maxTokens,
      responseFormat: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: EXTRACTER_SYSTEM_PROMPT,
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