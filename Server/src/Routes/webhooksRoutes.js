import express from 'express';
import { cashfreeWebhook } from '../controller/webhooksController.js';
import { checkCashfreeHealth, getCashfreeConfig } from '../services/cashfree.js';

const webhooksRoutes = express.Router();

// Cashfree webhook
webhooksRoutes.post('/cashfree',
  cashfreeWebhook
);

// Health check endpoint for Cashfree configuration
webhooksRoutes.get('/cashfree/health', async (req, res) => {
  try {
    const config = getCashfreeConfig();
    const health = await checkCashfreeHealth();
    
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
      config: getCashfreeConfig()
    });
  }
});

export default webhooksRoutes;
