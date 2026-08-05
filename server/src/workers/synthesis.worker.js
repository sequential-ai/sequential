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
      systemPrompt = `You are the final synthesis worker for Sequential AI.\n\nYour responsibility is to produce the final research result as a highly presentable, pure MARKDOWN string.\n\nIMPORTANT INSTRUCTIONS:\n1. Always start your response with a large level-1 heading (# Title) that perfectly summarizes the research topic.\n2. Do NOT generate JSON. Do NOT wrap your answer in a JSON object (e.g. no "summary" or "data" fields).\n3. Use Markdown tables if the answer requires tabular data.\n4. Keep the presentation simple, clean, and professional, similar to a README.md file.\n5. Use proper heading hierarchy (##, ###), lists, and bold text as appropriate.\n6. Ensure you cite your sources properly in the text.`;
      if (input.taskSpec) {
        systemPrompt += `\n\nUse the following JSON schema strictly as a conceptual guide for what information to include in your Markdown output, but remember: DO NOT output JSON:\n${JSON.stringify(input.taskSpec)}`;
      }
      llmResponseFormat = undefined;
    } else if (input.taskSpec) {
      systemPrompt = `${SYNTHESIS_SYSTEM_PROMPT}\n\nReturn JSON matching this exact JSON Schema:\n${JSON.stringify(input.taskSpec)}`;
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
        answer: result.content.trim()
      };
    }

    const output = parseJsonContent(result.content, "INVALID_SYNTHESIS_OUTPUT");

    let actualData = output;
    if (output && output.output && output.output.data) {
      actualData = output.output.data;
    } else if (output && output.data) {
      actualData = output.data;
    }

    if (input.taskSpec) {
      const validationResult = TaskValidator.validate(input.taskSpec, actualData);
      let errors = validationResult.valid ? [] : validationResult.errors;
      
      const validUrls = (input.sources || []).map(s => s.split("] ")[1]);
      const usedUrls = extractUrls(actualData);
      const invalidUrls = [...usedUrls].filter(url => !validUrls.includes(url));
      
      if (invalidUrls.length > 0) {
        errors.push({
          message: `Invalid citations used: ${invalidUrls.join(", ")}. You must ONLY use the provided source URLs.`
        });
      }

      if (errors.length > 0) {
        if (!input.retryCount || input.retryCount < 2) {
          console.warn("Synthesis validation failed, retrying...", errors);
          return this.run({ 
            ...input, 
            validationErrors: errors, 
            retryCount: (input.retryCount || 0) + 1 
          }, taskContext);
        } else {
          if (invalidUrls.length > 0) {
            console.warn("Citation repair failed. Failing safely by stripping invalid citations.");
            stripInvalidCitations(actualData, validUrls);
          }
          const finalValidation = TaskValidator.validate(input.taskSpec, actualData);
          if (!finalValidation.valid) {
            throw new WorkerError(`Synthesis output failed schema validation: ${JSON.stringify(finalValidation.errors)}`, {
              code: "SYNTHESIS_SCHEMA_MISMATCH",
              status: 502,
            });
          }
        }
      }
      return {
        ...result,
        data: actualData
      };
    }
    
    // For queries without taskSpec, we still want to return the structured object if one was generated
    if (typeof actualData === "object" && actualData !== null) {
      const validUrls = (input.sources || []).map(s => s.split("] ")[1]);
      const usedUrls = extractUrls(actualData);
      const invalidUrls = [...usedUrls].filter(url => !validUrls.includes(url));
      
      if (invalidUrls.length > 0) {
        if (!input.retryCount || input.retryCount < 2) {
           return this.run({ 
            ...input, 
            validationErrors: [{ message: `Invalid citations used: ${invalidUrls.join(", ")}. You must ONLY use the provided source URLs.` }], 
            retryCount: (input.retryCount || 0) + 1 
          }, taskContext);
        } else {
           stripInvalidCitations(actualData, validUrls);
        }
      }
      return {
        ...result,
        data: actualData
      };
    }

    return {
      ...result,
      answer: String(actualData).trim()
    };
  }
}

function extractUrls(obj, urls = new Set()) {
  if (typeof obj === "string" && obj.startsWith("http")) urls.add(obj);
  else if (Array.isArray(obj)) obj.forEach(item => extractUrls(item, urls));
  else if (typeof obj === "object" && obj !== null) Object.values(obj).forEach(val => extractUrls(val, urls));
  return urls;
}

function stripInvalidCitations(obj, validUrls) {
  if (Array.isArray(obj)) {
    for (let i = obj.length - 1; i >= 0; i--) {
      if (typeof obj[i] === "string" && obj[i].startsWith("http")) {
        if (!validUrls.includes(obj[i])) obj.splice(i, 1);
      } else {
        stripInvalidCitations(obj[i], validUrls);
      }
    }
  } else if (typeof obj === "object" && obj !== null) {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string" && obj[key].startsWith("http")) {
        if (!validUrls.includes(obj[key])) obj[key] = null; // or delete obj[key]
      } else {
        stripInvalidCitations(obj[key], validUrls);
      }
    }
  }
}

module.exports = { SynthesisWorker };