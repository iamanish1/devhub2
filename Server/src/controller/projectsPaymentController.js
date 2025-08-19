import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import PaymentIntent from '../Model/PaymentIntentModel.js';
import { createPayout } from '../services/payouts.js';
import { createOrder as cfCreateOrder } from '../services/cashfree.js';
import { logPaymentEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';
import mongoose from 'mongoose';

// Select contributors and lock bid amounts in escrow
export const selectContributors = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { contributorIds } = req.body; // Array of bid IDs
    const userId = req.user._id;

    // Validate project ownership
    const project = await ProjectListing.findOne({ _id: projectId, user: userId });
    if (!project) {
      throw new ApiError(404, 'Project not found or access denied');
    }

    // Check if project is still accepting contributors
    if (project.status === 'completed' || project.status === 'in_progress') {
      throw new ApiError(400, 'Project is no longer accepting contributors');
    }

    // Get bid details for selected contributors
    const bids = await Bidding.find({
      _id: { $in: contributorIds },
      project_id: projectId,
      bid_status: 'Pending'
    }).populate('user_id', 'username email');

    if (bids.length !== contributorIds.length) {
      throw new ApiError(400, 'Some selected bids are invalid or not pending');
    }

    // Check if number of contributors matches project requirement
    if (bids.length > project.Project_Contributor) {
      throw new ApiError(400, `Project requires ${project.Project_Contributor} contributors, but ${bids.length} were selected`);
    }

    // Calculate total escrow amount
    const totalEscrowAmount = bids.reduce((sum, bid) => sum + bid.total_amount, 0);

    // Create payment intent for escrow
    const escrowIntent = await PaymentIntent.create({
      provider: 'cashfree',
      purpose: 'escrow_lock',
      amount: totalEscrowAmount,
      userId: userId,
      projectId: projectId,
      status: 'created',
      notes: { 
        contributorCount: bids.length,
        contributorIds: contributorIds
      }
    });

    // Create Cashfree order for escrow
    const escrowOrder = await cfCreateOrder({
      orderId: escrowIntent._id.toString(),
      amount: totalEscrowAmount,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Escrow payment for selected contributors'
    });

    // Update payment intent with order ID
    escrowIntent.orderId = escrowOrder.order_id;
    await escrowIntent.save();

    // Update project with selected contributors
    const selectedContributors = bids.map(bid => ({
      userId: bid.user_id._id,
      bidId: bid._id,
      amount: bid.total_amount,
      status: 'pending'
    }));

    await ProjectListing.findByIdAndUpdate(projectId, {
      selectedContributors,
      status: 'in_progress',
      'escrow.totalBidLocked': totalEscrowAmount,
      'escrow.status': 'locked'
    });

    // Update bid statuses to accepted
    await Bidding.updateMany(
      { _id: { $in: contributorIds } },
      { 
        bid_status: 'Accepted',
        payment_status: 'locked',
        'escrow_details.locked_at': new Date(),
        'escrow_details.payment_intent_id': escrowIntent._id.toString()
      }
    );

    logPaymentEvent('contributors_selected', {
      projectId,
      contributorsCount: bids.length,
      totalEscrowAmount,
      escrowIntentId: escrowIntent._id,
      contributorIds: selectedContributors.map(c => c.userId)
    });

    res.status(200).json({
      success: true,
      message: 'Contributors selected and escrow locked successfully',
      data: {
        projectId,
        selectedContributors: selectedContributors.map(c => ({
          userId: c.userId,
          amount: c.amount
        })),
        escrowAmount: totalEscrowAmount,
        paymentOrder: escrowOrder
      }
    });

  } catch (error) {
    logPaymentEvent('contributor_selection_error', { 
      projectId: req.params.projectId, 
      error: error.message 
    });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error selecting contributors'
    });
  }
};

// Complete project and distribute payments
export const completeProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Find project and validate ownership
    const project = await ProjectListing.findById(projectId)
      .populate('selectedContributors.userId', 'username email')
      .lean();

    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    if (project.user.toString() !== userId.toString()) {
      throw new ApiError(403, 'Access denied: Not project owner');
    }

    if (!project.selectedContributors?.length) {
      throw new ApiError(400, 'No contributors selected for this project');
    }

    // Check if bonus pool is funded
    const pool = await BonusPool.findOne({ projectId });
    if (!pool || pool.status !== 'funded') {
      throw new ApiError(400, 'Bonus pool not funded for this project');
    }

    // Calculate distribution amounts
    const netBonusAmount = pool.totalAmount - pool.commission.amount;
    const bonusPerContributor = Math.floor(netBonusAmount / project.selectedContributors.length);

    logPaymentEvent('project_completion_started', {
      projectId,
      totalBonus: pool.totalAmount,
      commission: pool.commission.amount,
      netBonusAmount,
      bonusPerContributor,
      contributorsCount: project.selectedContributors.length
    });

    // Process payments to each contributor
    const paymentResults = [];
    for (const contributor of project.selectedContributors) {
      try {
        // Calculate total payment (bid amount + bonus)
        const totalPayment = contributor.amount + bonusPerContributor;

        // Create payout to contributor
        const payout = await createPayout({
          userId: contributor.userId,
          projectId: projectId,
          amount: totalPayment,
          provider: 'cashfree'
        });

        // Update contributor payment status
        await ProjectListing.updateOne(
          { 
            _id: projectId, 
            'selectedContributors.userId': contributor.userId 
          },
          { 
            $set: { 
              'selectedContributors.$.status': 'paid',
              'selectedContributors.$.paidAt': new Date()
            } 
          }
        );

        // Update bid payment status
        await Bidding.updateOne(
          { _id: contributor.bidId },
          { 
            payment_status: 'paid',
            'escrow_details.payout_id': payout.payoutId
          }
        );

        paymentResults.push({
          userId: contributor.userId,
          bidAmount: contributor.amount,
          bonusAmount: bonusPerContributor,
          totalAmount: totalPayment,
          payoutId: payout.payoutId,
          status: 'success'
        });

        logPaymentEvent('contributor_payment_successful', {
          projectId,
          userId: contributor.userId,
          bidAmount: contributor.amount,
          bonusAmount: bonusPerContributor,
          totalAmount: totalPayment,
          payoutId: payout.payoutId
        });

      } catch (error) {
        logPaymentEvent('contributor_payment_failed', {
          projectId,
          userId: contributor.userId,
          error: error.message
        });

        paymentResults.push({
          userId: contributor.userId,
          bidAmount: contributor.amount,
          bonusAmount: bonusPerContributor,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update project and bonus pool status
    await BonusPool.updateOne({ projectId }, { status: 'released' });
    await ProjectListing.updateOne(
      { _id: projectId }, 
      { 
        status: 'completed',
        'escrow.status': 'released'
      }
    );

    logPaymentEvent('project_completion_finished', {
      projectId,
      paymentResults,
      totalPayments: paymentResults.length,
      successfulPayments: paymentResults.filter(r => r.status === 'success').length
    });

    res.status(200).json({
      success: true,
      message: 'Project completed and payments distributed',
      data: {
        projectId,
        totalBonus: pool.totalAmount,
        commission: pool.commission.amount,
        netBonusAmount,
        bonusPerContributor,
        paymentResults,
        summary: {
          total: paymentResults.length,
          successful: paymentResults.filter(r => r.status === 'success').length,
          failed: paymentResults.filter(r => r.status === 'failed').length
        }
      }
    });

  } catch (error) {
    logPaymentEvent('project_completion_error', { 
      projectId: req.params.projectId, 
      error: error.message 
    });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error completing project'
    });
  }
};

// Get project bonus status
export const getProjectBonusStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Find project and validate access
    const project = await ProjectListing.findById(projectId).lean();
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    // Check if user is project owner or contributor
    const isOwner = project.user.toString() === userId.toString();
    const isContributor = project.selectedContributors?.some(
      c => c.userId.toString() === userId.toString()
    );

    if (!isOwner && !isContributor) {
      throw new ApiError(403, 'Access denied');
    }

    // Get bonus pool details
    const pool = await BonusPool.findOne({ projectId });
    
    // Get contributor details
    const contributorDetails = project.selectedContributors?.map(contributor => ({
      userId: contributor.userId,
      amount: contributor.amount,
      status: contributor.status,
      bonusAmount: pool ? Math.floor((pool.totalAmount - pool.commission.amount) / project.selectedContributors.length) : 0
    })) || [];

    res.status(200).json({
      success: true,
      data: {
        projectId,
        projectTitle: project.project_Title,
        bonusFunded: project.bonus?.funded || false,
        bonusRequired: project.bonus?.minRequired || 0,
        bonusPool: pool ? {
          totalAmount: pool.totalAmount,
          commission: pool.commission,
          status: pool.status,
          contributors: contributorDetails
        } : null,
        userRole: isOwner ? 'owner' : 'contributor',
        canComplete: isOwner && project.bonus?.funded && project.selectedContributors?.length > 0
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error fetching bonus status'
    });
  }
};

// Get all bids for a project (for owner to select contributors)
export const getProjectBids = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Validate project ownership
    const project = await ProjectListing.findOne({ _id: projectId, user: userId });
    if (!project) {
      throw new ApiError(404, 'Project not found or access denied');
    }

    // Get all bids for the project
    const bids = await Bidding.find({ 
      project_id: projectId,
      bid_status: 'Pending'
    })
    .populate('user_id', 'username email usertype')
    .sort({ created_at: -1 });

    const formattedBids = bids.map(bid => ({
      id: bid._id,
      userId: bid.user_id._id,
      username: bid.user_id.username,
      email: bid.user_id.email,
      usertype: bid.user_id.usertype,
      bidAmount: bid.bid_amount,
      totalAmount: bid.total_amount,
      bidFee: bid.bid_fee,
      yearOfExperience: bid.year_of_experience,
      bidDescription: bid.bid_description,
      hoursAvailable: bid.hours_avilable_per_week,
      skills: bid.skills,
      isFreeBid: bid.is_free_bid,
      createdAt: bid.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        projectId,
        projectTitle: project.project_Title,
        requiredContributors: project.Project_Contributor,
        bids: formattedBids,
        totalBids: formattedBids.length
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error fetching project bids'
    });
  }
};
