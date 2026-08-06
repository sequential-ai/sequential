const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const { PLANNER_SYSTEM_PROMPT } = require("./prompts");
const modelSelectionService = require("../services/model-selection.service");

class SubQueryWorker extends BaseWorker {
  constructor(options = {}) {
    super("planner");
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
    this.maxSubQueries = options.maxSubQueries || 8;
    this.mode = options.mode || 'STANDARD';
  }

  getEventPrefix() {
    return "planner";
  }

  async run(input, taskContext) {
    const query = input?.query;
    if (typeof query !== "string" || !query.trim()) {
      throw new WorkerError("A research query is required", {
        code: "INVALID_RESEARCH_QUERY",
        status: 400,
      });
    }

    const targetMax = input.maxSubQueries || this.maxSubQueries;

    // Use model selection service for cost-effective model choice
    const selectedModel = input.model || this.model || 
      modelSelectionService.getWorkerModel('planner', this.mode);

    console.log(`[SubQueryWorker] Using model: ${selectedModel} for planning`);

    const result = await this.llm.run({
      model: selectedModel,
      temperature: input.temperature ?? 0.2,
      maxTokens: input.maxTokens,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: PLANNER_SYSTEM_PROMPT(targetMax, this.mode)
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              query: query.trim(),
              maxSubQueries: targetMax,
              mode: this.mode
            }),
        },
      ],
    });

    const output = parseJsonContent(result.content, "INVALID_SUBQUERY_OUTPUT");
    const subQueries = Array.isArray(output.subQueries)
      ? output.subQueries
          .filter((item) => typeof item?.query === "string" && item.query.trim())
          .slice(0, targetMax)
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

    return {
      usage: result.usage,
      subQueries,
      estimatedSources: subQueries.length * 3
    };
  }
}

module.exports = { SubQueryWorker };