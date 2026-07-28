const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

class TaskValidator {
  /**
   * Validates output data against a provided JSON Schema (taskSpec)
   * @param {Object} schema - JSON Schema Draft-07 compliant schema
   * @param {Object} data - The data to validate
   * @returns {Object} { valid: boolean, errors: Array }
   */
  static validate(schema, data) {
    if (!schema || Object.keys(schema).length === 0) {
      return { valid: true, errors: [] }; // No schema provided, pass by default
    }

    try {
      const validateFn = ajv.compile(schema);
      const valid = validateFn(data);
      return {
        valid,
        errors: validateFn.errors || [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: `Schema compilation error: ${error.message}` }],
      };
    }
  }
}

module.exports = TaskValidator;
