import API_BASE_URL from '../Config/api.js';

// Payment API endpoints
const PAYMENT_ENDPOINTS = {
  BID_FEE: `${API_BASE_URL}/api/payments/bid-fee`,
  LISTING: `${API_BASE_URL}/api/payments/listing`,
  BONUS: `${API_BASE_URL}/api/payments/bonus`,
  SUBSCRIPTION: `${API_BASE_URL}/api/payments/subscription`,
  WITHDRAWAL: `${API_BASE_URL}/api/payments/withdrawal`,
  PAYMENT_STATUS: (orderId) => `${API_BASE_URL}/api/payments/status/${orderId}`,
  PAYMENT_HISTORY: `${API_BASE_URL}/api/payments/history`,
  SUBSCRIPTION_STATUS: `${API_BASE_URL}/api/payments/subscription/status`,
  BONUS_POOLS: `${API_BASE_URL}/api/payments/bonus-pools`,
  WITHDRAWAL_HISTORY: `${API_BASE_URL}/api/payments/withdrawal/history`
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Helper function to make API requests
const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return handleResponse(response);
};

// Payment API functions
export const paymentApi = {
  // Bid Fee Payment
  createBidFeePayment: async (projectId, bidId) => {
    return makeRequest(PAYMENT_ENDPOINTS.BID_FEE, {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        bidId,
        amount: 9,
        purpose: 'bid_fee'
      })
    });
  },

  // Bonus Funding Payment
  createBonusFundingPayment: async (projectId, contributorCount) => {
    const amount = contributorCount * 200;
    return makeRequest(PAYMENT_ENDPOINTS.BONUS, {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        amount,
        contributorCount,
        purpose: 'bonus_funding'
      })
    });
  },

  // Subscription Payment
  createSubscriptionPayment: async (planType = 'monthly') => {
    return makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION, {
      method: 'POST',
      body: JSON.stringify({
        amount: 299,
        planType,
        purpose: 'subscription'
      })
    });
  },

  // Withdrawal Fee Payment
  createWithdrawalPayment: async (amount) => {
    return makeRequest(PAYMENT_ENDPOINTS.WITHDRAWAL, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        fee: 15,
        purpose: 'withdrawal_fee'
      })
    });
  },

  // Check Payment Status
  getPaymentStatus: async (orderId) => {
    return makeRequest(PAYMENT_ENDPOINTS.PAYMENT_STATUS(orderId));
  },

  // Get Payment History
  getPaymentHistory: async (page = 1, limit = 10) => {
    return makeRequest(`${PAYMENT_ENDPOINTS.PAYMENT_HISTORY}?page=${page}&limit=${limit}`);
  },

  // Get Subscription Status
  getSubscriptionStatus: async () => {
    return makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION_STATUS);
  },

  // Get Bonus Pools
  getBonusPools: async () => {
    return makeRequest(PAYMENT_ENDPOINTS.BONUS_POOLS);
  },

  // Get Withdrawal History
  getWithdrawalHistory: async (page = 1, limit = 10) => {
    return makeRequest(`${PAYMENT_ENDPOINTS.WITHDRAWAL_HISTORY}?page=${page}&limit=${limit}`);
  },

  // Cancel Subscription
  cancelSubscription: async () => {
    return makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION, {
      method: 'DELETE'
    });
  },

  // Update Payment Method
  updatePaymentMethod: async (paymentMethodId) => {
    return makeRequest(`${API_BASE_URL}/api/payments/payment-method`, {
      method: 'PUT',
      body: JSON.stringify({ paymentMethodId })
    });
  }
};

export default paymentApi;
