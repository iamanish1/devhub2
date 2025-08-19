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
    const response = await makeRequest(PAYMENT_ENDPOINTS.BID_FEE, {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        bidId,
        amount: 9,
        purpose: 'bid_fee'
      })
    });
    return response.data;
  },

  // Bonus Funding Payment
  createBonusFundingPayment: async (projectId, contributorCount) => {
    const amount = contributorCount * 200;
    const response = await makeRequest(PAYMENT_ENDPOINTS.BONUS, {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        amount,
        contributorCount,
        purpose: 'bonus_funding'
      })
    });
    return response.data;
  },

  // Subscription Payment
  createSubscriptionPayment: async (planType = 'monthly') => {
    const response = await makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION, {
      method: 'POST',
      body: JSON.stringify({
        amount: 299,
        planType,
        purpose: 'subscription'
      })
    });
    return response.data;
  },

  // Withdrawal Fee Payment
  createWithdrawalPayment: async (amount) => {
    const response = await makeRequest(PAYMENT_ENDPOINTS.WITHDRAWAL, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        fee: 15,
        purpose: 'withdrawal_fee'
      })
    });
    return response.data;
  },

  // Get Payment History
  getPaymentHistory: async (page = 1, limit = 10) => {
    const response = await makeRequest(`${PAYMENT_ENDPOINTS.PAYMENT_HISTORY}?page=${page}&limit=${limit}`);
    return response.data.payments || [];
  },

  // Get Withdrawal History
  getWithdrawalHistory: async (page = 1, limit = 10) => {
    const response = await makeRequest(`${PAYMENT_ENDPOINTS.WITHDRAWAL_HISTORY}?page=${page}&limit=${limit}`);
    return response.data.withdrawals || [];
  },

  // Get Bonus Pools
  getBonusPools: async () => {
    const response = await makeRequest(PAYMENT_ENDPOINTS.BONUS_POOLS);
    return response.data || [];
  },

  // Get Subscription Status
  getSubscriptionStatus: async () => {
    const response = await makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION_STATUS);
    return response.data;
  },

  // Check Payment Status
  getPaymentStatus: async (orderId) => {
    const response = await makeRequest(PAYMENT_ENDPOINTS.PAYMENT_STATUS(orderId));
    return response.data;
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
