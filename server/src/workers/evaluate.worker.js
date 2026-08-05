const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const { EVALUATE_SYSTEM_PROMPT } = require("./prompts");
const EventMapper = require("../sse/EventMapper");

class EvaluateWorker extends BaseWorker {
  constructor(options = {}) {
    super("evaluate");
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
  }

  getEventPrefix() {
    return "evaluate";
  }

  async run(input, taskContext) {
    if (typeof input?.query !== "string" || !input.query.trim()) {
      throw new WorkerError("The original query is required", {
        code: "INVALID_EVALUATE_QUERY",
        status: 400,
      });
    }

    const result = await this.llm.run({
      model: input.model || this.model,
      temperature: input.temperature ?? 0.1,
      maxTokens: input.maxTokens,
      responseFormat: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: EVALUATE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({
            query: input.query.trim(),
            facts: input.facts || []
          }),
        },
      ],
    });

    const output = parseJsonContent(
      result.content,
      "INVALID_EVALUATE_OUTPUT"
    );

    const subQueries = Array.isArray(output.subQueries)
      ? output.subQueries.filter(
          (sq) =>
            sq &&
            typeof sq.query === "string" &&
            sq.query.trim()
        ).slice(0, 5) // max 5 subqueries
      : [];

    return {
      usage: result.usage,
      subQueries,
    };
  }
}

module.exports = { EvaluateWorker };
