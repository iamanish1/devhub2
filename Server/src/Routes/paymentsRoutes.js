import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import {
  createBidFee,
  createListing,
  createBonus,
  getPaymentStatus,
  getPaymentHistory
} from '../controller/paymentsController.js';
import {
  validateRequest,
  bidFeeSchema,
  listingFeeSchema,
  bonusSchema
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

export default paymentsRoutes;
