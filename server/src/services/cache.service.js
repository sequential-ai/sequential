const crypto = require('crypto');
const { connection } = require('../orchestrator/queue');

/**
 * Cache service for embeddings, prompts, and results
 * Reduces token usage by avoiding redundant LLM calls and embedding generations
 */
class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour default
    this.embeddingTTL = 86400; // 24 hours for embeddings
    this.promptTTL = 3600; // 1 hour for prompts
    this.resultTTL = 1800; // 30 minutes for results
  }

  /**
   * Generate a consistent hash key for cache entries
   */
  _hashKey(prefix, data) {
    const hash = crypto.createHash('sha256');
    hash.update(typeof data === 'string' ? data : JSON.stringify(data));
    return `${prefix}:${hash.digest('hex').substring(0, 16)}`;
  }

  /**
   * Get embedding from cache
   */
  async getEmbedding(text, model = 'default') {
    const key = this._hashKey('embed', { text, model });
    try {
      const cached = await connection.get(key);
      if (cached) {
        console.log(`[Cache] Embedding cache hit for key: ${key.substring(0, 20)}...`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('[Cache] Error getting embedding:', error);
      return null;
    }
  }

  /**
   * Set embedding in cache
   */
  async setEmbedding(text, model, embedding, ttl = this.embeddingTTL) {
    const key = this._hashKey('embed', { text, model });
    try {
      await connection.set(key, JSON.stringify(embedding), 'EX', ttl);
      console.log(`[Cache] Embedding cached: ${key.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('[Cache] Error setting embedding:', error);
      return false;
    }
  }

  /**
   * Batch get embeddings from cache
   */
  async getEmbeddingsBatch(texts, model = 'default') {
    const results = await Promise.all(
      texts.map(text => this.getEmbedding(text, model))
    );
    return results;
  }

  /**
   * Batch set embeddings in cache
   */
  async setEmbeddingsBatch(texts, model, embeddings, ttl = this.embeddingTTL) {
    const results = await Promise.all(
      texts.map((text, index) => 
        this.setEmbedding(text, model, embeddings[index], ttl)
      )
    );
    return results;
  }

  /**
   * Get prompt cache (for LLM system prompts + user messages)
   */
  async getPromptCache(systemPrompt, userMessage, model = 'default') {
    const key = this._hashKey('prompt', { systemPrompt, userMessage, model });
    try {
      const cached = await connection.get(key);
      if (cached) {
        console.log(`[Cache] Prompt cache hit for key: ${key.substring(0, 20)}...`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('[Cache] Error getting prompt cache:', error);
      return null;
    }
  }

  /**
   * Set prompt cache
   */
  async setPromptCache(systemPrompt, userMessage, model, response, ttl = this.promptTTL) {
    const key = this._hashKey('prompt', { systemPrompt, userMessage, model });
    try {
      await connection.set(key, JSON.stringify(response), 'EX', ttl);
      console.log(`[Cache] Prompt cached: ${key.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('[Cache] Error setting prompt cache:', error);
      return false;
    }
  }

  /**
   * Get result cache (for complete task results)
   */
  async getResultCache(query, mode, taskSpec = null) {
    const key = this._hashKey('result', { query, mode, taskSpec });
    try {
      const cached = await connection.get(key);
      if (cached) {
        console.log(`[Cache] Result cache hit for query: ${query.substring(0, 30)}...`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('[Cache] Error getting result cache:', error);
      return null;
    }
  }

  /**
   * Set result cache
   */
  async setResultCache(query, mode, taskSpec, result, ttl = this.resultTTL) {
    const key = this._hashKey('result', { query, mode, taskSpec });
    try {
      await connection.set(key, JSON.stringify(result), 'EX', ttl);
      console.log(`[Cache] Result cached for query: ${query.substring(0, 30)}...`);
      return true;
    } catch (error) {
      console.error('[Cache] Error setting result cache:', error);
      return false;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await connection.keys(pattern);
      if (keys.length > 0) {
        await connection.del(keys);
        console.log(`[Cache] Invalidated ${keys.length} entries matching: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      console.error('[Cache] Error invalidating pattern:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const embedKeys = await connection.keys('embed:*');
      const promptKeys = await connection.keys('prompt:*');
      const resultKeys = await connection.keys('result:*');
      
      return {
        embeddings: embedKeys.length,
        prompts: promptKeys.length,
        results: resultKeys.length,
        total: embedKeys.length + promptKeys.length + resultKeys.length
      };
    } catch (error) {
      console.error('[Cache] Error getting stats:', error);
      return { embeddings: 0, prompts: 0, results: 0, total: 0 };
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    try {
      const count = await this.invalidatePattern('*');
      console.log(`[Cache] Cleared all cache entries: ${count}`);
      return count;
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
      return 0;
    }
  }
}

module.exports = new CacheService();