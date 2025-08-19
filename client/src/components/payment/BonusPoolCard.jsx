import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';
import { formatCurrency, calculateBonusPoolAmount } from '../../utils/paymentUtils';
import { PAYMENT_AMOUNTS } from '../../constants/paymentConstants';
import PaymentModal from './PaymentModal';

const BonusPoolCard = ({ projectId, currentPool = null }) => {
  const { bonusPools, bonusPoolsLoading } = usePayment();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contributorCount, setContributorCount] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);

  // Find the bonus pool for this project
  const bonusPool = currentPool || bonusPools.find(pool => pool.projectId === projectId);

  // Calculate total amount
  const totalAmount = calculateBonusPoolAmount(contributorCount);

  // Get payout status color
  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  if (bonusPoolsLoading) {
    return (
      <motion.div
        className="glass rounded-xl p-6 border border-gray-700"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-4"></div>
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className="glass rounded-xl p-6 border border-gray-700"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Bonus Pool</h3>
            <p className="text-gray-400 text-sm">Reward contributors for their work</p>
          </div>
          {bonusPool && (
            <div className="text-right">
              <div className="gradient-text text-xl font-bold">
                {formatCurrency(bonusPool.amount)}
              </div>
              <div className="text-xs text-gray-400">
                {bonusPool.contributorCount} contributors
              </div>
            </div>
          )}
        </div>

        {/* Current Pool Status */}
        {bonusPool ? (
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Amount:</span>
              <span className="text-white font-bold">
                {formatCurrency(bonusPool.amount)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Contributors:</span>
              <span className="text-white">
                {bonusPool.contributorCount}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Per Contributor:</span>
              <span className="text-white">
                {formatCurrency(bonusPool.amount / bonusPool.contributorCount)}
              </span>
            </div>
            
            {bonusPool.payoutStatus && (
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Payout Status:</span>
                <span className={`font-medium ${getPayoutStatusColor(bonusPool.payoutStatus)}`}>
                  {bonusPool.payoutStatus}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <div className="text-center mb-4">
              <div className="text-gray-400 text-sm mb-2">No bonus pool created yet</div>
              <p className="text-gray-400 text-xs">
                Create a bonus pool to reward contributors
              </p>
            </div>
          </div>
        )}

        {/* Calculator */}
        <div className="mb-4">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            {showCalculator ? 'Hide' : 'Show'} Calculator
          </button>
          
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Number of Contributors
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={contributorCount}
                  onChange={(e) => setContributorCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-300 text-sm">Per Contributor:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(PAYMENT_AMOUNTS.BONUS_PER_CONTRIBUTOR)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">Total Amount:</span>
                  <span className="gradient-text font-bold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {bonusPool ? (
            <>
              <button
                onClick={() => {
                  setContributorCount(bonusPool.contributorCount);
                  setShowPaymentModal(true);
                }}
                className="btn-primary flex-1"
              >
                Add More Funding
              </button>
              <button className="btn-secondary flex-1">
                View Details
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary w-full"
            >
              Create Bonus Pool
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              ₹{PAYMENT_AMOUNTS.BONUS_PER_CONTRIBUTOR} per contributor
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Contributors will receive equal shares from the bonus pool
            </p>
          </div>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentType="bonus_funding"
        projectId={projectId}
        contributorCount={contributorCount}
        onSuccess={(result) => {
          console.log('Bonus funding payment successful:', result);
          setShowPaymentModal(false);
        }}
      />
    </>
  );
};

export default BonusPoolCard;
