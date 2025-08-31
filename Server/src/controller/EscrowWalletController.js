import EscrowWallet from '../Model/EscrowWalletModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import ProjectSelection from '../Model/ProjectSelectionModel.js';
import Bidding from '../Model/BiddingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import PaymentIntent from '../Model/PaymentIntentModel.js';
import user from '../Model/UserModel.js';
import { logger } from '../utils/logger.js';
import notificationService from '../services/notificationService.js';
import { createOrder as rpCreateOrder, createPayout } from '../services/razorpay.js';
import mongoose from 'mongoose';

/**
 * Create escrow wallet for a project
 */
export const createEscrowWallet = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { bonusPoolAmount } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only create escrow for your own projects' });
    }

    // Check if escrow already exists
    const existingEscrow = await EscrowWallet.findOne({ projectId });
    if (existingEscrow) {
      return res.status(400).json({ message: 'Escrow wallet already exists for this project' });
    }

    // Get project selection to determine number of contributors
    const selection = await ProjectSelection.findOne({ projectId });
    if (!selection || selection.status !== 'completed') {
      return res.status(400).json({ message: 'Project selection must be completed before creating escrow' });
    }

    const totalContributors = selection.selectedUsers.length;
    const amountPerContributor = Math.floor(bonusPoolAmount / totalContributors);

    // Calculate total bid amount from selected users
    let totalBidAmount = 0;
    for (const selectedUser of selection.selectedUsers) {
      const bid = await Bidding.findById(selectedUser.bidId);
      if (bid) {
        totalBidAmount += bid.bid_amount || 0;
      }
    }

    // Calculate total escrow amount (bid amount + bonus pool)
    const totalEscrowAmount = totalBidAmount + bonusPoolAmount;

    // Create escrow wallet
    const escrowWallet = new EscrowWallet({
      projectId,
      projectOwner: req.user._id,
      totalBidAmount: totalBidAmount,
      totalBonusPool: bonusPoolAmount,
      totalEscrowAmount: totalEscrowAmount,
      bonusPoolDistribution: {
        totalContributors,
        amountPerContributor,
        distributedAmount: 0,
        remainingAmount: bonusPoolAmount
      },
      status: 'active'
    });

         await escrowWallet.save();

     // Send notification to project owner
     try {
       await notificationService.sendEscrowCreatedNotification(
         req.user._id,
         projectId,
         bonusPoolAmount,
         totalContributors
       );
     } catch (notificationError) {
       logger.error(`[EscrowWallet] Notification failed: ${notificationError.message}`);
     }

     logger.info(`[EscrowWallet] Created escrow wallet for project: ${projectId}, Bonus pool: ${bonusPoolAmount}`);

     res.status(201).json({
       message: 'Escrow wallet created successfully',
       escrowWallet
     });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in createEscrowWallet: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Lock user funds in escrow (called when user is selected)
 */
export const lockUserFunds = async (req, res) => {
  try {
    const { projectId, userId, bidId } = req.params;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only lock funds for your own projects' });
    }

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      return res.status(404).json({ message: 'Escrow wallet not found' });
    }

    // Get bid details
    const bid = await Bidding.findById(bidId);
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    if (bid.user_id.toString() !== userId) {
      return res.status(400).json({ message: 'Bid does not belong to the specified user' });
    }

    // Calculate bonus amount for this user
    const bonusAmount = escrowWallet.bonusPoolDistribution.amountPerContributor;

    // Lock funds in escrow
    escrowWallet.lockUserFunds(userId, bidId, bid.bid_amount, bonusAmount);

    // Add audit log
    escrowWallet.addAuditLog(
      'lock',
      bid.bid_amount + bonusAmount,
      userId,
      'User selected for project - funds locked in escrow',
      req.ip,
      req.get('User-Agent')
    );

    await escrowWallet.save();

    // Update bid status to locked
    bid.payment_status = 'locked';
    await bid.save();

    logger.info(`[EscrowWallet] Locked funds for user: ${userId}, Project: ${projectId}, Amount: ${bid.bid_amount + bonusAmount}`);

    res.status(200).json({
      message: 'Funds locked successfully',
      escrowWallet,
      lockedAmount: bid.bid_amount + bonusAmount
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in lockUserFunds: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Release user funds from escrow (called when project is completed)
 */
export const releaseUserFunds = async (req, res) => {
  try {
    const { projectId, userId, bidId } = req.params;
    const { reason = 'project_completion', notes = '' } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only release funds for your own projects' });
    }

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      return res.status(404).json({ message: 'Escrow wallet not found' });
    }

    // Find the locked fund
    const lockedFund = escrowWallet.lockedFunds.find(fund => 
      fund.userId.toString() === userId && fund.bidId.toString() === bidId
    );

    if (!lockedFund) {
      return res.status(404).json({ message: 'No locked funds found for this user and bid' });
    }

    if (lockedFund.lockStatus !== 'locked') {
      return res.status(400).json({ message: `Funds are not locked. Current status: ${lockedFund.lockStatus}` });
    }

    // Release funds
    escrowWallet.releaseUserFunds(userId, bidId, reason);

    // Add audit log
    escrowWallet.addAuditLog(
      'release',
      lockedFund.totalAmount,
      userId,
      `Funds released: ${reason} - ${notes}`,
      req.ip,
      req.get('User-Agent')
    );

    await escrowWallet.save();

    // Update bid status
    const bid = await Bidding.findById(bidId);
    if (bid) {
      bid.payment_status = 'paid';
      await bid.save();
    }

         // Process payment to user (integrate with Razorpay)
     try {
       await processPaymentToUser(userId, lockedFund.totalAmount, projectId, bidId);
     } catch (paymentError) {
       logger.error(`[EscrowWallet] Payment processing failed: ${paymentError.message}`);
       // Don't fail the release, but log the payment error
     }

     // Send notification to user
     try {
       await notificationService.sendProjectCompletionNotification(
         userId,
         projectId,
         lockedFund.bidAmount,
         lockedFund.bonusAmount
       );
     } catch (notificationError) {
       logger.error(`[EscrowWallet] Notification failed: ${notificationError.message}`);
     }

     logger.info(`[EscrowWallet] Released funds for user: ${userId}, Project: ${projectId}, Amount: ${lockedFund.totalAmount}`);

     res.status(200).json({
       message: 'Funds released successfully',
       escrowWallet,
       releasedAmount: lockedFund.totalAmount
     });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in releaseUserFunds: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Refund user funds (called when project is cancelled or user is removed)
 */
export const refundUserFunds = async (req, res) => {
  try {
    const { projectId, userId, bidId } = req.params;
    const { reason = 'cancellation', notes = '' } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only refund funds for your own projects' });
    }

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      return res.status(404).json({ message: 'Escrow wallet not found' });
    }

    // Find the locked fund
    const lockedFund = escrowWallet.lockedFunds.find(fund => 
      fund.userId.toString() === userId && fund.bidId.toString() === bidId
    );

    if (!lockedFund) {
      return res.status(404).json({ message: 'No locked funds found for this user and bid' });
    }

    if (lockedFund.lockStatus !== 'locked') {
      return res.status(400).json({ message: `Funds are not locked. Current status: ${lockedFund.lockStatus}` });
    }

    // Refund funds
    escrowWallet.refundUserFunds(userId, bidId, reason);

    // Add audit log
    escrowWallet.addAuditLog(
      'refund',
      lockedFund.totalAmount,
      userId,
      `Funds refunded: ${reason} - ${notes}`,
      req.ip,
      req.get('User-Agent')
    );

    await escrowWallet.save();

    // Update bid status
    const bid = await Bidding.findById(bidId);
    if (bid) {
      bid.payment_status = 'refunded';
      await bid.save();
    }

    logger.info(`[EscrowWallet] Refunded funds for user: ${userId}, Project: ${projectId}, Amount: ${lockedFund.totalAmount}`);

    res.status(200).json({
      message: 'Funds refunded successfully',
      escrowWallet,
      refundedAmount: lockedFund.totalAmount
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in refundUserFunds: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get escrow wallet details
 */
export const getEscrowWallet = async (req, res) => {
  try {
    const { projectId } = req.params;

    const escrowWallet = await EscrowWallet.findByProjectId(projectId);

    if (!escrowWallet) {
      return res.status(404).json({ message: 'Escrow wallet not found' });
    }

    // Check if user has access (project owner or selected user)
    const isProjectOwner = escrowWallet.projectOwner._id.toString() === req.user._id.toString();
    const isSelectedUser = escrowWallet.lockedFunds.some(fund => 
      fund.userId._id.toString() === req.user._id.toString()
    );

    if (!isProjectOwner && !isSelectedUser) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      escrowWallet,
      userAccess: {
        isProjectOwner,
        isSelectedUser
      }
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in getEscrowWallet: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get all escrow wallets for a project owner
 */
export const getProjectOwnerEscrows = async (req, res) => {
  try {
    const escrowWallets = await EscrowWallet.findByProjectOwner(req.user._id);

    res.status(200).json({
      escrowWallets,
      total: escrowWallets.length
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in getProjectOwnerEscrows: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Complete project and release all funds
 */
export const completeProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { completionNotes = '', qualityScore } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only complete your own projects' });
    }

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      return res.status(404).json({ message: 'Escrow wallet not found' });
    }

    // Update project completion status
    escrowWallet.projectCompletion = {
      isCompleted: true,
      completedAt: new Date(),
      completedBy: req.user._id,
      completionNotes,
      qualityScore
    };

    // Release all locked funds
    const releasePromises = escrowWallet.lockedFunds
      .filter(fund => fund.lockStatus === 'locked')
      .map(async (fund) => {
        try {
          escrowWallet.releaseUserFunds(fund.userId, fund.bidId, 'project_completion');
          
          // Process payment to user
          await processPaymentToUser(fund.userId, fund.totalAmount, projectId, fund.bidId);
          
          return { success: true, userId: fund.userId, amount: fund.totalAmount };
        } catch (error) {
          logger.error(`[EscrowWallet] Failed to release funds for user ${fund.userId}: ${error.message}`);
          return { success: false, userId: fund.userId, error: error.message };
        }
      });

    const releaseResults = await Promise.all(releasePromises);

    // Add audit log
    escrowWallet.addAuditLog(
      'release',
      escrowWallet.totalEscrowAmount,
      req.user._id,
      `Project completed - all funds released`,
      req.ip,
      req.get('User-Agent')
    );

    await escrowWallet.save();

    // Update project status
    project.status = 'completed';
    await project.save();

    logger.info(`[EscrowWallet] Project completed: ${projectId}, Released funds for ${releaseResults.filter(r => r.success).length} users`);

    res.status(200).json({
      message: 'Project completed and funds released successfully',
      escrowWallet,
      releaseResults
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in completeProject: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Process payment to user via Razorpay
 */
async function processPaymentToUser(userId, amount, projectId, bidId) {
  try {
    // Get user details
    const userDetails = await user.findById(userId);
    if (!userDetails) {
      throw new Error('User not found');
    }

    // Create payout via Razorpay
    const payoutData = {
      account_number: userDetails.account_number || 'default_account', // You'll need to store user's account details
      fund_account_id: userDetails.fund_account_id || 'default_fund_account',
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: `payout_${projectId}_${bidId}_${Date.now()}`,
      narration: `Payment for project ${projectId}`
    };

    const payout = await createPayout(payoutData);

    // Create payment intent record
    const paymentIntent = new PaymentIntent({
      provider: 'razorpay',
      purpose: 'project_payment',
      amount: amount,
      userId: userId,
      projectId: projectId,
      orderId: payout.id,
      status: 'paid',
      notes: {
        projectId,
        bidId,
        payoutId: payout.id,
        payoutStatus: payout.status
      }
    });

    await paymentIntent.save();

    logger.info(`[EscrowWallet] Payment processed for user: ${userId}, Amount: ${amount}, Payout ID: ${payout.id}`);

    return payout;

  } catch (error) {
    logger.error(`[EscrowWallet] Payment processing failed: ${error.message}`, error);
    throw error;
  }
}

/**
 * Create escrow wallet automatically when both bonus funding and project selection are completed
 */
export const createEscrowWalletIfReady = async (projectId, userId) => {
  try {
    // Check if escrow wallet already exists
    const existingEscrow = await EscrowWallet.findOne({ projectId });
    if (existingEscrow) {
      logger.info(`[EscrowWallet] Escrow wallet already exists for project: ${projectId}`);
      return existingEscrow;
    }

    // Check if project selection is completed
    const { default: ProjectSelection } = await import('../Model/ProjectSelectionModel.js');
    const selection = await ProjectSelection.findOne({ projectId });
    if (!selection || selection.status !== 'completed') {
      logger.info(`[EscrowWallet] Project selection not completed for project: ${projectId}`);
      return null;
    }

    // Check if bonus pool has been funded
    const bonusPool = await BonusPool.findOne({ projectId });
    if (!bonusPool || bonusPool.status !== 'funded') {
      logger.info(`[EscrowWallet] Bonus pool not funded for project: ${projectId}`);
      return null;
    }

    // Calculate total bid amount from selected users
    let totalBidAmount = 0;
    for (const selectedUser of selection.selectedUsers) {
      const bid = await Bidding.findById(selectedUser.bidId);
      if (bid) {
        totalBidAmount += bid.bid_amount || 0;
      }
    }

    // Calculate total escrow amount (bid amount + bonus pool)
    const totalEscrowAmount = totalBidAmount + bonusPool.totalAmount;

    // Create escrow wallet
    const escrowWallet = new EscrowWallet({
      projectId,
      projectOwner: userId,
      totalBidAmount: totalBidAmount,
      totalBonusPool: bonusPool.totalAmount,
      totalEscrowAmount: totalEscrowAmount,
      bonusPoolDistribution: {
        totalContributors: selection.selectedUsers.length,
        amountPerContributor: Math.floor(bonusPool.totalAmount / selection.selectedUsers.length),
        distributedAmount: 0,
        remainingAmount: bonusPool.totalAmount
      },
      status: 'active'
    });

    await escrowWallet.save();

    // Send notification to project owner
    try {
      await notificationService.sendEscrowCreatedNotification(
        userId,
        projectId,
        bonusPool.totalAmount,
        selection.selectedUsers.length
      );
    } catch (notificationError) {
      logger.error(`[EscrowWallet] Notification failed: ${notificationError.message}`);
    }

    logger.info(`[EscrowWallet] Created escrow wallet for project: ${projectId}, Bonus pool: ${bonusPool.totalAmount}`);

    return escrowWallet;

  } catch (error) {
    logger.error(`[EscrowWallet] Error in createEscrowWalletIfReady: ${error.message}`, error);
    return null;
  }
};

/**
 * Get escrow statistics
 */
export const getEscrowStats = async (req, res) => {
  try {
    const stats = await EscrowWallet.aggregate([
      {
        $match: {
          projectOwner: new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $group: {
          _id: null,
          totalEscrows: { $sum: 1 },
          totalLockedAmount: { $sum: '$totalEscrowAmount' },
          totalReleasedAmount: {
            $sum: {
              $reduce: {
                input: '$lockedFunds',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    {
                      $cond: [
                        { $eq: ['$$this.lockStatus', 'released'] },
                        '$$this.totalAmount',
                        0
                      ]
                    }
                  ]
                }
              }
            }
          },
          activeEscrows: {
            $sum: {
              $cond: [
                { $in: ['$status', ['active', 'locked']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const statsData = stats[0] || {
      totalEscrows: 0,
      totalLockedAmount: 0,
      totalReleasedAmount: 0,
      activeEscrows: 0
    };

    res.status(200).json({
      stats: statsData
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in getEscrowStats: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get user's escrow wallet for a specific project
 */
export const getUserEscrowWallet = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[EscrowWallet] Getting user escrow wallet for project ${projectId}, user ${userId}`);

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      logger.info(`[EscrowWallet] No escrow wallet found for project ${projectId}`);
      return res.status(404).json({ 
        message: 'Escrow wallet not found for this project',
        errorType: 'NO_ESCROW_WALLET',
        projectId,
        userId
      });
    }

    logger.info(`[EscrowWallet] Found escrow wallet for project ${projectId}, checking user funds for user ${userId}`);
    logger.info(`[EscrowWallet] Escrow wallet has ${escrowWallet.lockedFunds?.length || 0} locked funds`);

    // Find user's locked funds
    const userFunds = escrowWallet.lockedFunds.find(fund => 
      fund.userId.toString() === userId.toString()
    );

    if (!userFunds) {
      logger.info(`[EscrowWallet] No escrow funds found for user ${userId} in project ${projectId}`);
      logger.info(`[EscrowWallet] Available users in escrow: ${escrowWallet.lockedFunds?.map(f => f.userId.toString()).join(', ')}`);
      return res.status(404).json({ 
        message: 'No escrow funds found for this user',
        errorType: 'NO_USER_FUNDS',
        projectId,
        userId,
        availableUsers: escrowWallet.lockedFunds?.map(f => f.userId.toString()) || []
      });
    }

    // Calculate user's earnings
    const userEarnings = {
      bidAmount: userFunds.bidAmount,
      bonusAmount: userFunds.bonusAmount,
      totalAmount: userFunds.totalAmount,
      status: userFunds.lockStatus,
      lockedAt: userFunds.lockedAt,
      releasedAt: userFunds.releasedAt,
      refundedAt: userFunds.refundedAt,
      releaseReason: userFunds.releaseReason,
      releaseNotes: userFunds.releaseNotes
    };

    res.status(200).json({
      escrowWallet: {
        id: escrowWallet._id,
        projectId: escrowWallet.projectId,
        status: escrowWallet.status,
        totalEscrowAmount: escrowWallet.totalEscrowAmount,
        totalBonusPool: escrowWallet.totalBonusPool,
        projectCompletion: escrowWallet.projectCompletion
      },
      userEarnings
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in getUserEscrowWallet: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get user's escrow status for a specific project
 */
export const getUserEscrowStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[EscrowWallet] Getting user escrow status for project ${projectId}, user ${userId}`);

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      return res.status(404).json({ message: 'Escrow wallet not found for this project' });
    }

    // Find user's locked funds
    const userFunds = escrowWallet.lockedFunds.find(fund => 
      fund.userId.toString() === userId.toString()
    );

    if (!userFunds) {
      return res.status(404).json({ message: 'No escrow funds found for this user' });
    }

    // Get project details
    const project = await ProjectListing.findById(projectId);
    const projectTitle = project ? project.project_Title : 'Unknown Project';

    const status = {
      projectId,
      projectTitle,
      userId,
      bidAmount: userFunds.bidAmount,
      bonusAmount: userFunds.bonusAmount,
      totalAmount: userFunds.totalAmount,
      status: userFunds.lockStatus,
      escrowWalletStatus: escrowWallet.status,
      projectCompleted: escrowWallet.projectCompletion?.isCompleted || false,
      canWithdraw: userFunds.lockStatus === 'released',
      lockedAt: userFunds.lockedAt,
      releasedAt: userFunds.releasedAt,
      releaseReason: userFunds.releaseReason
    };

    res.status(200).json({
      status
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in getUserEscrowStatus: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Request withdrawal of user's escrow funds
 */
export const requestUserWithdrawal = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { withdrawalMethod = 'razorpay', accountDetails } = req.body;

    logger.info(`[EscrowWallet] User ${userId} requesting withdrawal for project ${projectId}`);

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      return res.status(404).json({ message: 'Escrow wallet not found for this project' });
    }

    // Find user's locked funds
    const userFunds = escrowWallet.lockedFunds.find(fund => 
      fund.userId.toString() === userId.toString()
    );

    if (!userFunds) {
      return res.status(404).json({ message: 'No escrow funds found for this user' });
    }

    // Check if funds can be withdrawn
    if (userFunds.lockStatus !== 'released') {
      return res.status(400).json({ 
        message: 'Funds cannot be withdrawn yet. They will be available after project completion.' 
      });
    }

    // Process withdrawal via Razorpay
    try {
      const payout = await processPaymentToUser(userId, userFunds.totalAmount, projectId, userFunds.bidId);
      
      // Update fund status to withdrawn
      userFunds.lockStatus = 'withdrawn';
      userFunds.withdrawnAt = new Date();
      userFunds.withdrawalMethod = withdrawalMethod;
      userFunds.accountDetails = accountDetails;
      
      await escrowWallet.save();

      // Add audit log
      escrowWallet.addAuditLog(
        'withdrawal',
        userFunds.totalAmount,
        userId,
        `User withdrawal processed via ${withdrawalMethod}`,
        req.ip,
        req.get('User-Agent')
      );

      await escrowWallet.save();

      logger.info(`[EscrowWallet] Withdrawal processed for user ${userId}, amount: ${userFunds.totalAmount}`);

      res.status(200).json({
        message: 'Withdrawal request processed successfully',
        withdrawal: {
          amount: userFunds.totalAmount,
          method: withdrawalMethod,
          payoutId: payout.id,
          status: payout.status
        }
      });

    } catch (paymentError) {
      logger.error(`[EscrowWallet] Payment processing failed: ${paymentError.message}`);
      res.status(500).json({ 
        message: 'Withdrawal processing failed. Please try again later.',
        error: paymentError.message 
      });
    }

  } catch (error) {
    logger.error(`[EscrowWallet] Error in requestUserWithdrawal: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
