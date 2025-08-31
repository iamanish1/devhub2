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
import { WITHDRAWAL_FEE, WITHDRAWAL_MAX, WITHDRAWAL_MIN } from '../utils/flags.js';
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
      fund.userId.toString() === userId.toString() && fund.bidId.toString() === bidId.toString()
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
      fund.userId.toString() === userId.toString() && fund.bidId.toString() === bidId.toString()
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
      
      // Check if funds are properly locked
      if (existingEscrow.lockedFunds.length === 0) {
        logger.info(`[EscrowWallet] Escrow wallet exists but no funds are locked. Attempting to lock funds...`);
        const fundsLocked = await ensureEscrowFundsLocked(projectId, existingEscrow);
        if (fundsLocked) {
          logger.info(`[EscrowWallet] Successfully locked funds for existing escrow wallet`);
        } else {
          logger.error(`[EscrowWallet] Failed to lock funds for existing escrow wallet`);
        }
      }
      
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
 * Ensure escrow funds are properly locked for all selected users
 */
const ensureEscrowFundsLocked = async (projectId, escrowWallet) => {
  try {
    // Get project selection
    const { default: ProjectSelection } = await import('../Model/ProjectSelectionModel.js');
    const selection = await ProjectSelection.findOne({ projectId });
    if (!selection || selection.status !== 'completed') {
      logger.error(`[EscrowWallet] Project selection not completed for project: ${projectId}`);
      return false;
    }

    let allFundsLocked = true;

    // Lock funds for each selected user
    for (const selectedUser of selection.selectedUsers) {
      try {
        // Check if funds are already locked for this user
        const existingFund = escrowWallet.lockedFunds.find(fund => 
          fund.userId.toString() === selectedUser.userId.toString() && 
          fund.bidId.toString() === selectedUser.bidId.toString()
        );

        if (existingFund) {
          logger.info(`[EscrowWallet] Funds already locked for user ${selectedUser.userId}`);
          continue;
        }

        // Get the bid to get the bid amount
        const bid = await Bidding.findById(selectedUser.bidId);
        if (!bid) {
          logger.error(`[EscrowWallet] Bid not found for user ${selectedUser.userId}, bid ID: ${selectedUser.bidId}`);
          allFundsLocked = false;
          continue;
        }

        const bidAmount = bid.bid_amount || 0;
        const bonusAmount = escrowWallet.bonusPoolDistribution.amountPerContributor;

        logger.info(`[EscrowWallet] Locking funds for user ${selectedUser.userId}: bidAmount=${bidAmount}, bonusAmount=${bonusAmount}`);

        // Lock the funds
        escrowWallet.lockUserFunds(
          selectedUser.userId,
          selectedUser.bidId,
          bidAmount,
          bonusAmount
        );

        // Update selection record
        selectedUser.escrowLocked = true;
        selectedUser.escrowLockedAt = new Date();

        logger.info(`[EscrowWallet] Successfully locked funds for user ${selectedUser.userId}`);

      } catch (error) {
        logger.error(`[EscrowWallet] Failed to lock funds for user ${selectedUser.userId}: ${error.message}`);
        allFundsLocked = false;
      }
    }

    // Save both the escrow wallet and selection
    if (allFundsLocked) {
      await escrowWallet.save();
      await selection.save();
      logger.info(`[EscrowWallet] All escrow funds locked successfully for project: ${projectId}`);
    }

    return allFundsLocked;

  } catch (error) {
    logger.error(`[EscrowWallet] Error in ensureEscrowFundsLocked: ${error.message}`, error);
    return false;
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
 * Move released funds to user's available balance (Step 1 of withdrawal)
 */
export const moveFundsToBalance = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[EscrowWallet] User ${userId} requesting to move funds to balance for project ${projectId}`);

    // Get escrow wallet
    const escrowWallet = await EscrowWallet.findOne({ projectId });
    if (!escrowWallet) {
      logger.error(`[EscrowWallet] Escrow wallet not found for project ${projectId}`);
      return res.status(404).json({ message: 'Escrow wallet not found for this project' });
    }

    logger.info(`[EscrowWallet] Found escrow wallet for project ${projectId}, status: ${escrowWallet.status}`);

    // Find user's locked funds
    const userFunds = escrowWallet.lockedFunds.find(fund => 
      fund.userId.toString() === userId.toString()
    );

    if (!userFunds) {
      logger.error(`[EscrowWallet] No escrow funds found for user ${userId} in project ${projectId}`);
      return res.status(404).json({ message: 'No escrow funds found for this user' });
    }

    logger.info(`[EscrowWallet] Found user funds, status: ${userFunds.lockStatus}, amount: ${userFunds.totalAmount}`);

    // Check if funds can be moved to balance
    if (userFunds.lockStatus !== 'released') {
      logger.error(`[EscrowWallet] Funds cannot be moved to balance. Current status: ${userFunds.lockStatus}`);
      return res.status(400).json({ 
        message: 'Funds cannot be moved to balance yet. They will be available after project completion.' 
      });
    }

    // Check if funds are already moved to balance
    if (userFunds.lockStatus === 'moved_to_balance') {
      logger.error(`[EscrowWallet] Funds already moved to balance for user ${userId}`);
      return res.status(400).json({ 
        message: 'Funds have already been moved to your available balance.' 
      });
    }

    // Get user and update balance
    const userDetails = await user.findById(userId);
    if (!userDetails) {
      logger.error(`[EscrowWallet] User not found: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`[EscrowWallet] Current user balance - available: ${userDetails.balance.available}, total: ${userDetails.balance.total}`);

    // Update user balance
    userDetails.balance.available += userFunds.totalAmount;
    userDetails.balance.total += userFunds.totalAmount;

    // Update fund status using model method
    escrowWallet.moveFundsToBalance(userId);

    // Save both documents
    await Promise.all([
      userDetails.save(),
      escrowWallet.save()
    ]);

    // Add audit log
    escrowWallet.addAuditLog(
      'move_to_balance',
      userFunds.totalAmount,
      userId,
      `Funds moved to user's available balance`,
      req.ip,
      req.get('User-Agent')
    );

    await escrowWallet.save();

    logger.info(`[EscrowWallet] Funds moved to balance for user ${userId}, amount: ${userFunds.totalAmount}, new balance: ${userDetails.balance.available}`);

    res.status(200).json({
      message: 'Funds successfully moved to your available balance',
      amount: userFunds.totalAmount,
      newBalance: userDetails.balance.available,
      totalEarnings: userDetails.balance.total
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in moveFundsToBalance: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Request withdrawal from available balance to bank account (Step 2 of withdrawal)
 */
export const requestUserWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, withdrawalMethod = 'bank_transfer' } = req.body;

    logger.info(`[EscrowWallet] User ${userId} requesting withdrawal of ${amount} from available balance`);

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    if (amount < WITHDRAWAL_MIN) {
      return res.status(400).json({ message: `Minimum withdrawal amount is ₹${WITHDRAWAL_MIN}` });
    }

    if (amount > WITHDRAWAL_MAX) {
      return res.status(400).json({ message: `Maximum withdrawal amount is ₹${WITHDRAWAL_MAX.toLocaleString()}` });
    }

    // Get user details
    const userDetails = await user.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate withdrawal fee and total amount to deduct
    const withdrawalFee = WITHDRAWAL_FEE; // ₹20 withdrawal fee
    const totalAmountToDeduct = amount + withdrawalFee; // User pays withdrawal amount + fee
    const actualAmountReceived = amount; // User receives the requested amount

    // Check if user has sufficient balance (including fee)
    if (userDetails.balance.available < totalAmountToDeduct) {
      return res.status(400).json({ 
        message: 'Insufficient available balance for withdrawal',
        availableBalance: userDetails.balance.available,
        requestedAmount: amount,
        fee: withdrawalFee,
        totalRequired: totalAmountToDeduct
      });
    }

    // Create withdrawal record
    const withdrawal = {
      amount: actualAmountReceived, // Amount user will receive
      fee: withdrawalFee, // Fee deducted
      totalDeducted: totalAmountToDeduct, // Total amount deducted from balance
      status: 'pending',
      method: withdrawalMethod,
      referenceId: `WD_${userId}_${Date.now()}`,
      createdAt: new Date(),
      notes: `Withdrawal request via ${withdrawalMethod}. Fee: ₹${withdrawalFee}`,
      razorpayPayoutId: null,
      payoutStatus: 'pending'
    };

    // Try to process payout via Razorpay if bank details are available
    let payoutResult = null;
    let payoutError = null;

    if (userDetails.bankDetails && userDetails.bankDetails.accountNumber) {
      try {
        // For immediate processing, we'll simulate success in test mode
        // In production, this would create actual Razorpay payout
        const isTestMode = process.env.RAZORPAY_ENV === 'test';
        
        if (isTestMode) {
          // Simulate immediate success in test mode
          payoutResult = {
            id: `test_payout_${Date.now()}`,
            status: 'processed',
            amount: actualAmountReceived * 100,
            reference_id: withdrawal.referenceId
          };
          
          withdrawal.razorpayPayoutId = payoutResult.id;
          withdrawal.payoutStatus = 'processed';
          withdrawal.status = 'completed';
          withdrawal.notes += ' | Test mode - immediate processing';
          
          logger.info(`[EscrowWallet] Test mode payout processed immediately for user ${userId}`);
        } else {
          // Production mode - create actual Razorpay payout
          const payoutData = {
            account_number: userDetails.bankDetails.accountNumber,
            fund_account_id: userDetails.bankDetails.fundAccountId || null,
            amount: actualAmountReceived * 100, // Convert to paise
            currency: 'INR',
            mode: 'IMPS',
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: withdrawal.referenceId,
            narration: `Withdrawal to ${userDetails.bankDetails.accountNumber}`
          };

          payoutResult = await createPayout(payoutData);
          
          // Update withdrawal record with payout details
          withdrawal.razorpayPayoutId = payoutResult.id;
          withdrawal.payoutStatus = payoutResult.status;
          withdrawal.status = payoutResult.status === 'processed' ? 'completed' : 'pending';
          
          logger.info(`[EscrowWallet] Razorpay payout created for user ${userId}, payout ID: ${payoutResult.id}`);
        }
        
      } catch (payoutErr) {
        payoutError = payoutErr;
        logger.error(`[EscrowWallet] Razorpay payout failed for user ${userId}: ${payoutErr.message}`);
        
        // Set withdrawal status to failed but still allow the request
        withdrawal.status = 'failed';
        withdrawal.payoutStatus = 'failed';
        withdrawal.notes += ` | Payout Error: ${payoutErr.message}`;
      }
    } else {
      // No bank details - set status to pending for manual processing
      withdrawal.status = 'pending';
      withdrawal.notes += ' | Manual processing required - no bank details';
      logger.info(`[EscrowWallet] No bank details for user ${userId}, withdrawal set to manual processing`);
    }

    userDetails.withdrawals.push(withdrawal);

    // Update balance - deduct total amount (including fee)
    userDetails.balance.available -= totalAmountToDeduct;
    
    // Only add to pending if the withdrawal is not immediately completed
    if (withdrawal.status !== 'completed') {
      userDetails.balance.pending += actualAmountReceived;
    }

    await userDetails.save();

    logger.info(`[EscrowWallet] Withdrawal request created for user ${userId}, amount: ${amount}, status: ${withdrawal.status}`);

    // Prepare response based on payout result
    let responseMessage = 'Withdrawal request submitted successfully';
    let isImmediateSuccess = false;
    
    if (payoutError) {
      responseMessage = 'Withdrawal request submitted but payout processing failed. Our team will contact you.';
    } else if (withdrawal.status === 'completed') {
      responseMessage = '🎉 Withdrawal processed successfully! Money has been transferred to your bank account.';
      isImmediateSuccess = true;
      
      // Clear any pending balance since withdrawal is completed
      if (userDetails.balance.pending > 0) {
        userDetails.balance.pending = Math.max(0, userDetails.balance.pending - actualAmountReceived);
      }
    } else if (!userDetails.bankDetails || !userDetails.bankDetails.accountNumber) {
      responseMessage = 'Withdrawal request submitted. Please update your bank details for faster processing.';
    } else if (withdrawal.status === 'pending') {
      responseMessage = 'Withdrawal request submitted and will be processed shortly.';
    }

    res.status(200).json({
      message: responseMessage,
      withdrawal: {
        id: withdrawal.referenceId,
        amount: withdrawal.amount, // Amount user will receive
        fee: withdrawal.fee, // Fee deducted
        totalDeducted: withdrawal.totalDeducted, // Total amount deducted from balance
        status: withdrawal.status,
        method: withdrawal.method,
        createdAt: withdrawal.createdAt,
        razorpayPayoutId: withdrawal.razorpayPayoutId,
        payoutStatus: withdrawal.payoutStatus
      },
      newBalance: userDetails.balance.available,
      pendingWithdrawals: userDetails.balance.pending,
      payoutResult: payoutResult,
      requiresBankDetails: !userDetails.bankDetails || !userDetails.bankDetails.accountNumber,
      isImmediateSuccess: isImmediateSuccess,
      processingTime: isImmediateSuccess ? 'immediate' : 'pending'
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in requestUserWithdrawal: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get user's balance and withdrawal information
 */
export const getUserBalance = async (req, res) => {
  try {
    const userId = req.user._id;

    const userDetails = await user.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get recent withdrawals
    const recentWithdrawals = userDetails.withdrawals
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.status(200).json({
      balance: userDetails.balance,
      bankDetails: userDetails.bankDetails,
      recentWithdrawals: recentWithdrawals
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in getUserBalance: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Update user's bank details for withdrawals
 */
export const updateBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      accountNumber, 
      ifscCode, 
      accountHolderName, 
      bankName 
    } = req.body;

    // Validate required fields
    if (!accountNumber || !ifscCode || !accountHolderName || !bankName) {
      return res.status(400).json({ 
        message: 'All bank details are required: account number, IFSC code, account holder name, and bank name' 
      });
    }

    // Validate account number format (basic validation)
    if (!/^\d{9,18}$/.test(accountNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ 
        message: 'Invalid account number format' 
      });
    }

    // Validate IFSC code format
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      return res.status(400).json({ 
        message: 'Invalid IFSC code format' 
      });
    }

    const userDetails = await user.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update bank details
    userDetails.bankDetails = {
      accountNumber: accountNumber.replace(/\s/g, ''), // Remove spaces
      ifscCode: ifscCode.toUpperCase(),
      accountHolderName: accountHolderName,
      bankName: bankName,
      updatedAt: new Date()
    };

    await userDetails.save();

    logger.info(`[EscrowWallet] Bank details updated for user ${userId}`);

    res.status(200).json({
      message: 'Bank details updated successfully',
      bankDetails: userDetails.bankDetails
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in updateBankDetails: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get user's bank details
 */
export const getBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const userDetails = await user.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      bankDetails: userDetails.bankDetails || null
    });

  } catch (error) {
    logger.error(`[EscrowWallet] Error in getBankDetails: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
