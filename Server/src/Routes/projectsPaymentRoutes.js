import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import {
  completeProject,
  getProjectBonusStatus,
  selectContributors,
  getProjectBids
} from '../controller/projectsPaymentController.js';

const projectsPaymentRoutes = express.Router();

// Get all bids for a project (for owner to select contributors)
projectsPaymentRoutes.get('/:projectId/bids', 
  authMiddleware, 
  getProjectBids
);

// Select contributors for project
projectsPaymentRoutes.post('/:projectId/select-contributors', 
  authMiddleware, 
  selectContributors
);

// Complete project and distribute bonus
projectsPaymentRoutes.post('/:projectId/complete', 
  authMiddleware, 
  completeProject
);

// Get project bonus status
projectsPaymentRoutes.get('/:projectId/bonus-status', 
  authMiddleware, 
  getProjectBonusStatus
);

export default projectsPaymentRoutes;
