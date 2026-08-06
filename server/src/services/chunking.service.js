/**
 * Adaptive chunking service for optimal content processing
 * Improves on fixed-size chunking by considering content structure and semantic boundaries
 */
class ChunkingService {
  constructor(options = {}) {
    this.defaultChunkSize = options.defaultChunkSize || 4000;
    this.defaultOverlap = options.defaultOverlap || 400;
    this.minChunkSize = options.minChunkSize || 1000;
    this.maxChunkSize = options.maxChunkSize || 8000;
    this.minOverlap = options.minOverlap || 100;
    this.maxOverlap = options.maxOverlap || 1000;
  }

  /**
   * Analyze content and determine optimal chunking strategy
   */
  analyzeContent(content) {
    const analysis = {
      length: content.length,
      hasStructure: false,
      structureType: null,
      density: 0,
      recommendedChunkSize: this.defaultChunkSize,
      recommendedOverlap: this.defaultOverlap
    };

    // Detect content structure
    const hasHeaders = /^#{1,6}\s+/m.test(content);
    const hasLists = /^\s*[-*+]\s+/m.test(content) || /^\s*\d+\.\s+/m.test(content);
    const hasCode = /```[\s\S]*```/.test(content) || /`[^`]+`/.test(content);
    const hasTables = /\|.*\|/.test(content);
    const hasParagraphs = /\n\n+/.test(content);

    analysis.hasStructure = hasHeaders || hasLists || hasCode || hasTables || hasParagraphs;

    if (hasHeaders && hasParagraphs) {
      analysis.structureType = 'article';
      analysis.recommendedChunkSize = 3000; // Smaller chunks for articles
      analysis.recommendedOverlap = 300;
    } else if (hasCode || hasTables) {
      analysis.structureType = 'technical';
      analysis.recommendedChunkSize = 5000; // Larger chunks for technical content
      analysis.recommendedOverlap = 500;
    } else if (hasLists) {
      analysis.structureType = 'list';
      analysis.recommendedChunkSize = 3500;
      analysis.recommendedOverlap = 350;
    } else {
      analysis.structureType = 'plain';
      analysis.recommendedChunkSize = this.defaultChunkSize;
      analysis.recommendedOverlap = this.defaultOverlap;
    }

    // Calculate content density (words per character)
    const words = content.split(/\s+/).length;
    analysis.density = words / content.length;

    // Adjust based on density
    if (analysis.density > 0.2) {
      // High density (more words) - smaller chunks
      analysis.recommendedChunkSize = Math.max(
        this.minChunkSize,
        analysis.recommendedChunkSize * 0.8
      );
    } else if (analysis.density < 0.1) {
      // Low density (fewer words) - larger chunks
      analysis.recommendedChunkSize = Math.min(
        this.maxChunkSize,
        analysis.recommendedChunkSize * 1.2
      );
    }

    return analysis;
  }

  /**
   * Chunk content with adaptive strategy
   */
  chunkContent(content, options = {}) {
    const analysis = this.analyzeContent(content);
    
    const chunkSize = options.chunkSize || analysis.recommendedChunkSize;
    const overlap = options.overlap || analysis.recommendedOverlap;
    const respectStructure = options.respectStructure !== false; // Default to respecting structure

    console.log(`[Chunking] Strategy: ${analysis.structureType}, size: ${chunkSize}, overlap: ${overlap}, respectStructure: ${respectStructure}`);

    if (respectStructure && analysis.hasStructure) {
      return this.structureAwareChunking(content, chunkSize, overlap, analysis.structureType);
    } else {
      return this.fixedSizeChunking(content, chunkSize, overlap);
    }
  }

  /**
   * Fixed-size chunking (original method)
   */
  fixedSizeChunking(content, chunkSize, overlap) {
    const chunks = [];
    let idx = 0;
    
    while (idx < content.length) {
      chunks.push(content.slice(idx, idx + chunkSize));
      idx += chunkSize - overlap;
    }
    
    return chunks;
  }

  /**
   * Structure-aware chunking that respects document boundaries
   */
  structureAwareChunking(content, chunkSize, overlap, structureType) {
    const chunks = [];
    
    if (structureType === 'article') {
      return this.articleChunking(content, chunkSize, overlap);
    } else if (structureType === 'technical') {
      return this.technicalChunking(content, chunkSize, overlap);
    } else if (structureType === 'list') {
      return this.listChunking(content, chunkSize, overlap);
    } else {
      return this.fixedSizeChunking(content, chunkSize, overlap);
    }
  }

  /**
   * Article-style chunking (respects headers and paragraphs)
   */
  articleChunking(content, chunkSize, overlap) {
    const chunks = [];
    const lines = content.split('\n');
    let currentChunk = '';
    let currentSize = 0;
    
    for (const line of lines) {
      const lineSize = line.length + 1; // +1 for newline
      
      // Check if this is a header
      const isHeader = /^#{1,6}\s+/.test(line);
      
      // If adding this line would exceed chunk size and current chunk is substantial
      if (currentSize + lineSize > chunkSize && currentSize > chunkSize * 0.5) {
        chunks.push(currentChunk.trim());
        
        // Start new chunk with overlap from previous
        const overlapLines = currentChunk.split('\n').slice(-Math.ceil(overlap / 100));
        currentChunk = overlapLines.join('\n') + '\n' + line;
        currentSize = currentChunk.length;
      } else {
        currentChunk += line + '\n';
        currentSize += lineSize;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [content];
  }

  /**
   * Technical content chunking (respects code blocks and tables)
   */
  technicalChunking(content, chunkSize, overlap) {
    const chunks = [];
    let currentChunk = '';
    let inCodeBlock = false;
    let inTable = false;
    
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Detect code block boundaries
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      
      // Detect table boundaries
      if (line.includes('|')) {
        inTable = true;
      } else if (inTable && line.trim() === '') {
        inTable = false;
      }
      
      // Don't break inside code blocks or tables
      if (inCodeBlock || inTable) {
        currentChunk += line + '\n';
        continue;
      }
      
      // Normal chunking logic
      if (currentChunk.length + line.length > chunkSize && currentChunk.length > chunkSize * 0.6) {
        chunks.push(currentChunk.trim());
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + '\n' + line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [content];
  }

  /**
   * List-style chunking (respects list items)
   */
  listChunking(content, chunkSize, overlap) {
    const chunks = [];
    const listItems = content.split(/\n(?=\s*[-*+]|\s*\d+\.)/); // Split by list item boundaries
    
    let currentChunk = '';
    
    for (const item of listItems) {
      if (currentChunk.length + item.length > chunkSize && currentChunk.length > chunkSize * 0.5) {
        chunks.push(currentChunk.trim());
        currentChunk = item;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + item;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [content];
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokens(text) {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Optimize chunk size for target token limit
   */
  optimizeForTokenLimit(content, targetTokens, maxTokens = 8000) {
    const estimatedTokens = this.estimateTokens(content);
    
    if (estimatedTokens <= targetTokens) {
      return [content]; // No chunking needed
    }
    
    // Calculate optimal chunk size
    const targetChunkSize = Math.floor((targetTokens / estimatedTokens) * content.length);
    const safeChunkSize = Math.min(targetChunkSize, maxTokens * 4); // Convert back to characters
    
    return this.chunkContent(content, {
      chunkSize: safeChunkSize,
      overlap: Math.floor(safeChunkSize * 0.1)
    });
  }
}

module.exports = new ChunkingService();