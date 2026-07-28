class SourceManager {
  /**
   * Normalizes domains and deduplicates URLs for the sources array.
   * @param {Array<string>} urls - Array of raw URLs
   * @returns {Array<Object>} - Deduplicated sources with domain info
   */
  static processSources(urls) {
    if (!Array.isArray(urls)) return [];
    
    const uniqueUrls = [...new Set(urls.filter(u => typeof u === "string" && u.trim() !== ""))];
    
    return uniqueUrls.map((url, index) => {
      let domain = "";
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname.replace(/^www\./, "");
      } catch (e) {
        domain = "unknown";
      }
      
      return {
        id: `source_${index + 1}`,
        url,
        domain
      };
    });
  }
}

module.exports = SourceManager;
