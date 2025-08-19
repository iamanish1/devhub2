import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import user from "../Model/UserModel.js";
import PaymentIntent from "../Model/PaymentIntentModel.js";
import { createOrder as cfCreateOrder } from "../services/cashfree.js";
import { logPaymentEvent } from "../utils/logger.js";
import { ApiError } from "../utils/error.js";
import mongoose from "mongoose";
import { firestoreDb } from "../config/firebaseAdmin.js";

// Check if user can place a bid (free bids or subscription)
const checkBidEligibility = async (userId) => {
  const User = await user.findById(userId);
  if (!User) {
    console.log(`[Bid Eligibility] User ${userId} not found`);
    return { canBid: false, reason: 'user_not_found' };
  }

  console.log(`[Bid Eligibility] Checking eligibility for user: ${User.username}`);
  console.log(`[Bid Eligibility] Free bids - remaining: ${User.freeBids?.remaining}, used: ${User.freeBids?.used}`);
  console.log(`[Bid Eligibility] Subscription - isActive: ${User.subscription?.isActive}, expiresAt: ${User.subscription?.expiresAt}`);

  // Check if user has active subscription
  if (User.subscription?.isActive && User.subscription?.expiresAt > new Date()) {
    console.log(`[Bid Eligibility] User has active subscription - ₹3 fee`);
    return { canBid: true, feeAmount: 3, reason: 'subscription' };
  }

  // Check if user has free bids remaining (₹0 fee)
  if (User.freeBids?.remaining > 0) {
    console.log(`[Bid Eligibility] User has ${User.freeBids.remaining} free bids remaining - ₹0 fee`);
    return { canBid: true, feeAmount: 0, reason: 'free_bid', remaining: User.freeBids.remaining };
  }

  // User needs to pay full bid fee (₹9 fee)
  console.log(`[Bid Eligibility] User has no free bids or subscription - ₹9 fee required`);
  return { canBid: true, feeAmount: 9, reason: 'payment_required' };
};

export const createBid = async (req, res) => {
  try {
    const { _id } = req.params; // projectId
    const userID = req.user._id;

    const {
      bid_amount,
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills,
    } = req.body;

    // Validate project exists
    const project = await ProjectListing.findById(_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if project is still accepting bids
    if (project.status === 'completed' || project.status === 'in_progress') {
      return res.status(400).json({ message: "Project is no longer accepting bids" });
    }

    // Check if user already placed a bid
    const existingBid = await Bidding.findOne({
      project_id: _id,
      user_id: userID,
    });

    if (existingBid) {
      return res.status(400).json({
        message: "You have already placed a bid on this project",
      });
    }

    // Check bid eligibility
    const eligibility = await checkBidEligibility(userID);
    
    if (!eligibility.canBid) {
      return res.status(403).json({ message: "You are not eligible to place bids" });
    }

    // Calculate bid fee and total amount based on eligibility
    let bidFee = eligibility.feeAmount; // Use the fee amount from eligibility
    let totalAmount = bid_amount + bidFee;

    console.log(`[Bid Creation] Eligibility check result:`, eligibility);
    console.log(`[Bid Creation] Fee calculation - bidFee: ₹${bidFee}, totalAmount: ₹${totalAmount}, reason: ${eligibility.reason}`);

    // Create payment intent for ALL bids (payment always required)
    let paymentIntent = null;
    let cashfreeOrder = null;

    // Create payment intent for the TOTAL amount (bid amount + fee if applicable)
    paymentIntent = await PaymentIntent.create({
      provider: 'cashfree',
      purpose: 'bid_fee',
      amount: totalAmount, // Total amount including bid amount + fee (if any)
      userId: userID,
      projectId: _id,
      status: 'created',
      notes: { 
        bidAmount: bid_amount,
        bidFee: bidFee,
        totalAmount: totalAmount,
        feeAmount: eligibility.feeAmount,
        feeWaived: eligibility.feeAmount === 0,
        year_of_experience,
        bid_description,
        hours_avilable_per_week,
        skills
      }
    });

    // Create Cashfree order for the TOTAL amount
    cashfreeOrder = await cfCreateOrder({
      orderId: paymentIntent._id.toString(),
      amount: totalAmount, // Total amount including bid amount + fee (if any)
      customer: { 
        customer_id: String(userID), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: eligibility.feeAmount === 0 ? 'Bid payment (no fee)' : 
             eligibility.feeAmount === 3 ? 'Bid payment (bid amount + ₹3 fee)' : 
             'Bid payment (bid amount + ₹9 fee)'
    });

    // Update payment intent with order ID
    paymentIntent.orderId = cashfreeOrder.order_id;
    await paymentIntent.save();

    logPaymentEvent('bid_fee_created', {
      intentId: paymentIntent._id,
      orderId: cashfreeOrder.order_id,
      userId: userID,
      projectId: _id,
      bidAmount: bid_amount,
      bidFee: bidFee,
      totalAmount: totalAmount,
      feeAmount: eligibility.feeAmount
    });

    // Return payment data for ALL bids (payment always required)
    console.log(`[Bid Creation] Payment required for all bids - returning payment data`);
    res.status(201).json({ 
      message: "Payment required before bid creation.",
      paymentRequired: true,
      paymentData: {
        provider: 'cashfree',
        order: cashfreeOrder,
        intentId: paymentIntent._id,
        amount: totalAmount // Total amount including bid amount + fee (if any)
      },
      bidInfo: {
        originalAmount: bid_amount,
        fee: bidFee,
        totalAmount: totalAmount,
        paymentType: eligibility.feeAmount === 0 ? 'free_bid' : 
                    eligibility.feeAmount === 3 ? 'subscription_bid' : 'paid_bid',
        feeAmount: eligibility.feeAmount
      }
    });

  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getBid = async (req, res) => {
  try {
    const { _id } = req.params; // projectId
    const userID = req.user._id;

    const existingBid = await Bidding.findOne({
      project_id: _id,
      user_id: userID,
    });

    // Get user's bid eligibility
    const eligibility = await checkBidEligibility(userID);

    if (!existingBid) {
      return res.status(200).json({ 
        bidExist: false,
        eligibility: eligibility
      });
    }

    res.status(200).json({
      message: "Bid fetched successfully",
      existingBid,
      eligibility: eligibility
    });
  } catch (error) {
    console.error("Error fetching bid:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's bid statistics
export const getUserBidStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's bid eligibility
    const eligibility = await checkBidEligibility(userId);

    // Get user's bid statistics
    const bidStats = await Bidding.aggregate([
      {
        $match: { user_id: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          acceptedBids: {
            $sum: { $cond: [{ $eq: ['$bid_status', 'Accepted'] }, 1, 0] }
          },
          pendingBids: {
            $sum: { $cond: [{ $eq: ['$bid_status', 'Pending'] }, 1, 0] }
          },
          totalBidAmount: { $sum: '$total_amount' },
          totalBidFees: { $sum: '$bid_fee' }
        }
      }
    ]);

    // Get user details for free bids info
    const userDetails = await user.findById(userId).select('freeBids subscription');

    const stats = {
      eligibility: {
        canBid: eligibility.canBid,
        requiresPayment: true, // All bids require payment
        reason: eligibility.reason,
        feeAmount: eligibility.feeAmount,
        remaining: eligibility.remaining || 0
      },
      bids: bidStats[0] || {
        totalBids: 0,
        acceptedBids: 0,
        pendingBids: 0,
        totalBidAmount: 0,
        totalBidFees: 0
      },
      freeBids: userDetails?.freeBids || { remaining: 5, used: 0 },
      subscription: userDetails?.subscription || { isActive: false, expiresAt: null }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching bid stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bid statistics"
    });
  }
};
