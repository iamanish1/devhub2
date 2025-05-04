 import express from 'express';
import { createBid } from '../controller/BidingController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const biddingRoutes = express.Router();
biddingRoutes.post('/createBid/:projectId', authMiddleware, createBid); // Create a new bid for a project

export default biddingRoutes;