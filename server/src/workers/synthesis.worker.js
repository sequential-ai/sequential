const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { OpenRouterWorker, parseJsonContent } = require("./openrouter.worker");
const TaskValidator = require("../modules/tasks/taskValidator");
const { SYNTHESIS_SYSTEM_PROMPT } = require("./prompts");
const EventMapper = require("../sse/EventMapper");
const modelSelectionService = require("../services/model-selection.service");

class SynthesisWorker extends BaseWorker {
  constructor(options = {}) {
    super("synthesis");
    this.llm = options.llm || new OpenRouterWorker(options);
    this.model = options.model;
    this.mode = options.mode || 'STANDARD';
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

    // Use model selection service for cost-effective model choice
    const selectedModel = input.model || this.model || 
      modelSelectionService.getWorkerModel('synthesis', this.mode);

    console.log(`[SynthesisWorker] Using model: ${selectedModel} for synthesis`);
    console.log(`[SynthesisWorker] Processing ${input.facts?.length || 0} facts`);

    // Temporarily disable progressive refinement to isolate the issue
    // const refinedFacts = this.refineFacts(input.facts || [], input.sources || []);
    const refinedFacts = input.facts || [];
    console.log(`[SynthesisWorker] Using ${refinedFacts.length} facts (progressive refinement disabled)`);

    // Convert fact objects to strings for LLM consumption
    const factStrings = refinedFacts.map(f => {
      if (typeof f === 'string') return f;
      return `[${f.type?.toUpperCase() || 'FACT'}] Claim: ${f.claim}\nEvidence: ${f.evidence || f.evidenceText}\nSources: ${Array.isArray(f.sources) ? f.sources.join(", ") : f.sources}`;
    });

    console.log(`[SynthesisWorker] Calling LLM with ${factStrings.length} fact strings`);

    const result = await this.llm.run({
      model: selectedModel,
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
            facts: factStrings,
            sources: input.sources || [],
            previousValidationErrors: input.validationErrors || undefined
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

    console.log(`[SynthesisWorker] LLM call completed`);
    console.log(`[SynthesisWorker] Response format: ${input.responseFormat}`);
    console.log(`[SynthesisWorker] Result keys: ${Object.keys(result)}`);
    console.log(`[SynthesisWorker] Has content: ${!!result.content}`);

    if (input.responseFormat === "markdown") {
      console.log(`[SynthesisWorker] Returning markdown response`);
      const answer = result.content.trim();
      console.log(`[SynthesisWorker] Answer length: ${answer.length}`);
      return {
        ...result,
        answer
      };
    }

    console.log(`[SynthesisWorker] Parsing JSON content`);
    const output = parseJsonContent(result.content, "INVALID_SYNTHESIS_OUTPUT");
    console.log(`[SynthesisWorker] JSON parsed successfully`);

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

  /**
   * Progressive refinement: prioritize high-quality, relevant facts
   */
  refineFacts(facts, sources) {
    if (!Array.isArray(facts) || facts.length === 0) return [];

    // Score facts based on multiple factors
    const scoredFacts = facts.map(fact => {
      let score = 0;

      // Confidence scoring
      const confWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const factConf = typeof fact === 'string' ? 'MEDIUM' : (fact.confidence || 'MEDIUM');
      score += confWeight[factConf] || 2;

      // Length scoring (longer facts often more detailed)
      const factText = typeof fact === 'string' ? fact : (fact.claim || fact.evidence || '');
      if (factText.length > 100) score += 2;
      else if (factText.length > 50) score += 1;

      // Source diversity scoring
      const factSources = typeof fact === 'string' ? [] : (fact.sources || []);
      if (factSources.length > 1) score += 2;
      else if (factSources.length === 1) score += 1;

      // Numerical data scoring
      if (/\d+/.test(factText)) score += 1;

      // Resolution status (if contradictions were resolved)
      if (typeof fact === 'object' && fact.resolution && fact.resolution !== 'mark_uncertain') {
        score += 2;
      }

      return {
        fact,
        score
      };
    });

    // Sort by score (highest first)
    scoredFacts.sort((a, b) => b.score - a.score);

    // Return top 80% of facts, ensuring minimum of 10
    const topCount = Math.max(10, Math.floor(scoredFacts.length * 0.8));
    return scoredFacts.slice(0, topCount).map(item => item.fact);
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