/**
 * Model selection service for cost-effective LLM usage
 * Chooses optimal models based on task type, complexity, and cost considerations
 */
class ModelSelectionService {
  constructor() {
    // Model definitions with cost and capability profiles
    this.models = {
      // High-end models (expensive but capable)
      'gpt-4o': {
        provider: 'openai',
        costPer1kInput: 0.005,
        costPer1kOutput: 0.015,
        capabilities: ['reasoning', 'synthesis', 'complex-extraction'],
        maxTokens: 128000,
        quality: 'high'
      },
      'gpt-4o-mini': {
        provider: 'openai',
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        capabilities: ['reasoning', 'synthesis', 'extraction', 'planning'],
        maxTokens: 128000,
        quality: 'medium-high'
      },
      
      // Mid-tier models (balanced cost and capability)
      'claude-3.5-sonnet': {
        provider: 'anthropic',
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        capabilities: ['reasoning', 'synthesis', 'complex-extraction'],
        maxTokens: 200000,
        quality: 'high'
      },
      'claude-3-haiku': {
        provider: 'anthropic',
        costPer1kInput: 0.00025,
        costPer1kOutput: 0.00125,
        capabilities: ['extraction', 'simple-reasoning', 'classification'],
        maxTokens: 200000,
        quality: 'medium'
      },
      
      // Budget models (cheap but capable for simple tasks)
      'gpt-3.5-turbo': {
        provider: 'openai',
        costPer1kInput: 0.0005,
        costPer1kOutput: 0.0015,
        capabilities: ['extraction', 'simple-reasoning', 'classification'],
        maxTokens: 16385,
        quality: 'medium'
      },
      'claude-3-opus': {
        provider: 'anthropic',
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        capabilities: ['reasoning', 'synthesis', 'complex-extraction'],
        maxTokens: 200000,
        quality: 'very-high'
      }
    };

    // Task type to model mappings
    this.taskModelMappings = {
      'planning': {
        preferred: ['gpt-4o-mini', 'claude-3.5-sonnet'],
        fallback: ['gpt-3.5-turbo'],
        minQuality: 'medium'
      },
      'extraction': {
        preferred: ['gpt-4o-mini', 'claude-3-haiku', 'gpt-3.5-turbo'],
        fallback: ['gpt-4o-mini'],
        minQuality: 'medium'
      },
      'evaluation': {
        preferred: ['gpt-4o-mini', 'claude-3.5-sonnet'],
        fallback: ['gpt-4o'],
        minQuality: 'medium-high'
      },
      'synthesis': {
        preferred: ['gpt-4o', 'claude-3.5-sonnet', 'gpt-4o-mini'],
        fallback: ['claude-3-opus'],
        minQuality: 'high'
      },
      'verification': {
        preferred: ['gpt-4o-mini', 'claude-3.5-sonnet'],
        fallback: ['gpt-4o'],
        minQuality: 'medium-high'
      }
    };

    // Default models for different task modes
    this.modeDefaults = {
      'FAST': {
        planning: 'gpt-4o-mini',
        extraction: 'gpt-3.5-turbo',
        evaluation: 'gpt-4o-mini',
        synthesis: 'gpt-4o-mini'
      },
      'STANDARD': {
        planning: 'gpt-4o-mini',
        extraction: 'gpt-4o-mini',
        evaluation: 'gpt-4o-mini',
        synthesis: 'gpt-4o-mini'
      },
      'DEEP': {
        planning: 'claude-3.5-sonnet',
        extraction: 'gpt-4o-mini',
        evaluation: 'claude-3.5-sonnet',
        synthesis: 'gpt-4o'
      }
    };
  }

  /**
   * Select optimal model for a given task
   */
  selectModel(taskType, options = {}) {
    const {
      mode = 'STANDARD',
      complexity = 'medium',
      requiredCapabilities = [],
      budgetConstraint = false,
      customModel = null
    } = options;

    // If custom model is specified, use it
    if (customModel && this.models[customModel]) {
      console.log(`[ModelSelection] Using custom model: ${customModel}`);
      return customModel;
    }

    // Get mode-specific defaults
    const modeDefaults = this.modeDefaults[mode] || this.modeDefaults['STANDARD'];
    const defaultModel = modeDefaults[taskType] || 'gpt-4o-mini';

    // If budget constraint is enabled, prefer cheaper models
    if (budgetConstraint) {
      const budgetModel = this.selectBudgetModel(taskType, complexity);
      if (budgetModel) {
        console.log(`[ModelSelection] Budget model selected: ${budgetModel}`);
        return budgetModel;
      }
    }

    // Check if required capabilities need specific models
    if (requiredCapabilities.length > 0) {
      const capableModel = this.selectModelByCapabilities(taskType, requiredCapabilities);
      if (capableModel) {
        console.log(`[ModelSelection] Capability-based model: ${capableModel}`);
        return capableModel;
      }
    }

    // Use complexity-based selection
    const complexityModel = this.selectModelByComplexity(taskType, complexity);
    console.log(`[ModelSelection] Complexity-based model: ${complexityModel}`);
    return complexityModel;
  }

  /**
   * Select budget-friendly model
   */
  selectBudgetModel(taskType, complexity) {
    const taskMapping = this.taskModelMappings[taskType];
    if (!taskMapping) return 'gpt-4o-mini';

    // Sort preferred models by cost (cheapest first)
    const sortedModels = taskMapping.preferred
      .map(modelName => this.models[modelName])
      .filter(model => model)
      .sort((a, b) => {
        const costA = a.costPer1kInput + a.costPer1kOutput;
        const costB = b.costPer1kInput + b.costPer1kOutput;
        return costA - costB;
      });

    if (sortedModels.length > 0) {
      return sortedModels[0].provider === 'openai' ? 
        `openai/${Object.keys(this.models).find(key => this.models[key] === sortedModels[0])}` :
        `anthropic/${Object.keys(this.models).find(key => this.models[key] === sortedModels[0])}`;
    }

    return 'gpt-4o-mini';
  }

  /**
   * Select model based on required capabilities
   */
  selectModelByCapabilities(taskType, requiredCapabilities) {
    const taskMapping = this.taskModelMappings[taskType];
    if (!taskMapping) return null;

    for (const modelName of taskMapping.preferred) {
      const model = this.models[modelName];
      if (!model) continue;

      const hasAllCapabilities = requiredCapabilities.every(cap => 
        model.capabilities.includes(cap)
      );

      if (hasAllCapabilities) {
        return modelName;
      }
    }

    return null;
  }

  /**
   * Select model based on task complexity
   */
  selectModelByComplexity(taskType, complexity) {
    const taskMapping = this.taskModelMappings[taskType];
    if (!taskMapping) return 'gpt-4o-mini';

    // High complexity tasks need better models
    if (complexity === 'high') {
      // Check if high-quality model is available in preferred
      const highQualityModel = taskMapping.preferred.find(name => {
        const model = this.models[name];
        return model && (model.quality === 'high' || model.quality === 'very-high');
      });
      
      if (highQualityModel) return highQualityModel;
      
      // Fall back to first preferred
      return taskMapping.preferred[0];
    }

    // Medium complexity - use preferred models
    if (complexity === 'medium') {
      return taskMapping.preferred[0];
    }

    // Low complexity - can use cheaper models
    if (complexity === 'low') {
      const cheapModel = taskMapping.preferred.find(name => {
        const model = this.models[name];
        return model && model.quality === 'medium';
      });
      
      if (cheapModel) return cheapModel;
    }

    return taskMapping.preferred[0];
  }

  /**
   * Estimate cost for a given model and token usage
   */
  estimateCost(modelName, inputTokens, outputTokens) {
    const model = this.models[modelName.replace('openai/', '').replace('anthropic/', '')];
    if (!model) return null;

    const inputCost = (inputTokens / 1000) * model.costPer1kInput;
    const outputCost = (outputTokens / 1000) * model.costPer1kOutput;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      model: modelName
    };
  }

  /**
   * Get model information
   */
  getModelInfo(modelName) {
    const cleanName = modelName.replace('openai/', '').replace('anthropic/', '');
    return this.models[cleanName] || null;
  }

  /**
   * Compare costs between models
   */
  compareModels(modelNames, inputTokens, outputTokens) {
    return modelNames.map(name => {
      const cost = this.estimateCost(name, inputTokens, outputTokens);
      return {
        model: name,
        ...cost,
        savings: cost ? (1 - cost.totalCost / 0.01) * 100 : 0 // Relative to $0.01 baseline
      };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }

  /**
   * Get recommended model for worker type
   */
  getWorkerModel(workerType, mode = 'STANDARD') {
    const workerTypeMap = {
      'planner': 'planning',
      'extract': 'extraction',
      'evaluate': 'evaluation',
      'synthesis': 'synthesis',
      'verification': 'verification'
    };

    const taskType = workerTypeMap[workerType] || 'extraction';
    return this.selectModel(taskType, { mode });
  }
}

module.exports = new ModelSelectionService();