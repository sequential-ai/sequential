/**
 * Query Constraint Extraction Service
 * Dynamically extracts user's actual constraints from queries
 * Distinguishes intent, entity type, required constraints, and excluded types
 */

class QueryConstraintService {
  constructor() {
    this.intentPatterns = {
      rank_entities: [/top\s+\d+/i, /best\s+\d+/i, /leading\s+\d+/i, /most\s+important/i],
      find_information: [/what\s+is/i, /how\s+does/i, /explain/i, /describe/i],
      compare: [/vs\b/i, /compared\s+to/i, /difference/i, /better/i],
      list: [/list\s+all/i, /examples\s+of/i, /types\s+of/i]
    };

    this.entityTypePatterns = {
      startup: [/startup/i, /company\s+under/i, /funded\s+by/i, /seed\s+round/i, /series\s+[a-z]/i],
      company: [/company/i, /corporation/i, /enterprise/i, /business/i],
      product: [/product/i, /tool/i, /software/i, /platform/i, /service/i],
      model: [/model/i, /llm/i, /gpt/i, /claude/i, /gemini/i],
      framework: [/framework/i, /library/i, /sdk/i, /api/i],
      open_source: [/open\s+source/i, /github/i, /oss/i, /free/i],
      platform: [/platform/i, /infrastructure/i, /cloud/i],
      research_paper: [/paper/i, /study/i, /research/i, /arxiv/i, /journal/i],
      person: [/founder/i, /ceo/i, /developer/i, /author/i]
    };

    this.constraintPatterns = {
      startup: [/startup/i, /early\s+stage/i, /vc\s+backed/i, /founded/i],
      active: [/active/i, /operating/i, /current/i, /live/i, /launched/i],
      ai: [/ai/i, /artificial\s+intelligence/i, /machine\s+learning/i, /ml/i],
      saas: [/saas/i, /software\s+as\s+a\s+service/i, /cloud/i, /subscription/i],
      autonomous: [/autonomous/i, /self.*driving/i, /agent/i, /independent/i],
      agent: [/agent/i, /bot/i, /assistant/i, /copilot/i],
      infrastructure: [/infrastructure/i, /platform/i, /framework/i, /tool/i],
      location: [/in\s+([a-z\s]+)/i, /based\s+in/i],
      time: [/after\s+(\d{4})/i, /before\s+(\d{4})/i, /in\s+(\d{4})/i],
      size: [/under\s+(\d+)/i, /over\s+(\d+)/i, /more\s+than\s+(\d+)/i]
    };

    this.excludedTypePatterns = {
      large_incumbent: [/microsoft/i, /google/i, /amazon/i, /meta/i, /apple/i, /salesforce/i, /oracle/i, /ibm/i],
      generic_model: [/gpt/i, /claude/i, /gemini/i, /llama/i],
      unrelated_automation: [/workato/i, /zapier/i, /ifttt/i/i]
    };
  }

  /**
   * Extract constraints from user query
   */
  extractConstraints(query) {
    const queryLower = query.toLowerCase();

    // Detect intent
    const intent = this.detectIntent(queryLower);

    // Detect entity type
    const entityType = this.detectEntityType(queryLower);

    // Extract required constraints
    const requiredConstraints = this.extractRequiredConstraints(queryLower, entityType);

    // Extract preferred constraints
    const preferredConstraints = this.extractPreferredConstraints(queryLower);

    // Detect excluded types
    const excludedTypes = this.detectExcludedTypes(queryLower);

    // Extract ranking criteria for rank_entity queries
    const rankingCriteria = intent === 'rank_entities' 
      ? this.extractRankingCriteria(queryLower, entityType)
      : null;

    return {
      intent,
      entityType,
      requiredConstraints,
      preferredConstraints,
      excludedTypes,
      rankingCriteria,
      originalQuery: query
    };
  }

  /**
   * Detect query intent
   */
  detectIntent(queryLower) {
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(queryLower)) {
          return intent;
        }
      }
    }
    return 'find_information';
  }

  /**
   * Detect entity type from query
   */
  detectEntityType(queryLower) {
    for (const [type, patterns] of Object.entries(this.entityTypePatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(queryLower)) {
          return type;
        }
      }
    }
    return 'entity';
  }

  /**
   * Extract required constraints
   */
  extractRequiredConstraints(queryLower, entityType) {
    const constraints = [];

    for (const [constraint, patterns] of Object.entries(this.constraintPatterns)) {
      for (const pattern of patterns) {
        const match = queryLower.match(pattern);
        if (match) {
          constraints.push({
            type: constraint,
            value: match[1] || true,
            source: 'explicit'
          });
        }
      }
    }

    // Add entity type as implicit constraint
    if (entityType !== 'entity') {
      constraints.push({
        type: entityType,
        value: true,
        source: 'implicit'
      });
    }

    return constraints;
  }

  /**
   * Extract preferred constraints
   */
  extractPreferredConstraints(queryLower) {
    const preferred = [];
    
    // Words like "ideally", "preferably", "bonus if"
    if (/ideally|preferably|bonus\s+if/i.test(queryLower)) {
      // Extract following conditions
    const match = queryLower.match(/(ideally|preferably|bonus\s+if)\s+(.+)/i);
      if (match) {
        preferred.push({
          condition: match[2],
          source: 'explicit'
        });
      }
    }

    return preferred;
  }

  /**
   * Detect excluded types
   */
  detectExcludedTypes(queryLower) {
    const excluded = [];

    for (const [type, patterns] of Object.entries(this.excludedTypePatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(queryLower)) {
          excluded.push({
            type,
            source: 'explicit'
          });
        }
      }
    }

    return excluded;
  }

  /**
   * Extract ranking criteria for entity ranking queries
   */
  extractRankingCriteria(queryLower, entityType) {
    const criteria = [];

    // Default criteria based on entity type
    if (entityType === 'startup') {
      criteria.push(
        { name: 'query_relevance', weight: 0.25 },
        { name: 'traction', weight: 0.20 },
        { name: 'funding', weight: 0.15 },
        { name: 'product_maturity', weight: 0.15 },
        { name: 'technical_differentiation', weight: 0.15 },
        { name: 'recent_activity', weight: 0.10 }
      );
    } else if (entityType === 'product') {
      criteria.push(
        { name: 'query_relevance', weight: 0.30 },
        { name: 'maturity', weight: 0.25 },
        { name: 'features', weight: 0.20 },
        { name: 'user_adoption', weight: 0.15 },
        { name: 'pricing', weight: 0.10 }
      );
    } else {
      criteria.push(
        { name: 'query_relevance', weight: 0.40 },
        { name: 'authority', weight: 0.30 },
        { name: 'recency', weight: 0.20 },
        { name: 'specificity', weight: 0.10 }
      );
    }

    // Check for explicit ranking criteria in query
    if (/by\s+(funding|revenue|users|growth)/i.test(queryLower)) {
      const match = queryLower.match(/by\s+(funding|revenue|users|growth)/i);
      if (match) {
        criteria.unshift({
          name: match[1],
          weight: 0.35,
          source: 'explicit'
        });
      }
    }

    return criteria;
  }
}

module.exports = new QueryConstraintService();