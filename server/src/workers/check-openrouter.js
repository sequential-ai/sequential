const { SynthesisWorker } = require("./index");

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.error('Usage: pnpm run check:openrouter -- "your research question"');
  process.exitCode = 1;
} else {
  new SynthesisWorker().run({
    query,
    facts: [],
    sources: [],
  }).then((result) => {
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}