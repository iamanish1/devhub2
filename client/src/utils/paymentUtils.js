import { PAYMENT_AMOUNTS } from '../constants/paymentConstants.js';

// Format currency for display
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Calculate bonus pool amount
export const calculateBonusPoolAmount = (contributorCount) => {
  return contributorCount * PAYMENT_AMOUNTS.BONUS_PER_CONTRIBUTOR;
};

// Calculate withdrawal fee
export const calculateWithdrawalFee = (amount) => {
  return PAYMENT_AMOUNTS.WITHDRAWAL_FEE;
};

// Calculate total withdrawal amount (including fee)
export const calculateTotalWithdrawalAmount = (amount) => {
  return amount + calculateWithdrawalFee(amount);
};

// Validate withdrawal amount
export const validateWithdrawalAmount = (amount) => {
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount > PAYMENT_AMOUNTS.WITHDRAWAL_MAX) {
    return { 
      isValid: false, 
      error: `Maximum withdrawal amount is ${formatCurrency(PAYMENT_AMOUNTS.WITHDRAWAL_MAX)}` 
    };
  }
  
  return { isValid: true, error: null };
};

// Validate contributor count for bonus pool
export const validateContributorCount = (count) => {
  if (count <= 0) {
    return { isValid: false, error: 'Number of contributors must be greater than 0' };
  }
  
  if (count > 100) {
    return { isValid: false, error: 'Maximum 100 contributors allowed per project' };
  }
  
  return { isValid: true, error: null };
};

// Get payment status color
export const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'success':
    case 'paid':
      return 'text-green-400';
    case 'pending':
      return 'text-yellow-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

// Get payment status icon
export const getPaymentStatusIcon = (status) => {
  switch (status) {
    case 'success':
    case 'paid':
      return 'check-circle';
    case 'pending':
      return 'clock';
    case 'failed':
      return 'x-circle';
    default:
      return 'question-circle';
  }
};

// Format payment date
export const formatPaymentDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get payment type display name
export const getPaymentTypeDisplayName = (type) => {
  switch (type) {
    case 'bid_fee':
      return 'Bid Fee';
    case 'bonus_funding':
      return 'Bonus Funding';
    case 'withdrawal_fee':
      return 'Withdrawal Fee';
    case 'subscription':
      return 'Subscription';
    default:
      return type;
  }
};

// Get payment provider display name
export const getPaymentProviderDisplayName = (provider) => {
  switch (provider) {
    case 'razorpay':
      return 'Razorpay';
    default:
      return provider;
  }
};

// Calculate subscription savings
export const calculateSubscriptionSavings = (bidCount, listingCount) => {
  const bidSavings = bidCount * PAYMENT_AMOUNTS.BID_FEE;
  const listingSavings = listingCount * 0; // No listing fee
  return bidSavings + listingSavings;
};

// Check if payment is recent (within 24 hours)
export const isRecentPayment = (paymentDate) => {
  const payment = new Date(paymentDate);
  const now = new Date();
  const diffInHours = (now - payment) / (1000 * 60 * 60);
  return diffInHours <= 24;
};

// Generate payment summary
export const generatePaymentSummary = (payment) => {
  const { type, amount, status, createdAt, provider } = payment;
  
  return {
    type: getPaymentTypeDisplayName(type),
    amount: formatCurrency(amount),
    status: status,
    date: formatPaymentDate(createdAt),
    provider: getPaymentProviderDisplayName(provider),
    isRecent: isRecentPayment(createdAt)
  };
};
