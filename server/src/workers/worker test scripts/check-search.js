const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const { SearchWorker } = require("../index");
const query = process.argv.slice(2).join(" ").trim();

if (!query) {
  console.error('Usage: pnpm run check:search -- "your search query"');
  process.exitCode = 1;
} else {
  new SearchWorker()
    .run({ query, num: 10 })
    .then((results) => {
      console.log(
        JSON.stringify(
          {
            query: query,
            resultCount: results.length,
            results: results,
          },
          null,
          2,
        ),
      );
    })
    .catch(printError);
}

function printError(error) {
  console.error(
    JSON.stringify(
      {
        error: error.message,
        code: error.code || "UNKNOWN_ERROR",
        retryable: error.retryable === true,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
}
