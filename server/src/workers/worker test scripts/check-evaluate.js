const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const { EvaluateWorker } = require("../index");

const args = process.argv.slice(2);
const query = args[0] || "history of apple";

new EvaluateWorker()
  .run({ 
    query, 
    facts: [
      { claim: "Apple was founded in 1976.", evidence: "Apple website", relevance: "HIGH", confidence: "HIGH" },
      { claim: "Steve Jobs was a founder.", evidence: "Wikipedia", relevance: "HIGH", confidence: "HIGH" }
    ] 
  })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
