const embeddingService = require("./embedding.service");
const prisma = require("../db/db-connection"); // Assume standard prisma export

class SemanticSearchService {
  /**
   * Search for the most relevant memories for a given query.
   * @param {string} query The search query.
   * @param {string} taskId The ID of the task to search within (or null for org-wide).
   * @param {string} organizationId The ID of the organization.
   * @param {number} topK Number of results to return.
   */
  async searchMemories(query, taskId, organizationId, topK = 10) {
    if (!query) return [];

    // 1. Embed the query
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // 2. Format the vector for pgvector
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // 3. Perform vector similarity search
    let results = [];
    if (taskId) {
      results = await prisma.$queryRaw`
        SELECT id, content, "sourceUrl", 1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM "Memory"
        WHERE "organizationId" = ${organizationId} AND "taskId" = ${taskId}
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT ${topK};
      `;
    } else {
      results = await prisma.$queryRaw`
        SELECT id, content, "sourceUrl", 1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM "Memory"
        WHERE "organizationId" = ${organizationId}
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT ${topK};
      `;
    }

    return results;
  }
}

module.exports = new SemanticSearchService();
