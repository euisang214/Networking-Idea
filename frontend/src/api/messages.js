import api from '../services/api/client';
import { handleRequest } from '../services/api/helpers';

const MessagesAPI = {
  /**
   * Send a message
   * @param {Object} messageData - Message details
   * @returns {Promise<Object>} Sent message
   */
  sendMessage: (messageData) =>
    handleRequest(api.post('/messages', messageData)),

  /**
   * Get conversation with a user
   * @param {string} userId - User ID
   * @param {number} limit - Message limit
   * @param {number} skip - Messages to skip
   * @returns {Promise<Array>} Messages array
   */
  getConversation: (userId, limit = 50, skip = 0) =>
    handleRequest(
      api.get(`/messages/conversation/${userId}?limit=${limit}&skip=${skip}`)
    ),

  /**
   * Get all conversations for current user
   * @returns {Promise<Array>} Conversations array
   */
  getConversations: () =>
    handleRequest(api.get('/messages/conversations')),

  /**
   * Get unread message count
   * @returns {Promise<number>} Unread count
   */
  getUnreadCount: () =>
    handleRequest(api.get('/messages/unread/count')),

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Updated message
   */
  markAsRead: (messageId) =>
    handleRequest(api.put(`/messages/${messageId}/read`)),

  /**
   * Get messages for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Session messages
   */
  getSessionMessages: (sessionId) =>
    handleRequest(api.get(`/messages/session/${sessionId}`))
};

export default MessagesAPI;