 import express from 'express';
import { createBid , getBid } from '../controller/BidingController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const biddingRoutes = express.Router();
biddingRoutes.post('/createBid/:_id', authMiddleware, createBid); // Create a new bid for a project
biddingRoutes.get('/getBid/:_id', authMiddleware, getBid); // Get all bids for a project
export default biddingRoutes;