const JobOfferService = require('../services/jobOfferServices');
const responseFormatter = require('../utils/responseFormatter');
const { ValidationError } = require('../utils/errorTypes');

const JobOfferController = {
  // Report a job offer
  reportOffer: async (req, res, next) => {
    try {
      const { sessionId, offerDetails } = req.body;
      const userId = req.user.id;
      const reportedBy = req.user.userType;

      const jobOffer = await JobOfferService.reportJobOffer({
        sessionId,
        userId,
        reportedBy,
        offerDetails
      });

      return responseFormatter.created(res, { jobOffer }, 'Job offer reported successfully');
    } catch (error) {
      next(error);
    }
  },

  // Confirm a reported job offer
  confirmOffer: async (req, res, next) => {
    try {
      const { offerId } = req.params;
      const userId = req.user.id;
      const confirmedBy = req.user.userType;

      const jobOffer = await JobOfferService.confirmJobOffer(offerId, userId, confirmedBy);

      return responseFormatter.success(res, { jobOffer }, 'Job offer confirmed successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get job offers for current user
  getMyOffers: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;

      const offers = await JobOfferService.getUserJobOffers(userId, userType);

      return responseFormatter.success(res, { offers });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = JobOfferController;