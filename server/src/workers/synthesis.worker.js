const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const TaskValidator = require("../modules/tasks/taskValidator");
const { SYNTHESIS_SYSTEM_PROMPT } = require("./prompts");
const EventMapper = require("../sse/EventMapper");

class SynthesisWorker extends BaseWorker {
  constructor(options = {}) {
    super("synthesis");
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
  }

  getEventPrefix() {
    return "synthesis";
  }

  async run(input, taskContext) {
    if (typeof input?.query !== "string" || !input.query.trim()) {
      throw new WorkerError("The original query is required", {
        code: "INVALID_SYNTHESIS_QUERY",
        status: 400,
      });
    }

    let systemPrompt = SYNTHESIS_SYSTEM_PROMPT;
    let llmResponseFormat = { type: "json_object" };
    
    if (input.responseFormat === "markdown") {
      systemPrompt = `You are the final synthesis worker for Sequential AI.\n\nYour responsibility is to produce the final research result as a highly presentable, pure MARKDOWN string.\n\nIMPORTANT INSTRUCTIONS:\n1. Always start your response with a large level-1 heading (# Title) that perfectly summarizes the research topic.\n2. Do NOT generate JSON. Do NOT wrap your answer in a JSON object.\n3. Use Markdown tables if the answer requires tabular data.\n4. Keep the presentation simple, clean, and professional, similar to a README.md file.\n5. Use proper heading hierarchy (##, ###), lists, and bold text as appropriate.\n6. Ensure you cite your sources properly in the text.`;
      if (input.taskSpec) {
        systemPrompt += `\n\nUse the following JSON schema strictly as a conceptual guide for what information to include in your Markdown output, but remember: DO NOT output JSON:\n${JSON.stringify(input.taskSpec)}`;
      }
      llmResponseFormat = undefined;
    } else if (input.taskSpec) {
      systemPrompt = `${SYNTHESIS_SYSTEM_PROMPT}\n\nReturn JSON matching this exact JSON Schema:\n${JSON.stringify(input.taskSpec)}`;
    } else {
      systemPrompt = `${SYNTHESIS_SYSTEM_PROMPT}\n\nReturn a structured JSON object representing the research result.`;
    }

    const result = await this.llm.run({
      model: input.model || this.model,
      temperature: input.temperature ?? 0.1,
      maxTokens: input.maxTokens,
      responseFormat: llmResponseFormat,
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
      stream: true,
      onChunk: (delta) => {
        if (input.taskSpec) {
          // You could optionally emit json.delta if needed
          EventMapper.mapSynthesisDelta(taskContext.taskId, 'synthesis', delta);
        } else {
          EventMapper.mapSynthesisDelta(taskContext.taskId, 'synthesis', delta);
        }
      }
    });

    if (input.responseFormat === "markdown") {
      return {
        ...result,
        format: "markdown",
        content: result.content.trim()
      };
    }

    let parsedOutput;
    try {
      parsedOutput = parseJsonContent(result.content, "INVALID_SYNTHESIS_OUTPUT");
    } catch (err) {
      if (input.retryCount !== 1) {
        console.warn("Synthesis JSON parse failed, retrying...", err.message);
        return this.run({ ...input, validationErrors: [{ message: "Failed to parse JSON", details: err.message }], retryCount: 1 });
      }
      throw new WorkerError(`Synthesis output failed JSON parsing: ${err.message}`, {
        code: "INVALID_SYNTHESIS_OUTPUT",
        retryable: false
      });
    }

    if (input.taskSpec) {
      const validationResult = TaskValidator.validate(input.taskSpec, parsedOutput);
      if (!validationResult.valid) {
        if (input.retryCount !== 1) {
          console.warn("Synthesis validation failed, retrying...", validationResult.errors);
          return this.run({ ...input, validationErrors: validationResult.errors, retryCount: 1 });
        } else {
          throw new WorkerError(`Synthesis output failed schema validation: ${JSON.stringify(validationResult.errors)}`, {
            code: "SYNTHESIS_SCHEMA_MISMATCH",
            retryable: false
          });
        }
      }
    }
    
    // For queries without taskSpec, we still want to return the structured object if one was generated
    if (typeof parsedOutput !== "object" || parsedOutput === null) {
      if (input.retryCount !== 1) {
        return this.run({ ...input, validationErrors: [{ message: "Output must be a JSON object or array" }], retryCount: 1 });
      }
      throw new WorkerError(`Synthesis output must be a JSON object or array`, {
        code: "INVALID_SYNTHESIS_OUTPUT",
        retryable: false
      });
    }

    return {
      ...result,
      format: "json",
      content: parsedOutput
    };
  }
}

module.exports = { SynthesisWorker };