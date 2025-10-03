import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import {
  getUserAssignedProjects,
  getUserProjectStats,
  getProjectDetails,
  updateTaskStatus,
  refreshProjectStatus,
  debugProjectTasks,
  createTestInProgressTask,
  recalculateUserProfileStats,
  debugUserContributions,
  manualSyncContributions
} from '../controller/UserProjectsController.js';

const userProjectsRoutes = express.Router();

// Get user's assigned projects (where bid was accepted)
userProjectsRoutes.get('/assigned', authMiddleware, getUserAssignedProjects);

// Get user's project statistics
userProjectsRoutes.get('/stats', authMiddleware, getUserProjectStats);

// Get detailed project information with tasks
userProjectsRoutes.get('/details/:projectId', authMiddleware, getProjectDetails);

// Update task status (for user to mark tasks as completed)
userProjectsRoutes.put('/task/:taskId/status', authMiddleware, updateTaskStatus);

// Refresh project status (for testing/debugging)
userProjectsRoutes.get('/refresh-status/:projectId', authMiddleware, refreshProjectStatus);

// Debug project tasks (for troubleshooting)
userProjectsRoutes.get('/debug-tasks/:projectId', authMiddleware, debugProjectTasks);

// Debug user contributions (for troubleshooting)
userProjectsRoutes.get('/debug-contributions', authMiddleware, debugUserContributions);

// Manual sync contributions to Firebase
userProjectsRoutes.post('/manual-sync', authMiddleware, manualSyncContributions);

// Test endpoint to create In Progress task
userProjectsRoutes.post('/test-in-progress/:projectId', authMiddleware, createTestInProgressTask);

// Recalculate user profile statistics
userProjectsRoutes.post('/recalculate-stats', authMiddleware, recalculateUserProfileStats);

export default userProjectsRoutes;
