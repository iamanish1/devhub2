import ProjectListing from '../Model/ProjectListingModel.js';
import ProjectSelection from '../Model/ProjectSelectionModel.js';
import Bidding from '../Model/BiddingModel.js';
import { logger } from '../utils/logger.js';

/**
 * Check if user has access to project workspace
 */
export const checkWorkspaceAccess = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Checking workspace access for user ${userId} on project ${projectId}`);

    // Check if project exists
    const project = await ProjectListing.findById(projectId);
    if (!project) {
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
    const selection = await ProjectSelection.findOne({ projectId });
    if (selection && selection.selectedUsers) {
      const isSelectedContributor = selection.selectedUsers.some(
        selectedUser => selectedUser.userId.toString() === userId.toString()
      );
      
      if (isSelectedContributor) {
        logger.info(`[ProjectTask] User ${userId} is selected contributor`);
        return res.status(200).json({ 
          hasAccess: true, 
          accessLevel: 'contributor',
          message: 'User is selected contributor' 
        });
      }
    }

    // Check if user has an accepted bid
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
      message: 'Internal server error' 
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
