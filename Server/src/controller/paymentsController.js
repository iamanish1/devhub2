import PaymentIntent from '../Model/PaymentIntentModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import { createOrder as rpCreateOrder, createRefund } from '../services/razorpay.js';
import { BID_FEE, LISTING_FEE, BONUS_PER_CONTRIBUTOR } from '../utils/flags.js';
import { logPaymentEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';
import { v4 as uuid } from 'uuid';
import mongoose from 'mongoose';

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
      provider: 'razorpay',
      purpose: 'bid_fee',
      amount: BID_FEE,
      userId,
      projectId,
      status: 'created',
      notes: { bidId }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
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
      'feePayment.provider': 'razorpay',
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
        provider: 'razorpay',
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
      provider: 'razorpay',
      purpose: 'listing',
      amount: LISTING_FEE,
      userId,
      projectId,
      status: 'created'
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
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
        provider: 'razorpay',
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
    const { projectId, contributorsCount, projectTitle, amountPerContributor, isNewProject } = req.body;
    const userId = req.user._id;

    let project = null;
    let minBonus = 0;

    if (isNewProject) {
      // For new projects, use the provided amount per contributor
      minBonus = amountPerContributor * contributorsCount;
    } else {
      // For existing projects, validate project ownership
      project = await ProjectListing.findOne({ _id: projectId, user: userId });
      if (!project) {
        throw new ApiError(404, 'Project not found or access denied');
      }

      // Check if bonus already funded
      if (project.bonus?.funded) {
        throw new ApiError(400, 'Bonus already funded for this project');
      }

      // Calculate minimum bonus amount
      minBonus = BONUS_PER_CONTRIBUTOR * contributorsCount;
    }

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'bonus_funding',
      amount: minBonus,
      userId,
      projectId: projectId || null,
      status: 'created',
      notes: { 
        contributorsCount,
        isNewProject,
        projectTitle,
        amountPerContributor
      }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: minBonus,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Bonus funding payment'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    // Update project with bonus info (only for existing projects)
    if (projectId && project) {
      await ProjectListing.findByIdAndUpdate(projectId, {
        $set: { 
          'bonus.minRequired': minBonus,
          'bonus.razorpayOrderId': order.order_id
        }
      });
    }

    logPaymentEvent('bonus_funding_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      projectId: projectId || 'new_project',
      amount: minBonus,
      contributorsCount,
      isNewProject
    });

    res.status(201).json({
      success: true,
      message: 'Bonus funding initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id,
        amount: minBonus,
        purpose: 'bonus_funding'
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

// Create subscription payment (₹299/month)
export const createSubscription = async (req, res) => {
  try {
    const { planType = 'monthly' } = req.body;
    const userId = req.user._id;

    // Check if user already has active subscription
    const existingSubscription = await PaymentIntent.findOne({
      purpose: 'subscription',
      userId,
      status: 'paid',
      'notes.planType': planType,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    if (existingSubscription) {
      throw new ApiError(400, 'Active subscription already exists');
    }

    const subscriptionAmount = 299; // ₹299/month

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'subscription',
      amount: subscriptionAmount,
      userId,
      status: 'created',
      notes: { planType }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: subscriptionAmount,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Premium subscription payment'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    logPaymentEvent('subscription_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      planType,
      amount: subscriptionAmount
    });

    res.status(201).json({
      success: true,
      message: 'Subscription payment initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id,
        planType,
        amount: subscriptionAmount
      }
    });

  } catch (error) {
    logPaymentEvent('subscription_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating subscription payment'
    });
  }
};

// Create withdrawal payment (₹15 fee)
export const createWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // Validate withdrawal amount
    if (!amount || amount <= 0 || amount > 10000) {
      throw new ApiError(400, 'Invalid withdrawal amount. Must be between ₹1 and ₹10,000');
    }

    const withdrawalFee = 15; // ₹15 withdrawal fee
    const totalAmount = withdrawalFee; // User pays the fee

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'withdrawal_fee',
      amount: totalAmount,
      userId,
      status: 'created',
      notes: { 
        withdrawalAmount: amount,
        fee: withdrawalFee
      }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: totalAmount,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Withdrawal fee payment'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    logPaymentEvent('withdrawal_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      withdrawalAmount: amount,
      fee: withdrawalFee
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal fee payment initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id,
        withdrawalAmount: amount,
        fee: withdrawalFee
      }
    });

  } catch (error) {
    logPaymentEvent('withdrawal_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating withdrawal payment'
    });
  }
};

// Process refund for failed project or cancelled payment
export const processRefund = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    // Find the payment intent
    const paymentIntent = await PaymentIntent.findOne({
      _id: paymentIntentId,
      userId: userId
    });

    if (!paymentIntent) {
      throw new ApiError(404, 'Payment intent not found');
    }

    if (paymentIntent.status === 'refunded') {
      throw new ApiError(400, 'Payment has already been refunded');
    }

    if (paymentIntent.status !== 'paid') {
      throw new ApiError(400, 'Payment must be completed before refund');
    }

    // Create refund through Razorpay
    const refund = await createRefund(
      paymentIntent.paymentId, // Use paymentId for Razorpay refunds
      `refund_${Date.now()}`,
      paymentIntent.amount,
      reason || 'User requested refund'
    );

    // Update payment intent status
    paymentIntent.status = 'refunded';
    paymentIntent.notes = {
      ...paymentIntent.notes,
      refundId: refund.refund_id,
      refundReason: reason,
      refundedAt: new Date()
    };
    await paymentIntent.save();

    // If this was a bid fee payment, update the bid status
    if (paymentIntent.purpose === 'bid_fee') {
      await Bidding.updateOne(
        { 'escrow_details.payment_intent_id': paymentIntentId },
        { 
          payment_status: 'refunded',
          'escrow_details.refunded_at': new Date()
        }
      );
    }

    logPaymentEvent('refund_processed', {
      paymentIntentId,
      userId,
      amount: paymentIntent.amount,
      reason,
      refundId: refund.refund_id
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.refund_id,
        amount: paymentIntent.amount,
        reason,
        refundedAt: new Date()
      }
    });

  } catch (error) {
    logPaymentEvent('refund_error', {
      paymentIntentId: req.params.paymentIntentId,
      error: error.message
    });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error processing refund'
    });
  }
};

// Get refund history
export const getRefundHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const refunds = await PaymentIntent.find({
      userId,
      status: 'refunded'
    })
    .populate('projectId', 'project_Title')
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await PaymentIntent.countDocuments({
      userId,
      status: 'refunded'
    });

    const formattedRefunds = refunds.map(payment => ({
      id: payment._id,
      purpose: payment.purpose,
      amount: payment.amount,
      refundReason: payment.notes?.refundReason,
      refundedAt: payment.notes?.refundedAt,
      projectTitle: payment.projectId?.project_Title || 'N/A',
      provider: payment.provider
    }));

    res.status(200).json({
      success: true,
      data: {
        refunds: formattedRefunds,
        pagination: {
          currentPage: parseInt(page),
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
      message: 'Error fetching refund history'
    });
  }
};

// Get subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the most recent subscription payment
    const subscription = await PaymentIntent.findOne({
      purpose: 'subscription',
      userId,
      status: 'paid'
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: {
          isActive: false,
          subscription: null
        }
      });
    }

    // Check if subscription is still active (within 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const isActive = subscription.createdAt >= thirtyDaysAgo;

    res.status(200).json({
      success: true,
      data: {
        isActive,
        subscription: {
          id: subscription._id,
          planType: subscription.notes?.planType || 'monthly',
          amount: subscription.amount,
          status: subscription.status,
          createdAt: subscription.createdAt,
          expiresAt: new Date(subscription.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription status'
    });
  }
};

// Get bonus pools
export const getBonusPools = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all projects with bonus pools created by the user
    const projects = await ProjectListing.find({
      user: userId,
      'bonus.minRequired': { $exists: true, $gt: 0 }
    }).select('project_Title bonus createdAt');

    const bonusPools = projects.map(project => ({
      id: project._id,
      projectTitle: project.project_Title,
      minRequired: project.bonus.minRequired,
      funded: project.bonus.funded || false,
      status: project.bonus.funded ? 'active' : 'pending',
      createdAt: project.createdAt
    }));

    res.status(200).json({
      success: true,
      data: bonusPools
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bonus pools'
    });
  }
};

// Get withdrawal history
export const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const filter = { 
      userId, 
      purpose: 'withdrawal_fee' 
    };

    const withdrawals = await PaymentIntent.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentIntent.countDocuments(filter);

    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal._id,
      amount: withdrawal.notes?.withdrawalAmount || 0,
      fee: withdrawal.notes?.fee || 0,
      status: withdrawal.status,
      provider: withdrawal.provider,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          currentPage: parseInt(page),
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
      message: 'Error fetching withdrawal history'
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

// Get detailed payment analytics
export const getPaymentAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get payment statistics
    const paymentStats = await PaymentIntent.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$purpose',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await PaymentIntent.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get recent activity
    const recentActivity = await PaymentIntent.find({
      userId,
      createdAt: { $gte: startDate }
    })
    .populate('projectId', 'project_Title')
    .sort({ createdAt: -1 })
    .limit(10);

    const analytics = {
      period,
      summary: {
        totalPayments: paymentStats.reduce((sum, stat) => sum + stat.count, 0),
        totalAmount: paymentStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
        successfulPayments: paymentStats.reduce((sum, stat) => sum + stat.successfulPayments, 0),
        failedPayments: paymentStats.reduce((sum, stat) => sum + stat.failedPayments, 0)
      },
      byPurpose: paymentStats,
      monthlyTrends: monthlyTrends.map(trend => ({
        period: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
        amount: trend.totalAmount,
        count: trend.count
      })),
      recentActivity: recentActivity.map(payment => ({
        id: payment._id,
        purpose: payment.purpose,
        amount: payment.amount,
        status: payment.status,
        provider: payment.provider,
        projectTitle: payment.projectId?.project_Title || 'N/A',
        createdAt: payment.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment analytics'
    });
  }
};

// Get user's payment summary
export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's payment summary
    const summary = await PaymentIntent.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

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

    const paymentSummary = {
      payments: summary[0] || {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0
      },
      bids: bidStats[0] || {
        totalBids: 0,
        acceptedBids: 0,
        pendingBids: 0,
        totalBidAmount: 0,
        totalBidFees: 0
      }
    };

    res.status(200).json({
      success: true,
      data: paymentSummary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment summary'
    });
  }
};
