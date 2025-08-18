import express from 'express';
import {
  razorpayWebhook,
  cashfreeWebhook,
  getWebhookEvents
} from '../controller/webhooksController.js';

const webhooksRoutes = express.Router();

// Razorpay webhook - IMPORTANT: need raw body for signature verification
webhooksRoutes.post('/razorpay',
  express.raw({ type: '*/*' }), // preserve rawBody
  (req, res, next) => { 
    req.rawBody = req.body.toString(); 
    req.body = JSON.parse(req.rawBody); 
    next(); 
  },
  razorpayWebhook
);

// Cashfree webhook
webhooksRoutes.post('/cashfree', 
  express.json({ type: '*/*' }), 
  cashfreeWebhook
);

// Get webhook events (for debugging)
webhooksRoutes.get('/events', getWebhookEvents);

export default webhooksRoutes;
