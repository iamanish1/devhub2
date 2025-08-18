import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import { createTransfer } from '../services/razorpay.js';
import { logPaymentEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';

// Complete project and distribute bonus
export const completeProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find project and validate ownership
    const project = await ProjectListing.findById(id).lean();
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
    const pool = await BonusPool.findOne({ projectId: id });
    if (!pool || pool.status !== 'funded') {
      throw new ApiError(400, 'Bonus pool not funded for this project');
    }

    // Calculate distribution amounts
    const netAmount = pool.totalBonus - pool.commission.amount;
    const perContributor = Math.floor(netAmount / project.selectedContributors.length);

    logPaymentEvent('project_completion_started', {
      projectId: id,
      totalBonus: pool.totalBonus,
      commission: pool.commission.amount,
      netAmount,
      perContributor,
      contributorsCount: project.selectedContributors.length
    });

    // Process Razorpay Route transfers to each contributor
    const transferResults = [];
    for (const contributor of project.selectedContributors) {
      try {
        if (!contributor.linkedAccountId) {
          logPaymentEvent('transfer_skipped_no_account', {
            projectId: id,
            userId: contributor.userId,
            reason: 'No linked account'
          });
          continue;
        }

        // Create Route transfer
        const transfer = await createTransfer({
          account: contributor.linkedAccountId,
          amount: perContributor,
          notes: { 
            projectId: id.toString(), 
            userId: contributor.userId.toString(),
            purpose: 'project_completion_bonus'
          }
        });

        // Update bonus pool splits
        await BonusPool.updateOne(
          { 
            projectId: id, 
            'splits.userId': contributor.userId 
          },
          { 
            $set: { 
              'splits.$.routeTransferId': transfer.id,
              'splits.$.amount': perContributor
            } 
          },
          { upsert: true }
        );

        transferResults.push({
          userId: contributor.userId,
          amount: perContributor,
          transferId: transfer.id,
          status: 'success'
        });

        logPaymentEvent('transfer_successful', {
          projectId: id,
          userId: contributor.userId,
          amount: perContributor,
          transferId: transfer.id
        });

      } catch (error) {
        logPaymentEvent('transfer_failed', {
          projectId: id,
          userId: contributor.userId,
          amount: perContributor,
          error: error.message
        });

        transferResults.push({
          userId: contributor.userId,
          amount: perContributor,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Update project and bonus pool status
    await BonusPool.updateOne({ projectId: id }, { status: 'released' });
    await ProjectListing.updateOne({ _id: id }, { status: 'completed' });

    logPaymentEvent('project_completion_finished', {
      projectId: id,
      transferResults,
      totalTransfers: transferResults.length,
      successfulTransfers: transferResults.filter(r => r.status === 'success').length
    });

    res.status(200).json({
      success: true,
      message: 'Project completed and bonus distributed',
      data: {
        projectId: id,
        totalBonus: pool.totalBonus,
        commission: pool.commission.amount,
        netAmount,
        perContributor,
        transferResults,
        summary: {
          total: transferResults.length,
          successful: transferResults.filter(r => r.status === 'success').length,
          failed: transferResults.filter(r => r.status === 'failed').length
        }
      }
    });

  } catch (error) {
    logPaymentEvent('project_completion_error', { 
      projectId: req.params.id, 
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
    const { id } = req.params;
    const userId = req.user._id;

    // Find project and validate access
    const project = await ProjectListing.findById(id).lean();
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
    const pool = await BonusPool.findOne({ projectId: id });
    
    // Get contributor details
    const contributorDetails = project.selectedContributors?.map(contributor => ({
      userId: contributor.userId,
      bidAmount: contributor.bidAmount,
      linkedAccountId: contributor.linkedAccountId,
      bonusAmount: pool ? Math.floor((pool.totalBonus - pool.commission.amount) / project.selectedContributors.length) : 0,
      transferId: pool?.splits?.find(s => s.userId.toString() === contributor.userId.toString())?.routeTransferId
    })) || [];

    res.status(200).json({
      success: true,
      data: {
        projectId: id,
        projectTitle: project.project_Title,
        bonusFunded: project.bonus?.funded || false,
        bonusRequired: project.bonus?.minRequired || 0,
        bonusPool: pool ? {
          totalBonus: pool.totalBonus,
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

// Select contributors for project
export const selectContributors = async (req, res) => {
  try {
    const { id } = req.params;
    const { contributorIds } = req.body; // Array of bid IDs
    const userId = req.user._id;

    // Validate project ownership
    const project = await ProjectListing.findOne({ _id: id, user: userId });
    if (!project) {
      throw new ApiError(404, 'Project not found or access denied');
    }

    // Get bid details for selected contributors
    const bids = await Bidding.find({
      _id: { $in: contributorIds },
      project_id: id,
      bid_status: 'Accepted'
    }).populate('user_id', 'username email');

    if (bids.length !== contributorIds.length) {
      throw new ApiError(400, 'Some selected bids are invalid or not accepted');
    }

    // Update project with selected contributors
    const selectedContributors = bids.map(bid => ({
      userId: bid.user_id._id,
      bidAmount: bid.bid_amount,
      linkedAccountId: null // Will be set when contributor links their account
    }));

    await ProjectListing.findByIdAndUpdate(id, {
      selectedContributors,
      status: 'in_progress'
    });

    logPaymentEvent('contributors_selected', {
      projectId: id,
      contributorsCount: selectedContributors.length,
      contributorIds: selectedContributors.map(c => c.userId)
    });

    res.status(200).json({
      success: true,
      message: 'Contributors selected successfully',
      data: {
        projectId: id,
        selectedContributors: selectedContributors.map(c => ({
          userId: c.userId,
          bidAmount: c.bidAmount
        }))
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error selecting contributors'
    });
  }
};
