const { WorkerError } = require("./errors");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const TaskValidator = require("../modules/tasks/taskValidator");
const { SYNTHESIS_SYSTEM_PROMPT } = require("./prompts");

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

    let systemPrompt = SYNTHESIS_SYSTEM_PROMPT;
    
    if (input.taskSpec) {
      systemPrompt = `${SYNTHESIS_SYSTEM_PROMPT}\n\nReturn JSON matching this exact JSON Schema:\n${JSON.stringify(input.taskSpec)}`;
    }

    const result = await this.llm.run({
      model: input.model || this.model,
      temperature: input.temperature ?? 0.1,
      maxTokens: input.maxTokens,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            query: input.query.trim(),
            facts: input.facts || [],
            sources: input.sources || [],
            previousValidationErrors: input.validationErrors || undefined,
          }),
        },
      ],
    });

    const output = parseJsonContent(result.content, "INVALID_SYNTHESIS_OUTPUT");

    let actualData = output;
    if (output && output.output && output.output.data) {
      actualData = output.output.data;
    } else if (output && output.data) {
      actualData = output.data;
    }

    if (input.taskSpec) {
      const validationResult = TaskValidator.validate(input.taskSpec, actualData);
      if (!validationResult.valid) {
        if (input.retryCount !== 1) {
          console.warn("Synthesis validation failed, retrying...", validationResult.errors);
          return this.run({ ...input, validationErrors: validationResult.errors, retryCount: 1 });
        } else {
          throw new WorkerError(`Synthesis output failed schema validation: ${JSON.stringify(validationResult.errors)}`, {
            code: "SYNTHESIS_SCHEMA_MISMATCH",
            status: 502,
          });
        }
      }
      return {
        ...result,
        data: actualData
      };
    }
    
    // For queries without taskSpec, we still want to return the structured object if one was generated
    if (typeof actualData === "object" && actualData !== null) {
      return {
        ...result,
        data: actualData
      };
    }

    // Fallback if LLM unexpectedly returned a plain string
    let finalAnswer = String(actualData);
    if (!finalAnswer.trim()) {
      throw new WorkerError(`OpenRouter returned no synthesis answer. Raw output: ${result.content}`, {
        code: "INVALID_SYNTHESIS_OUTPUT",
        status: 502,
      });
    }

    return {
      ...result,
      answer: finalAnswer.trim()
    };
  }
}

module.exports = { SynthesisWorker };