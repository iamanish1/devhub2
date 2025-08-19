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
      return 'text-green-500';
    case 'pending':
      return 'text-yellow-500';
    case 'failed':
      return 'text-red-500';
    case 'refunded':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

// Get payment status icon
export const getPaymentStatusIcon = (status) => {
  switch (status) {
    case 'success':
    case 'paid':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'pending':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      );
    case 'failed':
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
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
    case 'cashfree':
      return 'Cashfree';
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
