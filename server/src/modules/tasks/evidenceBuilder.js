class EvidenceBuilder {
  /**
   * Maps facts to structured Evidence formats with source IDs.
   * @param {Array<Object>} facts - The extracted facts array
   * @param {Array<Object>} sources - The processed sources array from SourceManager
   * @returns {Array<Object>} - Structured evidence
   */
  static buildEvidence(facts, sources) {
    if (!Array.isArray(facts)) return [];

    return facts.map(fact => {
      // Find the source ID by matching the URL
      const source = sources.find(s => s.url === fact.sourceUrl);
      const sourceId = source ? source.id : null;

      return {
        claim: fact.claim,
        confidence: fact.confidence,
        sourceId
      };
    });
  }
}

module.exports = EvidenceBuilder;
