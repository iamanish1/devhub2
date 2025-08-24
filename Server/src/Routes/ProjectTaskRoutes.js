import express from 'express';
import { checkWorkspaceAccess, getWorkspace, debugProjectAccess } from '../controller/ProjectTaskController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const projectTaskRoutes = express.Router();

// Check workspace access
projectTaskRoutes.get('/workspace/:projectId/check-access', authMiddleware, checkWorkspaceAccess);

// Get project workspace
projectTaskRoutes.get('/workspace/:projectId', authMiddleware, getWorkspace);

// Debug endpoint for project access
projectTaskRoutes.get('/debug/:projectId', authMiddleware, debugProjectAccess);

export default projectTaskRoutes;
