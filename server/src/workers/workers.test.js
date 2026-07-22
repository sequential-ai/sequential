const test = require("node:test");
const assert = require("node:assert/strict");
const { SearchWorker, ScraperWorker, WorkerError } = require("./index");

function response(body, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  };
}

test("SearchWorker sends a Serper request and normalizes results", async () => {
  let request;
  const worker = new SearchWorker({
    apiKey: "serper-test-key",
    fetch: async (url, options) => {
      request = { url, options };
      return response({
        organic: [{ title: "Example", link: "https://example.com" }],
      });
    },
  });

  const result = await worker.run({ query: "sequential ai", gl: "in", num: 5 });

  assert.equal(request.url, "https://google.serper.dev/search");
  assert.equal(request.options.headers["X-API-KEY"], "serper-test-key");
  assert.deepEqual(JSON.parse(request.options.body), {
    q: "sequential ai",
    gl: "in",
    num: 5,
  });
  assert.equal(result.provider, "serper");
  assert.equal(result.organic[0].title, "Example");
});

test("ScraperWorker sends a Jina Reader request and returns page content", async () => {
  let request;
  const worker = new ScraperWorker({
    apiKey: "jina-test-key",
    fetch: async (url, options) => {
      request = { url, options };
      return response({ data: { title: "Example", content: "Readable page" } });
    },
  });

  const result = await worker.run("https://example.com/docs");

  assert.equal(request.url, "https://r.jina.ai/https://example.com/docs");
  assert.equal(request.options.headers.Authorization, "Bearer jina-test-key");
  assert.equal(result.title, "Example");
  assert.equal(result.content, "Readable page");
});

test("workers reject invalid input before making a request", async () => {
  const worker = new ScraperWorker({ fetch: async () => response({}) });

  await assert.rejects(
    () => worker.run("file:///etc/passwd"),
    (error) => {
      assert.ok(error instanceof WorkerError);
      assert.equal(error.code, "UNSUPPORTED_SCRAPE_PROTOCOL");
      return true;
    },
  );
});
