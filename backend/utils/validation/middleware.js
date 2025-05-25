const { validationResult } = require('express-validator');
const { ValidationError } = require('../errorTypes');

/**
 * Run provided validations and handle any errors.
 * @param {Array} validations - array of validation chains from express-validator
 * @returns Express middleware
 */
function validate(validations) {
  return async (req, res, next) => {
    if (Array.isArray(validations)) {
      await Promise.all(validations.map(v => v.run(req)));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formatted = {};
      errors.array().forEach(err => {
        formatted[err.param] = err.msg;
      });
      return next(new ValidationError('Validation error', formatted));
    }

    return next();
  };
}

module.exports = validate;
