import PaymentIntent from '../Model/PaymentIntentModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import { createOrder as rzpCreateOrder } from '../services/razorpay.js';
import { createOrder as cfCreateOrder } from '../services/cashfree.js';
import { BID_FEE, LISTING_FEE, BONUS_PER_CONTRIBUTOR } from '../utils/flags.js';
import { logPaymentEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';
import { v4 as uuid } from 'uuid';

// Create bid fee payment (₹9)
export const createBidFee = async (req, res) => {
  try {
    const { projectId, bidId } = req.body;
    const userId = req.user._id;

    // Check if bid fee already paid for this bid
    const existingPayment = await PaymentIntent.findOne({
      purpose: 'bid_fee',
      userId,
      projectId,
      'notes.bidId': bidId,
      status: 'paid'
    });

    if (existingPayment) {
      throw new ApiError(400, 'Bid fee already paid for this bid');
    }

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'cashfree',
      purpose: 'bid_fee',
      amount: BID_FEE,
      userId,
      projectId,
      status: 'created',
      notes: { bidId }
    });

    // Create Cashfree order
    const order = await cfCreateOrder({
      orderId: intent._id.toString(),
      amount: BID_FEE,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Bid fee payment'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    // Update bid with payment info
    await Bidding.findByIdAndUpdate(bidId, {
      'feePayment.provider': 'cashfree',
      'feePayment.orderId': order.order_id,
      'feePayment.status': 'pending'
    });

    logPaymentEvent('bid_fee_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      projectId,
      bidId
    });

    res.status(201).json({
      success: true,
      message: 'Bid fee payment initiated',
      data: {
        provider: 'cashfree',
        order,
        intentId: intent._id
      }
    });

  } catch (error) {
    logPaymentEvent('bid_fee_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating bid fee payment'
    });
  }
};

// Create listing fee payment (₹199)
export const createListing = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user._id;

    // Check if listing fee already paid for this project
    const existingPayment = await PaymentIntent.findOne({
      purpose: 'listing',
      userId,
      projectId,
      status: 'paid'
    });

    if (existingPayment) {
      throw new ApiError(400, 'Listing fee already paid for this project');
    }

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'cashfree',
      purpose: 'listing',
      amount: LISTING_FEE,
      userId,
      projectId,
      status: 'created'
    });

    // Create Cashfree order
    const order = await cfCreateOrder({
      orderId: intent._id.toString(),
      amount: LISTING_FEE,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Project listing fee'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    logPaymentEvent('listing_fee_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      projectId
    });

    res.status(201).json({
      success: true,
      message: 'Listing fee payment initiated',
      data: {
        provider: 'cashfree',
        order,
        intentId: intent._id
      }
    });

  } catch (error) {
    logPaymentEvent('listing_fee_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating listing fee payment'
    });
  }
};

// Create bonus pool funding (₹200 × contributors)
export const createBonus = async (req, res) => {
  try {
    const { projectId, contributorsCount } = req.body;
    const userId = req.user._id;

    // Validate project ownership
    const project = await ProjectListing.findOne({ _id: projectId, user: userId });
    if (!project) {
      throw new ApiError(404, 'Project not found or access denied');
    }

    // Check if bonus already funded
    if (project.bonus?.funded) {
      throw new ApiError(400, 'Bonus already funded for this project');
    }

    // Calculate minimum bonus amount
    const minBonus = BONUS_PER_CONTRIBUTOR * contributorsCount;

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'bonus',
      amount: minBonus,
      userId,
      projectId,
      status: 'created',
      notes: { contributorsCount }
    });

    // Create Razorpay order
    const order = await rzpCreateOrder({ 
      amount: minBonus, 
      notes: { 
        purpose: 'bonus', 
        projectId: projectId.toString() 
      } 
    });

    // Update intent with order ID
    intent.orderId = order.id;
    await intent.save();

    // Update project with bonus info
    await ProjectListing.findByIdAndUpdate(projectId, {
      $set: { 
        'bonus.minRequired': minBonus,
        'bonus.razorpayOrderId': order.id
      }
    });

    logPaymentEvent('bonus_funding_created', {
      intentId: intent._id,
      orderId: order.id,
      userId,
      projectId,
      amount: minBonus,
      contributorsCount
    });

    res.status(201).json({
      success: true,
      message: 'Bonus funding initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id,
        amount: minBonus
      }
    });

  } catch (error) {
    logPaymentEvent('bonus_funding_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating bonus funding'
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { intentId } = req.params;
    const userId = req.user._id;

    const intent = await PaymentIntent.findOne({ _id: intentId, userId });
    if (!intent) {
      throw new ApiError(404, 'Payment intent not found');
    }

    res.status(200).json({
      success: true,
      data: {
        intentId: intent._id,
        status: intent.status,
        amount: intent.amount,
        purpose: intent.purpose,
        provider: intent.provider,
        orderId: intent.orderId,
        paymentId: intent.paymentId,
        createdAt: intent.createdAt,
        updatedAt: intent.updatedAt
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error fetching payment status'
    });
  }
};

// Get user's payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, purpose } = req.query;

    const filter = { userId };
    if (purpose) {
      filter.purpose = purpose;
    }

    const payments = await PaymentIntent.find(filter)
      .populate('projectId', 'project_Title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentIntent.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history'
    });
  }
};
