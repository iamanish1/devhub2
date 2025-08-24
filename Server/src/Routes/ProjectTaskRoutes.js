import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import upload from '../Middleware/upload.js';
import {
  createProjectWorkspace,
  getProjectWorkspace,
  createTask,
  updateTask,
  completeTask,
  addTaskComment,
  uploadTaskFile,
  getUserTasks,
  getProjectStatistics
} from '../controller/ProjectTaskController.js';

const projectTaskRoutes = express.Router();

// Create project workspace
projectTaskRoutes.post('/workspace/:projectId', authMiddleware, createProjectWorkspace);

// Get project workspace
projectTaskRoutes.get('/workspace/:projectId', authMiddleware, getProjectWorkspace);

// Create task
projectTaskRoutes.post('/:projectId/tasks', authMiddleware, createTask);

// Update task
projectTaskRoutes.put('/:projectId/tasks/:taskId', authMiddleware, updateTask);

// Complete task
projectTaskRoutes.post('/:projectId/tasks/:taskId/complete', authMiddleware, completeTask);

// Add comment to task
projectTaskRoutes.post('/:projectId/tasks/:taskId/comments', authMiddleware, addTaskComment);

// Upload file to task
projectTaskRoutes.post('/:projectId/tasks/:taskId/files', authMiddleware, upload.single('file'), uploadTaskFile);

// Get user's tasks
projectTaskRoutes.get('/user/tasks', authMiddleware, getUserTasks);

// Get project statistics
projectTaskRoutes.get('/:projectId/statistics', authMiddleware, getProjectStatistics);

export default projectTaskRoutes;
