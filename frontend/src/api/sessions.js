import api from "../services/api/client";
import { handleRequest } from "../services/api/helpers";

const SessionsAPI = {
  /**
   * Create a new session
   * @param {Object} sessionData - Session details
   * @returns {Promise<Object>} Created session
   */
  createSession: (sessionData) =>
    handleRequest(api.post("/sessions", sessionData)),

  /**
   * Fetch a session by id
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Session data
   */
  getSession: (sessionId) =>
    handleRequest(api.get(`/sessions/${sessionId}`)),

  /**
   * List sessions for the current user
   */
  getUserSessions: (status, page = 1, limit = 10) => {
    const queryParams = new URLSearchParams();

    if (status) queryParams.append("status", status);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    return handleRequest(
      api.get(`/sessions/user/me?${queryParams.toString()}`)
    );
  },

  /**
   * List sessions for the current professional
   */
  getProfessionalSessions: (status, page = 1, limit = 10) => {
    const queryParams = new URLSearchParams();

    if (status) queryParams.append("status", status);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    return handleRequest(
      api.get(`/sessions/professional/me?${queryParams.toString()}`)
    );
  },

  /**
   * Update the status of a session
   * @param {string} sessionId - Session identifier
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated session
   */
  updateSessionStatus: (sessionId, status) =>
    handleRequest(
      api.put(`/sessions/${sessionId}/status`, { status })
    ),

  /**
   * Update session schedule
   * @param {string} sessionId - Session identifier
   * @param {string} startTime - New start time
   * @param {string} endTime - New end time
   * @returns {Promise<Object>} Updated session
   */
  updateSessionSchedule: (sessionId, startTime, endTime) =>
    handleRequest(
      api.put(`/sessions/${sessionId}/reschedule`, {
        startTime,
        endTime,
      })
    ),

  /**
   * Create a payment for a session
   * @param {string} sessionId - Session identifier
   * @param {string} paymentMethodId - Stripe payment method id
   * @returns {Promise<Object>} Payment data
   */
  createPayment: (sessionId, paymentMethodId) =>
    handleRequest(
      api.post(`/sessions/${sessionId}/payment`, {
        paymentMethodId,
      })
    ),

  /**
   * Create feedback for a session
   * @param {string} sessionId - Session identifier
   * @param {number} rating - Star rating
   * @param {string} comment - Feedback text
   * @returns {Promise<Object>} Updated session
   */
  createFeedback: (sessionId, rating, comment) =>
    handleRequest(
      api.post(`/sessions/${sessionId}/feedback`, {
        rating,
        comment,
      })
    ),

  /**
   * Check professional availability
   * @param {string} professionalId - Professional identifier
   * @param {string} startTime - Desired start time
   * @param {string} endTime - Desired end time
   * @returns {Promise<boolean>} Availability flag
   */
  getAvailability: (professionalId, startTime, endTime) =>
    handleRequest(
      api.post("/sessions/check-availability", {
        professionalId,
        startTime,
        endTime,
      })
    ),
};

export default SessionsAPI;
