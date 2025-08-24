import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import { adminAuthenticationMiddleware } from '../Middleware/AdminauthenticationMiddleware.js';
import {
  createProjectSelection,
  getProjectSelection,
  executeAutomaticSelection,
  manualSelection,
  getRankedBidders,
  updateSelectionConfig,
  getProjectOwnerSelections,
  cancelSelection
} from '../controller/ProjectSelectionController.js';

const projectSelectionRoutes = express.Router();

// Test route to verify routing is working
projectSelectionRoutes.get('/test', (req, res) => {
  res.status(200).json({ 
    message: 'Project Selection routes are working',
    timestamp: new Date().toISOString()
  });
});

// Create project selection configuration
projectSelectionRoutes.post('/create/:projectId', authMiddleware, createProjectSelection);

// Get project selection configuration
projectSelectionRoutes.get('/:projectId', authMiddleware, getProjectSelection);

// Execute automatic selection
projectSelectionRoutes.post('/:projectId/execute-automatic', authMiddleware, executeAutomaticSelection);

// Manual selection of users
projectSelectionRoutes.post('/:projectId/manual-selection', authMiddleware, manualSelection);

// Get ranked bidders for manual selection
projectSelectionRoutes.get('/:projectId/ranked-bidders', authMiddleware, getRankedBidders);

// Update selection configuration
projectSelectionRoutes.put('/:projectId/config', authMiddleware, updateSelectionConfig);

// Get all selections for project owner
projectSelectionRoutes.get('/owner/selections', authMiddleware, getProjectOwnerSelections);

// Cancel selection
projectSelectionRoutes.post('/:projectId/cancel', authMiddleware, cancelSelection);

export default projectSelectionRoutes;
