// Payment Constants for Backend
export const PAYMENT_AMOUNTS = {
  BID_FEE: 9,
  BONUS_PER_CONTRIBUTOR: 200,
  WITHDRAWAL_FEE: 20,
  WITHDRAWAL_MAX: 10000,
  WITHDRAWAL_MIN: 100,
  SUBSCRIPTION: 299,
  LISTING_FEE: 199
};

export const PAYMENT_TYPES = {
  BID_FEE: 'bid_fee',
  BONUS_FUNDING: 'bonus_funding',
  WITHDRAWAL_FEE: 'withdrawal_fee',
  SUBSCRIPTION: 'subscription',
  LISTING: 'listing'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  CREATED: 'created'
};
