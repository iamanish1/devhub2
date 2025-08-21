import PaymentIntent from '../Model/PaymentIntentModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import WebhookEvent from '../Model/WebhookEventModel.js';
import { verifyWebhookSignature as rpVerify, verifyOrderWithRazorpay } from '../services/razorpay.js';
import { logWebhookEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';
import mongoose from 'mongoose';
import { firestoreDb } from '../config/firebaseAdmin.js';
import user from '../Model/UserModel.js';

// Razorpay webhook handler
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    // Verify webhook payload
    if (!rpVerify(rawBody, signature)) {
      logWebhookEvent('razorpay', 'webhook_verification_failed', 'unknown', {
        signature: signature ? 'present' : 'missing',
        payloadKeys: req.body ? Object.keys(req.body) : []
      });
      return res.status(400).send('Invalid webhook payload');
    }

    const eventId = req.body.payload?.payment?.entity?.id || req.body.payload?.order?.entity?.id;
    const type = req.body.event || 'payment.captured';

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
    if (type === 'payment.captured' || type === 'order.paid') {
      const orderId = req.body.payload?.order?.entity?.id || req.body.payload?.payment?.entity?.order_id;
      const paymentId = req.body.payload?.payment?.entity?.id;
      
      console.log(`[Webhook] Processing payment success - orderId: ${orderId}, paymentId: ${paymentId}, type: ${type}`);
      
      if (orderId) {
        // Optional: Verify order with Razorpay API for additional security
        // This is recommended for production to prevent webhook spoofing
        const orderVerified = await verifyOrderWithRazorpay(orderId);
        if (!orderVerified) {
          logger.warn('Order verification failed, but continuing webhook processing', { orderId });
          // You can choose to return error here for stricter security
          // return res.status(400).send('Order verification failed');
        }
        // Update payment intent
        const intent = await PaymentIntent.findOneAndUpdate(
          { orderId }, 
          { 
            status: 'paid', 
            paymentId: paymentId 
          }, 
          { new: true }
        );

        console.log(`[Webhook] Payment intent updated - intentId: ${intent?._id}, status: ${intent?.status}, purpose: ${intent?.purpose}`);

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

              // Also check for pending bids that should be updated
              const pendingBid = await Bidding.findOne({
                project_id: intent.projectId,
                user_id: intent.userId,
                payment_status: 'pending'
              });

              console.log(`[Webhook] Checking for existing bid - projectId: ${intent.projectId}, userId: ${intent.userId}, existingBid: ${existingBid ? existingBid._id : 'none'}, pendingBid: ${pendingBid ? pendingBid._id : 'none'}`);

              if (!existingBid) {
                let bidToUpdate = null;
                
                // If there's a pending bid, update it instead of creating a new one
                if (pendingBid) {
                  console.log(`[Webhook] Updating existing pending bid - bidId: ${pendingBid._id}`);
                  bidToUpdate = await Bidding.findByIdAndUpdate(
                    pendingBid._id,
                    {
                      payment_status: 'paid',
                      escrow_details: {
                        ...pendingBid.escrow_details,
                        payment_intent_id: intent._id.toString()
                      }
                    },
                    { new: true }
                  );
                  console.log(`[Webhook] Updated pending bid to paid - bidId: ${bidToUpdate._id}`);
                } else {
                  // Create new bid only if no pending bid exists
                  console.log(`[Webhook] Creating new bid after payment`);
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

                  bidToUpdate = await newBid.save();
                  console.log(`[Webhook] Created new bid - bidId: ${bidToUpdate._id}`);
                }

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

                                 console.log(`[Webhook] Bid processed after successful payment - bidId: ${bidToUpdate._id}, feeAmount: ${feeAmount}`);
                 logWebhookEvent('razorpay', 'bid_created', eventId, {
                   bidId: bidToUpdate._id,
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
                 'razorpayOrderId': orderId,
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
                  'bonus.razorpayOrderId': orderId
                } 
              });

              logWebhookEvent('razorpay', 'bonus_funded', eventId, {
                projectId: intent.projectId,
                amount: bonusAmount,
                contributorCount
              });
              break;

            case 'subscription':
              // Handle subscription activation
              logWebhookEvent('razorpay', 'subscription_activated', eventId, {
                userId: intent.userId,
                planType: intent.notes?.planType
              });
              break;

            case 'withdrawal_fee':
              // Handle withdrawal fee payment
              logWebhookEvent('razorpay', 'withdrawal_fee_paid', eventId, {
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
    logWebhookEvent('razorpay', 'webhook_error', 'unknown', { error: error.message });
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

// Manual payment status update for testing (REMOVE IN PRODUCTION)
export const manualPaymentUpdate = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`[Manual Update] Processing payment update for orderId: ${orderId}`);
    
    // Find and update payment intent
    const intent = await PaymentIntent.findOneAndUpdate(
      { orderId }, 
      { 
        status: 'paid'
      }, 
      { new: true }
    );

    if (!intent) {
      return res.status(404).json({ message: 'Payment intent not found' });
    }

    console.log(`[Manual Update] Payment intent updated - intentId: ${intent._id}, status: ${intent.status}, purpose: ${intent.purpose}`);

    // Process the payment update
    if (intent.purpose === 'bid_fee') {
      const { bidAmount, bidFee, totalAmount, feeAmount } = intent.notes;
      
      // Check for existing bids
      const existingBid = await Bidding.findOne({
        project_id: intent.projectId,
        user_id: intent.userId,
        payment_status: 'paid'
      });

      const pendingBid = await Bidding.findOne({
        project_id: intent.projectId,
        user_id: intent.userId,
        payment_status: 'pending'
      });

      console.log(`[Manual Update] Checking bids - existingBid: ${existingBid ? existingBid._id : 'none'}, pendingBid: ${pendingBid ? pendingBid._id : 'none'}`);

      if (!existingBid) {
        let bidToUpdate = null;
        
        if (pendingBid) {
          console.log(`[Manual Update] Updating pending bid - bidId: ${pendingBid._id}`);
          bidToUpdate = await Bidding.findByIdAndUpdate(
            pendingBid._id,
            {
              payment_status: 'paid',
              escrow_details: {
                ...pendingBid.escrow_details,
                payment_intent_id: intent._id.toString()
              }
            },
            { new: true }
          );
        } else {
          console.log(`[Manual Update] Creating new bid`);
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
            is_free_bid: feeAmount === 0,
            payment_status: 'paid'
          });

          bidToUpdate = await newBid.save();
        }

        console.log(`[Manual Update] Bid processed - bidId: ${bidToUpdate._id}`);
      }
    }

    res.status(200).json({ 
      message: 'Payment status updated manually',
      intent: intent,
      success: true
    });

  } catch (error) {
    console.error('[Manual Update] Error:', error);
    res.status(500).json({ 
      message: 'Error updating payment status',
      error: error.message 
    });
  }
};
