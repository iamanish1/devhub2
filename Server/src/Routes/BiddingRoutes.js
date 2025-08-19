 import express from 'express';
import { createBid, getBid, getUserBidStats } from '../controller/BidingController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const biddingRoutes = express.Router();
biddingRoutes.post('/createBid/:_id', authMiddleware, createBid); // Create a new bid for a project
biddingRoutes.get('/getBid/:_id', authMiddleware, getBid); // Get all bids for a project
biddingRoutes.get('/stats', authMiddleware, getUserBidStats); // Get user's bid statistics
export default biddingRoutes;