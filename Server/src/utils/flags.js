export const useRazorpayForBids = () => process.env.USE_RAZORPAY_FOR_BIDS === 'true';
export const useRazorpayForListings = () => process.env.USE_RAZORPAY_FOR_LISTINGS === 'true';
export const useRazorpayForBonus = () => process.env.USE_RAZORPAY_FOR_BONUS === 'true';
export const useRazorpayForSubscriptions = () => process.env.USE_RAZORPAY_FOR_SUBSCRIPTIONS === 'true';

// Payment amounts
export const BID_FEE = 9;
export const LISTING_FEE = 199;
export const BONUS_PER_CONTRIBUTOR = 200;
export const SUBSCRIPTION_FEE = 299;
