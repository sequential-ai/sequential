# Provider Workers

These workers are standalone CommonJS modules. They do not depend on Express, the database, or a queue, so routes, orchestrators, scheduled jobs, and SDK adapters can use them directly.

## Configuration

Set `SERPER_API_KEY` for search and `JINA_API_KEY` for authenticated Jina Reader requests. `SERPER_API_URL` and `JINA_READER_URL` are optional endpoint overrides.

## Usage

```js
const { SearchWorker, ScraperWorker } = require("./src/workers");

const search = new SearchWorker();
const results = await search.run({ query: "vector databases", num: 10 });

const scraper = new ScraperWorker();
const page = await scraper.run("https://example.com/article");
```

Both workers also accept `{ fetch }` in the constructor, which makes them easy to test or run with a custom HTTP transport.
