const fetch = require("node-fetch"); // Or use global fetch if Node 18+

class EmbeddingService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    this.endpoint = "https://openrouter.ai/api/v1/embeddings";
    this.model = "openai/text-embedding-3-small";
    this.fetch = options.fetch || globalThis.fetch;
  }

  /**
   * Generates embeddings for an array of strings.
   * @param {string[]} texts - The strings to embed.
   * @returns {Promise<number[][]>} Array of vectors.
   */
  async generateEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required for embeddings");
    }

    const response = await this.fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5000",
        "X-Title": process.env.OPENROUTER_SITE_NAME || "Sequential AI",
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Embedding API failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid response from Embedding API");
    }

    // Sort by index just in case, then map to arrays
    return data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }

  /**
   * Generates a single embedding for a string.
   */
  async generateEmbedding(text) {
    const vectors = await this.generateEmbeddings([text]);
    return vectors[0];
  }
}

module.exports = new EmbeddingService();
