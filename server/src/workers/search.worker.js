const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");
const { UrlNormalizer, SourceClassifier, ContentTypeDetector, FaviconGenerator } = require("./search.utils");

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

  async run(input, context = {}) {
    const request = normalizeSearchInput(input);
    const originalQuery = typeof input === "string" ? input : input.query;
    const subQueryId = input.subQueryId || context.subQueryId;
    const purpose = input.purpose || context.purpose;
    const provider = "serper";

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

    const searchResults = [];
    const organic = Array.isArray(payload.organic) ? payload.organic : [];
    
    let position = 1;
    for (const r of organic) {
      if (!r.link) continue;

      const { canonicalUrl, domain } = UrlNormalizer.normalize(r.link);
      if (!canonicalUrl) continue;

      const sourceType = SourceClassifier.classify(domain, canonicalUrl);
      const contentType = ContentTypeDetector.detect(domain, canonicalUrl);
      const faviconUrl = FaviconGenerator.getFavicon(domain, r.imageUrl || r.favicon);

      const searchResult = {
        id: `search_result_${Math.random().toString(36).substr(2, 9)}`,
        provider,
        position: position++,
        query: originalQuery,
        subQueryId,
        purpose,
        title: r.title,
        url: r.link,
        canonicalUrl,
        domain,
        favicon: faviconUrl,
        snippet: r.snippet,
        sourceType,
        contentType,
        publishedAt: r.date || undefined,
        sitelinks: r.sitelinks || undefined
      };
      
      searchResults.push(searchResult);
    }

    return searchResults;
  }
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
