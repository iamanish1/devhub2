import ProjectTask from '../Model/ProjectTaskModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import ProjectSelection from '../Model/ProjectSelectionModel.js';
import user from '../Model/UserModel.js';
import { logger } from '../utils/logger.js';
import notificationService from '../services/notificationService.js';
import mongoose from 'mongoose';

/**
 * Create project task workspace
 */
export const createProjectWorkspace = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      startDate,
      endDate,
      teamMembers = [],
      settings = {}
    } = req.body;

    // Validate project exists and user owns it
    const project = await ProjectListing.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only create workspace for your own projects' });
    }

    // Check if workspace already exists
    const existingWorkspace = await ProjectTask.findOne({ projectId });
    if (existingWorkspace) {
      return res.status(400).json({ message: 'Project workspace already exists' });
    }

    // Get project selection to add selected users as team members
    const selection = await ProjectSelection.findOne({ projectId });
    if (!selection || selection.status !== 'completed') {
      return res.status(400).json({ message: 'Project selection must be completed before creating workspace' });
    }

    // Create workspace
    const workspace = new ProjectTask({
      projectId,
      projectOwner: req.user._id,
      timeline: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      settings: {
        allowTaskCreation: settings.allowTaskCreation !== false,
        allowTaskAssignment: settings.allowTaskAssignment !== false,
        requireApproval: settings.requireApproval || false,
        autoAssignTasks: settings.autoAssignTasks || false,
        notificationPreferences: {
          taskAssigned: settings.notificationPreferences?.taskAssigned !== false,
          taskCompleted: settings.notificationPreferences?.taskCompleted !== false,
          milestoneReached: settings.notificationPreferences?.milestoneReached !== false,
          commentAdded: settings.notificationPreferences?.commentAdded !== false
        }
      }
    });

    // Add project owner as admin
    workspace.addTeamMember(req.user._id, 'admin', {
      canCreateTasks: true,
      canAssignTasks: true,
      canReviewTasks: true,
      canManageTeam: true,
      canViewAllTasks: true
    });

    // Add selected users as contributors
    for (const selectedUser of selection.selectedUsers) {
      workspace.addTeamMember(selectedUser.userId, 'contributor', {
        canCreateTasks: settings.allowTaskCreation,
        canAssignTasks: false,
        canReviewTasks: false,
        canManageTeam: false,
        canViewAllTasks: true
      });
    }

    // Add additional team members if provided
    for (const member of teamMembers) {
      workspace.addTeamMember(member.userId, member.role || 'contributor', member.permissions || {});
    }

    await workspace.save();

    logger.info(`[ProjectTask] Created workspace for project: ${projectId}`);

    res.status(201).json({
      message: 'Project workspace created successfully',
      workspace
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in createProjectWorkspace: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get project workspace
 */
export const getProjectWorkspace = async (req, res) => {
  try {
    const { projectId } = req.params;

    const workspace = await ProjectTask.findByProjectId(projectId);

    if (!workspace) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    // Check if user has access
    const isProjectOwner = workspace.projectOwner._id.toString() === req.user._id.toString();
    const isTeamMember = workspace.teamMembers.some(member => 
      member.userId._id.toString() === req.user._id.toString() && member.isActive
    );

    if (!isProjectOwner && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({
      workspace,
      userAccess: {
        isProjectOwner,
        isTeamMember,
        userRole: isTeamMember ? workspace.teamMembers.find(m => 
          m.userId._id.toString() === req.user._id.toString()
        )?.role : null
      }
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in getProjectWorkspace: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Create a new task
 */
export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      assignedTo,
      priority = 'medium',
      estimatedHours = 0,
      dueDate,
      tags = []
    } = req.body;

    // Get workspace
    const workspace = await ProjectTask.findOne({ projectId });
    if (!workspace) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    // Check if user has permission to create tasks
    const userMember = workspace.teamMembers.find(member => 
      member.userId.toString() === req.user._id.toString()
    );

    const isProjectOwner = workspace.projectOwner.toString() === req.user._id.toString();
    const canCreateTasks = isProjectOwner || (userMember && userMember.permissions.canCreateTasks);

    if (!canCreateTasks) {
      return res.status(403).json({ message: 'You do not have permission to create tasks' });
    }

    // Validate assigned user is a team member
    if (assignedTo) {
      const assignedMember = workspace.teamMembers.find(member => 
        member.userId.toString() === assignedTo && member.isActive
      );
      if (!assignedMember) {
        return res.status(400).json({ message: 'Assigned user must be an active team member' });
      }
    }

    // Create task
    const taskData = {
      title,
      description,
      assignedTo: assignedTo || req.user._id,
      priority,
      estimatedHours,
      dueDate: new Date(dueDate),
      tags
    };

    const task = workspace.createTask(taskData, req.user._id);
    await workspace.save();

    // Send notification to assigned user
    if (assignedTo && assignedTo !== req.user._id.toString()) {
      try {
        await notificationService.sendNotification(assignedTo, 'task_assigned', {
          projectTitle: workspace.projectId,
          taskTitle: title,
          assignedBy: req.user.username
        }, ['email', 'push']);
      } catch (notificationError) {
        logger.error(`[ProjectTask] Notification failed: ${notificationError.message}`);
      }
    }

    logger.info(`[ProjectTask] Created task for project: ${projectId}, Task: ${title}`);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in createTask: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Update task
 */
export const updateTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const updateData = req.body;

    // Get workspace
    const workspace = await ProjectTask.findOne({ projectId });
    if (!workspace) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    // Find task
    const task = workspace.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const isProjectOwner = workspace.projectOwner.toString() === req.user._id.toString();
    const isTaskAssignee = task.assignedTo.toString() === req.user._id.toString();
    const userMember = workspace.teamMembers.find(member => 
      member.userId.toString() === req.user._id.toString()
    );

    const canUpdateTask = isProjectOwner || isTaskAssignee || 
      (userMember && userMember.permissions.canAssignTasks);

    if (!canUpdateTask) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }

    // Update task fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        task[key] = updateData[key];
      }
    });

    task.updatedAt = new Date();
    workspace.addActivityLog('task_updated', req.user._id, 'task', taskId, updateData);

    await workspace.save();

    logger.info(`[ProjectTask] Updated task: ${taskId} in project: ${projectId}`);

    res.status(200).json({
      message: 'Task updated successfully',
      task
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in updateTask: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Complete task
 */
export const completeTask = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { actualHours, notes } = req.body;

    // Get workspace
    const workspace = await ProjectTask.findOne({ projectId });
    if (!workspace) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    // Find task
    const task = workspace.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to the task or project owner
    const isProjectOwner = workspace.projectOwner.toString() === req.user._id.toString();
    const isTaskAssignee = task.assignedTo.toString() === req.user._id.toString();

    if (!isProjectOwner && !isTaskAssignee) {
      return res.status(403).json({ message: 'You can only complete tasks assigned to you' });
    }

    // Complete task
    workspace.completeTask(taskId, req.user._id);
    
    if (actualHours) {
      task.actualHours = actualHours;
    }

    if (notes) {
      workspace.addComment(taskId, req.user._id, `Task completed: ${notes}`);
    }

    await workspace.save();

    // Send notification to project owner
    if (!isProjectOwner) {
      try {
        await notificationService.sendNotification(workspace.projectOwner, 'task_completed', {
          projectTitle: workspace.projectId,
          taskTitle: task.title,
          completedBy: req.user.username,
          actualHours: actualHours || task.actualHours
        }, ['email', 'push']);
      } catch (notificationError) {
        logger.error(`[ProjectTask] Notification failed: ${notificationError.message}`);
      }
    }

    logger.info(`[ProjectTask] Completed task: ${taskId} in project: ${projectId}`);

    res.status(200).json({
      message: 'Task completed successfully',
      task
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in completeTask: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Add comment to task
 */
export const addTaskComment = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { content } = req.body;

    // Get workspace
    const workspace = await ProjectTask.findOne({ projectId });
    if (!workspace) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    // Find task
    const task = workspace.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is team member
    const isTeamMember = workspace.teamMembers.some(member => 
      member.userId.toString() === req.user._id.toString() && member.isActive
    );
    const isProjectOwner = workspace.projectOwner.toString() === req.user._id.toString();

    if (!isTeamMember && !isProjectOwner) {
      return res.status(403).json({ message: 'You must be a team member to add comments' });
    }

    // Add comment
    const comment = workspace.addComment(taskId, req.user._id, content);
    await workspace.save();

    // Send notification to task assignee and project owner
    const notifyUsers = [task.assignedTo];
    if (workspace.projectOwner.toString() !== task.assignedTo.toString()) {
      notifyUsers.push(workspace.projectOwner);
    }

    for (const userId of notifyUsers) {
      if (userId.toString() !== req.user._id.toString()) {
        try {
          await notificationService.sendNotification(userId, 'comment_added', {
            projectTitle: workspace.projectId,
            taskTitle: task.title,
            commentedBy: req.user.username,
            comment: content.substring(0, 100)
          }, ['email', 'push']);
        } catch (notificationError) {
          logger.error(`[ProjectTask] Notification failed: ${notificationError.message}`);
        }
      }
    }

    logger.info(`[ProjectTask] Added comment to task: ${taskId} in project: ${projectId}`);

    res.status(201).json({
      message: 'Comment added successfully',
      comment: comment.comments[comment.comments.length - 1]
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in addTaskComment: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Upload file to task
 */
export const uploadTaskFile = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { title, description, isPublic = true, tags = [] } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get workspace
    const workspace = await ProjectTask.findOne({ projectId });
    if (!workspace) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    // Find task
    const task = workspace.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const isProjectOwner = workspace.projectOwner.toString() === req.user._id.toString();
    const isTaskAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isTeamMember = workspace.teamMembers.some(member => 
      member.userId.toString() === req.user._id.toString() && member.isActive
    );

    if (!isProjectOwner && !isTaskAssignee && !isTeamMember) {
      return res.status(403).json({ message: 'You do not have permission to upload files to this task' });
    }

    // Add file to task
    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    task.attachments.push(fileData);

    // Add to project resources if public
    if (isPublic) {
      workspace.resources.push({
        title: title || req.file.originalname,
        description: description || '',
        type: getFileType(req.file.mimetype),
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        uploadedBy: req.user._id,
        isPublic: true,
        tags
      });
    }

    workspace.addActivityLog('file_uploaded', req.user._id, 'task', taskId, {
      filename: req.file.filename,
      originalName: req.file.originalname
    });

    await workspace.save();

    logger.info(`[ProjectTask] Uploaded file to task: ${taskId} in project: ${projectId}`);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileData
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in uploadTaskFile: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get user's tasks
 */
export const getUserTasks = async (req, res) => {
  try {
    const { status, priority, projectId } = req.query;

    let query = { 'tasks.assignedTo': req.user._id };

    if (status) {
      query['tasks.status'] = status;
    }
    if (priority) {
      query['tasks.priority'] = priority;
    }
    if (projectId) {
      query.projectId = projectId;
    }

    const workspaces = await ProjectTask.find(query)
      .populate('projectOwner', 'username email')
      .populate('tasks.assignedTo', 'username email')
      .populate('tasks.assignedBy', 'username email')
      .sort({ 'tasks.dueDate': 1 });

    // Extract tasks from workspaces
    const tasks = [];
    workspaces.forEach(workspace => {
      workspace.tasks.forEach(task => {
        if (task.assignedTo.toString() === req.user._id.toString()) {
          tasks.push({
            ...task.toObject(),
            projectTitle: workspace.projectId,
            projectOwner: workspace.projectOwner
          });
        }
      });
    });

    res.status(200).json({
      tasks,
      total: tasks.length
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in getUserTasks: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Get project statistics
 */
export const getProjectStatistics = async (req, res) => {
  try {
    const { projectId } = req.params;

    const workspace = await ProjectTask.findOne({ projectId });
    if (!workspace) {
      return res.status(404).json({ message: 'Project workspace not found' });
    }

    // Check access
    const isProjectOwner = workspace.projectOwner.toString() === req.user._id.toString();
    const isTeamMember = workspace.teamMembers.some(member => 
      member.userId.toString() === req.user._id.toString() && member.isActive
    );

    if (!isProjectOwner && !isTeamMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate additional statistics
    const taskStatusDistribution = {
      pending: workspace.tasks.filter(t => t.status === 'pending').length,
      in_progress: workspace.tasks.filter(t => t.status === 'in_progress').length,
      review: workspace.tasks.filter(t => t.status === 'review').length,
      completed: workspace.tasks.filter(t => t.status === 'completed').length,
      cancelled: workspace.tasks.filter(t => t.status === 'cancelled').length
    };

    const priorityDistribution = {
      low: workspace.tasks.filter(t => t.priority === 'low').length,
      medium: workspace.tasks.filter(t => t.priority === 'medium').length,
      high: workspace.tasks.filter(t => t.priority === 'high').length,
      urgent: workspace.tasks.filter(t => t.priority === 'urgent').length
    };

    const overdueTasks = workspace.tasks.filter(t => 
      t.status !== 'completed' && new Date() > new Date(t.dueDate)
    ).length;

    res.status(200).json({
      statistics: workspace.statistics,
      taskStatusDistribution,
      priorityDistribution,
      overdueTasks,
      activeTeamMembers: workspace.activeTeamMembers.length,
      totalFiles: workspace.resources.length,
      recentActivity: workspace.activityLog.slice(-10)
    });

  } catch (error) {
    logger.error(`[ProjectTask] Error in getProjectStatistics: ${error.message}`, error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

/**
 * Helper function to determine file type
 */
function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('javascript') || mimeType.includes('python') || 
      mimeType.includes('java') || mimeType.includes('cpp') || 
      mimeType.includes('html') || mimeType.includes('css')) return 'code';
  return 'document';
}
