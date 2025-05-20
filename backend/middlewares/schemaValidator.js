const Joi = require('../utils/simpleJoi');
const { ValidationError } = require('../utils/errorTypes');

function celebrate(schemas) {
  return (req, res, next) => {
    const errors = {};
    if (schemas.body) {
      const result = schemas.body.validate(req.body);
      if (result.error) errors.body = result.error.details;
      else req.body = result.value;
    }
    if (schemas.query) {
      const result = schemas.query.validate(req.query);
      if (result.error) errors.query = result.error.details;
      else req.query = result.value;
    }
    if (schemas.params) {
      const result = schemas.params.validate(req.params);
      if (result.error) errors.params = result.error.details;
      else req.params = result.value;
    }
    if (Object.keys(errors).length) {
      return next(new ValidationError('Validation failed', errors));
    }
    next();
  };
}

celebrate.Joi = Joi;

module.exports = celebrate;
