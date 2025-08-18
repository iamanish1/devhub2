import { logger } from '../utils/logger.js';
import Payout from '../Model/PayoutModel.js';

export const createPayout = async ({ userId, projectId, amount, provider = 'cashfree' }) => {
  try {
    const payout = new Payout({
      provider,
      userId,
      projectId,
      amount,
      feeApplied: calculatePayoutFee(amount, provider),
      status: 'queued'
    });

    await payout.save();
    
    logger.info('Payout created', { 
      payoutId: payout._id, 
      userId, 
      amount, 
      provider 
    });
    
    return payout;
  } catch (error) {
    logger.error('Error creating payout', error);
    throw error;
  }
};

export const processPayout = async (payoutId) => {
  try {
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      throw new Error('Payout not found');
    }

    // Here you would integrate with Cashfree Payouts or RazorpayX
    // For now, we'll simulate processing
    payout.status = 'processed';
    payout.externalId = `ext_${Date.now()}`;
    await payout.save();
    
    logger.info('Payout processed', { 
      payoutId: payout._id, 
      externalId: payout.externalId 
    });
    
    return payout;
  } catch (error) {
    logger.error('Error processing payout', error);
    throw error;
  }
};

export const getPayoutsByUser = async (userId) => {
  try {
    const payouts = await Payout.find({ userId })
      .populate('projectId', 'project_Title')
      .sort({ createdAt: -1 });
    
    return payouts;
  } catch (error) {
    logger.error('Error fetching user payouts', error);
    throw error;
  }
};

export const getPayoutStats = async (userId) => {
  try {
    const stats = await Payout.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    return stats;
  } catch (error) {
    logger.error('Error fetching payout stats', error);
    throw error;
  }
};

const calculatePayoutFee = (amount, provider) => {
  // Calculate platform fee based on provider and amount
  const baseFee = 5; // ₹5 base fee
  const percentageFee = amount * 0.02; // 2% fee
  return Math.min(baseFee + percentageFee, 50); // Cap at ₹50
};
