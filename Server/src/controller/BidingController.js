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
    console.log(`[Bid Eligibility] User has active subscription - allowing free bid`);
    return { canBid: true, requiresPayment: false, reason: 'subscription' };
  }

  // Check if user has free bids remaining
  if (User.freeBids?.remaining > 0) {
    console.log(`[Bid Eligibility] User has ${User.freeBids.remaining} free bids remaining - allowing free bid`);
    return { canBid: true, requiresPayment: false, reason: 'free_bid', remaining: User.freeBids.remaining };
  }

  // User needs to pay bid fee
  console.log(`[Bid Eligibility] User has no free bids or subscription - payment required`);
  return { canBid: true, requiresPayment: true, reason: 'payment_required' };
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
    let bidFee = 0;
    let totalAmount = bid_amount;
    let requiresPayment = false;

    console.log(`[Bid Creation] Eligibility check result:`, eligibility);

    if (eligibility.requiresPayment) {
      // User needs to pay bid fee (after using free bids)
      bidFee = 9; // ₹9 bidding fee
      totalAmount = bid_amount + bidFee;
      requiresPayment = true;
      console.log(`[Bid Creation] Payment required - bidFee: ₹${bidFee}, totalAmount: ₹${totalAmount}`);
    } else {
      // Free bid (first 5 bids or subscription)
      bidFee = 0; // No fee for free bids
      totalAmount = bid_amount; // Only the original bid amount
      requiresPayment = false;
      console.log(`[Bid Creation] Free bid - bidFee: ₹${bidFee}, totalAmount: ₹${totalAmount}, reason: ${eligibility.reason}`);
    }

    // If payment is required, create payment intent first
    let paymentIntent = null;
    let cashfreeOrder = null;

    if (requiresPayment) {
      // Create payment intent for the TOTAL amount (bid amount + fee)
      paymentIntent = await PaymentIntent.create({
        provider: 'cashfree',
        purpose: 'bid_fee',
        amount: totalAmount, // Total amount including bid amount + fee
        userId: userID,
        projectId: _id,
        status: 'created',
        notes: { 
          bidAmount: bid_amount,
          bidFee: bidFee,
          totalAmount: totalAmount
        }
      });

      // Create Cashfree order for the TOTAL amount
      cashfreeOrder = await cfCreateOrder({
        orderId: paymentIntent._id.toString(),
        amount: totalAmount, // Total amount including bid amount + fee
        customer: { 
          customer_id: String(userID), 
          customer_email: req.user.email, 
          customer_phone: req.user.phone || '9999999999' 
        },
        notes: 'Bid payment (bid amount + fee)'
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
        totalAmount: totalAmount
      });
    }

    // Create the bid
    const newBid = new Bidding({
      project_id: _id,
      user_id: userID,
      bid_amount: bid_amount, // Original bid amount
      bid_fee: bidFee, // ₹9 fee or 0 for free bids
      total_amount: totalAmount, // Total including fee (or just bid amount for free)
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills,
      is_free_bid: !requiresPayment,
      payment_status: requiresPayment ? 'pending' : 'free'
    });

    await newBid.save();

    // Update user's bid statistics
    const User = await user.findById(userID);
    if (!requiresPayment && eligibility.reason === 'free_bid') {
      console.log(`[Bid Creation] Updating free bid statistics - before: remaining: ${User.freeBids.remaining}, used: ${User.freeBids.used}`);
      User.freeBids.remaining -= 1;
      User.freeBids.used += 1;
      console.log(`[Bid Creation] Updated free bid statistics - after: remaining: ${User.freeBids.remaining}, used: ${User.freeBids.used}`);
    } else {
      console.log(`[Bid Creation] No free bid statistics update needed - requiresPayment: ${requiresPayment}, reason: ${eligibility.reason}`);
    }
    await User.save();

    // Update project statistics
    const projectObjectId = new mongoose.Types.ObjectId(_id);
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

        console.log("Firebase Sync Data:", {
          total_bids: totalBids,
          number_of_contributors: uniqueContributors,
          current_bid_amount: currentBidAmount,
        });
      } catch (firestoreError) {
        console.warn("Firestore sync failed:", firestoreError.message);
      }
    }

    // Return response based on payment requirement
    if (requiresPayment) {
      console.log(`[Bid Creation] Returning payment required response - totalAmount: ₹${totalAmount}`);
      res.status(201).json({ 
        message: "Bid created successfully. Payment required.",
        bid: newBid,
        paymentRequired: true,
        paymentData: {
          provider: 'cashfree',
          order: cashfreeOrder,
          intentId: paymentIntent._id,
          amount: totalAmount // Total amount including bid amount + fee
        },
        bidInfo: {
          originalAmount: bid_amount,
          fee: bidFee,
          totalAmount: totalAmount,
          paymentType: 'paid_bid'
        }
      });
    } else {
      console.log(`[Bid Creation] Returning free bid response - totalAmount: ₹${totalAmount}, reason: ${eligibility.reason}`);
      res.status(201).json({ 
        message: "Bid created successfully", 
        bid: newBid,
        paymentRequired: false,
        bidInfo: {
          originalAmount: bid_amount,
          fee: bidFee,
          totalAmount: totalAmount,
          paymentType: eligibility.reason
        }
      });
    }

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
        requiresPayment: eligibility.requiresPayment,
        reason: eligibility.reason,
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
