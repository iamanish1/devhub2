import ProjectListing from '../Model/ProjectListingModel.js';
import ProjectSelection from '../Model/ProjectSelectionModel.js';
import Bidding from '../Model/BiddingModel.js';
import ProjectTask from '../Model/ProjectTaskModel.js';
import UserProfile from '../Model/UserProfileModel.js';
import { logger } from '../utils/logger.js';

// Firebase imports for checking workspace access
import { doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";

/**
 * Helper function to check if user has access to a project
 * @param {Object} project - The project object
 * @param {string} userId - The user ID to check
 * @param {Object} selection - Optional ProjectSelection object
 * @returns {Object} - { hasAccess: boolean, accessLevel: string, message: string }
 */
export const checkProjectAccess = async (project, userId, selection = null) => {
  // Check if user is project owner
  if (project.user.toString() === userId.toString()) {
    return { 
      hasAccess: true, 
      accessLevel: 'owner',
      message: 'User is project owner' 
    };
  }

  // Special access for free projects - any user can access for resume building
  if (project.project_category === 'free' || project.is_free_project) {
    return { 
      hasAccess: true, 
      accessLevel: 'free_contributor',
      message: 'User has access to free project for resume building' 
    };
  }

  // Check if user is a selected contributor
  if (selection && selection.selectedUsers && selection.selectedUsers.length > 0) {
    const isSelectedContributor = selection.selectedUsers.some(
      selectedUser => selectedUser.userId?.toString() === userId.toString()
    );
    
    if (isSelectedContributor) {
      return { 
        hasAccess: true, 
        accessLevel: 'contributor',
        message: 'User is selected contributor' 
      };
    }
  }

  // Check if user has an accepted bid
  try {
    const acceptedBid = await Bidding.findOne({
      project_id: project._id,
      user_id: userId,
      bid_status: 'Accepted'
    });

    if (acceptedBid) {
      return { 
        hasAccess: true, 
        accessLevel: 'contributor',
        message: 'User has accepted bid' 
      };
    }
  } catch (biddingError) {
    logger.error(`[ProjectTask] Error checking Bidding: ${biddingError.message}`, biddingError);
  }

  return { 
    hasAccess: false, 
    accessLevel: 'none',
    message: 'Access denied: User is not a selected contributor or project owner' 
  };
};

/**
 * Create project workspace
 */
export const createWorkspace = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const workspaceData = req.body;

    logger.info(`[ProjectTask] Creating workspace for project ${projectId}`);

    // Check if user is project owner
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only project owner can create workspace' });
    }

    // Create workspace in Firebase
    const workspaceRef = doc(db, 'project_workspaces', projectId);
    await setDoc(workspaceRef, {
      projectId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      ...workspaceData
    });

    res.status(201).json({ 
      success: true,
      message: 'Workspace created successfully',
      workspace: { projectId, ...workspaceData }
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error creating workspace: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update project workspace
 */
export const updateWorkspace = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    logger.info(`[ProjectTask] Updating workspace for project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Update workspace in Firebase
    const workspaceRef = doc(db, 'project_workspaces', projectId);
    await setDoc(workspaceRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    res.status(200).json({ 
      success: true,
      message: 'Workspace updated successfully'
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error updating workspace: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new task
 */
export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { title, description, priority = 'medium', dueDate, assignedTo, estimatedHours } = req.body;

    logger.info(`[ProjectTask] Creating task for project ${projectId}`);
    logger.info(`[ProjectTask] Request body:`, req.body);
    logger.info(`[ProjectTask] User ID: ${userId}`);
    logger.info(`[ProjectTask] Project ID: ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Create task in database
    const newTask = new ProjectTask({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: assignedTo || userId,
      estimatedHours: estimatedHours || 0,
      projectId,
      createdBy: userId,
      status: 'pending'
    });

    const savedTask = await newTask.save();

    // Sync to Firebase for real-time updates
    const taskRef = doc(db, 'project_tasks', savedTask._id.toString());
    await setDoc(taskRef, {
      id: savedTask._id.toString(),
      projectId,
      title: savedTask.title,
      description: savedTask.description,
      status: savedTask.status,
      priority: savedTask.priority,
      assignedTo: savedTask.assignedTo.toString(),
      createdBy: savedTask.createdBy.toString(),
      createdAt: serverTimestamp()
    });

    res.status(201).json({ 
      success: true,
      message: 'Task created successfully',
      task: savedTask
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error creating task: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update a task
 */
export const updateTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user._id;
    const updateData = req.body;

    logger.info(`[ProjectTask] Updating task ${taskId} for project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Update task in database
    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Sync to Firebase for real-time updates
    const taskRef = doc(db, 'project_tasks', taskId);
    await setDoc(taskRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    }, { merge: true });

    res.status(200).json({ 
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error updating task: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Deleting task ${taskId} for project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Delete task from database
    const deletedTask = await ProjectTask.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete from Firebase
    const taskRef = doc(db, 'project_tasks', taskId);
    await setDoc(taskRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId.toString()
    }, { merge: true });

    res.status(200).json({ 
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error deleting task: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Complete a task
 */
export const completeTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user._id;
    const { completionNotes, actualHours } = req.body;

    logger.info(`[ProjectTask] Completing task ${taskId} for project ${projectId}`);
    logger.info(`[ProjectTask] User ID: ${userId}`);
    logger.info(`[ProjectTask] Request body:`, req.body);

    // Validate required parameters
    if (!projectId || !taskId) {
      logger.error(`[ProjectTask] Missing required parameters: projectId=${projectId}, taskId=${taskId}`);
      return res.status(400).json({ message: 'Project ID and Task ID are required' });
    }

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      logger.error(`[ProjectTask] Project not found: ${projectId}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      logger.error(`[ProjectTask] Access denied for user ${userId} on project ${projectId}: ${accessResult.message}`);
      return res.status(403).json({ message: accessResult.message });
    }

    // Check if task exists before updating
    const existingTask = await ProjectTask.findById(taskId);
    if (!existingTask) {
      logger.error(`[ProjectTask] Task not found: ${taskId}`);
      return res.status(404).json({ message: 'Task not found' });
    }

    logger.info(`[ProjectTask] Current task status: ${existingTask.status}`);

    // Update task status to review (waiting for admin approval)
    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { 
        status: 'review',
        completionNotes: completionNotes || '',
        actualHours: actualHours || existingTask.actualHours || 0,
        completedAt: new Date(),
        completedBy: userId,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      logger.error(`[ProjectTask] Failed to update task: ${taskId}`);
      return res.status(500).json({ message: 'Failed to update task' });
    }

    logger.info(`[ProjectTask] Task updated successfully: ${updatedTask._id}, new status: ${updatedTask.status}`);

    // Sync to Firebase for real-time updates (with error handling)
    try {
      if (db) {
        const taskRef = doc(db, 'project_tasks', taskId);
        await setDoc(taskRef, {
          status: 'review',
          completionNotes: completionNotes || '',
          actualHours: actualHours || existingTask.actualHours || 0,
          completedAt: serverTimestamp(),
          completedBy: userId.toString(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        logger.info(`[ProjectTask] Firebase sync successful for task: ${taskId}`);
      } else {
        logger.warn(`[ProjectTask] Firebase not available, skipping sync for task: ${taskId}`);
      }
    } catch (firebaseError) {
      logger.error(`[ProjectTask] Firebase sync failed for task ${taskId}:`, firebaseError);
      // Don't fail the entire operation if Firebase sync fails
    }

    res.status(200).json({ 
      success: true,
      message: 'Task completed successfully',
      task: updatedTask
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error completing task: ${error.message}`, error);
    logger.error(`[ProjectTask] Error stack:`, error.stack);
    
    // Return more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format' 
      });
    }

    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Review task (Admin only)
 */
export const reviewTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user._id;
    const { reviewNotes, approved = true } = req.body;

    logger.info(`[ProjectTask] Reviewing task ${taskId} for project ${projectId}`);

    // Check if user is project owner (admin)
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only project owner can review tasks' });
    }

    // Update task status to completed (admin approved) or back to review (admin rejected)
    const newStatus = approved ? 'completed' : 'review';
    const updatedTask = await ProjectTask.findByIdAndUpdate(
      taskId,
      { 
        status: newStatus,
        reviewNotes,
        approved,
        reviewedAt: new Date(),
        reviewedBy: userId
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Sync to Firebase for real-time updates
    const taskRef = doc(db, 'project_tasks', taskId);
    await setDoc(taskRef, {
      status: newStatus,
      reviewNotes,
      approved,
      reviewedAt: serverTimestamp(),
      reviewedBy: userId.toString()
    }, { merge: true });

    res.status(200).json({ 
      success: true,
      message: 'Task reviewed successfully',
      task: updatedTask
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error reviewing task: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Add comment to task
 */
export const addTaskComment = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    logger.info(`[ProjectTask] Adding comment to task ${taskId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Add comment to Firebase for real-time updates
    const commentRef = collection(db, 'task_comments');
    const newComment = await addDoc(commentRef, {
      taskId,
      projectId,
      content,
      authorId: userId.toString(),
      authorName: req.user.username || req.user.name || 'Unknown',
      createdAt: serverTimestamp()
    });

    res.status(201).json({ 
      success: true,
      message: 'Comment added successfully',
      comment: {
        id: newComment.id,
        content,
        authorId: userId.toString(),
        authorName: req.user.username || req.user.name || 'Unknown',
        createdAt: new Date()
      }
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error adding comment: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Upload file to task
 */
export const uploadTaskFile = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const userId = req.user._id;
    const { title, description, isPublic = true, tags } = req.body;
    const file = req.file;

    logger.info(`[ProjectTask] Uploading file to task ${taskId}`);

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Save file info to Firebase
    const fileRef = collection(db, 'task_files');
    const newFile = await addDoc(fileRef, {
      taskId,
      projectId,
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size,
      title: title || file.originalname,
      description: description || '',
      isPublic: isPublic === 'true',
      tags: tags ? JSON.parse(tags) : [],
      uploadedBy: userId.toString(),
      uploadedAt: serverTimestamp()
    });

    res.status(201).json({ 
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: newFile.id,
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/${file.filename}`,
        size: file.size,
        title: title || file.originalname,
        description: description || '',
        uploadedBy: userId.toString(),
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error uploading file: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Upload project resource
 */
export const uploadProjectResource = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;
    const { name, type, description, url } = req.body;
    const file = req.file;

    logger.info(`[ProjectTask] Uploading resource to project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    let resourceData = {
      projectId,
      name,
      type,
      description: description || '',
      uploadedBy: userId.toString(),
      uploadedAt: serverTimestamp()
    };

    // Handle different resource types
    if (type === 'file' && file) {
      resourceData = {
        ...resourceData,
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      };
    } else if (type === 'link' && url) {
      resourceData = {
        ...resourceData,
        url: url
      };
    } else if (type === 'document' && file) {
      resourceData = {
        ...resourceData,
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/${file.filename}`,
        size: file.size,
        mimetype: file.mimetype
      };
    } else {
      return res.status(400).json({ message: 'Invalid resource type or missing file/URL' });
    }

    // Save resource to Firebase for real-time updates
    const resourceRef = collection(db, 'project_resources');
    const newResource = await addDoc(resourceRef, resourceData);

    // Create notification for new resource
    await addDoc(collection(db, "project_notifications"), {
      projectId,
      type: 'resource_uploaded',
      title: 'New Resource Added',
      message: `Resource "${name}" has been added to the project`,
      resourceId: newResource.id,
      createdBy: userId.toString(),
      createdAt: serverTimestamp(),
      readBy: []
    });

    res.status(201).json({ 
      success: true,
      message: 'Resource uploaded successfully',
      resource: {
        id: newResource.id,
        ...resourceData,
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error uploading resource: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get project resources
 */
export const getProjectResources = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Getting resources for project ${projectId}`);
    console.log('🔍 [ProjectTask] Getting resources for project:', projectId);
    console.log('🔍 [ProjectTask] User ID:', userId);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      console.log('❌ [ProjectTask] Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('✅ [ProjectTask] Project found:', project.project_Title);

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    console.log('🔍 [ProjectTask] Access check result:', accessResult);

    if (!accessResult.hasAccess) {
      console.log('❌ [ProjectTask] Access denied for user:', userId, '-', accessResult.message);
      return res.status(403).json({ message: accessResult.message });
    }

    console.log('🔍 [ProjectTask] Access granted, fetching resources from Firebase...');

    // Check if Firebase is properly configured
    if (!db) {
      console.log('⚠️ [ProjectTask] Firebase db is not available, returning empty resources');
      return res.status(200).json({ 
        success: true,
        resources: [],
        total: 0,
        message: 'Firebase not configured'
      });
    }

    try {
      // Get resources from Firebase - remove orderBy to avoid index requirement
      const resourcesQuery = query(
        collection(db, 'project_resources'),
        where('projectId', '==', projectId)
      );

      console.log('🔍 [ProjectTask] Firebase query created, executing...');

      const resourcesSnapshot = await getDocs(resourcesQuery);
      console.log('🔍 [ProjectTask] Firebase query executed, docs count:', resourcesSnapshot.size);

      const resources = [];
      
      resourcesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 [ProjectTask] Processing resource:', doc.id, data);
        resources.push({
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate?.() || new Date(data.uploadedAt)
        });
      });

      // Sort resources by uploadedAt in descending order (newest first)
      resources.sort((a, b) => {
        const dateA = new Date(a.uploadedAt);
        const dateB = new Date(b.uploadedAt);
        return dateB - dateA;
      });

      console.log('✅ [ProjectTask] Returning', resources.length, 'resources');

      res.status(200).json({ 
        success: true,
        resources,
        total: resources.length
      });

    } catch (firebaseError) {
      console.error('❌ [ProjectTask] Firebase error:', firebaseError);
      console.error('❌ [ProjectTask] Firebase error details:', {
        code: firebaseError.code,
        message: firebaseError.message,
        stack: firebaseError.stack
      });
      
      // If Firebase fails, return empty resources instead of error
      console.log('🔍 [ProjectTask] Returning empty resources due to Firebase error');
      res.status(200).json({ 
        success: true,
        resources: [],
        total: 0,
        message: 'No resources found or Firebase connection issue',
        firebaseError: firebaseError.message
      });
    }

  } catch (error) {
    logger.error(`[ProjectTask] Error getting project resources: ${error.message}`, error);
    console.error('❌ [ProjectTask] Error getting project resources:', error);
    console.error('❌ [ProjectTask] Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete project resource
 */
export const deleteProjectResource = async (req, res) => {
  try {
    const { projectId, resourceId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Deleting resource ${resourceId} from project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Get resource from Firebase
    const resourceRef = doc(db, 'project_resources', resourceId);
    const resourceDoc = await getDoc(resourceRef);

    if (!resourceDoc.exists()) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const resourceData = resourceDoc.data();

    // Check if user is the uploader or project owner
    if (resourceData.uploadedBy !== userId.toString() && !isProjectOwner) {
      return res.status(403).json({ message: 'Only the uploader or project owner can delete this resource' });
    }

    // Delete file from server if it's a file resource
    if (resourceData.filename) {
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
      const filePath = path.join(uploadsDir, resourceData.filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from Firebase
    await deleteDoc(resourceRef);

    // Create notification for resource deletion
    await addDoc(collection(db, "project_notifications"), {
      projectId,
      type: 'resource_deleted',
      title: 'Resource Deleted',
      message: `Resource "${resourceData.name}" has been deleted`,
      resourceId: resourceId,
      createdBy: userId.toString(),
      createdAt: serverTimestamp(),
      readBy: []
    });

    res.status(200).json({ 
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error deleting resource: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update project resource
 */
export const updateProjectResource = async (req, res) => {
  try {
    const { projectId, resourceId } = req.params;
    const userId = req.user._id;
    const { name, description } = req.body;

    logger.info(`[ProjectTask] Updating resource ${resourceId} in project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Get resource from Firebase
    const resourceRef = doc(db, 'project_resources', resourceId);
    const resourceDoc = await getDoc(resourceRef);

    if (!resourceDoc.exists()) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const resourceData = resourceDoc.data();

    // Check if user is the uploader or project owner
    if (resourceData.uploadedBy !== userId.toString() && !isProjectOwner) {
      return res.status(403).json({ message: 'Only the uploader or project owner can update this resource' });
    }

    // Update resource in Firebase
    await updateDoc(resourceRef, {
      name: name || resourceData.name,
      description: description || resourceData.description,
      updatedAt: serverTimestamp(),
      updatedBy: userId.toString()
    });

    // Create notification for resource update
    await addDoc(collection(db, "project_notifications"), {
      projectId,
      type: 'resource_updated',
      title: 'Resource Updated',
      message: `Resource "${name || resourceData.name}" has been updated`,
      resourceId: resourceId,
      createdBy: userId.toString(),
      createdAt: serverTimestamp(),
      readBy: []
    });

    res.status(200).json({ 
      success: true,
      message: 'Resource updated successfully'
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error updating resource: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get project tasks
 */
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Getting tasks for project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Get tasks from database
    const tasks = await ProjectTask.find({ projectId })
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      tasks,
      total: tasks.length
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error getting project tasks: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get user's tasks
 */
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, priority, projectId } = req.query;

    logger.info(`[ProjectTask] Getting tasks for user ${userId}`);

    // Build filter
    const filter = { assignedTo: userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (projectId) filter.projectId = projectId;

    // Get tasks from database
    const tasks = await ProjectTask.find(filter)
      .populate('projectId', 'project_Title Project_Description')
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true,
      tasks,
      total: tasks.length
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error getting user tasks: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get project statistics
 */
export const getProjectStatistics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Getting statistics for project ${projectId}`);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Get task statistics
    const tasks = await ProjectTask.find({ projectId });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;

    // Calculate progress percentage
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get team statistics
    const teamMembers = selection?.selectedUsers || [];
    const activeContributors = teamMembers.length;

    // Calculate estimated vs actual hours
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);

    const statistics = {
      project: {
        id: project._id,
        title: project.project_Title,
        description: project.Project_Description
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        progressPercentage: Math.round(progressPercentage * 100) / 100
      },
      team: {
        totalMembers: teamMembers.length,
        activeContributors
      },
      time: {
        totalEstimatedHours,
        totalActualHours,
        efficiency: totalEstimatedHours > 0 ? ((totalEstimatedHours - totalActualHours) / totalEstimatedHours) * 100 : 0
      }
    };

    res.status(200).json({ 
      success: true,
      statistics
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error getting project statistics: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get team members for a project
 */
export const getTeamMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    logger.info(`[ProjectTask] Getting team members for project ${projectId}`);
    console.log('🔍 [ProjectTask] Getting team members for project:', projectId);
    console.log('🔍 [ProjectTask] User ID:', userId);
    console.log('🔍 [ProjectTask] Request params:', req.params);
    console.log('🔍 [ProjectTask] Request user:', req.user);

    // Check if user has access
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      console.log('❌ [ProjectTask] Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    console.log('✅ [ProjectTask] Project found:', project.project_Title);

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    console.log('🔍 [ProjectTask] Access check result:', accessResult);

    if (!accessResult.hasAccess) {
      console.log('❌ [ProjectTask] Access denied for user:', userId, '-', accessResult.message);
      return res.status(403).json({ message: accessResult.message });
    }

    // Get project owner
    const ownerProfile = await UserProfile.findOne({ username: project.user }).lean();
    console.log('🔍 [ProjectTask] Owner profile:', ownerProfile ? 'Found' : 'Not found');

    // Get selected contributors
    const teamMembers = [];
    
    if (selection && selection.selectedUsers) {
      console.log('🔍 [ProjectTask] Found selection with', selection.selectedUsers.length, 'selected users');
      for (const selectedUser of selection.selectedUsers) {
        const userProfile = await UserProfile.findOne({ username: selectedUser.userId }).lean();
        if (userProfile) {
          teamMembers.push({
            userId: selectedUser.userId,
            username: userProfile.username,
            email: userProfile.user_profile_email,
            avatar: userProfile.user_profile_cover_photo,
            role: 'contributor',
            joinedAt: selectedUser.selectedAt,
            selectionReason: selectedUser.selectionReason
          });
        }
      }
    } else {
      console.log('🔍 [ProjectTask] No selection found or no selected users');
    }

    // Add project owner
    if (ownerProfile) {
      teamMembers.unshift({
        userId: project.user.toString(),
        username: ownerProfile.username,
        email: ownerProfile.user_profile_email,
        avatar: ownerProfile.user_profile_cover_photo,
        role: 'owner',
        joinedAt: project.createdAt,
        selectionReason: 'Project Owner'
      });
    }

    console.log('✅ [ProjectTask] Returning', teamMembers.length, 'team members');

    res.status(200).json({ 
      success: true,
      teamMembers,
      totalMembers: teamMembers.length
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error getting team members: ${error.message}`, error);
    console.error('❌ [ProjectTask] Error getting team members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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

    // Get project selection for access check
    const selection = await ProjectSelection.findOne({ projectId });
    
    // Use helper function to check access
    const accessResult = await checkProjectAccess(project, userId, selection);
    
    if (accessResult.hasAccess) {
      logger.info(`[ProjectTask] User ${userId} granted access to project ${projectId} - ${accessResult.message}`);
      return res.status(200).json(accessResult);
    } else {
      logger.warn(`[ProjectTask] User ${userId} denied access to project ${projectId} - ${accessResult.message}`);
      return res.status(403).json(accessResult); n
    }

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

    // Use helper function to check access (includes free project logic)
    const selection = await ProjectSelection.findOne({ projectId });
    const accessResult = await checkProjectAccess(project, userId, selection);

    if (!accessResult.hasAccess) {
      return res.status(403).json({ message: accessResult.message });
    }

    // Get tasks from database
    const tasks = await ProjectTask.find({ projectId })
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    // Get resources from Firebase
    let resources = [];
    try {
      const resourcesQuery = query(
        collection(db, 'project_resources'),
        where('projectId', '==', projectId),
        orderBy('uploadedAt', 'desc')
      );
      const resourcesSnapshot = await getDocs(resourcesQuery);
      
      resourcesSnapshot.forEach((doc) => {
        const data = doc.data();
        resources.push({
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate?.() || new Date(data.uploadedAt)
        });
      });
    } catch (firebaseError) {
      logger.error(`[ProjectTask] Error getting resources from Firebase: ${firebaseError.message}`);
      // Continue with empty resources array
    }

    // Return workspace data
    const workspace = {
      projectId,
      projectTitle: project.project_Title,
      projectDescription: project.Project_Description,
      tasks: tasks,
      resources: resources,
      contributors: selection?.selectedUsers || [],
      userAccess: {
        accessLevel: accessResult.accessLevel,
        hasAccess: accessResult.hasAccess,
        message: accessResult.message
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


