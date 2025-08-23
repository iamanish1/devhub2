import { logger } from '../utils/logger.js';

// Create payout to user's bank account
export const createPayout = async ({ userId, projectId, amount, provider = 'razorpay' }) => {
  try {
    // Validate provider
    if (provider !== 'razorpay') {
      throw new Error('Only Razorpay payouts are supported');
    }

    // Calculate fee (₹15 for amounts up to ₹10k)
    const fee = amount <= 10000 ? 15 : Math.round(amount * 0.015); // 1.5% for amounts > ₹10k
    const netAmount = amount - fee;

    logger.info('Creating payout', {
      userId,
      projectId,
      amount,
      fee,
      netAmount,
      provider
    });

    // Here you would integrate with Razorpay Payouts API
    // For now, we'll return a mock response
    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      payoutId,
      amount,
      fee,
      netAmount,
      status: 'pending',
      provider
    };

  } catch (error) {
    logger.error('Error creating payout', error);
    throw error;
  }
};

// Get payout status
export const getPayoutStatus = async (payoutId, provider = 'razorpay') => {
  try {
    logger.info('Getting payout status', { payoutId, provider });

    // Here you would call Razorpay Payouts API to get status
    // For now, we'll return a mock response
    return {
      payoutId,
      status: 'completed',
      provider
    };

  } catch (error) {
    logger.error('Error getting payout status', error);
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
