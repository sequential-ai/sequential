const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const { SynthesisWorker } = require("../index");

const query = process.argv.slice(2).join(" ").trim() || "What is the history of apple?";

new SynthesisWorker().run({
  query,
  facts: [
    { claim: "Apple was founded in 1976.", evidence: "Apple website", relevance: "HIGH", confidence: "HIGH" },
    { claim: "Steve Jobs was a founder.", evidence: "Wikipedia", relevance: "HIGH", confidence: "HIGH" }
  ],
  sources: [
    { url: "https://apple.com", title: "Apple", description: "Apple website" },
    { url: "https://wikipedia.org", title: "Wikipedia", description: "Wikipedia article" }
  ],
}).then((result) => {
  console.log(JSON.stringify(result, null, 2));
}).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
