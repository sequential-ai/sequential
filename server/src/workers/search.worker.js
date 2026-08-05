const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");

const DEFAULT_SEARCH_ENDPOINT = "https://google.serper.dev/search";

class SearchWorker extends BaseWorker {
  constructor(options = {}) {
    super("search");
    this.apiKey = options.apiKey || process.env.SERPER_API_KEY;
    this.endpoint =
      options.endpoint || process.env.SERPER_API_URL || DEFAULT_SEARCH_ENDPOINT;
    this.fetch = options.fetch || globalThis.fetch;

    if (typeof this.fetch !== "function") {
      throw new WorkerError("A fetch implementation is required", {
        code: "FETCH_UNAVAILABLE",
      });
    }
  }

  getEventPrefix() {
    return "search";
  }

  async run(input, context) {
    const request = normalizeSearchInput(input);

    if (!this.apiKey) {
      throw new WorkerError("SERPER_API_KEY is not configured", {
        code: "SERPER_API_KEY_MISSING",
        status: 503,
        retryable: false,
      });
    }

    let response;
    try {
      response = await this.fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify(request),
      });
    } catch (error) {
      throw new WorkerError("Serper request failed", {
        code: "SERPER_NETWORK_ERROR",
        retryable: true,
        cause: error,
      });
    }

    const payload = await parseResponse(response, "Serper");
    if (!response.ok) {
      throw new WorkerError(payload.message || "Serper returned an error", {
        code: "SERPER_API_ERROR",
        status: response.status,
        retryable: response.status >= 500 || response.status === 429,
      });
    }

    const domainResults = [];
    const organic = Array.isArray(payload.organic) ? payload.organic : [];
    
    for (const r of organic) {
      const searchResult = {
        id: `search_result_${Math.random().toString(36).substr(2, 9)}`,
        title: r.title,
        url: r.link,
        domain: new URL(r.link).hostname,
        snippet: r.snippet
      };
      domainResults.push(searchResult);
    }

    return rankAndFilterResults(domainResults);
  }
}

function rankAndFilterResults(results) {
  return results.sort((a, b) => {
    const scoreA = getSourceScore(a);
    const scoreB = getSourceScore(b);
    return scoreB - scoreA;
  });
}

function getSourceScore(result) {
  let score = 0;
  const domain = result.domain.toLowerCase();
  const url = result.url.toLowerCase();

  // Highly prioritized
  if (domain.endsWith(".gov") || domain.endsWith(".edu")) score += 10;
  if (domain === "github.com" || domain.endsWith(".github.io")) score += 10;
  if (domain === "arxiv.org" || domain === "en.wikipedia.org") score += 10;
  
  // Official docs
  if (domain.startsWith("docs.") || domain.startsWith("support.") || domain.startsWith("developer.")) score += 5;
  if (url.endsWith(".pdf")) score += 5;

  // Deprioritized (Not blocked, just pushed down)
  if (domain.includes("youtube.com") || domain.includes("vimeo.com") || domain.includes("dailymotion.com")) score -= 5;
  if (domain.includes("pinterest.") || domain.includes("quora.com") || domain.includes("reddit.com") || domain.includes("yahoo.com")) score -= 5;

  return score;
}

function normalizeSearchInput(input) {
  if (typeof input === "string") {
    input = { query: input };
  }

  if (!input || typeof input.query !== "string" || !input.query.trim()) {
    throw new WorkerError("Search query is required", {
      code: "INVALID_SEARCH_QUERY",
      status: 400,
    });
  }

  const request = {
    q: input.query.trim(),
  };

  for (const field of [
    "gl",
    "hl",
    "location",
    "type",
    "autocorrect",
    "page",
    "num",
  ]) {
    if (input[field] !== undefined) {
      request[field] = input[field];
    }
  }

  return request;
}

async function parseResponse(response, provider) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new WorkerError(`${provider} returned invalid JSON`, {
      code: `${provider.toUpperCase()}_INVALID_RESPONSE`,
      status: 502,
      retryable: true,
      cause: error,
    });
  }
}

module.exports = { SearchWorker, normalizeSearchInput };
