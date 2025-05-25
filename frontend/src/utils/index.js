const anonymizer = require('./anonymizer');
const errorHandler = require('./error-handler');

module.exports = {
  ...anonymizer,
  errorHandler
};
