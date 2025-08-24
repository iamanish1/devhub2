import express from 'express';
import { 
  checkWorkspaceAccess, 
  getWorkspace, 
  debugProjectAccess, 
  debugProjectBids,
  createTask,
  updateTask,
  deleteTask,
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
import upload from '../Middleware/upload.js';

const projectTaskRoutes = express.Router();

// Test endpoint to verify route is working
projectTaskRoutes.get('/test', (req, res) => {
  res.json({ message: 'Project task routes are working' });
});

// Test endpoint for task creation (without auth for debugging)
projectTaskRoutes.post('/test-task/:projectId', (req, res) => {
  console.log('🔍 Test task endpoint hit');
  console.log('🔍 Project ID:', req.params.projectId);
  console.log('🔍 Request body:', req.body);
  res.json({ 
    message: 'Test task endpoint working',
    projectId: req.params.projectId,
    body: req.body
  });
});

// User-specific routes (must come before parameterized routes)
projectTaskRoutes.get('/user/tasks', authMiddleware, getUserTasks);

// Workspace management
projectTaskRoutes.post('/workspace/:projectId', authMiddleware, createWorkspace);
projectTaskRoutes.get('/workspace/:projectId', authMiddleware, getWorkspace);
projectTaskRoutes.put('/workspace/:projectId', authMiddleware, updateWorkspace);
projectTaskRoutes.get('/workspace/:projectId/check-access', authMiddleware, checkWorkspaceAccess);

// Task management
projectTaskRoutes.post('/:projectId/tasks', authMiddleware, createTask);
projectTaskRoutes.put('/:projectId/tasks/:taskId', authMiddleware, updateTask);
projectTaskRoutes.delete('/:projectId/tasks/:taskId', authMiddleware, deleteTask);
projectTaskRoutes.post('/:projectId/tasks/:taskId/complete', authMiddleware, completeTask);
projectTaskRoutes.post('/:projectId/tasks/:taskId/comments', authMiddleware, addTaskComment);
projectTaskRoutes.post('/:projectId/tasks/:taskId/files', authMiddleware, upload.single('file'), uploadTaskFile);

// Project-specific routes
projectTaskRoutes.get('/:projectId/statistics', authMiddleware, getProjectStatistics);
projectTaskRoutes.get('/:projectId/team', authMiddleware, getTeamMembers);

// Debug endpoints
projectTaskRoutes.get('/debug/:projectId', authMiddleware, debugProjectAccess);
projectTaskRoutes.get('/debug/:projectId/bids', authMiddleware, debugProjectBids);

export default projectTaskRoutes;
