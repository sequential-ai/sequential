const { WorkerError } = require("./errors");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");

class FactExtractorWorker {
  constructor(options = {}) {
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
    this.maxFacts = options.maxFacts || 20;
  }

  async run(input) {
    if (typeof input?.content !== "string" || !input.content.trim()) {
      throw new WorkerError("Page content is required", {
        code: "INVALID_FACT_INPUT",
        status: 400,
      });
    }

    const result = await this.llm.run({
      model: input.model || this.model,
      temperature: input.temperature ?? 0,
      maxTokens: input.maxTokens,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Extract only facts supported by the supplied page. Return JSON only with a facts array. Every fact must include claim, evidence, confidence, and sourceUrl. Do not use outside knowledge.",
        },
        {
          role: "user",
          content: JSON.stringify({
            query: input.query || "",
            sourceUrl: input.sourceUrl || input.url || null,
            content: input.content,
            maxFacts: this.maxFacts,
          }),
        },
      ],
    });

    const output = parseJsonContent(result.content, "INVALID_FACT_OUTPUT");
    const facts = Array.isArray(output.facts)
      ? output.facts
          .filter((fact) => fact && typeof fact.claim === "string" && fact.claim.trim() && typeof fact.evidence === "string" && fact.evidence.trim())
          .slice(0, this.maxFacts)
          .map((fact) => ({
            claim: fact.claim.trim(),
            evidence: fact.evidence.trim(),
            confidence: normalizeConfidence(fact.confidence),
            sourceUrl: fact.sourceUrl || input.sourceUrl || input.url || null,
            date: fact.date || null,
          }))
      : [];

    return { ...result, facts };
  }
}

function normalizeConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(1, number));
}

module.exports = { FactExtractorWorker };