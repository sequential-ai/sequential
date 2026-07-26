const { WorkerError } = require("./errors");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");

class SubQueryWorker {
  constructor(options = {}) {
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
    this.maxSubQueries = options.maxSubQueries || 8;
  }

  async run(input) {
    const query = input?.query;
    if (typeof query !== "string" || !query.trim()) {
      throw new WorkerError("A research query is required", {
        code: "INVALID_RESEARCH_QUERY",
        status: 400,
      });
    }

    const result = await this.llm.run({
      model: input.model || this.model,
      temperature: input.temperature ?? 0.2,
      maxTokens: input.maxTokens,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Decompose research questions into independent web-search sub-queries. Return JSON only with a subQueries array. Each item must have query and purpose strings.",
        },
        {
          role: "user",
          content: JSON.stringify({ query: query.trim(), maxSubQueries: this.maxSubQueries }),
        },
      ],
    });

    const output = parseJsonContent(result.content, "INVALID_SUBQUERY_OUTPUT");
    const subQueries = Array.isArray(output.subQueries)
      ? output.subQueries
          .filter((item) => typeof item?.query === "string" && item.query.trim())
          .slice(0, this.maxSubQueries)
          .map((item, index) => ({
            id: item.id || `subquery_${index + 1}`,
            query: item.query.trim(),
            purpose: typeof item.purpose === "string" ? item.purpose.trim() : "Research this aspect",
          }))
      : [];

    if (subQueries.length === 0) {
      throw new WorkerError("OpenRouter returned no valid sub-queries", {
        code: "INVALID_SUBQUERY_OUTPUT",
        status: 502,
      });
    }

    return { ...result, subQueries };
  }
}

module.exports = { SubQueryWorker };