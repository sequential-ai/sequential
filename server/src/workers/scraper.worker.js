const { WorkerError } = require("./errors");
const BaseWorker = require("./base.worker");

const DEFAULT_READER_ENDPOINT = "https://r.jina.ai";

class ScraperWorker extends BaseWorker {
  constructor(options = {}) {
    super("scraper");
    this.apiKey = options.apiKey || process.env.JINA_API_KEY;
    this.readerEndpoint = (
      options.readerEndpoint ||
      process.env.JINA_READER_URL ||
      DEFAULT_READER_ENDPOINT
    ).replace(/\/$/, "");
    this.fetch = options.fetch || globalThis.fetch;

    if (typeof this.fetch !== "function") {
      throw new WorkerError("A fetch implementation is required", {
        code: "FETCH_UNAVAILABLE",
      });
    }
  }

  getEventPrefix() {
    return "scraper";
  }

  async run(input, taskContext) {
    const request = normalizeScrapeInput(input);
    const headers = {
      Accept: "application/json",
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    let response;
    try {
      response = await this.fetch(`${this.readerEndpoint}/${request.url}`, {
        method: "GET",
        headers,
      });
    } catch (error) {
      throw new WorkerError("Jina Reader request failed", {
        code: "JINA_NETWORK_ERROR",
        retryable: true,
        cause: error,
      });
    }

    const payload = await parseReaderResponse(response);
    if (!response.ok) {
      throw new WorkerError(
        payload.message || "Jina Reader returned an error",
        {
          code: "JINA_API_ERROR",
          status: response.status,
          retryable: response.status >= 500 || response.status === 429,
        },
      );
    }

    return {
      url: request.url,
      title: payload.data?.title || payload.title || null,
      description: payload.data?.description || payload.description || null,
      content: payload.data?.content || payload.content || "",
      links: payload.data?.links || payload.links || {},
    };
  }
}

function normalizeScrapeInput(input) {
  const url = typeof input === "string" ? input : input?.url;

  if (typeof url !== "string" || !url.trim()) {
    throw new WorkerError("A URL is required", {
      code: "INVALID_SCRAPE_URL",
      status: 400,
    });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
  } catch (error) {
    throw new WorkerError("A valid URL is required", {
      code: "INVALID_SCRAPE_URL",
      status: 400,
      cause: error,
    });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new WorkerError("Only HTTP and HTTPS URLs are supported", {
      code: "UNSUPPORTED_SCRAPE_PROTOCOL",
      status: 400,
    });
  }

  return { url: parsedUrl.toString() };
}

async function parseReaderResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { content: text };
  }
}

module.exports = { ScraperWorker, normalizeScrapeInput };
