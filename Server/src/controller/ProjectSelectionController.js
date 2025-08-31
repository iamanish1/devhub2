import ProjectSelection from "../Model/ProjectSelectionModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import Bidding from "../Model/BiddingModel.js";
import EscrowWallet from "../Model/EscrowWalletModel.js";
import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";
// Remove selectionAlgorithm import since we're removing automation
import notificationService from "../services/notificationService.js";
import { logger } from "../utils/logger.js";
import { ApiError } from "../utils/error.js";
import mongoose from "mongoose";

// Firebase imports
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase.js";

/**
 * Create Firebase workspace access for selected contributors
 */
export const createFirebaseWorkspaceAccess = async (projectId, userId) => {
  try {
    // Create workspace access document
    const workspaceAccessRef = doc(
      db,
      "workspace_access",
      `${projectId}_${userId}`
    );
    await setDoc(
      workspaceAccessRef,
      {
        projectId,
        userId,
        accessLevel: "contributor",
        grantedAt: serverTimestamp(),
        status: "active",
        createdBy: "ProjectSelectionController",
      },
      { merge: true }
    );

    // Create project contributor document
    const projectContributorRef = doc(
      db,
      "project_contributors",
      `${projectId}_${userId}`
    );
    await setDoc(
      projectContributorRef,
      {
        projectId,
        userId,
        role: "contributor",
        joinedAt: serverTimestamp(),
        status: "active",
        createdBy: "ProjectSelectionController",
      },
      { merge: true }
    );

    logger.info(
      `[ProjectSelection] Firebase workspace access created for user ${userId} on project ${projectId}`
    );
    return true;
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error creating Firebase workspace access: ${error.message}`,
      error
    );
    return false;
  }
};

/**
 * Create a new project selection configuration
 */
export const createProjectSelection = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      selectionMode = "manual", // Default to manual only
      requiredContributors,
      maxBidsToConsider = 50,
      requiredSkills = [],
      criteriaWeights = {
        skillMatch: 40,
        bidAmount: 30,
        experience: 20,
        availability: 10,
      },
    } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "You can only configure selection for your own projects",
        });
    }

    // Check if selection already exists
    const existingSelection = await ProjectSelection.findOne({ projectId });
    if (existingSelection) {
      return res
        .status(400)
        .json({
          message: "Selection configuration already exists for this project",
        });
    }

    // Validate required contributors
    if (!requiredContributors || requiredContributors < 1) {
      return res
        .status(400)
        .json({ message: "Required contributors must be at least 1" });
    }

    if (requiredContributors > 50) {
      return res
        .status(400)
        .json({ message: "Required contributors cannot exceed 50" });
    }

    // Validate criteria weights sum to 100
    const totalWeight =
      criteriaWeights.skillMatch +
      criteriaWeights.bidAmount +
      criteriaWeights.experience +
      criteriaWeights.availability;
    if (Math.abs(totalWeight - 100) > 0.01) {
      return res
        .status(400)
        .json({ message: "Criteria weights must sum to 100" });
    }

    // Create selection configuration (manual only)
    const selection = new ProjectSelection({
      projectId,
      projectOwner: req.user._id,
      selectionMode: "manual", // Force manual mode
      requiredContributors,
      maxBidsToConsider,
      requiredSkills,
      criteriaWeights,
      status: "pending",
    });

    await selection.save();

    logger.info(
      `[ProjectSelection] Created manual selection config for project: ${projectId}`
    );

    res.status(201).json({
      message: "Project selection configuration created successfully",
      selection,
    });
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error in createProjectSelection: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Get project selection configuration
 */
export const getProjectSelection = async (req, res) => {
  try {
    const { projectId } = req.params;

    const selection = await ProjectSelection.findOne({ projectId })
      .populate("projectOwner", "username email")
      .populate("selectedUsers.userId", "username email usertype")
      .populate("selectedUsers.bidId", "bid_amount bid_description skills");

    if (!selection) {
      return res
        .status(404)
        .json({ message: "Selection configuration not found" });
    }

    // Check if user has access (project owner or selected user)
    const isProjectOwner =
      selection.projectOwner._id.toString() === req.user._id.toString();
    const isSelectedUser = selection.selectedUsers.some(
      (user) => user.userId._id.toString() === req.user._id.toString()
    );

    if (!isProjectOwner && !isSelectedUser) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({
      selection,
      userAccess: {
        isProjectOwner,
        isSelectedUser,
      },
    });
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error in getProjectSelection: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Manual selection of users
 */
export const manualSelection = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { selectedUserIds, reason = "manual" } = req.body;

    // Validate reason is a valid enum value
    const validReasons = ['manual', 'automatic', 'hybrid'];
    const validatedReason = validReasons.includes(reason) ? reason : 'manual';

    logger.info(
      `[ProjectSelection] Manual selection request for project: ${projectId}, users: ${selectedUserIds}, reason: ${validatedReason}`
    );

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only select users for your own projects" });
    }

    // Get or create selection configuration
    let selection = await ProjectSelection.findOne({ projectId });
    if (!selection) {
      // Create default selection configuration for manual selection
      selection = new ProjectSelection({
        projectId,
        projectOwner: req.user._id,
        selectionMode: "manual", // Force manual mode
        requiredContributors: project.Project_Contributor || 10, // Default to 10 if not specified
        maxBidsToConsider: 50,
        requiredSkills: [],
        criteriaWeights: {
          skillMatch: 40,
          bidAmount: 30,
          experience: 20,
          availability: 10,
        },
        status: "pending",
      });
      await selection.save();
      logger.info(
        `[ProjectSelection] Created default manual selection config for project: ${projectId} with requiredContributors: ${selection.requiredContributors}`
      );
    }

    // Validate selected users
    logger.info(
      `[ProjectSelection] Validating selected users: ${
        selectedUserIds?.length || 0
      } users, max allowed: ${selection.requiredContributors}`
    );

    if (
      !selectedUserIds ||
      !Array.isArray(selectedUserIds) ||
      selectedUserIds.length === 0
    ) {
      logger.warn(
        `[ProjectSelection] No users selected for project: ${projectId}`
      );
      return res
        .status(400)
        .json({ message: "Please select at least one user" });
    }

    // Check if adding these users would exceed the required number of contributors
    const currentSelectedCount = selection.selectedUsers.length;
    const newUsersToAdd = selectedUserIds.filter(userId => 
      !selection.selectedUsers.some(user => user.userId.toString() === userId.toString())
    ).length;
    
    if (currentSelectedCount + newUsersToAdd > selection.requiredContributors) {
      logger.warn(
        `[ProjectSelection] Too many users would be selected: ${currentSelectedCount + newUsersToAdd} > ${selection.requiredContributors}`
      );
      return res.status(400).json({
        message: `Cannot select more than ${selection.requiredContributors} users total`,
      });
    }

    // Get bids for selected users (including rejected bids that can be re-accepted)
    logger.info(
      `[ProjectSelection] Finding bids for users: ${selectedUserIds.join(", ")}`
    );

    // First, get all bids for these users regardless of status
    const allBids = await Bidding.find({
      project_id: projectId,
      user_id: { $in: selectedUserIds }
    });

    logger.info(
      `[ProjectSelection] Found ${allBids.length} total bids for ${selectedUserIds.length} selected users`
    );

    // Log all bid statuses for debugging
    allBids.forEach(bid => {
      logger.info(
        `[ProjectSelection] Bid ${bid._id} for user ${bid.user_id} has status: ${bid.bid_status}`
      );
    });

    // Create a map of user IDs to their bids
    const userBidMap = new Map();
    allBids.forEach(bid => {
      const userId = bid.user_id.toString();
      if (!userBidMap.has(userId)) {
        userBidMap.set(userId, []);
      }
      userBidMap.get(userId).push(bid);
    });

    // Check which users don't have any bids
    const usersWithoutBids = selectedUserIds.filter(userId => 
      !userBidMap.has(userId.toString())
    );

    if (usersWithoutBids.length > 0) {
      logger.warn(
        `[ProjectSelection] Users without any bids: ${usersWithoutBids.join(", ")}`
      );
      return res
        .status(400)
        .json({ 
          message: "Some selected users do not have any bids",
          missingUsers: usersWithoutBids,
          totalBidsFound: allBids.length,
          expectedBids: selectedUserIds.length
        });
    }

    // For each user, select the best available bid (Accepted > Pending > Rejected)
    const selectedBids = [];
    for (const userId of selectedUserIds) {
      const userBids = userBidMap.get(userId.toString());
      if (!userBids || userBids.length === 0) {
        continue; // This should not happen due to the check above
      }

      // Sort bids by priority: Accepted > Pending > Rejected
      const sortedBids = userBids.sort((a, b) => {
        const statusPriority = { 'Accepted': 3, 'Pending': 2, 'Rejected': 1 };
        return statusPriority[b.bid_status] - statusPriority[a.bid_status];
      });

      selectedBids.push(sortedBids[0]); // Take the highest priority bid
    }

    logger.info(
      `[ProjectSelection] Selected ${selectedBids.length} bids for ${selectedUserIds.length} users`
    );

    // Create selected users array
    const selectedUsers = selectedBids.map((bid, index) => ({
      userId: bid.user_id,
      bidId: bid._id,
      bidAmount: bid.total_amount || bid.bid_amount || 0, // Add bid amount from the bid
      selectionScore: 100, // Manual selection gets full score
      selectionReason: 'manual', // Use valid enum value
      skillMatchScore: 100,
      bidAmountScore: 100,
      experienceScore: 100,
      availabilityScore: 100,
      selectedAt: new Date(),
    }));

    // Update or add selections (replace existing selections for the same users)
    const existingUserIds = selection.selectedUsers.map(user => user.userId.toString());
    
    // Remove existing selections for users being re-selected
    selection.selectedUsers = selection.selectedUsers.filter(user => 
      !selectedUserIds.includes(user.userId.toString())
    );
    
    // Add new selections
    selection.selectedUsers = [...selection.selectedUsers, ...selectedUsers];
    
    // Update status based on whether we have enough contributors
    if (selection.selectedUsers.length >= selection.requiredContributors) {
      selection.status = "completed";
      selection.selectionCompletedAt = new Date();
      logger.info(`[ProjectSelection] Selection completed for project ${projectId}. Selected: ${selection.selectedUsers.length}, Required: ${selection.requiredContributors}`);
    } else {
      selection.status = "in_progress";
      logger.info(`[ProjectSelection] Selection in progress for project ${projectId}. Selected: ${selection.selectedUsers.length}, Required: ${selection.requiredContributors}`);
    }
    
    selection.totalBidsConsidered = selectedBids.length;

    // Add manual override log
    selectedUserIds.forEach((userId) => {
      selection.manualOverrides.push({
        userId,
        action: "select",
        reason: validatedReason,
        overriddenAt: new Date(),
      });
    });

    await selection.save();

    // Update bid statuses and create Firebase workspace access for selected users
    for (const selectedUser of selectedUsers) {
      try {
        // Update bid status
        await Bidding.findByIdAndUpdate(selectedUser.bidId, {
          bid_status: "Accepted",
        });

        // Create Firebase workspace access
        const firebaseResult = await createFirebaseWorkspaceAccess(projectId, selectedUser.userId);
        if (firebaseResult) {
          logger.info(
            `[ProjectSelection] Firebase workspace access created for user ${selectedUser.userId} on project ${projectId}`
          );
        } else {
          logger.error(
            `[ProjectSelection] Failed to create Firebase workspace access for user ${selectedUser.userId} on project ${projectId}`
          );
        }
      } catch (error) {
        logger.error(
          `[ProjectSelection] Failed to process selected user ${selectedUser.userId}: ${error.message}`
        );
      }
    }

    // Create escrow wallet and lock funds if selection is completed
    let escrowCreated = false;
    logger.info(`[ProjectSelection] Checking escrow wallet creation for project ${projectId}. Selection status: ${selection.status}`);
    
    if (selection.status === "completed") {
      try {
        // Check if bonus pool exists and is funded
        const { default: BonusPool } = await import('../Model/BonusPoolModel.js');
        const bonusPool = await BonusPool.findOne({ projectId });
        logger.info(`[ProjectSelection] Bonus pool check for project ${projectId}: ${bonusPool ? 'Found' : 'Not found'}, Status: ${bonusPool?.status || 'N/A'}`);
        
        // For testing purposes, auto-fund bonus pool if it exists but is pending
        if (bonusPool && bonusPool.status === 'pending') {
          bonusPool.status = 'funded';
          bonusPool.fundedAt = new Date();
          await bonusPool.save();
          logger.info(`[ProjectSelection] Auto-funded bonus pool for testing: ${bonusPool._id}`);
        }
        
        // Use the new function to create escrow wallet if ready
        const { createEscrowWalletIfReady } = await import('./EscrowWalletController.js');
        const escrowWallet = await createEscrowWalletIfReady(projectId, req.user._id);
        
        if (escrowWallet) {
          escrowCreated = true;

          // Lock funds for each selected user
          for (const selectedUser of selection.selectedUsers) {
            try {
              // Get the bid to get the bid amount
              const { default: Bidding } = await import('../Model/BiddingModel.js');
              const bid = await Bidding.findById(selectedUser.bidId);
              if (!bid) {
                logger.error(`[ProjectSelection] Bid not found for user ${selectedUser.userId}, bid ID: ${selectedUser.bidId}`);
                continue;
              }

              const bidAmount = bid.bid_amount || 0;
              const bonusAmount = escrowWallet.bonusPoolDistribution.amountPerContributor;
              
              logger.info(
                `[ProjectSelection] Locking funds for user ${selectedUser.userId}: bidAmount=${bidAmount}, bonusAmount=${bonusAmount}`
              );
              
              escrowWallet.lockUserFunds(
                selectedUser.userId, 
                selectedUser.bidId, 
                bidAmount, 
                bonusAmount
              );

              // Update selection record to mark escrow as locked
              selectedUser.escrowLocked = true;
              selectedUser.escrowLockedAt = new Date();

              logger.info(
                `[ProjectSelection] Funds locked in escrow for user ${selectedUser.userId} on project ${projectId}`
              );

              // Send escrow funds locked notification
              try {
                await notificationService.sendEscrowFundsLockedNotification(
                  selectedUser.userId,
                  projectId,
                  bidAmount,
                  bonusAmount
                );
              } catch (notificationError) {
                logger.error(
                  `[ProjectSelection] Escrow notification failed for user ${selectedUser.userId}: ${notificationError.message}`
                );
              }
            } catch (escrowError) {
              logger.error(
                `[ProjectSelection] Failed to lock funds for user ${selectedUser.userId}: ${escrowError.message}`
              );
            }
          }

          // Save both the escrow wallet and selection
          try {
            await escrowWallet.save();
            await selection.save();
            logger.info(
              `[ProjectSelection] Escrow wallet created and funds locked for project: ${projectId}`
            );
          } catch (saveError) {
            logger.error(
              `[ProjectSelection] Failed to save escrow wallet or selection: ${saveError.message}`
            );
            // Try to save selection separately to avoid losing selection data
            try {
              await selection.save();
              logger.info(`[ProjectSelection] Selection data saved successfully`);
            } catch (selectionSaveError) {
              logger.error(
                `[ProjectSelection] Failed to save selection data: ${selectionSaveError.message}`
              );
            }
          }
        } else {
          logger.info(
            `[ProjectSelection] Escrow wallet not created - bonus pool not funded or already exists for project: ${projectId}`
          );
        }
      } catch (escrowError) {
        logger.error(
          `[ProjectSelection] Failed to create escrow wallet: ${escrowError.message}`
        );
        // Don't fail the selection process if escrow creation fails
      }
    }

    logger.info(
      `[ProjectSelection] Manual selection completed for project: ${projectId}. Selected: ${selectedUsers.length} users`
    );

    res.status(200).json({
      success: true,
      message: `Successfully selected ${selectedUsers.length} users`,
      selection,
      selectedUsers,
      escrowCreated
    });
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error in manualSelection: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Get ranked bidders for a project (for manual selection)
 */
export const getRankedBidders = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50 } = req.query;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only view bidders for your own projects" });
    }

    // Get selection configuration
    const selection = await ProjectSelection.findOne({ projectId });
    if (!selection) {
      return res
        .status(404)
        .json({ message: "Selection configuration not found" });
    }

    // Get all bids for the project with user information
    const bids = await Bidding.find({ 
      project_id: projectId,
      bid_status: 'Pending'
    }).populate('user_id', 'username email usertype');

    if (bids.length === 0) {
      return res.status(200).json({
        rankedBidders: [],
        totalBidders: 0,
        selectionConfig: null,
      });
    }

    // Get user profiles for additional details
    const userIds = bids.map(bid => bid.user_id._id);
    const userProfiles = await UserProfile.find({ username: { $in: userIds } });
    const profileMap = new Map();
    userProfiles.forEach((profile) => {
      profileMap.set(profile.username.toString(), profile);
    });

    // Create simple ranked bidders list (sorted by bid amount descending)
    const rankedBidders = bids
      .map((bid) => {
        const profile = profileMap.get(bid.user_id._id.toString());
        return {
          userId: bid.user_id._id,
          username: bid.user_id.username,
          email: bid.user_id.email,
          usertype: bid.user_id.usertype,
          bidId: bid._id,
          bidAmount: bid.bid_amount || 0,
          bidDescription: bid.bid_description,
          yearOfExperience: bid.year_of_experience,
          hoursAvailable: bid.hours_avilable_per_week,
          skills: bid.skills || [],
          totalScore: 100, // Manual selection doesn't need scoring
          scores: {
            skillMatch: 100,
            bidAmount: 100,
            experience: 100,
            availability: 100,
            totalScore: 100
          },
          profile: profile
            ? {
                bio: profile.user_profile_bio,
                completedProjects: profile.user_completed_projects,
                contributions: profile.user_project_contribution,
                skills: profile.user_profile_skills,
              }
            : null,
        };
      })
      .sort((a, b) => b.bidAmount - a.bidAmount) // Sort by bid amount descending
      .slice(0, parseInt(limit));

    res.status(200).json({
      rankedBidders: rankedBidders,
      totalBidders: rankedBidders.length,
      selectionConfig: {
        requiredContributors: selection.requiredContributors,
        maxBidsToConsider: parseInt(limit),
        requiredSkills: selection.requiredSkills,
        criteriaWeights: selection.criteriaWeights,
      },
    });
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error in getRankedBidders: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Update selection configuration
 */
export const updateSelectionConfig = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      selectionMode,
      requiredContributors,
      maxBidsToConsider,
      requiredSkills,
      criteriaWeights,
    } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "You can only update selection for your own projects",
        });
    }

    // Get selection configuration
    const selection = await ProjectSelection.findOne({ projectId });
    if (!selection) {
      return res
        .status(404)
        .json({ message: "Selection configuration not found" });
    }

    // Check if selection is already completed
    if (selection.status === "completed") {
      return res
        .status(400)
        .json({
          message: "Cannot update selection configuration after completion",
        });
    }

    // Update fields if provided
    if (selectionMode) selection.selectionMode = selectionMode;
    if (requiredContributors)
      selection.requiredContributors = requiredContributors;
    if (maxBidsToConsider) selection.maxBidsToConsider = maxBidsToConsider;
    if (requiredSkills) selection.requiredSkills = requiredSkills;
    if (criteriaWeights) selection.criteriaWeights = criteriaWeights;

    await selection.save();

    logger.info(
      `[ProjectSelection] Updated selection config for project: ${projectId}`
    );

    res.status(200).json({
      message: "Selection configuration updated successfully",
      selection,
    });
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error in updateSelectionConfig: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Get all selections for a project owner
 */
export const getProjectOwnerSelections = async (req, res) => {
  try {
    console.log(
      "🔍 [ProjectSelection] Getting selections for user:",
      req.user._id
    );

    // Get all projects owned by this user
    const userProjects = await ProjectListing.find({
      user: req.user._id,
    }).select("_id project_Title");

    if (userProjects.length === 0) {
      return res.status(200).json({
        message: "No projects found for this user",
        selections: [],
        total: 0,
      });
    }

    // Get all selections for these projects
    const projectIds = userProjects.map((project) => project._id);
    const selections = await ProjectSelection.find({
      projectId: { $in: projectIds },
    })
      .populate("projectId", "project_Title Project_Description")
      .populate("selectedUsers.userId", "username email")
      .sort({ createdAt: -1 });

    console.log(
      `✅ [ProjectSelection] Found ${selections.length} selections for user ${req.user._id}`
    );

    res.status(200).json({
      message: "Selections retrieved successfully",
      selections: selections,
      total: selections.length,
    });
  } catch (error) {
    console.error(
      "❌ [ProjectSelection] Error in getProjectOwnerSelections:",
      error
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Cancel selection
 */
export const cancelSelection = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "You can only cancel selection for your own projects",
        });
    }

    // Get selection configuration
    const selection = await ProjectSelection.findOne({ projectId });
    if (!selection) {
      return res
        .status(404)
        .json({ message: "Selection configuration not found" });
    }

    // Check if selection can be cancelled
    if (selection.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot cancel completed selection" });
    }

    // Update status
    selection.status = "cancelled";
    await selection.save();

    logger.info(
      `[ProjectSelection] Cancelled selection for project: ${projectId}`
    );

    res.status(200).json({
      message: "Selection cancelled successfully",
      selection,
    });
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error in cancelSelection: ${error.message}`,
      error
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

/**
 * Get team members for a specific project
 */
export const getProjectTeamMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    // Verify the user owns this project or is a selected contributor
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner or a selected contributor
    const isProjectOwner = project.user.toString() === userId.toString();
    
    // Get project selection to check if user is a selected contributor
    const projectSelection = await ProjectSelection.findOne({ projectId });
    const isSelectedContributor = projectSelection?.selectedUsers?.some(
      user => user.userId.toString() === userId.toString()
    );

    if (!isProjectOwner && !isSelectedContributor) {
      return res.status(403).json({ message: 'Access denied. You are not authorized to view this project team.' });
    }

    // Get the project selection with populated user data
    const selection = await ProjectSelection.findOne({ projectId })
      .populate({
        path: 'selectedUsers.userId',
        select: 'username email name'
      })
      .populate({
        path: 'selectedUsers.bidId',
        select: 'bid_amount bid_description year_of_experience hours_avilable_per_week skills'
      });

    if (!selection) {
      return res.status(200).json({ 
        teamMembers: [],
        project: {
          id: project._id,
          title: project.project_Title,
          description: project.Project_Description
        }
      });
    }

    // Get user profiles for selected users
    const teamMembersWithProfiles = await Promise.all(
      selection.selectedUsers.map(async (selectedUser) => {
        const userProfile = await UserProfile.findOne(
          { username: selectedUser.userId._id },
          'user_profile_cover_photo user_profile_bio user_profile_skills user_profile_linkedIn user_profile_github user_profile_website user_profile_instagram user_profile_location user_profile_created_at user_project_contribution user_completed_projects'
        );

        return {
          id: selectedUser.userId._id,
          userId: selectedUser.userId._id,
          username: selectedUser.userId.username || selectedUser.userId.name,
          email: selectedUser.userId.email,
          role: 'contributor',
          selectionScore: selectedUser.selectionScore,
          selectionReason: selectedUser.selectionReason,
          selectedAt: selectedUser.selectedAt,
          acceptedByUser: selectedUser.acceptedByUser,
          acceptedAt: selectedUser.acceptedAt,
          escrowLocked: selectedUser.escrowLocked,
          escrowLockedAt: selectedUser.escrowLockedAt,
          // Bid information
          bidAmount: selectedUser.bidId?.bid_amount,
          bidDescription: selectedUser.bidId?.bid_description,
          experience: selectedUser.bidId?.year_of_experience,
          hoursPerWeek: selectedUser.bidId?.hours_avilable_per_week,
          skills: selectedUser.bidId?.skills || [],
          // Profile information
          avatar: userProfile?.user_profile_cover_photo,
          bio: userProfile?.user_profile_bio,
          profileSkills: userProfile?.user_profile_skills,
          linkedIn: userProfile?.user_profile_linkedIn,
          github: userProfile?.user_profile_github,
          website: userProfile?.user_profile_website,
          instagram: userProfile?.user_profile_instagram,
          location: userProfile?.user_profile_location,
          profileCreatedAt: userProfile?.user_profile_created_at,
          projectContribution: userProfile?.user_project_contribution,
          completedProjects: userProfile?.user_completed_projects
        };
      })
    );

    // Add project owner to team members
    const projectOwnerProfile = await UserProfile.findOne(
      { username: project.user },
      'user_profile_cover_photo user_profile_bio user_profile_skills user_profile_linkedIn user_profile_github user_profile_website user_profile_instagram user_profile_location user_profile_created_at user_project_contribution user_completed_projects'
    );

    const projectOwner = {
      id: project.user,
      userId: project.user,
      username: projectOwnerProfile?.username || 'Project Owner',
      email: '', // Don't expose owner email for security
      role: 'project_owner',
      selectionScore: 100,
      selectionReason: 'project_owner',
      selectedAt: project.createdAt,
      acceptedByUser: true,
      acceptedAt: project.createdAt,
      escrowLocked: false,
      // Profile information
      avatar: projectOwnerProfile?.user_profile_cover_photo,
      bio: projectOwnerProfile?.user_profile_bio,
      profileSkills: projectOwnerProfile?.user_profile_skills,
      linkedIn: projectOwnerProfile?.user_profile_linkedIn,
      github: projectOwnerProfile?.user_profile_github,
      website: projectOwnerProfile?.user_profile_website,
      instagram: projectOwnerProfile?.user_profile_instagram,
      location: projectOwnerProfile?.user_profile_location,
      profileCreatedAt: projectOwnerProfile?.user_profile_created_at,
      projectContribution: projectOwnerProfile?.user_project_contribution,
      completedProjects: projectOwnerProfile?.user_completed_projects
    };

    // Combine owner and contributors
    const allTeamMembers = [projectOwner, ...teamMembersWithProfiles];

    res.status(200).json({
      teamMembers: allTeamMembers,
      project: {
        id: project._id,
        title: project.project_Title,
        description: project.Project_Description,
        totalContributors: selection?.selectedUsers?.length || 0,
        requiredContributors: selection?.requiredContributors || 0,
        selectionStatus: selection?.status || 'pending'
      }
    });

  } catch (error) {
    console.error('Error getting project team members:', error);
    res.status(500).json({ 
      message: 'Failed to fetch team members',
      error: error.message 
    });
  }
};
