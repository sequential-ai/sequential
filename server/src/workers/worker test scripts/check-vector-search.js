const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const prisma = require("../../db/db-connection");
const embeddingService = require("../../services/embedding.service");

const query = process.argv[2];

if (!query) {
  console.error('Usage: pnpm run check:vector-search -- "your search query"');
  process.exitCode = 1;
} else {
  runVectorSearch(query).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

async function runVectorSearch(query) {
  console.log(`Generating embedding for query: "${query}"...`);
  
  const embedding = await embeddingService.generateEmbedding(query);
  const vectorString = `[${embedding.join(",")}]`;

  console.log("Embedding generated, running vector search against Memory table...");
  const topK = 5;

  const chunks = await prisma.$queryRaw`
    SELECT "id", "sourceUrl", left("content", 150) as snippet, "embedding" <=> ${vectorString}::vector as distance
    FROM "Memory"
    ORDER BY distance ASC
    LIMIT ${topK}
  `;

  console.log("\n--- Top Results ---");
  chunks.forEach((chunk, index) => {
    console.log(`\n[Result ${index + 1}]`);
    console.log(`Distance:  ${chunk.distance.toFixed(4)} (Lower is better)`);
    console.log(`Source URL: ${chunk.sourceUrl}`);
    console.log(`Snippet:   ${chunk.snippet.replace(/\n/g, ' ')}...`);
  });

  console.log("\nDone.");
  process.exit(0);
}
