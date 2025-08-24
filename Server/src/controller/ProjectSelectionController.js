import ProjectSelection from "../Model/ProjectSelectionModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import Bidding from "../Model/BiddingModel.js";
import EscrowWallet from "../Model/EscrowWalletModel.js";
import UserProfile from "../Model/UserProfileModel.js";
import user from "../Model/UserModel.js";
import selectionAlgorithm from "../services/selectionAlgorithm.js";
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
      selectionMode = "hybrid",
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

    // Create selection configuration
    const selection = new ProjectSelection({
      projectId,
      projectOwner: req.user._id,
      selectionMode,
      requiredContributors,
      maxBidsToConsider,
      requiredSkills,
      criteriaWeights,
      status: "pending",
    });

    await selection.save();

    logger.info(
      `[ProjectSelection] Created selection config for project: ${projectId}`
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
 * Execute automatic selection
 */
export const executeAutomaticSelection = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { force = false } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          message: "You can only execute selection for your own projects",
        });
    }

    // Get or create selection configuration
    let selection = await ProjectSelection.findOne({ projectId });
    if (!selection) {
      // Create default selection configuration
      selection = new ProjectSelection({
        projectId,
        projectOwner: req.user._id,
        selectionMode: "automatic",
        requiredContributors: project.Project_Contributor,
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
    }

    // Check if selection is already in progress or completed
    if (selection.status === "in_progress" && !force) {
      return res
        .status(400)
        .json({ message: "Selection is already in progress" });
    }

    if (selection.status === "completed" && !force) {
      return res
        .status(400)
        .json({ message: "Selection is already completed" });
    }

    // Update status to in progress
    selection.status = "in_progress";
    selection.selectionStartedAt = new Date();
    await selection.save();

    logger.info(
      `[ProjectSelection] Starting automatic selection for project: ${projectId}`
    );

    // Execute selection algorithm
    const selectionConfig = {
      requiredContributors: selection.requiredContributors,
      maxBidsToConsider: selection.maxBidsToConsider,
      requiredSkills: selection.requiredSkills,
      criteriaWeights: selection.criteriaWeights,
    };

    const result = await selectionAlgorithm.executeAutomaticSelection(
      projectId,
      selectionConfig
    );

    if (result.success) {
      // Update selection with results
      selection.selectedUsers = result.selectedUsers;
      selection.status = "completed";
      selection.selectionCompletedAt = new Date();
      selection.totalBidsConsidered = result.totalBidders;
      await selection.save();

      // Update bid statuses and create Firebase workspace access for selected users
      for (const selectedUser of result.selectedUsers) {
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

      // Send notifications to selected users
      for (const selectedUser of result.selectedUsers) {
        try {
          await notificationService.sendUserSelectionNotification(
            selectedUser.userId,
            projectId,
            selectedUser.bidAmount || 0,
            selectedUser.bonusAmount || 0
          );
        } catch (notificationError) {
          logger.error(
            `[ProjectSelection] Notification failed for user ${selectedUser.userId}: ${notificationError.message}`
          );
        }
      } 
      

      // Send notification to project owner
      try {
        await notificationService.sendSelectionStartedNotification(
          req.user._id,
          projectId,
          {
            requiredContributors: selection.requiredContributors,
            totalBids: result.totalBidders,
            selectionMode: selection.selectionMode,
          }
        );
      } catch (notificationError) {
        logger.error(
          `[ProjectSelection] Notification failed for project owner: ${notificationError.message}`
        );
      }

      logger.info(
        `[ProjectSelection] Automatic selection completed for project: ${projectId}. Selected: ${result.selectedUsers.length} users`
      );

      res.status(200).json({
        success: true,
        message: result.message,
        selection,
        result,
      });
    } else {
      // Update status to failed
      selection.status = "failed";
      selection.lastError = {
        message: result.message,
        timestamp: new Date(),
        retryCount: (selection.lastError?.retryCount || 0) + 1,
      };
      await selection.save();

      res.status(400).json({
        success: false,
        message: result.message,
        selection,
      });
    }
  } catch (error) {
    logger.error(
      `[ProjectSelection] Error in executeAutomaticSelection: ${error.message}`,
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
        selectionMode: "manual",
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
        `[ProjectSelection] Created default selection config for project: ${projectId} with requiredContributors: ${selection.requiredContributors}`
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
    } else {
      selection.status = "in_progress";
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

    logger.info(
      `[ProjectSelection] Manual selection completed for project: ${projectId}. Selected: ${selectedUsers.length} users`
    );

    res.status(200).json({
      success: true,
      message: `Successfully selected ${selectedUsers.length} users`,
      selection,
      selectedUsers,
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

    // Get ranked bidders using selection algorithm
    const selectionConfig = {
      requiredContributors: selection.requiredContributors,
      maxBidsToConsider: parseInt(limit),
      requiredSkills: selection.requiredSkills,
      criteriaWeights: selection.criteriaWeights,
    };

    const rankedBidders = await selectionAlgorithm.selectBidders(
      projectId,
      selectionConfig
    );

    // Get user profiles for additional details
    const userIds = rankedBidders.map((bidder) => bidder.userId);
    const userProfiles = await UserProfile.find({ username: { $in: userIds } });
    const profileMap = new Map();
    userProfiles.forEach((profile) => {
      profileMap.set(profile.username.toString(), profile);
    });

    // Enhance bidder data with profile information
    const enhancedBidders = rankedBidders.map((bidder) => {
      const profile = profileMap.get(bidder.userId.toString());
      return {
        ...bidder,
        profile: profile
          ? {
              bio: profile.user_profile_bio,
              completedProjects: profile.user_completed_projects,
              contributions: profile.user_project_contribution,
              skills: profile.user_profile_skills,
            }
          : null,
      };
    });

    res.status(200).json({
      rankedBidders: enhancedBidders,
      totalBidders: enhancedBidders.length,
      selectionConfig,
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
