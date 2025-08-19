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
    return { canBid: false, reason: 'user_not_found' };
  }

  // Check if user has active subscription
  if (User.subscription?.isActive && User.subscription?.expiresAt > new Date()) {
    return { canBid: true, requiresPayment: false, reason: 'subscription' };
  }

  // Check if user has free bids remaining
  if (User.freeBids?.remaining > 0) {
    return { canBid: true, requiresPayment: false, reason: 'free_bid', remaining: User.freeBids.remaining };
  }

  // User needs to pay bid fee
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

    if (eligibility.requiresPayment) {
      // User needs to pay bid fee (after using free bids)
      bidFee = 9; // ₹9 bidding fee
      totalAmount = bid_amount + bidFee;
      requiresPayment = true;
    } else {
      // Free bid (first 5 bids or subscription)
      bidFee = 0; // No fee for free bids
      totalAmount = bid_amount; // Only the original bid amount
      requiresPayment = false;
    }

    // If payment is required, create payment intent first
    let paymentIntent = null;
    let cashfreeOrder = null;

    if (requiresPayment) {
      // Create payment intent
      paymentIntent = await PaymentIntent.create({
        provider: 'cashfree',
        purpose: 'bid_fee',
        amount: bidFee,
        userId: userID,
        projectId: _id,
        status: 'created',
        notes: { 
          bidAmount: bid_amount,
          totalAmount: totalAmount
        }
      });

      // Create Cashfree order
      cashfreeOrder = await cfCreateOrder({
        orderId: paymentIntent._id.toString(),
        amount: bidFee,
        customer: { 
          customer_id: String(userID), 
          customer_email: req.user.email, 
          customer_phone: req.user.phone || '9999999999' 
        },
        notes: 'Bid fee payment'
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
        fee: bidFee
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
      User.freeBids.remaining -= 1;
      User.freeBids.used += 1;
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
      res.status(201).json({ 
        message: "Bid created successfully. Payment required.",
        bid: newBid,
        paymentRequired: true,
        paymentData: {
          provider: 'cashfree',
          order: cashfreeOrder,
          intentId: paymentIntent._id,
          amount: bidFee
        },
        bidInfo: {
          originalAmount: bid_amount,
          fee: bidFee,
          totalAmount: totalAmount,
          paymentType: 'paid_bid'
        }
      });
    } else {
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
    const userID = req.user._id;
    const User = await user.findById(userID);

    if (!User) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = {
      freeBids: {
        remaining: User.freeBids?.remaining || 0,
        used: User.freeBids?.used || 0
      },
      subscription: {
        isActive: User.subscription?.isActive || false,
        expiresAt: User.subscription?.expiresAt
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching bid stats:", error);
    res.status(500).json({ message: error.message });
  }
};
