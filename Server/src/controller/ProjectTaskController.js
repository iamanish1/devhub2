import ProjectListing from '../Model/ProjectListingModel.js';
import ProjectSelection from '../Model/ProjectSelectionModel.js';
import Bidding from '../Model/BiddingModel.js';
import { logger } from '../utils/logger.js';

// Firebase imports for checking workspace access
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";

/**
 * Check if user has access to project workspace
 */
export const checkWorkspaceAccess = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Checking workspace access for user ${userId} on project ${projectId}`);

    // Validate projectId
    if (!projectId) {
      logger.error(`[ProjectTask] Project ID is missing in request`);
      return res.status(400).json({ 
        hasAccess: false, 
        message: 'Project ID is required' 
      });
    }

    // Validate userId
    if (!userId) {
      logger.error(`[ProjectTask] User ID is missing in request`);
      return res.status(400).json({ 
        hasAccess: false, 
        message: 'User ID is required' 
      });
    }

    // Check if project exists
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      logger.warn(`[ProjectTask] Project not found: ${projectId}`);
      return res.status(404).json({ 
        hasAccess: false, 
        message: 'Project not found' 
      });
    }

    // Check if user is project owner
    if (project.user.toString() === userId.toString()) {
      logger.info(`[ProjectTask] User ${userId} is project owner`);
      return res.status(200).json({ 
        hasAccess: true, 
        accessLevel: 'owner',
        message: 'User is project owner' 
      });
    }

    // Check if user is a selected contributor
    try {
      const selection = await ProjectSelection.findOne({ projectId });
      logger.info(`[ProjectTask] ProjectSelection query result: ${selection ? 'Found' : 'Not found'}`);
      
      if (selection && selection.selectedUsers && selection.selectedUsers.length > 0) {
        logger.info(`[ProjectTask] Found ${selection.selectedUsers.length} selected users`);
        
        const isSelectedContributor = selection.selectedUsers.some(
          selectedUser => {
            const selectedUserId = selectedUser.userId?.toString();
            const currentUserId = userId.toString();
            logger.info(`[ProjectTask] Comparing: ${selectedUserId} with ${currentUserId}`);
            return selectedUserId === currentUserId;
          }
        );
        
        if (isSelectedContributor) {
          logger.info(`[ProjectTask] User ${userId} is selected contributor`);
          return res.status(200).json({ 
            hasAccess: true, 
            accessLevel: 'contributor',
            message: 'User is selected contributor' 
          });
        } else {
          logger.info(`[ProjectTask] User ${userId} is not in selected users list`);
        }
      } else {
        logger.info(`[ProjectTask] No selection found or no selected users for project ${projectId}`);
      }
    } catch (selectionError) {
      logger.error(`[ProjectTask] Error checking ProjectSelection: ${selectionError.message}`, selectionError);
      // Continue to check other access methods
    }

    // Check if user has an accepted bid
    try {
      const acceptedBid = await Bidding.findOne({
        project_id: projectId,
        user_id: userId,
        bid_status: 'Accepted'
      });

      if (acceptedBid) {
        logger.info(`[ProjectTask] User ${userId} has accepted bid`);
        return res.status(200).json({ 
          hasAccess: true, 
          accessLevel: 'contributor',
          message: 'User has accepted bid' 
        });
      } else {
        logger.info(`[ProjectTask] User ${userId} does not have an accepted bid`);
      }
    } catch (biddingError) {
      logger.error(`[ProjectTask] Error checking Bidding: ${biddingError.message}`, biddingError);
      // Continue to deny access
    }

    logger.warn(`[ProjectTask] User ${userId} denied access to project ${projectId}`);
    return res.status(403).json({ 
      hasAccess: false, 
      message: 'Access denied: User is not a selected contributor or project owner' 
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error checking workspace access: ${error.message}`, error);
    res.status(500).json({ 
      hasAccess: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Debug endpoint to check project selection and Firebase access status
 */
export const debugProjectAccess = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Debug access for user ${userId} on project ${projectId}`);

    // Get project details
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get selection details
    const selection = await ProjectSelection.findOne({ projectId });
    
    // Get user's bids
    const userBids = await Bidding.find({
      project_id: projectId,
      user_id: userId
    });

    // Check if user is project owner
    const isProjectOwner = project.user.toString() === userId.toString();
    
    // Check if user is selected contributor
    const isSelectedContributor = selection && selection.selectedUsers && 
      selection.selectedUsers.some(selectedUser => selectedUser.userId.toString() === userId.toString());
    
    // Check if user has accepted bid
    const hasAcceptedBid = userBids.some(bid => bid.bid_status === 'Accepted');

    // Check Firebase workspace access
    let firebaseWorkspaceAccess = null;
    let firebaseProjectContributor = null;
    
    try {
      const workspaceAccessRef = doc(db, 'workspace_access', `${projectId}_${userId}`);
      const workspaceAccessDoc = await getDoc(workspaceAccessRef);
      if (workspaceAccessDoc.exists()) {
        firebaseWorkspaceAccess = workspaceAccessDoc.data();
      }

      const projectContributorRef = doc(db, 'project_contributors', `${projectId}_${userId}`);
      const projectContributorDoc = await getDoc(projectContributorRef);
      if (projectContributorDoc.exists()) {
        firebaseProjectContributor = projectContributorDoc.data();
      }
    } catch (firebaseError) {
      logger.error(`[ProjectTask] Error checking Firebase access: ${firebaseError.message}`);
    }

    const debugInfo = {
      project: {
        id: project._id,
        title: project.project_Title,
        owner: project.user
      },
      user: {
        id: userId,
        isProjectOwner,
        isSelectedContributor,
        hasAcceptedBid
      },
      selection: selection ? {
        id: selection._id,
        status: selection.status,
        selectedUsersCount: selection.selectedUsers?.length || 0,
        selectedUsers: selection.selectedUsers?.map(user => ({
          userId: user.userId,
          selectionReason: user.selectionReason,
          selectedAt: user.selectedAt
        })) || []
      } : null,
      bids: userBids.map(bid => ({
        id: bid._id,
        status: bid.bid_status,
        amount: bid.bid_amount
      })),
      firebase: {
        workspaceAccess: firebaseWorkspaceAccess,
        projectContributor: firebaseProjectContributor
      }
    };

    res.status(200).json(debugInfo);

  } catch (error) {
    logger.error(`[ProjectTask] Error in debugProjectAccess: ${error.message}`, error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Get project workspace
 */
export const getWorkspace = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Getting workspace for project ${projectId}`);

    // First check access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    const isProjectOwner = project.user.toString() === userId.toString();
    
    // Check if user is selected contributor
    const selection = await ProjectSelection.findOne({ projectId });
    const isSelectedContributor = selection && selection.selectedUsers && 
      selection.selectedUsers.some(selectedUser => selectedUser.userId.toString() === userId.toString());

    // Check if user has accepted bid
    const acceptedBid = await Bidding.findOne({
      project_id: projectId,
      user_id: userId,
      bid_status: 'Accepted'
    });

    if (!isProjectOwner && !isSelectedContributor && !acceptedBid) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return workspace data
    const workspace = {
      projectId,
      projectTitle: project.project_Title,
      projectDescription: project.Project_Description,
      tasks: [], // You can populate this with actual tasks
      resources: [], // You can populate this with actual resources
      contributors: selection?.selectedUsers || [],
      userAccess: {
        isProjectOwner,
        isSelectedContributor,
        hasAcceptedBid: !!acceptedBid
      }
    };

    res.status(200).json({ workspace });

  } catch (error) {
    logger.error(`[ProjectTask] Error getting workspace: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Manually create Firebase workspace access for testing
 */
export const createFirebaseAccess = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Creating Firebase access for user ${userId} on project ${projectId}`);

    // Import the createFirebaseWorkspaceAccess function
    const { createFirebaseWorkspaceAccess } = await import('./ProjectSelectionController.js');
    
    const result = await createFirebaseWorkspaceAccess(projectId, userId);
    
    if (result) {
      res.status(200).json({ 
        success: true,
        message: 'Firebase workspace access created successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to create Firebase workspace access' 
      });
    }

  } catch (error) {
    logger.error(`[ProjectTask] Error creating Firebase access: ${error.message}`, error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
};

/**
 * Debug endpoint to check all bids for a project
 */
export const debugProjectBids = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Debug bids for project ${projectId}`);

    // Get project details
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    const isProjectOwner = project.user.toString() === userId.toString();
    if (!isProjectOwner) {
      return res.status(403).json({ message: 'Only project owner can view bid details' });
    }

    // Get all bids for this project
    const allBids = await Bidding.find({ project_id: projectId })
      .populate('user_id', 'username email')
      .sort({ createdAt: -1 });

    // Group bids by user
    const bidsByUser = {};
    allBids.forEach(bid => {
      const userId = bid.user_id._id.toString();
      if (!bidsByUser[userId]) {
        bidsByUser[userId] = [];
      }
      bidsByUser[userId].push({
        id: bid._id,
        status: bid.bid_status,
        amount: bid.bid_amount,
        description: bid.bid_description,
        createdAt: bid.createdAt,
        user: {
          id: bid.user_id._id,
          username: bid.user_id.username,
          email: bid.user_id.email
        }
      });
    });

    const debugInfo = {
      project: {
        id: project._id,
        title: project.project_Title,
        owner: project.user
      },
      totalBids: allBids.length,
      bidsByUser: bidsByUser,
      bidStatuses: allBids.reduce((acc, bid) => {
        acc[bid.bid_status] = (acc[bid.bid_status] || 0) + 1;
        return acc;
      }, {})
    };

    res.status(200).json(debugInfo);

  } catch (error) {
    logger.error(`[ProjectTask] Error in debugProjectBids: ${error.message}`, error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};
