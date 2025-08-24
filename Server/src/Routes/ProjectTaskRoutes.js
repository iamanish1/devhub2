import express from 'express';
import { 
  checkWorkspaceAccess, 
  getWorkspace, 
  debugProjectAccess, 
  debugProjectBids,
  createTask,
  updateTask,
  completeTask,
  addTaskComment,
  uploadTaskFile,
  getUserTasks,
  getProjectStatistics,
  getTeamMembers,
  createWorkspace,
  updateWorkspace
} from '../controller/ProjectTaskController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import { upload } from '../Middleware/upload.js';

const projectTaskRoutes = express.Router();

// Workspace management
projectTaskRoutes.post('/workspace/:projectId', authMiddleware, createWorkspace);
projectTaskRoutes.get('/workspace/:projectId', authMiddleware, getWorkspace);
projectTaskRoutes.put('/workspace/:projectId', authMiddleware, updateWorkspace);
projectTaskRoutes.get('/workspace/:projectId/check-access', authMiddleware, checkWorkspaceAccess);

// Task management
projectTaskRoutes.post('/:projectId/tasks', authMiddleware, createTask);
projectTaskRoutes.put('/:projectId/tasks/:taskId', authMiddleware, updateTask);
projectTaskRoutes.post('/:projectId/tasks/:taskId/complete', authMiddleware, completeTask);
projectTaskRoutes.post('/:projectId/tasks/:taskId/comments', authMiddleware, addTaskComment);
projectTaskRoutes.post('/:projectId/tasks/:taskId/files', authMiddleware, upload.single('file'), uploadTaskFile);

// User and project data
projectTaskRoutes.get('/:projectId/statistics', authMiddleware, getProjectStatistics);
projectTaskRoutes.get('/:projectId/team', authMiddleware, getTeamMembers);
projectTaskRoutes.get('/user/tasks', authMiddleware, getUserTasks);

// Debug endpoints
projectTaskRoutes.get('/debug/:projectId', authMiddleware, debugProjectAccess);
projectTaskRoutes.get('/debug/:projectId/bids', authMiddleware, debugProjectBids);

export default projectTaskRoutes;
