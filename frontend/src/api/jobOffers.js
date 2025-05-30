import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const JobOffersAPI = {
  /**
   * Report a job offer
   * @param {string} sessionId - Session identifier
   * @param {Object} offerDetails - Offer details
   * @returns {Promise<Object>} Created job offer
   */
  reportOffer: (sessionId, offerDetails) =>
    handleRequest(
      api.post('/job-offers/report', {
        sessionId,
        offerDetails
      })
    ),

  /**
   * Confirm a reported job offer
   * @param {string} offerId - Job offer identifier
   * @returns {Promise<Object>} Updated job offer
   */
  confirmOffer: (offerId) =>
    handleRequest(api.post(`/job-offers/${offerId}/confirm`)),

  /**
   * Get job offers for the current user
   * @returns {Promise<Array>} Job offers array
   */
  getMyOffers: () => handleRequest(api.get('/job-offers/me'))
};

export default JobOffersAPI;