import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';
import { formatCurrency } from '../../utils/paymentUtils';
import { PAYMENT_AMOUNTS, SUBSCRIPTION_BENEFITS } from '../../constants/paymentConstants';
import PaymentModal from './PaymentModal';

const SubscriptionStatus = () => {
  const { subscription, hasActiveSubscription } = usePayment();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!subscription.expiresAt) return 0;
    const expiryDate = new Date(subscription.expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Get subscription status color
  const getStatusColor = () => {
    const daysRemaining = getDaysRemaining();
    if (daysRemaining === 0) return 'text-red-500';
    if (daysRemaining <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get subscription status text
  const getStatusText = () => {
    if (!subscription.isActive) return 'Inactive';
    const daysRemaining = getDaysRemaining();
    if (daysRemaining === 0) return 'Expired';
    if (daysRemaining <= 7) return 'Expiring Soon';
    return 'Active';
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
            <h3 className="text-lg font-semibold text-white">Premium Subscription</h3>
            <p className="text-gray-400 text-sm">Unlimited access to all features</p>
          </div>
          <div className={`text-right ${getStatusColor()}`}>
            <div className="text-sm font-medium">{getStatusText()}</div>
            {subscription.isActive && getDaysRemaining() > 0 && (
              <div className="text-xs">{getDaysRemaining()} days left</div>
            )}
          </div>
        </div>

        {/* Subscription Details */}
        {subscription.isActive ? (
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Plan:</span>
              <span className="text-white font-medium">
                {subscription.planType === 'monthly' ? 'Monthly' : 'Yearly'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Amount:</span>
              <span className="gradient-text font-bold">
                {formatCurrency(PAYMENT_AMOUNTS.SUBSCRIPTION)}/month
              </span>
            </div>
            
            {subscription.expiresAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Expires:</span>
                <span className="text-white">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Auto-renewal:</span>
              <span className={`font-medium ${subscription.autoRenew ? 'text-green-500' : 'text-red-500'}`}>
                {subscription.autoRenew ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="text-center mb-4">
              <div className="gradient-text text-3xl font-bold mb-2">
                {formatCurrency(PAYMENT_AMOUNTS.SUBSCRIPTION)}
                <span className="text-gray-400 text-lg">/month</span>
              </div>
              <p className="text-gray-400">Get unlimited access to all features</p>
            </div>
          </div>
        )}

        {/* Benefits Preview */}
        <div className="mb-4">
          <button
            onClick={() => setShowBenefits(!showBenefits)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            {showBenefits ? 'Hide' : 'Show'} Benefits
          </button>
          
          {showBenefits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              {SUBSCRIPTION_BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-300">{benefit}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {subscription.isActive ? (
            <>
              <button className="btn-secondary flex-1">
                Manage Subscription
              </button>
              <button className="btn-danger flex-1">
                Cancel Subscription
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary w-full"
            >
              Subscribe Now
            </button>
          )}
        </div>

        {/* Savings Calculator */}
        {!subscription.isActive && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Save money with subscription</p>
              <p className="text-white text-sm">
                Pay ₹9 per bid without subscription
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentType="subscription"
        onSuccess={(result) => {
          console.log('Subscription payment successful:', result);
          setShowPaymentModal(false);
        }}
      />
    </>
  );
};

export default SubscriptionStatus;
