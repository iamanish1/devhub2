import express from 'express';
import { razorpayWebhook, manualPaymentUpdate, checkPaymentAndUpdateBid, resetFreeBids, syncFreeBidCount, debugUserBids } from '../controller/webhooksController.js';
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

// Manual payment update for testing (REMOVE IN PRODUCTION)
webhooksRoutes.post('/manual-update/:orderId', manualPaymentUpdate);

// Check payment status and update bid (fallback for failed webhooks)
webhooksRoutes.get('/check-payment/:orderId', authMiddleware, checkPaymentAndUpdateBid);

// Reset free bids for testing (REMOVE IN PRODUCTION)
webhooksRoutes.post('/reset-free-bids', authMiddleware, resetFreeBids);

// Sync free bid count with actual paid bids (REMOVE IN PRODUCTION)
webhooksRoutes.post('/sync-free-bids', authMiddleware, syncFreeBidCount);

// Debug user bids (REMOVE IN PRODUCTION)
webhooksRoutes.get('/debug-user-bids', authMiddleware, debugUserBids);

// Test webhook endpoint for debugging
webhooksRoutes.post('/test', (req, res) => {
  console.log('[Test Webhook] Received test webhook request');
  console.log('[Test Webhook] Headers:', req.headers);
  console.log('[Test Webhook] Body:', req.body);
  res.status(200).json({ message: 'Test webhook received successfully' });
});

export default webhooksRoutes;
