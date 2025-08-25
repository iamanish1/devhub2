import axios from 'axios';
import { API_ENDPOINTS } from '../Config/api.js';

// Get auth token
const getAuthToken = () => localStorage.getItem('token');

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Escrow Wallet API Service
 * Handles all escrow wallet related API calls
 */
export const escrowWalletApi = {
  /**
   * Create escrow wallet for a project
   */
  createEscrowWallet: async (projectId, bonusPoolAmount) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_ESCROW(projectId),
        { bonusPoolAmount }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get escrow wallet details
   */
  getEscrowWallet: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_ESCROW(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Lock user funds in escrow
   */
  lockUserFunds: async (projectId, userId, bidId) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.LOCK_USER_FUNDS(projectId, userId, bidId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Release user funds from escrow
   */
  releaseUserFunds: async (projectId, userId, bidId, reason = 'project_completion', notes = '') => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.RELEASE_USER_FUNDS(projectId, userId, bidId),
        { reason, notes }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Refund user funds
   */
  refundUserFunds: async (projectId, userId, bidId, reason = 'cancellation', notes = '') => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.REFUND_USER_FUNDS(projectId, userId, bidId),
        { reason, notes }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Complete project and release all funds
   */
  completeProject: async (projectId, completionNotes = '', qualityScore) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.COMPLETE_PROJECT(projectId),
        { completionNotes, qualityScore }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all escrow wallets for project owner
   */
  getProjectOwnerEscrows: async () => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_PROJECT_OWNER_ESCROWS
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get escrow statistics
   */
  getEscrowStats: async () => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_ESCROW_STATS
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get user's escrow wallet for a specific project
   */
  getUserEscrowWallet: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_USER_ESCROW(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get user's escrow status for a specific project
   */
  getUserEscrowStatus: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_USER_ESCROW_STATUS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Request withdrawal of user's escrow funds
   */
  requestUserWithdrawal: async (projectId, withdrawalData) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.REQUEST_USER_WITHDRAWAL(projectId),
        withdrawalData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default escrowWalletApi;
