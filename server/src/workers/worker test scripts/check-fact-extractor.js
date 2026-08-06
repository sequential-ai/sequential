const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const { FactExtractorWorker } = require("../index");

const args = process.argv.slice(2);
const query = args[0] || "history of apple";
const content = args[1] || "Apple was founded by Steve Jobs and Steve Wozniak in 1976.";

new FactExtractorWorker()
  .run({ query, content })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
