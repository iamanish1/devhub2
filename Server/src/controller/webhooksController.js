import PaymentIntent from '../Model/PaymentIntentModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import WebhookEvent from '../Model/WebhookEventModel.js';
import { verifyWebhookSignature as cfVerify } from '../services/cashfree.js';
import { logWebhookEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';
import mongoose from 'mongoose';
import { firestoreDb } from '../config/firebaseAdmin.js';
import user from '../Model/UserModel.js';

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
              // Create the bid after successful payment
              const { bidAmount, bidFee, totalAmount, feeAmount } = intent.notes;
              
              // Check if bid already exists (prevent duplicate)
              const existingBid = await Bidding.findOne({
                project_id: intent.projectId,
                user_id: intent.userId,
                payment_status: 'paid'
              });

              if (!existingBid) {
                // Create the bid
                const newBid = new Bidding({
                  project_id: intent.projectId,
                  user_id: intent.userId,
                  bid_amount: bidAmount,
                  bid_fee: bidFee,
                  total_amount: totalAmount,
                  year_of_experience: intent.notes.year_of_experience || 1,
                  bid_description: intent.notes.bid_description || '',
                  hours_avilable_per_week: intent.notes.hours_avilable_per_week || 10,
                  skills: intent.notes.skills || [],
                  is_free_bid: feeAmount === 0, // True if no fee was charged
                  payment_status: 'paid'
                });

                await newBid.save();

                // Update user's free bid statistics if fee was waived (free bid)
                if (feeAmount === 0) {
                  const User = await user.findById(intent.userId);
                  if (User && User.freeBids?.remaining > 0) {
                    console.log(`[Webhook] Updating free bid statistics - before: remaining: ${User.freeBids.remaining}, used: ${User.freeBids.used}`);
                    User.freeBids.remaining -= 1;
                    User.freeBids.used += 1;
                    console.log(`[Webhook] Updated free bid statistics - after: remaining: ${User.freeBids.remaining}, used: ${User.freeBids.used}`);
                    await User.save();
                  }
                }

                // Update project statistics
                const projectObjectId = new mongoose.Types.ObjectId(intent.projectId);
                const totalBids = await Bidding.countDocuments({
                  project_id: projectObjectId,
                });
                const allBids = await Bidding.find({ project_id: projectObjectId });

                const uniqueContributors = [
                  ...new Set(allBids.map((b) => b.user_id.toString())),
                ].length;

                // Calculate current bid amount (sum of all bid amounts, not including fees)
                let currentBidAmount = 0;
                if (allBids.length === 1) {
                  currentBidAmount = allBids[0].bid_amount;
                } else if (allBids.length > 1) {
                  currentBidAmount = allBids.reduce((sum, b) => sum + b.bid_amount, 0);
                }

                await ProjectListing.findByIdAndUpdate(projectObjectId, {
                  Project_Number_Of_Bids: totalBids,
                  Project_Bid_Amount: currentBidAmount,
                });

                // Sync to Firebase
                if (firestoreDb) {
                  try {
                    await firestoreDb
                      .collection("project_summaries")
                      .doc(String(projectObjectId))
                      .set(
                        {
                          current_bid_amount: currentBidAmount,
                          total_bids: totalBids,
                          number_of_contributors: uniqueContributors,
                          updated_at: new Date(),
                        },
                        { merge: true }
                      );
                  } catch (firestoreError) {
                    console.warn("Firestore sync failed:", firestoreError.message);
                  }
                }

                console.log(`[Webhook] Bid created after successful payment - bidId: ${newBid._id}, feeAmount: ${feeAmount}`);
                logWebhookEvent('cashfree', 'bid_created', eventId, {
                  bidId: newBid._id,
                  projectId: intent.projectId,
                  userId: intent.userId,
                  feeAmount: feeAmount
                });
              } else {
                console.log(`[Webhook] Bid already exists for this payment - bidId: ${existingBid._id}`);
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
