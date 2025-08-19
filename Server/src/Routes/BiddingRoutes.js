import express from 'express';
import { createBid, getBid, getUserBidStats } from '../controller/BidingController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const biddingRoutes = express.Router();

biddingRoutes.post('/createBid/:id', authMiddleware, createBid);
biddingRoutes.get('/getBid/:id', authMiddleware, getBid);
biddingRoutes.get('/stats', authMiddleware, getUserBidStats); // Get user's bid statistics

export default biddingRoutes;