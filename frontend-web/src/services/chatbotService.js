import { apiRequest, getStoreId } from './apiClient';

/**
 * Chatbot Service
 * Communicates with the backend RAG-based AI assistant.
 */
const chatbotService = {
  /**
   * Send a message to the AI chatbot.
   * @param {string} message - The user's query.
   * @returns {Promise<Object>} - { response: string, session_id: number }
   */
  async sendMessage(message) {
    const storeId = getStoreId();
    return await apiRequest('/chatbot/chat', {
      method: 'POST',
      body: { message, store_id: storeId },
    });
  },

  /**
   * List recent chat sessions for the current user.
   * @returns {Promise<Array>}
   */
  async getSessions() {
    const storeId = getStoreId();
    return await apiRequest(`/chatbot/sessions?store_id=${storeId}`);
  },

  /**
   * Get full message history for a specific session.
   * @param {number} sessionId 
   * @returns {Promise<Object>}
   */
  async getSessionDetail(sessionId) {
    return await apiRequest(`/chatbot/sessions/${sessionId}`);
  },

  /**
   * End a chat session.
   * @param {number} sessionId 
   */
  async endSession(sessionId) {
    return await apiRequest(`/chatbot/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  },

  /**
   * Admin: Ingest store data into the RAG index.
   * @param {Object} options - { ingest_faqs: bool, ingest_policies: bool, ingest_products: bool }
   */
  async ingestData(options = { ingest_faqs: true, ingest_policies: true, ingest_products: true }) {
    const storeId = getStoreId();
    return await apiRequest('/chatbot/admin/ingest', {
      method: 'POST',
      body: { store_id: storeId, ...options },
    });
  },

  /**
   * Admin: Rebuild the FAISS index from scratch.
   */
  async rebuildIndex() {
    const storeId = getStoreId();
    return await apiRequest('/chatbot/admin/rebuild', {
      method: 'POST',
      body: { store_id: storeId },
    });
  }
};

export default chatbotService;
