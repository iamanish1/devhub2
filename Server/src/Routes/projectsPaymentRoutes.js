import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import {
  completeProject,
  getProjectBonusStatus,
  selectContributors
} from '../controller/projectsPaymentController.js';

const projectsPaymentRoutes = express.Router();

// Complete project and distribute bonus
projectsPaymentRoutes.post('/:id/complete', 
  authMiddleware, 
  completeProject
);

// Get project bonus status
projectsPaymentRoutes.get('/:id/bonus-status', 
  authMiddleware, 
  getProjectBonusStatus
);

// Select contributors for project
projectsPaymentRoutes.post('/:id/select-contributors', 
  authMiddleware, 
  selectContributors
);

export default projectsPaymentRoutes;
