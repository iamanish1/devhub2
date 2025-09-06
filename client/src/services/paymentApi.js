import API_BASE_URL from '../Config/api.js';
import { PAYMENT_ERRORS } from '../constants/paymentConstants.js';

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
  WITHDRAWAL_HISTORY: `${API_BASE_URL}/api/payments/withdrawal/history`,
  PAYMENT_ANALYTICS: `${API_BASE_URL}/api/payments/analytics`,
  PAYMENT_SUMMARY: `${API_BASE_URL}/api/payments/summary`,
  REFUND_HISTORY: `${API_BASE_URL}/api/payments/refund/history`,
  PROCESS_REFUND: (paymentIntentId) => `${API_BASE_URL}/api/payments/refund/${paymentIntentId}`,
  CHECK_PAYMENT: (orderId) => `${API_BASE_URL}/api/payments/check/${orderId}`
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If JSON parsing fails, use default error message
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid response format');
  }
};

// Helper function to make API requests
const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(PAYMENT_ERRORS.NETWORK_ERROR);
    }
    throw error;
  }
};

// Payment API functions
export const paymentApi = {
  // Bid Fee Payment
  createBidFeePayment: async (projectId, bidId) => {
    try {
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
    } catch (error) {
      console.error('Bid fee payment error:', error);
      throw error;
    }
  },

  // Bonus Funding Payment
  createBonusFundingPayment: async (projectId, contributorCount, projectTitle, isNewProject = false, amountPerContributor = 200) => {
    try {
      const amount = contributorCount * amountPerContributor;
      const response = await makeRequest(PAYMENT_ENDPOINTS.BONUS, {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          amount,
          contributorsCount: contributorCount,
          projectTitle,
          isNewProject,
          amountPerContributor,
          purpose: 'bonus_funding'
        })
      });
      return response.data;
    } catch (error) {
      console.error('Bonus funding payment error:', error);
      throw error;
    }
  },

  // Subscription Payment
  createSubscriptionPayment: async (planName = 'starter', planType = 'monthly', amount) => {
    try {
      console.log('Creating subscription payment:', { planName, planType, amount });
      const response = await makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION, {
        method: 'POST',
        body: JSON.stringify({
          planName,
          planType,
          amount,
          purpose: 'subscription'
        })
      });
      console.log('Subscription payment response:', response);
      return response.data;
    } catch (error) {
      console.error('Subscription payment error:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Withdrawal Fee Payment
  createWithdrawalPayment: async (amount) => {
    try {
      if (!amount || amount <= 0 || amount > 10000) {
        throw new Error('Invalid withdrawal amount. Must be between ₹1 and ₹10,000');
      }
      
      const response = await makeRequest(PAYMENT_ENDPOINTS.WITHDRAWAL, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          fee: 15,
          purpose: 'withdrawal_fee'
        })
      });
      return response.data;
    } catch (error) {
      console.error('Withdrawal payment error:', error);
      throw error;
    }
  },

  // Get Payment History
  getPaymentHistory: async (page = 1, limit = 50) => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.PAYMENT_HISTORY}?page=${page}&limit=${limit}`);
      return response.data?.payments || [];
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  },

  // Get Withdrawal History
  getWithdrawalHistory: async (page = 1, limit = 50) => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.WITHDRAWAL_HISTORY}?page=${page}&limit=${limit}`);
      return response.data?.withdrawals || [];
    } catch (error) {
      console.error('Get withdrawal history error:', error);
      throw error;
    }
  },

  // Get Bonus Pools
  getBonusPools: async () => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.BONUS_POOLS);
      return response.data || [];
    } catch (error) {
      console.error('Get bonus pools error:', error);
      throw error;
    }
  },

  // Get Subscription Status
  getSubscriptionStatus: async () => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION_STATUS);
      return response.data;
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw error;
    }
  },

  // Get Subscription Plans
  getSubscriptionPlans: async () => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/subscription/plans`);
      return response.data;
    } catch (error) {
      console.error('Get subscription plans error:', error);
      throw error;
    }
  },

  // Activate Subscription
  activateSubscription: async (paymentIntentId) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/subscription/activate/${paymentIntentId}`, {
        method: 'POST'
      });
      return response.data;
    } catch (error) {
      console.error('Activate subscription error:', error);
      throw error;
    }
  },

  // Cancel Subscription
  cancelSubscription: async () => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/subscription/cancel`, {
        method: 'POST'
      });
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  },

  // Check Payment Status
  getPaymentStatus: async (orderId) => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.PAYMENT_STATUS(orderId));
      return response.data;
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error;
    }
  },

  // Get Payment Analytics
  getPaymentAnalytics: async (period = '30d') => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.PAYMENT_ANALYTICS}?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Get payment analytics error:', error);
      throw error;
    }
  },

  // Get Payment Summary
  getPaymentSummary: async () => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.PAYMENT_SUMMARY);
      return response.data;
    } catch (error) {
      console.error('Get payment summary error:', error);
      throw error;
    }
  },

  // Get Refund History
  getRefundHistory: async (page = 1, limit = 50) => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.REFUND_HISTORY}?page=${page}&limit=${limit}`);
      return response.data?.refunds || [];
    } catch (error) {
      console.error('Get refund history error:', error);
      throw error;
    }
  },

  // Process Refund
  processRefund: async (paymentIntentId, reason = 'User requested refund') => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.PROCESS_REFUND(paymentIntentId), {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return response.data;
    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  },

  // Check Payment and Update Bid
  checkPaymentAndUpdateBid: async (orderId) => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.CHECK_PAYMENT(orderId));
      return response.data;
    } catch (error) {
      console.error('Check payment error:', error);
      throw error;
    }
  },

  // Cancel Subscription
  cancelSubscription: async () => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION, {
        method: 'DELETE'
      });
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  },

  // Update Payment Method
  updatePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/payment-method`, {
        method: 'PUT',
        body: JSON.stringify({ paymentMethodId })
      });
      return response.data;
    } catch (error) {
      console.error('Update payment method error:', error);
      throw error;
    }
  },

  // Verify Payment with Razorpay
  verifyPayment: async (paymentId, orderId, signature) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/verify`, {
        method: 'POST',
        body: JSON.stringify({
          paymentId,
          orderId,
          signature
        })
      });
      return response.data;
    } catch (error) {
      console.error('Verify payment error:', error);
      throw error;
    }
  },

  // Get Payment Receipt
  getPaymentReceipt: async (paymentId) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/receipt/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment receipt error:', error);
      throw error;
    }
  }
};

export default paymentApi;
