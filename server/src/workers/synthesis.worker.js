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

     systemPrompt = SYNTHESIS_SYSTEM_PROMPT;
    let llmResponseFormat = { type: "json_object" };
    let systemPrompt = SYNTHESIS_SYSTEM_PROMPT;
    
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

    // Apply evidence selection with error handling
    let selectedFacts = input.facts || [];
    try {
      const evidenceSelectionService = require('../services/evidence-selection.service');
      selectedFacts = await evidenceSelectionService.selectEvidence(
        input.facts || [], 
        input.query, 
        this.mode
      );
      console.log(`[SynthesisWorker] Selected ${selectedFacts.length} facts from ${input.facts?.length || 0} total`);
    } catch (error) {
      console.warn('[SynthesisWorker] Evidence selection failed, using all facts:', error.message);
      selectedFacts = input.facts || [];
    }

    // Apply progressive refinement for ranking
    const refinedFacts = this.refineFacts(selectedFacts, input.sources || []);
    console.log(`[SynthesisWorker] Refined to ${refinedFacts.length} facts with enhanced scoring`);

    // Convert fact objects to strings for LLM consumption with enhanced metadata
    const factStrings = refinedFacts.map(f => {
      if (typeof f === 'string') return f;
      
      let factStr = `[${f.type?.toUpperCase() || 'FACT'}] Claim: ${f.claim}\nEvidence: ${f.evidence || f.evidenceText}`;
      
      // Add source information
      const sources = f.sourceUrls || f.sources;
      if (Array.isArray(sources)) {
        factStr += `\nSources: ${sources.join(", ")}`;
      } else if (sources) {
        factStr += `\nSource: ${sources}`;
      }

      // Add confidence information
      if (f.enhancedConfidence) {
        factStr += `\nConfidence: ${(f.enhancedConfidence * 100).toFixed(0)}%`;
      } else if (f.confidence) {
        factStr += `\nConfidence: ${f.confidence}`;
      }

      // Add original source information if available
      if (f.originalSource) {
        factStr += `\nOriginal Source: ${f.originalSource}`;
        if (f.originalSourceVerified) {
          factStr += ' (Verified)';
        }
      }

      // Add contradiction warning if present
      if (f.contradictions && f.contradictions.length > 0) {
        factStr += `\nNote: This claim has ${f.contradictions.length} conflicting source(s)`;
      }

      // Add independent source count if available
      if (f.independentSourceCount && f.independentSourceCount > 1) {
        factStr += `\nCorroborated by ${f.independentSourceCount} independent sources`;
      }

      return factStr;
    });

    console.log(`[SynthesisWorker] Calling LLM with ${factStrings.length} fact strings`);

    // Prepare user content
    let userContent = {
      query: input.query.trim(),
      facts: factStrings,
      sources: input.sources || [],
      previousValidationErrors: input.validationErrors || undefined
    };

    // If answer plan is provided with pre-validated candidates, enforce them
    if (input.answerPlan && input.answerPlan.candidates.length > 0) {
      console.log(`[SynthesisWorker] Enforcing ${input.answerPlan.candidates.length} pre-validated candidates`);
      
      // Add candidate constraint to system prompt
      systemPrompt += `\n\n## Candidate Constraints\nFor this ranking query, you MUST use the following pre-validated candidates in your answer:\n`;
      input.answerPlan.candidates.forEach((c, i) => {
        systemPrompt += `${i + 1}. ${c.name} (confidence: ${(c.queryRelevance * 100).toFixed(0)}%)\n`;
      });
      systemPrompt += `\nDo NOT replace these candidates with other entities. Your role is to explain and rank these specific candidates.\n`;
      
      // Add candidates to user content
      userContent.preValidatedCandidates = input.answerPlan.candidates;
    }

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
          content: JSON.stringify(userContent),
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

      // Enhanced confidence scoring (use enhancedConfidence if available)
      let confScore = 0.6; // Default MEDIUM
      if (fact.enhancedConfidence) {
        confScore = fact.enhancedConfidence;
      } else if (fact.confidence) {
        const confWeight = { HIGH: 0.85, MEDIUM: 0.60, LOW: 0.35 };
        confScore = confWeight[fact.confidence] || 0.60;
      }
      score += confScore * 3;

      // Length scoring (longer facts often more detailed)
      const factText = fact.claim || fact.evidence || fact.evidenceText || '';
      if (factText.length > 100) score += 2;
      else if (factText.length > 50) score += 1;

      // Source diversity scoring (use independentSourceCount if available)
      const sourceCount = fact.independentSourceCount || fact.sourceCount || (fact.sources ? fact.sources.length : 0);
      if (sourceCount > 1) score += Math.min(3, sourceCount * 1.5);
      else if (sourceCount === 1) score += 1;

      // Numerical data scoring
      if (/\d+/.test(factText)) score += 1;

      // Original source verification bonus
      if (fact.originalSourceVerified) score += 2;

      // Cluster bonus (if this is the best evidence in a cluster)
      if (fact.clusterId && fact.totalScore && fact.totalScore > 0.7) {
        score += 1.5;
      }

      // Contradiction penalty
      if (fact.contradictions && fact.contradictions.length > 0) {
        score -= fact.contradictions.length * 0.5;
      }

      // Specificity bonus (proper nouns, technical terms)
      const properNouns = factText.match(/\b[A-Z][a-z]+\b/g);
      if (properNouns && properNouns.length > 2) score += 1;

      return {
        fact,
        score
      };
    });

    // Sort by score (highest first)
    scoredFacts.sort((a, b) => b.score - a.score);

    // Return top 90% of facts, ensuring minimum of 5
    const topCount = Math.max(5, Math.floor(scoredFacts.length * 0.9));
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