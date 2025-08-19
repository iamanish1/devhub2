import express from 'express';
import { createBid, getBid, getUserBidStats } from '../controller/BidingController.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const biddingRoutes = express.Router();

// Test endpoint to check authentication
biddingRoutes.get('/test-auth', authMiddleware, (req, res) => {
  res.status(200).json({ 
    message: "Authentication successful", 
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

biddingRoutes.post('/createBid/:_id',  createBid);
biddingRoutes.get('/getBid/:_id', authMiddleware, getBid);
biddingRoutes.get('/stats', authMiddleware, getUserBidStats); // Get user's bid statistics

export default biddingRoutes;