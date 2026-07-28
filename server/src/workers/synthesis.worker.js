const { WorkerError } = require("./errors");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");

class SynthesisWorker {
  constructor(options = {}) {
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
  }

  async run(input) {
    if (typeof input?.query !== "string" || !input.query.trim()) {
      throw new WorkerError("The original query is required", {
        code: "INVALID_SYNTHESIS_QUERY",
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
          content: "Synthesize a concise answer using only the supplied facts. Return JSON only with answer (MUST be a single string containing markdown text, NOT an object or array), citations (array of strings), uncertainty (string), and nextActions (array of strings). Cite claims with source indexes such as [1]. Never invent unsupported details.",
        },
        {
          role: "user",
          content: JSON.stringify({
            query: input.query.trim(),
            facts: input.facts || [],
            sources: input.sources || [],
          }),
        },
      ],
    });

    const output = parseJsonContent(result.content, "INVALID_SYNTHESIS_OUTPUT");
    
    // Fallback: If AI generates an object for answer, stringify it instead of failing
    let finalAnswer = output.answer;
    if (typeof finalAnswer === "object" && finalAnswer !== null) {
      finalAnswer = JSON.stringify(finalAnswer, null, 2);
    } else if (finalAnswer) {
      finalAnswer = String(finalAnswer);
    }

    if (typeof finalAnswer !== "string" || !finalAnswer.trim()) {
      throw new WorkerError(`OpenRouter returned no synthesis answer. Raw output: ${result.content}`, {
        code: "INVALID_SYNTHESIS_OUTPUT",
        status: 502,
      });
    }

    return {
      ...result,
      answer: finalAnswer.trim(),
      citations: Array.isArray(output.citations) ? output.citations : [],
      uncertainty: Array.isArray(output.uncertainty) ? output.uncertainty : [],
      nextActions: Array.isArray(output.nextActions) ? output.nextActions : [],
    };
  }
}

module.exports = { SynthesisWorker };