const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const { ScraperWorker } = require("./index");
const url = process.argv[2];

if (!url) {
  console.error('Usage: pnpm run check:scrape -- "https://example.com"');
  process.exitCode = 1;
} else {
  new ScraperWorker()
    .run(url)
    .then((result) => {
      console.log(
        JSON.stringify(
          {
            url: result.url,
            title: result.title,
            description: result.description,
            contentPreview: result.content.slice(0, 1000),
            contentLength: result.content.length,
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
