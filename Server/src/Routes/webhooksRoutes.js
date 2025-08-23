import express from 'express';
import { razorpayWebhook, checkPaymentAndUpdateBid } from '../controller/webhooksController.js';
import { checkRazorpayHealth, getRazorpayConfig } from '../services/razorpay.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const webhooksRoutes = express.Router();

// Razorpay webhook
webhooksRoutes.post('/razorpay',
  razorpayWebhook
);

// Health check endpoint for Razorpay configuration
webhooksRoutes.get('/razorpay/health', async (req, res) => {
  try {
    const config = getRazorpayConfig();
    const health = await checkRazorpayHealth();
    
    res.json({
      timestamp: new Date().toISOString(),
      config,
      health,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      config: getRazorpayConfig()
    });
  }
});

// Check payment status and update bid (fallback for failed webhooks)
webhooksRoutes.get('/check-payment/:orderId', authMiddleware, checkPaymentAndUpdateBid);

export default webhooksRoutes;
