import PaymentIntent from '../Model/PaymentIntentModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import WebhookEvent from '../Model/WebhookEventModel.js';
import { verifyWebhookSignature as cfVerify } from '../services/cashfree.js';
import { logWebhookEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';

// Cashfree webhook handler
export const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    // Verify signature
    if (!cfVerify(rawBody, signature)) {
      logWebhookEvent('cashfree', 'signature_verification_failed', 'unknown', {
        signature: signature ? 'present' : 'missing'
      });
      return res.status(400).send('Invalid signature');
    }

    const eventId = req.body.orderId || req.body.paymentId;
    const type = req.body.orderStatus || req.body.paymentStatus;

    // Check for duplicate webhook
    const exists = await WebhookEvent.findOne({ eventId });
    if (exists) {
      logWebhookEvent('cashfree', 'duplicate_webhook', eventId, { type });
      return res.status(200).end();
    }

    // Create webhook event record
    await WebhookEvent.create({ 
      provider: 'cashfree', 
      eventType: type, 
      eventId, 
      signature, 
      processed: true 
    });

    logWebhookEvent('cashfree', type, eventId, req.body);

    // Handle payment success events
    if (type === 'PAID' || type === 'SUCCESS') {
      const orderId = req.body.orderId;
      
      if (orderId) {
        // Update payment intent
        const intent = await PaymentIntent.findOneAndUpdate(
          { orderId }, 
          { 
            status: 'paid', 
            paymentId: req.body.paymentId 
          }, 
          { new: true }
        );

        if (intent) {
          // Handle different payment purposes
          switch (intent.purpose) {
            case 'bid_fee':
              // Update bid status
              if (intent.notes?.bidId) {
                await Bidding.findByIdAndUpdate(intent.notes.bidId, {
                  'feePayment.status': 'paid',
                  'feePayment.paidAt': new Date()
                });
              }
              break;

            case 'listing':
              // Update project listing status
              await ProjectListing.findByIdAndUpdate(intent.projectId, {
                'cashfreeOrderId': orderId,
                status: 'active'
              });
              break;

            case 'bonus_funding':
              // Create or update bonus pool
              const bonusAmount = intent.amount;
              const contributorCount = intent.notes?.contributorsCount || 1;
              const amountPerContributor = Math.floor(bonusAmount / contributorCount);
              
              await BonusPool.findOneAndUpdate(
                { projectId: intent.projectId },
                { 
                  $set: { 
                    projectOwner: intent.userId,
                    totalAmount: bonusAmount,
                    contributorCount,
                    amountPerContributor,
                    status: 'funded',
                    paymentIntentId: intent._id,
                    orderId: orderId,
                    fundedAt: new Date()
                  } 
                },
                { upsert: true }
              );
              
              await ProjectListing.findByIdAndUpdate(intent.projectId, { 
                $set: { 
                  'bonus.funded': true,
                  'bonus.cashfreeOrderId': orderId
                } 
              });

              logWebhookEvent('cashfree', 'bonus_funded', eventId, {
                projectId: intent.projectId,
                amount: bonusAmount,
                contributorCount
              });
              break;

            case 'subscription':
              // Handle subscription activation
              logWebhookEvent('cashfree', 'subscription_activated', eventId, {
                userId: intent.userId,
                planType: intent.notes?.planType
              });
              break;

            case 'withdrawal_fee':
              // Handle withdrawal fee payment
              logWebhookEvent('cashfree', 'withdrawal_fee_paid', eventId, {
                userId: intent.userId,
                withdrawalAmount: intent.notes?.withdrawalAmount
              });
              break;
          }
        }
      }
    }

    return res.status(200).end();

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
