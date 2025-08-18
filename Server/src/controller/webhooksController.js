import PaymentIntent from '../Model/PaymentIntentModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import WebhookEvent from '../Model/WebhookEventModel.js';
import { verifySignature as rzpVerify } from '../services/razorpay.js';
import { verifyWebhookSignature as cfVerify } from '../services/cashfree.js';
import { logWebhookEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';

// Razorpay webhook handler
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    // Verify signature
    if (!rzpVerify(rawBody, signature)) {
      logWebhookEvent('razorpay', 'signature_verification_failed', 'unknown', {
        signature: signature ? 'present' : 'missing'
      });
      return res.status(400).send('Invalid signature');
    }

    const eventId = req.body.id;
    const type = req.body.event;

    // Check for duplicate webhook
    const exists = await WebhookEvent.findOne({ eventId });
    if (exists) {
      logWebhookEvent('razorpay', 'duplicate_webhook', eventId, { type });
      return res.status(200).end();
    }

    // Create webhook event record
    await WebhookEvent.create({ 
      provider: 'razorpay', 
      eventType: type, 
      eventId, 
      signature, 
      processed: true 
    });

    logWebhookEvent('razorpay', type, eventId, req.body);

    // Handle payment success events
    if (type === 'order.paid' || type === 'payment.captured') {
      const payment = req.body.payload?.payment?.entity;
      const orderId = payment?.order_id;
      
      if (orderId) {
        // Update payment intent
        const intent = await PaymentIntent.findOneAndUpdate(
          { orderId }, 
          { 
            status: 'paid', 
            paymentId: payment.id 
          }, 
          { new: true }
        );

        if (intent) {
          // Handle bonus funding
          if (intent.purpose === 'bonus') {
            const commission = Math.round(intent.amount * 0.10);
            
            await BonusPool.updateOne(
              { projectId: intent.projectId },
              { 
                $set: { 
                  totalBonus: intent.amount, 
                  commission: { rate: 0.10, amount: commission }, 
                  status: 'funded' 
                } 
              },
              { upsert: true }
            );
            
            await ProjectListing.updateOne(
              { _id: intent.projectId }, 
              { 
                $set: { 
                  'bonus.funded': true, 
                  'bonus.razorpayOrderId': orderId 
                } 
              }
            );

            logWebhookEvent('razorpay', 'bonus_funded', eventId, {
              projectId: intent.projectId,
              amount: intent.amount,
              commission
            });
          }
        }
      }
    }

    return res.status(200).end();

  } catch (error) {
    logWebhookEvent('razorpay', 'webhook_error', 'unknown', { error: error.message });
    return res.status(500).send('Webhook processing failed');
  }
};

// Cashfree webhook handler
export const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const eventId = (req.body?.data?.order?.order_id || '') + ':' + (req.body?.type || 'cf');
    
    // Verify signature if available
    if (signature && !cfVerify(JSON.stringify(req.body), signature)) {
      logWebhookEvent('cashfree', 'signature_verification_failed', eventId, {
        signature: 'invalid'
      });
      return res.status(400).send('Invalid signature');
    }

    // Check for duplicate webhook
    const exists = await WebhookEvent.findOne({ eventId });
    if (exists) {
      logWebhookEvent('cashfree', 'duplicate_webhook', eventId, { type: req.body?.type });
      return res.status(200).end();
    }

    // Create webhook event record
    await WebhookEvent.create({ 
      provider: 'cashfree', 
      eventType: req.body?.type, 
      eventId, 
      processed: true 
    });

    logWebhookEvent('cashfree', req.body?.type, eventId, req.body);

    // Handle payment success
    const cfStatus = req.body?.data?.payment?.payment_status || req.body?.data?.order?.order_status;
    if (['SUCCESS', 'PAID'].includes(String(cfStatus).toUpperCase())) {
      const orderId = req.body?.data?.order?.order_id;
      
      if (orderId) {
        // Update payment intent
        const intent = await PaymentIntent.findOneAndUpdate(
          { orderId }, 
          { status: 'paid' }, 
          { new: true }
        );

        if (intent) {
          // Handle bid fee payment
          if (intent.purpose === 'bid_fee' && intent.notes?.bidId) {
            await Bidding.findByIdAndUpdate(intent.notes.bidId, {
              'feePayment.status': 'paid'
            });

            logWebhookEvent('cashfree', 'bid_fee_paid', eventId, {
              bidId: intent.notes.bidId,
              projectId: intent.projectId
            });
          }

          // Handle listing fee payment
          if (intent.purpose === 'listing') {
            await ProjectListing.findByIdAndUpdate(intent.projectId, {
              $set: { status: 'active' }
            });

            logWebhookEvent('cashfree', 'listing_fee_paid', eventId, {
              projectId: intent.projectId
            });
          }
        }
      }
    }

    res.status(200).end();

  } catch (error) {
    logWebhookEvent('cashfree', 'webhook_error', 'unknown', { error: error.message });
    return res.status(500).send('Webhook processing failed');
  }
};

// Get webhook events (for debugging)
export const getWebhookEvents = async (req, res) => {
  try {
    const { provider, limit = 50 } = req.query;
    
    const filter = {};
    if (provider) {
      filter.provider = provider;
    }

    const events = await WebhookEvent.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: events
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching webhook events'
    });
  }
};
