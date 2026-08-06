const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const { SubQueryWorker } = require("../index");

const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.error('Usage: pnpm run check:subquery -- "your research question"');
  process.exitCode = 1;
} else {
  new SubQueryWorker()
    .run({ query, maxSubQueries: 3 })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
