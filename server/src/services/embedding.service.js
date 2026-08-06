const fetch = require("node-fetch"); // Or use global fetch if Node 18+
const cacheService = require("./cache.service");

class EmbeddingService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
    this.endpoint = "https://openrouter.ai/api/v1/embeddings";
    this.model = "openai/text-embedding-3-small";
    this.fetch = options.fetch || globalThis.fetch;
    this.cacheEnabled = options.cacheEnabled !== false; // Enable cache by default
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
   * Generates embeddings and returns usage/cost info.
   * Now with caching support to reduce token usage.
   */
  async generateEmbeddingsWithUsage(texts) {
    if (!texts || texts.length === 0) return { embeddings: [], usage: null };
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is required for embeddings");
    }

    // Check cache first if enabled
    if (this.cacheEnabled) {
      const cachedEmbeddings = await cacheService.getEmbeddingsBatch(texts, this.model);
      const uncachedTexts = [];
      const uncachedIndices = [];

      for (let i = 0; i < texts.length; i++) {
        if (cachedEmbeddings[i] === null) {
          uncachedTexts.push(texts[i]);
          uncachedIndices.push(i);
        }
      }

      // If all embeddings are cached, return immediately
      if (uncachedTexts.length === 0) {
        console.log(`[Embedding] All ${texts.length} embeddings found in cache`);
        return { 
          embeddings: cachedEmbeddings, 
          usage: { input: 0, output: 0, total: 0, cost: 0, cached: true } 
        };
      }

      // Generate only uncached embeddings
      console.log(`[Embedding] Cache hit: ${texts.length - uncachedTexts.length}/${texts.length}, generating ${uncachedTexts.length} new embeddings`);
      
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
          input: uncachedTexts,
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

      const newEmbeddings = data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
      
      // Cache the new embeddings
      await cacheService.setEmbeddingsBatch(uncachedTexts, this.model, newEmbeddings);

      // Merge cached and new embeddings
      const finalEmbeddings = [...cachedEmbeddings];
      for (let i = 0; i < uncachedIndices.length; i++) {
        finalEmbeddings[uncachedIndices[i]] = newEmbeddings[i];
      }
      
      let cost = 0;
      if (data.usage && data.usage.total_tokens) {
        cost = data.usage.total_tokens * 0.00000002;
      }

      const usage = data.usage ? {
        input: data.usage.prompt_tokens || 0,
        output: 0,
        total: data.usage.total_tokens || 0,
        cost: cost,
        cached: true,
        cacheHits: texts.length - uncachedTexts.length
      } : null;

      return { embeddings: finalEmbeddings, usage };
    }

    // Original non-cached path
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

    const embeddings = data.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
    
    let cost = 0;
    if (data.usage && data.usage.total_tokens) {
      cost = data.usage.total_tokens * 0.00000002;
    }

    const usage = data.usage ? {
      input: data.usage.prompt_tokens || 0,
      output: 0,
      total: data.usage.total_tokens || 0,
      cost: cost,
      cached: false
    } : null;

    return { embeddings, usage };
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
