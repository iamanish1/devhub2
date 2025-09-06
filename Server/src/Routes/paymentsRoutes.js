import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import {
  createBidFee,
  createListing,
  createBonus,
  createSubscription,
  createWithdrawal,
  getPaymentStatus,
  getPaymentHistory,
  getSubscriptionStatus,
  getSubscriptionPlans,
  activateSubscription,
  cancelSubscription,
  getBonusPools,
  getWithdrawalHistory,
  getPaymentAnalytics,
  getPaymentSummary,
  processRefund,
  getRefundHistory,
  verifyPaymentWithRazorpay
} from '../controller/paymentsController.js';
import {
  validateRequest,
  bidFeeSchema,
  listingFeeSchema,
  bonusSchema,
  subscriptionSchema,
  withdrawalSchema
} from '../utils/validate.js';

const paymentsRoutes = express.Router();

// Bid fee payment (₹9)
paymentsRoutes.post('/bid-fee', 
  authMiddleware, 
  validateRequest(bidFeeSchema),
  createBidFee
);

// Listing fee payment (₹199)
paymentsRoutes.post('/listing', 
  authMiddleware, 
  validateRequest(listingFeeSchema),
  createListing
);

// Bonus pool funding (₹200 × contributors)
paymentsRoutes.post('/bonus', 
  authMiddleware, 
  validateRequest(bonusSchema),
  createBonus
);

// Subscription payment (₹299/month)
paymentsRoutes.post('/subscription', 
  authMiddleware, 
  validateRequest(subscriptionSchema),
  createSubscription
);

// Withdrawal fee payment (₹20)
paymentsRoutes.post('/withdrawal', 
  authMiddleware, 
  validateRequest(withdrawalSchema),
  createWithdrawal
);

// Process refund
paymentsRoutes.post('/refund/:paymentIntentId', 
  authMiddleware, 
  processRefund
);

// Get payment status
paymentsRoutes.get('/status/:intentId', 
  authMiddleware, 
  getPaymentStatus
);

// Verify payment with Razorpay
paymentsRoutes.get('/verify-razorpay/:orderId', 
  authMiddleware, 
  verifyPaymentWithRazorpay
);

// Get payment history
paymentsRoutes.get('/history', 
  authMiddleware, 
  getPaymentHistory
);

// Get payment analytics
paymentsRoutes.get('/analytics', 
  authMiddleware, 
  getPaymentAnalytics
);

// Get payment summary
paymentsRoutes.get('/summary', 
  authMiddleware, 
  getPaymentSummary
);

// Get subscription status
paymentsRoutes.get('/subscription/status', 
  authMiddleware, 
  getSubscriptionStatus
);

// Get all subscription plans
paymentsRoutes.get('/subscription/plans', 
  authMiddleware, 
  getSubscriptionPlans
);

// Activate subscription after payment
paymentsRoutes.post('/subscription/activate/:paymentIntentId', 
  authMiddleware, 
  activateSubscription
);

// Cancel subscription
paymentsRoutes.post('/subscription/cancel', 
  authMiddleware, 
  cancelSubscription
);

// Get bonus pools
paymentsRoutes.get('/bonus-pools', 
  authMiddleware, 
  getBonusPools
);

// Get withdrawal history
paymentsRoutes.get('/withdrawal/history', 
  authMiddleware, 
  getWithdrawalHistory
);

// Get refund history
paymentsRoutes.get('/refund/history', 
  authMiddleware, 
  getRefundHistory
);

export default paymentsRoutes;
