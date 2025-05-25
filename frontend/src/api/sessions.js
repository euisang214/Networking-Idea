import api from "../services/api/client";

const SessionsAPI = {
  // Create a new session
  createSession: async (sessionData) => {
    const response = await api.post("/sessions", sessionData);
    return response.data.data.session;
  },

  // Get session by ID
  getSession: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data.data.session;
  },

  // Get current user's sessions
  getUserSessions: async (status, page = 1, limit = 10) => {
    const queryParams = new URLSearchParams();

    if (status) queryParams.append("status", status);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    const response = await api.get(
      `/sessions/user/me?${queryParams.toString()}`,
    );
    return response.data;
  },

  // Get professional's sessions
  getProfessionalSessions: async (status, page = 1, limit = 10) => {
    const queryParams = new URLSearchParams();

    if (status) queryParams.append("status", status);
    queryParams.append("page", page);
    queryParams.append("limit", limit);

    const response = await api.get(
      `/sessions/professional/me?${queryParams.toString()}`,
    );
    return response.data;
  },

  // Update session status
  updateSessionStatus: async (sessionId, status) => {
    const response = await api.put(`/sessions/${sessionId}/status`, { status });
    return response.data.data.session;
  },

  // Reschedule session
  rescheduleSession: async (sessionId, startTime, endTime) => {
    const response = await api.put(`/sessions/${sessionId}/reschedule`, {
      startTime,
      endTime,
    });
    return response.data.data.session;
  },

  // Process payment for session
  processPayment: async (sessionId, paymentMethodId) => {
    const response = await api.post(`/sessions/${sessionId}/payment`, {
      paymentMethodId,
    });
    return response.data.data.payment;
  },

  // Add feedback to session
  addFeedback: async (sessionId, rating, comment) => {
    const response = await api.post(`/sessions/${sessionId}/feedback`, {
      rating,
      comment,
    });
    return response.data.data.session;
  },

  // Check professional availability
  checkAvailability: async (professionalId, startTime, endTime) => {
    const response = await api.post("/sessions/check-availability", {
      professionalId,
      startTime,
      endTime,
    });
    return response.data.data.available;
  },
};

export default SessionsAPI;
