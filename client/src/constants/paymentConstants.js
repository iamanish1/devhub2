// Payment Types
export const PAYMENT_TYPES = {
  BID_FEE: 'bid_fee',           // ₹9 per bid
  BONUS_FUNDING: 'bonus_funding', // ₹200 × contributors
  WITHDRAWAL_FEE: 'withdrawal_fee', // ₹15 (up to ₹10k)
  SUBSCRIPTION: 'subscription'   // ₹299/month
};

// Payment Amounts
export const PAYMENT_AMOUNTS = {
  BID_FEE: 9,
  BONUS_PER_CONTRIBUTOR: 200,
  WITHDRAWAL_FEE: 15,
  WITHDRAWAL_MAX: 10000,
  SUBSCRIPTION: 299
};

// Payment Providers
export const PAYMENT_PROVIDERS = {
  CASHFREE: 'cashfree'
};

// Subscription Benefits
export const SUBSCRIPTION_BENEFITS = [
  "Unlimited project bids",
  "Unlimited project listings", 
  "Priority support",
  "Advanced analytics",
  "No bid fees",
  "No listing fees"
];

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Payment Error Messages
export const PAYMENT_ERRORS = {
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_AMOUNT: 'Invalid payment amount',
  SUBSCRIPTION_REQUIRED: 'Subscription required for this action'
};

// Payment Success Messages
export const PAYMENT_SUCCESS = {
  BID_FEE: 'Bid fee paid successfully! You can now place your bid.',
  BONUS_FUNDING: 'Bonus pool funded successfully!',
  WITHDRAWAL: 'Withdrawal request submitted successfully!',
  SUBSCRIPTION: 'Subscription activated successfully!'
};
