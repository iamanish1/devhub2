import express from 'express';
import authMiddleware from '../Middleware/authenticateMiddelware.js';
import {
  createEscrowWallet,
  lockUserFunds,
  releaseUserFunds,
  refundUserFunds,
  getEscrowWallet,
  getProjectOwnerEscrows,
  completeProject,
  getEscrowStats
} from '../controller/EscrowWalletController.js';

const escrowWalletRoutes = express.Router();

// Create escrow wallet for a project
escrowWalletRoutes.post('/create/:projectId', authMiddleware, createEscrowWallet);

// Lock user funds in escrow
escrowWalletRoutes.post('/:projectId/lock/:userId/:bidId', authMiddleware, lockUserFunds);

// Release user funds from escrow
escrowWalletRoutes.post('/:projectId/release/:userId/:bidId', authMiddleware, releaseUserFunds);

// Refund user funds
escrowWalletRoutes.post('/:projectId/refund/:userId/:bidId', authMiddleware, refundUserFunds);

// Get escrow wallet details
escrowWalletRoutes.get('/:projectId', authMiddleware, getEscrowWallet);

// Get all escrow wallets for project owner
escrowWalletRoutes.get('/owner/escrows', authMiddleware, getProjectOwnerEscrows);

// Complete project and release all funds
escrowWalletRoutes.post('/:projectId/complete', authMiddleware, completeProject);

// Get escrow statistics
escrowWalletRoutes.get('/owner/stats', authMiddleware, getEscrowStats);

export default escrowWalletRoutes;
