export const useCashfreeForBids = () => process.env.USE_CASHFREE_FOR_BIDS === 'true';
export const useCashfreeForListings = () => process.env.USE_CASHFREE_FOR_LISTINGS === 'true';
export const useCashfreeForBonus = () => process.env.USE_CASHFREE_FOR_BONUS === 'true';
export const useCashfreeForSubscriptions = () => process.env.USE_CASHFREE_FOR_SUBSCRIPTIONS === 'true';

// Payment amounts
export const BID_FEE = 9;
export const LISTING_FEE = 199;
export const BONUS_PER_CONTRIBUTOR = 200;
export const SUBSCRIPTION_FEE = 299;
