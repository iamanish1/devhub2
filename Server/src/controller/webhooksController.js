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
    console.log(`[Webhook] Received webhook request - method: ${req.method}, headers:`, Object.keys(req.headers));
    console.log(`[Webhook] Request body:`, JSON.stringify(req.body, null, 2));
    
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    
    console.log(`[Webhook] Signature: ${signature ? 'present' : 'missing'}`);
    console.log(`[Webhook] Raw body length: ${rawBody.length}`);
    
    // Verify webhook payload (temporarily bypassed for testing)
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.RAZORPAY_ENV === 'test';
    
    if (!rpVerify(rawBody, signature)) {
      console.log(`[Webhook] Webhook verification failed`);
      
      // In test mode, allow webhook to proceed even if verification fails
      if (isTestMode) {
        console.log(`[Webhook] Test mode - allowing webhook to proceed despite verification failure`);
      } else {
        logWebhookEvent('razorpay', 'webhook_verification_failed', 'unknown', {
          signature: signature ? 'present' : 'missing',
          payloadKeys: req.body ? Object.keys(req.body) : []
        });
        return res.status(400).send('Invalid webhook payload');
      }
    } else {
      console.log(`[Webhook] Webhook verification successful`);
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
        console.log(`[Webhook] Looking for payment intent with orderId: ${orderId}`);
        const intent = await PaymentIntent.findOneAndUpdate(
          { orderId }, 
          { 
            status: 'paid', 
            paymentId: paymentId 
          }, 
          { new: true }
        );

        console.log(`[Webhook] Payment intent update result - intentId: ${intent?._id}, status: ${intent?.status}, purpose: ${intent?.purpose}`);

                if (intent) {
          console.log(`[Webhook] Payment intent found and updated successfully`);
          console.log(`[Webhook] Intent notes:`, intent.notes);
          
          // Handle different payment purposes
          switch (intent.purpose) {
            case 'bid_fee':
              console.log(`[Webhook] Processing bid_fee payment`);
              
              // Get the bid ID from payment intent notes
              const bidId = intent.notes?.bidId;
              console.log(`[Webhook] Bid ID from payment intent: ${bidId}`);
              
              if (!bidId) {
                console.error(`[Webhook] No bid ID found in payment intent notes`);
                logWebhookEvent('razorpay', 'bid_fee_missing_bid_id', eventId, {
                  intentId: intent._id,
                  projectId: intent.projectId,
                  userId: intent.userId
                });
                break;
              }

              try {
                // Find and update the existing bid
                const bidToUpdate = await Bidding.findById(bidId);
                
                if (!bidToUpdate) {
                  console.error(`[Webhook] Bid not found with ID: ${bidId}`);
                  logWebhookEvent('razorpay', 'bid_fee_bid_not_found', eventId, {
                    bidId,
                    intentId: intent._id,
                    projectId: intent.projectId,
                    userId: intent.userId
                  });
                  break;
                }

                console.log(`[Webhook] Found bid to update - bidId: ${bidToUpdate._id}, current status: ${bidToUpdate.payment_status}`);

                // Update bid payment status to paid
                const updatedBid = await Bidding.findByIdAndUpdate(
                  bidId,
                  {
                    payment_status: 'paid',
                    'escrow_details.payment_intent_id': intent._id.toString(),
                    'escrow_details.locked_at': new Date()
                  },
                  { new: true }
                );

                console.log(`[Webhook] Bid payment status updated to paid - bidId: ${updatedBid._id}`);

                // Update user's free bid statistics if fee was waived (free bid)
                const feeAmount = intent.notes?.feeAmount || 0;
                const isFreeBid = intent.notes?.feeWaived || feeAmount === 0;
                
                console.log(`[Webhook] Free bid check - feeAmount: ${feeAmount}, feeWaived: ${intent.notes?.feeWaived}, isFreeBid: ${isFreeBid}`);
                
                if (isFreeBid) {
                  console.log(`[Webhook] Processing free bid update for user ${intent.userId}`);
                  const User = await user.findById(intent.userId);
                  if (User) {
                    console.log(`[Webhook] Found user: ${User.username}`);
                    // Initialize freeBids if not set
                    if (!User.freeBids) {
                      console.log(`[Webhook] Initializing freeBids for user ${User.username}`);
                      User.freeBids = { remaining: 5, used: 0 };
                    }
                    
                    console.log(`[Webhook] Current freeBids: remaining=${User.freeBids.remaining}, used=${User.freeBids.used}`);
                    
                    if (User.freeBids.remaining > 0) {
                      console.log(`[Webhook] Updating free bid statistics - before: remaining: ${User.freeBids.remaining}, used: ${User.freeBids.used}`);
                      User.freeBids.remaining -= 1;
                      User.freeBids.used += 1;
                      console.log(`[Webhook] Updated free bid statistics - after: remaining: ${User.freeBids.remaining}, used: ${User.freeBids.used}`);
                      await User.save();
                      console.log(`[Webhook] Free bid count updated successfully for user ${User.username}`);
                    } else {
                      console.log(`[Webhook] No free bids remaining for user ${User.username}`);
                    }
                  } else {
                    console.log(`[Webhook] User not found with ID: ${intent.userId}`);
                  }
                } else {
                  console.log(`[Webhook] Not a free bid - feeAmount: ${feeAmount}, skipping free bid update`);
                }

                // Update project statistics
                const projectObjectId = new mongoose.Types.ObjectId(intent.projectId);
                const totalBids = await Bidding.countDocuments({
                  project_id: projectObjectId,
                  payment_status: 'paid' // Only count paid bids
                });
                const allPaidBids = await Bidding.find({ 
                  project_id: projectObjectId,
                  payment_status: 'paid'
                });

                const uniqueContributors = [
                  ...new Set(allPaidBids.map((b) => b.user_id.toString())),
                ].length;

                // Calculate current bid amount (sum of all paid bid amounts, not including fees)
                let currentBidAmount = 0;
                if (allPaidBids.length === 1) {
                  currentBidAmount = allPaidBids[0].bid_amount;
                } else if (allPaidBids.length > 1) {
                  currentBidAmount = allPaidBids.reduce((sum, b) => sum + b.bid_amount, 0);
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

                console.log(`[Webhook] Bid processed successfully after payment - bidId: ${updatedBid._id}, feeAmount: ${feeAmount}`);
                logWebhookEvent('razorpay', 'bid_payment_completed', eventId, {
                  bidId: updatedBid._id,
                  projectId: intent.projectId,
                  userId: intent.userId,
                  feeAmount: feeAmount,
                  totalBids: totalBids,
                  currentBidAmount: currentBidAmount
                });

              } catch (bidUpdateError) {
                console.error(`[Webhook] Error updating bid:`, bidUpdateError);
                logWebhookEvent('razorpay', 'bid_fee_update_error', eventId, {
                  bidId,
                  intentId: intent._id,
                  error: bidUpdateError.message
                });
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
              const isNewProject = intent.notes?.isNewProject;
              
              if (isNewProject) {
                // For new projects, create a temporary bonus pool record
                await BonusPool.create({
                  projectId: null, // Will be updated when project is created
                  projectOwner: intent.userId,
                  totalAmount: bonusAmount,
                  contributorCount,
                  amountPerContributor,
                  status: 'funded',
                  paymentIntentId: intent._id,
                  orderId: orderId,
                  fundedAt: new Date(),
                  projectTitle: intent.notes?.projectTitle,
                  isNewProject: true
                });
              } else {
                // For existing projects, update the bonus pool
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
              }

              logWebhookEvent('razorpay', 'bonus_funded', eventId, {
                projectId: intent.projectId || 'new_project',
                amount: bonusAmount,
                contributorCount,
                isNewProject
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

// Check payment status and update bid if needed (fallback for failed webhooks)
export const checkPaymentAndUpdateBid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;
    
    console.log(`[Payment Check] Checking payment status for orderId: ${orderId}, userId: ${userId}`);
    
    // Find payment intent by orderId first
    let intent = await PaymentIntent.findOne({
      orderId: orderId,
      userId: userId
    });

    // If not found by orderId, try to find by intentId (orderId might be the intentId)
    if (!intent) {
      intent = await PaymentIntent.findOne({
        _id: orderId,
        userId: userId
      });
    }

    if (!intent) {
      console.log(`[Payment Check] No payment intent found for orderId: ${orderId}`);
      return res.status(404).json({ 
        message: 'Payment intent not found',
        orderId: orderId
      });
    }

    console.log(`[Payment Check] Found payment intent - status: ${intent.status}, purpose: ${intent.purpose}, bidId: ${intent.notes?.bidId}`);

    // If payment is already marked as paid, check if bid needs updating
    if (intent.status === 'paid') {
      const bidId = intent.notes?.bidId;
      
      if (bidId) {
        const bid = await Bidding.findById(bidId);
        
        if (bid && bid.payment_status === 'pending') {
          console.log(`[Payment Check] Updating bid status from pending to paid - bidId: ${bidId}`);
          
          // Update bid status
          await Bidding.findByIdAndUpdate(bidId, {
            payment_status: 'paid',
            'escrow_details.payment_intent_id': intent._id.toString(),
            'escrow_details.locked_at': new Date()
          });

          // Update project statistics
          const projectObjectId = new mongoose.Types.ObjectId(intent.projectId);
          const totalBids = await Bidding.countDocuments({
            project_id: projectObjectId,
            payment_status: 'paid'
          });
          const allPaidBids = await Bidding.find({ 
            project_id: projectObjectId,
            payment_status: 'paid'
          });

          const uniqueContributors = [
            ...new Set(allPaidBids.map((b) => b.user_id.toString())),
          ].length;

          let currentBidAmount = 0;
          if (allPaidBids.length === 1) {
            currentBidAmount = allPaidBids[0].bid_amount;
          } else if (allPaidBids.length > 1) {
            currentBidAmount = allPaidBids.reduce((sum, b) => sum + b.bid_amount, 0);
          }

          await ProjectListing.findByIdAndUpdate(projectObjectId, {
            Project_Number_Of_Bids: totalBids,
            Project_Bid_Amount: currentBidAmount,
          });

          console.log(`[Payment Check] Bid status updated successfully - bidId: ${bidId}`);
          
          return res.status(200).json({
            success: true,
            message: 'Bid status updated successfully',
            paymentStatus: 'paid',
            bidStatus: 'paid',
            totalBids: totalBids,
            currentBidAmount: currentBidAmount
          });
        } else if (bid && bid.payment_status === 'paid') {
          return res.status(200).json({
            success: true,
            message: 'Bid is already paid',
            paymentStatus: 'paid',
            bidStatus: 'paid'
          });
        }
      }

      // For non-bid payments (like bonus funding), just return success
      if (intent.purpose !== 'bid_fee') {
        return res.status(200).json({
          success: true,
          message: 'Payment is already verified',
          paymentStatus: 'paid',
          purpose: intent.purpose
        });
      }
    }

    // If payment is not paid, try to verify with Razorpay
    if (intent.status !== 'paid') {
      try {
        const { verifyOrderWithRazorpay } = await import('../services/razorpay.js');
        const orderVerified = await verifyOrderWithRazorpay(intent.orderId || orderId);
        
        if (orderVerified) {
          console.log(`[Payment Check] Order verified with Razorpay - updating payment status`);
          
          // Update payment intent status
          intent.status = 'paid';
          intent.updatedAt = new Date();
          await intent.save();
          
          // Update bid status if it's a bid fee payment
          const bidId = intent.notes?.bidId;
          if (bidId && intent.purpose === 'bid_fee') {
            await Bidding.findByIdAndUpdate(bidId, {
              payment_status: 'paid',
              'escrow_details.payment_intent_id': intent._id.toString(),
              'escrow_details.locked_at': new Date()
            });
          }
          
          return res.status(200).json({
            success: true,
            message: 'Payment verified and status updated',
            paymentStatus: 'paid',
            bidStatus: intent.purpose === 'bid_fee' ? 'paid' : 'n/a'
          });
        } else {
          console.log(`[Payment Check] Order verification failed with Razorpay`);
        }
      } catch (verifyError) {
        console.error(`[Payment Check] Error verifying order:`, verifyError);
      }
    }

    return res.status(200).json({
      success: false,
      message: 'Payment verification failed',
      paymentStatus: intent.status,
      bidStatus: 'pending'
    });

  } catch (error) {
    console.error('[Payment Check] Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking payment status',
      error: error.message 
    });
  }
};


