import express from 'express';
import {
  cashfreeWebhook,
  getWebhookEvents
} from '../controller/webhooksController.js';

const webhooksRoutes = express.Router();

// Cashfree webhook
webhooksRoutes.post('/cashfree', 
  express.json({ type: '*/*' }), 
  cashfreeWebhook
);

// Get webhook events (for debugging)
webhooksRoutes.get('/events', getWebhookEvents);

export default webhooksRoutes;
