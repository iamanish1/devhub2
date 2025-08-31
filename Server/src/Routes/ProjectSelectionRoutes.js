import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import { adminAuthenticationMiddleware } from '../Middleware/AdminauthenticationMiddleware.js';
import {
  createProjectSelection,
  getProjectSelection,
  manualSelection,
  getRankedBidders,
  updateSelectionConfig,
  getProjectOwnerSelections,
  cancelSelection,
  getProjectTeamMembers
} from '../controller/ProjectSelectionController.js';

const projectSelectionRoutes = express.Router();

// Test route to verify routing is working
projectSelectionRoutes.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Project Selection routes are working',
    timestamp: new Date().toISOString(),
    routes: [
      'POST /:projectId/manual-selection',
      'GET /:projectId/ranked-bidders',
      'GET /:projectId/team-members',
      'GET /owner/selections'
    ]
  });
});

// Create project selection configuration
projectSelectionRoutes.post('/create/:projectId', authMiddleware, createProjectSelection);

// Get project selection configuration
projectSelectionRoutes.get('/:projectId', authMiddleware, getProjectSelection);

// Get team members for a project
projectSelectionRoutes.get('/:projectId/team-members', authMiddleware, getProjectTeamMembers);

// Manual selection of users
projectSelectionRoutes.post('/:projectId/manual-selection', authMiddleware, (req, res, next) => {
  console.log(` Manual selection route hit: ${req.params.projectId}`);
  next();
}, manualSelection);

// Get all selections for project owner (must come before :projectId routes)
projectSelectionRoutes.get('/owner/selections', authMiddleware, getProjectOwnerSelections);

// Get ranked bidders for manual selection
projectSelectionRoutes.get('/:projectId/ranked-bidders', authMiddleware, getRankedBidders);

// Update selection configuration
projectSelectionRoutes.put('/:projectId/config', authMiddleware, updateSelectionConfig);

// Cancel selection
projectSelectionRoutes.post('/:projectId/cancel', authMiddleware, cancelSelection);

export default projectSelectionRoutes;
