/**
 * Smart context management service
 * Optimizes context window usage to reduce token costs while maintaining quality
 */
class ContextManagementService {
  constructor(options = {}) {
    this.defaultMaxTokens = options.defaultMaxTokens || 8000;
    this.safetyMargin = options.safetyMargin || 500; // Safety margin for context limits
    this.compressionThreshold = options.compressionThreshold || 0.8; // Compress when using 80% of context
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokens(text) {
    if (!text) return 0;
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Compress context by removing less important content
   */
  compressContext(context, maxTokens, priorityFn = null) {
    const estimatedTokens = this.estimateTokens(context);
    
    if (estimatedTokens <= maxTokens) {
      return context; // No compression needed
    }

    console.log(`[ContextManagement] Compressing context from ${estimatedTokens} to ${maxTokens} tokens`);

    // Split context into segments
    const segments = this.segmentContext(context);
    
    // Score segments by importance
    const scoredSegments = segments.map(segment => ({
      ...segment,
      score: priorityFn ? priorityFn(segment) : this.defaultPriorityFn(segment)
    }));

    // Sort by score (highest first) and select top segments
    scoredSegments.sort((a, b) => b.score - a.score);
    
    const selectedSegments = [];
    let currentTokens = 0;

    for (const segment of scoredSegments) {
      const segmentTokens = this.estimateTokens(segment.content);
      if (currentTokens + segmentTokens <= maxTokens - this.safetyMargin) {
        selectedSegments.push(segment);
        currentTokens += segmentTokens;
      }
    }

    // Reassemble context maintaining original order
    selectedSegments.sort((a, b) => a.originalIndex - b.originalIndex);
    return selectedSegments.map(s => s.content).join('\n\n');
  }

  /**
   * Segment context into logical units
   */
  segmentContext(context) {
    // Try to split by paragraphs first
    const paragraphs = context.split(/\n\n+/);
    
    return paragraphs.map((content, index) => ({
      content: content.trim(),
      originalIndex: index,
      length: content.length
    })).filter(p => p.content.length > 0);
  }

  /**
   * Default priority function for context segments
   */
  defaultPriorityFn(segment) {
    let score = 0;
    const content = segment.content.toLowerCase();

    // Prioritize segments with specific indicators
    if (content.includes('important') || content.includes('key') || content.includes('critical')) {
      score += 10;
    }
    
    // Prioritize segments with numbers/data
    if (/\d+/.test(content)) {
      score += 5;
    }
    
    // Prioritize longer segments (likely more substantive)
    score += Math.min(segment.length / 100, 10);
    
    // Prioritize segments with citations or references
    if (content.includes('according to') || content.includes('source') || content.includes('reference')) {
      score += 8;
    }

    return score;
  }

  /**
   * Optimize context for specific task types
   */
  optimizeContextForTask(context, taskType, maxTokens) {
    const taskPriorityFunctions = {
      'extraction': (segment) => {
        // For extraction, prioritize factual content
        let score = this.defaultPriorityFn(segment);
        const content = segment.content.toLowerCase();
        
        if (content.includes('fact') || content.includes('data') || content.includes('result')) {
          score += 15;
        }
        
        return score;
      },
      'synthesis': (segment) => {
        // For synthesis, prioritize comprehensive content
        let score = this.defaultPriorityFn(segment);
        const content = segment.content.toLowerCase();
        
        if (content.includes('conclusion') || content.includes('summary') || content.includes('overall')) {
          score += 12;
        }
        
        return score;
      },
      'evaluation': (segment) => {
        // For evaluation, prioritize analytical content
        let score = this.defaultPriorityFn(segment);
        const content = segment.content.toLowerCase();
        
        if (content.includes('analysis') || content.includes('compare') || content.includes('evaluate')) {
          score += 15;
        }
        
        return score;
      }
    };

    const priorityFn = taskPriorityFunctions[taskType] || this.defaultPriorityFn;
    return this.compressContext(context, maxTokens, priorityFn);
  }

  /**
   * Select optimal chunks for retrieval based on query relevance
   */
  selectRelevantChunks(chunks, queryEmbedding, chunkEmbeddings, maxTokens) {
    if (!chunks || chunks.length === 0) return [];

    // Calculate similarity scores (simplified cosine similarity)
    const scoredChunks = chunks.map((chunk, index) => {
      const chunkEmbedding = chunkEmbeddings[index];
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      
      return {
        chunk,
        score: similarity,
        index
      };
    });

    // Sort by relevance
    scoredChunks.sort((a, b) => b.score - a.score);

    // Select chunks within token limit
    const selectedChunks = [];
    let currentTokens = 0;

    for (const { chunk, score } of scoredChunks) {
      const chunkTokens = this.estimateTokens(chunk);
      
      // Include high-relevance chunks even if over limit
      if (score > 0.8 || currentTokens + chunkTokens <= maxTokens - this.safetyMargin) {
        selectedChunks.push(chunk);
        currentTokens += chunkTokens;
      }
      
      if (currentTokens >= maxTokens - this.safetyMargin) {
        break;
      }
    }

    console.log(`[ContextManagement] Selected ${selectedChunks.length}/${chunks.length} chunks (${currentTokens} tokens)`);
    return selectedChunks;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Dynamic context window adjustment based on model capabilities
   */
  getOptimalMaxTokens(model, taskType) {
    const modelLimits = {
      'gpt-4o': 128000,
      'gpt-4o-mini': 128000,
      'gpt-3.5-turbo': 16385,
      'claude-3.5-sonnet': 200000,
      'claude-3-haiku': 200000,
      'claude-3-opus': 200000
    };

    const modelName = model.replace('openai/', '').replace('anthropic/', '');
    const modelLimit = modelLimits[modelName] || this.defaultMaxTokens;

    // Adjust based on task type
    const taskAdjustments = {
      'extraction': 0.6, // Use 60% of context for extraction
      'synthesis': 0.8,  // Use 80% of context for synthesis
      'evaluation': 0.7, // Use 70% of context for evaluation
      'planning': 0.5   // Use 50% of context for planning
    };

    const adjustment = taskAdjustments[taskType] || 0.7;
    return Math.floor(modelLimit * adjustment);
  }

  /**
   * Smart truncation that preserves sentence boundaries
   */
  smartTruncate(text, maxTokens) {
    const estimatedTokens = this.estimateTokens(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }

    // Calculate target character length
    const targetLength = Math.floor((maxTokens / estimatedTokens) * text.length);
    
    // Find the last sentence boundary near target length
    const truncated = text.substring(0, targetLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );

    if (lastSentenceEnd > targetLength * 0.8) {
      return text.substring(0, lastSentenceEnd + 1);
    }

    return truncated + '...';
  }

  /**
   * Batch optimize multiple contexts
   */
  batchOptimizeContexts(contexts, taskType, maxTokensPerContext) {
    return contexts.map(context => 
      this.optimizeContextForTask(context, taskType, maxTokensPerContext)
    );
  }
}

module.exports = new ContextManagementService();