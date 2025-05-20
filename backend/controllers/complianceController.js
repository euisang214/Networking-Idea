const { gdprDeleteUser } = require('../utils/compliance');
const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

const ComplianceController = {
  deleteMe: async (req, res, next) => {
    try {
      await gdprDeleteUser(req.user.id);
      return responseFormatter.success(res, {}, 'User data deleted');
    } catch (err) {
      logger.error(`GDPR delete failed: ${err.message}`);
      next(err);
    }
  }
};

module.exports = ComplianceController;
