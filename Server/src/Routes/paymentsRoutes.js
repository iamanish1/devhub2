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
  getBonusPools,
  getWithdrawalHistory
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

// Withdrawal fee payment (₹15)
paymentsRoutes.post('/withdrawal', 
  authMiddleware, 
  validateRequest(withdrawalSchema),
  createWithdrawal
);

// Get payment status
paymentsRoutes.get('/status/:intentId', 
  authMiddleware, 
  getPaymentStatus
);

// Get payment history
paymentsRoutes.get('/history', 
  authMiddleware, 
  getPaymentHistory
);

// Get subscription status
paymentsRoutes.get('/subscription/status', 
  authMiddleware, 
  getSubscriptionStatus
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

export default paymentsRoutes;
