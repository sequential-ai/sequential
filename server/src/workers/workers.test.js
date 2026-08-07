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

// New quality improvement tests
test("Evidence clustering service groups similar claims", async () => {
  const evidenceClusteringService = require("../services/evidence-clustering.service");
  
  const evidence = [
    { claim: "40% of enterprise applications will use AI agents by 2026", sourceUrl: "https://source1.com", confidence: "HIGH" },
    { claim: "Gartner expects AI agents in 40% of enterprise apps by 2026", sourceUrl: "https://source2.com", confidence: "HIGH" },
    { claim: "AI agent adoption in enterprise will reach 40% by 2026", sourceUrl: "https://source3.com", confidence: "MEDIUM" }
  ];
  
  const clusters = await evidenceClusteringService.clusterEvidence(evidence);
  
  assert.ok(clusters.length >= 1);
  assert.ok(clusters[0].supportingEvidence.length >= 2);
});

test("Original source service extracts attributions", () => {
  const originalSourceService = require("../services/original-source.service");
  
  const claim = "According to Gartner, 40% of enterprise applications will use AI agents by 2026";
  const attribution = originalSourceService.extractAttribution(claim);
  
  assert.equal(attribution, "Gartner");
});

test("Evidence selection service respects mode budgets", async () => {
  const evidenceSelectionService = require("../services/evidence-selection.service");
  
  const evidence = Array(20).fill(null).map((_, i) => ({
    claim: `Test claim ${i}`,
    evidence: `Evidence ${i}`,
    confidence: "MEDIUM",
    sources: [`https://source${i}.com`]
  }));
  
  const fastSelected = await evidenceSelectionService.selectEvidence(evidence, "test query", "FAST");
  const standardSelected = await evidenceSelectionService.selectEvidence(evidence, "test query", "STANDARD");
  
  assert.ok(fastSelected.length <= 15); // FAST budget
  assert.ok(standardSelected.length <= 30); // STANDARD budget
});

test("Quality guardrails detect invalid citations", async () => {
  const qualityGuardrailsService = require("../services/quality-guardrails.service");
  
  const synthesisResult = { answer: "See https://invalid-source.com for details" };
  const sources = [{ url: "https://valid-source.com" }];
  
  const validation = await qualityGuardrailsService.validateSynthesis(synthesisResult, [], sources, "test");
  
  assert.ok(!validation.passed);
  assert.ok(validation.issues.some(i => i.type === "invalid_citation"));
});

test("Quality guardrails warn about overconfident claims", async () => {
  const qualityGuardrailsService = require("../services/quality-guardrails.service");
  
  const evidence = [{
    claim: "According to Gartner, 40% adoption",
    confidence: "HIGH",
    originalSourceVerified: false
  }];
  
  const validation = await qualityGuardrailsService.validateSynthesis({}, evidence, [], "test");
  
  assert.ok(validation.warnings.some(w => w.type === "overconfident"));
});}

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
