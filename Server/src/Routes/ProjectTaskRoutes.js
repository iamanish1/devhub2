import express from 'express';
import { checkWorkspaceAccess, getWorkspace, debugProjectAccess, debugProjectBids } from '../controller/ProjectTaskController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const projectTaskRoutes = express.Router();

// Check workspace access
projectTaskRoutes.get('/workspace/:projectId/check-access', authMiddleware, checkWorkspaceAccess);

// Get project workspace
projectTaskRoutes.get('/workspace/:projectId', authMiddleware, getWorkspace);

// Debug endpoint for project access
projectTaskRoutes.get('/debug/:projectId', authMiddleware, debugProjectAccess);

// Debug endpoint for project bids
projectTaskRoutes.get('/debug/:projectId/bids', authMiddleware, debugProjectBids);

export default projectTaskRoutes;
