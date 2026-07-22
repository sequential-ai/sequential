const path = require("node:path");
const assert = require("node:assert/strict");
const test = require("node:test");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { SearchWorker, ScraperWorker } = require("./index");

const hasSerperKey = Boolean(process.env.SERPER_API_KEY);
const hasJinaKey = Boolean(process.env.JINA_API_KEY);

test(
  "Serper integration search",
  { skip: !hasSerperKey ? "SERPER_API_KEY is not configured" : false },
  async () => {
    const worker = new SearchWorker();
    const result = await worker.run({ query: "Sequential AI", num: 3 });

    assert.equal(result.provider, "serper");
    assert.equal(result.query, "Sequential AI");
    assert.ok(Array.isArray(result.organic));
  },
);

test(
  "Jina integration scrape",
  { skip: !hasJinaKey ? "JINA_API_KEY is not configured" : false },
  async () => {
    const worker = new ScraperWorker();
    const result = await worker.run("https://example.com");

    assert.equal(result.provider, "jina");
    assert.equal(result.url, "https://example.com/");
    assert.ok(result.content.length > 0);
  },
);
