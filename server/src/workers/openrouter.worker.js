const { WorkerError } = require("./errors");

const DEFAULT_OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

class OpenRouterWorker {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    this.endpoint = options.endpoint || process.env.OPENROUTER_API_URL || DEFAULT_OPENROUTER_ENDPOINT;
    this.defaultModel = options.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    this.defaultTemperature = options.temperature;
    this.defaultMaxTokens = options.maxTokens;
    this.defaultTimeoutMs = options.timeoutMs || 60_000;
    this.siteUrl = options.siteUrl || process.env.OPENROUTER_SITE_URL;
    this.siteName = options.siteName || process.env.OPENROUTER_SITE_NAME;
    this.fetch = options.fetch || globalThis.fetch;

    if (typeof this.fetch !== "function") {
      throw new WorkerError("A fetch implementation is required", {
        code: "FETCH_UNAVAILABLE",
      });
    }
  }

  async run(input) {
    const request = normalizeChatInput(input, {
      defaultModel: this.defaultModel,
      defaultTemperature: this.defaultTemperature,
      defaultMaxTokens: this.defaultMaxTokens,
    });

    if (!this.apiKey) {
      throw new WorkerError("OPENROUTER_API_KEY is not configured", {
        code: "OPENROUTER_API_KEY_MISSING",
        status: 503,
      });
    }

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (this.siteUrl) headers["HTTP-Referer"] = this.siteUrl;
    if (this.siteName) headers["X-Title"] = this.siteName;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs || this.defaultTimeoutMs);

    let response;
    try {
      response = await this.fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(toChatRequest(request)),
        signal: controller.signal,
      });
    } catch (error) {
      throw new WorkerError("OpenRouter request failed", {
        code: error.name === "AbortError" ? "OPENROUTER_TIMEOUT" : "OPENROUTER_NETWORK_ERROR",
        retryable: true,
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (request.stream && typeof request.onChunk === 'function') {
      let fullContent = "";
      let finalUsage = null;
      const decoder = new TextDecoder();
      
      if (!response.ok) {
        const errPayload = await parseResponse(response);
        throw new WorkerError(errPayload.error?.message || "OpenRouter returned an error", {
          code: "OPENROUTER_API_ERROR",
          status: response.status,
          retryable: response.status === 429 || response.status >= 500,
        });
      }

      // Read SSE stream
      let buffer = "";
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // Keep the incomplete line in the buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices?.[0]?.delta?.content || "";
              if (delta) {
                fullContent += delta;
                request.onChunk(delta);
              }
              if (data.usage) {
                finalUsage = data.usage;
              }
            } catch (e) {
              // Ignore parse errors for fragmented SSE lines
            }
          }
        }
      }

      return {
        provider: "openrouter",
        model: request.model,
        content: fullContent,
        usage: normalizeUsage(finalUsage),
        finishReason: null,
      };
    }

    // Non-streaming handling below
    const payload = await parseResponse(response);
    if (!response.ok) {
      throw new WorkerError(payload.error?.message || "OpenRouter returned an error", {
        code: "OPENROUTER_API_ERROR",
        status: response.status,
        retryable: response.status === 429 || response.status >= 500,
      });
    }

    const choice = payload.choices?.[0];
    const content = choice?.message?.content;
    if (typeof content !== "string") {
      throw new WorkerError("OpenRouter returned no assistant content", {
        code: "OPENROUTER_INVALID_RESPONSE",
        status: 502,
        retryable: true,
      });
    }

    return {
      provider: "openrouter",
      model: payload.model || request.model,
      content,
      usage: normalizeUsage(payload.usage),
      finishReason: choice.finish_reason || null,
      raw: payload,
    };
  }
}

function normalizeChatInput(input, defaults) {
  if (!input || !Array.isArray(input.messages) || input.messages.length === 0) {
    throw new WorkerError("At least one chat message is required", {
      code: "INVALID_OPENROUTER_MESSAGES",
      status: 400,
    });
  }

  const model = input.model || defaults.defaultModel;
  if (typeof model !== "string" || !model.trim()) {
    throw new WorkerError("An OpenRouter model is required", {
      code: "INVALID_OPENROUTER_MODEL",
      status: 400,
    });
  }

  return {
    model: model.trim(),
    messages: input.messages,
    temperature: input.temperature ?? defaults.defaultTemperature,
    maxTokens: input.maxTokens ?? defaults.defaultMaxTokens,
    responseFormat: input.responseFormat,
    timeoutMs: input.timeoutMs,
    stream: input.stream || false,
    onChunk: input.onChunk
  };
}

function toChatRequest(request) {
  const body = {
    model: request.model,
    messages: request.messages,
  };

  if (request.temperature !== undefined) body.temperature = request.temperature;
  if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;
  if (request.responseFormat) body.response_format = request.responseFormat;
  if (request.stream) {
    body.stream = true;
    body.stream_options = { include_usage: true };
  }

  return body;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new WorkerError("OpenRouter returned invalid JSON", {
      code: "OPENROUTER_INVALID_RESPONSE",
      status: 502,
      retryable: true,
      cause: error,
    });
  }
}

function parseJsonContent(content, code) {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(normalized);
  } catch (error) {
    throw new WorkerError("OpenRouter returned invalid structured content", {
      code,
      status: 502,
      retryable: false,
      cause: error,
    });
  }
}

function normalizeUsage(usage) {
  if (!usage) return null;
  return {
    input: usage.prompt_tokens || 0,
    output: usage.completion_tokens || 0,
    cached: usage.prompt_tokens_details?.cached_tokens || 0,
    total: usage.total_tokens || 0,
    cost: usage.cost || 0,
  };
}

module.exports = {
  OpenRouterWorker,
  normalizeChatInput,
  parseJsonContent,
};