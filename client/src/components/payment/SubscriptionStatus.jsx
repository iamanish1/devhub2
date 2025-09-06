import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';
import { formatCurrency } from '../../utils/paymentUtils.jsx';
import { useSubscription } from '../../utils/subscriptionUtils';
import { PAYMENT_AMOUNTS, SUBSCRIPTION_BENEFITS } from '../../constants/paymentConstants';
import PaymentModal from './PaymentModal';
import PremiumBadge, { SubscriptionStatusBadge } from '../PremiumBadge';
import SubscriptionPerks from '../SubscriptionPerks';
import { CheckIcon } from '../../utils/iconUtils';

const SubscriptionStatus = () => {
  const { subscription } = usePayment();
  const { getDaysRemaining, isExpiringSoon, getStatusText } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  // Use subscription utilities for calculations
  const daysRemaining = getDaysRemaining();
  const expiringSoon = isExpiringSoon();

  // Get subscription status color
  const getStatusColor = () => {
    if (daysRemaining === 0) return 'text-red-500';
    if (expiringSoon) return 'text-yellow-500';
    return 'text-green-500';
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
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <motion.div
        className="glass rounded-2xl p-8 border border-gray-700 bg-gradient-to-br from-[#1a1a2e]/50 to-[#16213e]/50"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-white">Premium Subscription</h3>
              {subscription.isActive && (
                <PremiumBadge 
                  planName={subscription.planName || 'starter'}
                  planType={subscription.planType || 'monthly'}
                  size="medium"
                />
              )}
            </div>
            <p className="text-gray-400 text-base">Unlock unlimited access to all premium features</p>
          </div>
          <div className={`text-right ${getStatusColor()}`}>
            <div className="text-lg font-semibold">{getStatusText()}</div>
            {subscription.isActive && getDaysRemaining() > 0 && (
              <div className="text-sm opacity-80">{getDaysRemaining()} days remaining</div>
            )}
          </div>
        </div>

        {/* Subscription Details */}
        {subscription.isActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                  Plan Type:
                </span>
                <span className="text-white font-semibold capitalize">
                  {subscription.planName || 'Starter'} {subscription.planType || 'Monthly'}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Amount:
                </span>
                <span className="text-white font-bold">
                  {formatCurrency(PAYMENT_AMOUNTS.SUBSCRIPTION)}/{subscription.planType || 'month'}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {subscription.expiresAt && (
                <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                  <span className="text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Expires:
                  </span>
                  <span className="text-white font-medium">
                    {new Date(subscription.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Auto-renewal:
                </span>
                <span className={`font-semibold flex items-center gap-1 ${subscription.autoRenew ? 'text-green-400' : 'text-red-400'}`}>
                  {subscription.autoRenew ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Enabled
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                      </svg>
                      Disabled
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-6 p-6 bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 rounded-xl border border-[#00A8E8]/20">
            <div className="text-4xl font-bold bg-gradient-to-r from-[#00A8E8] to-[#0062E6] bg-clip-text text-transparent mb-2">
              {formatCurrency(PAYMENT_AMOUNTS.SUBSCRIPTION)}
              <span className="text-gray-400 text-xl">/month</span>
            </div>
            <p className="text-gray-300 text-lg">Get unlimited access to all premium features</p>
          </div>
        )}

        {/* Benefits Preview */}
        <div className="mb-6">
          <button
            onClick={() => setShowBenefits(!showBenefits)}
            className="flex items-center gap-2 text-[#00A8E8] hover:text-[#0096D6] font-medium transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${showBenefits ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {showBenefits ? 'Hide' : 'View'} Premium Benefits
          </button>
          
          {showBenefits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {SUBSCRIPTION_BENEFITS.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                  <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-3 h-3 text-green-400" />
                  </div>
                  <span className="text-gray-300 text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {subscription.isActive ? (
            <>
              <button 
                onClick={() => window.location.href = '/subscription'}
                className="flex-1 bg-[#00A8E8] hover:bg-[#0096D6] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Manage Subscription
              </button>
              <button className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
                Cancel Subscription
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0096D6] hover:to-[#0056CC] text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-[#00A8E8]/25 hover:shadow-[#00A8E8]/40 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Subscribe Now
            </button>
          )}
        </div>

        {/* Savings Calculator */}
        {!subscription.isActive && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <div className="text-center">
              <p className="text-green-400 text-sm font-medium mb-1">💰 Save money with subscription</p>
              <p className="text-gray-300 text-sm">
                Pay ₹9 per bid without subscription • Unlimited bids with premium
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Upgrade Options */}
      {!subscription.isActive && (
        <motion.div
          className="glass rounded-2xl p-6 border border-gray-700 bg-gradient-to-br from-[#1a1a2e]/30 to-[#16213e]/30"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <h4 className="text-lg font-semibold text-white mb-4">Quick Upgrade Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-600">
              <div className="text-2xl font-bold text-[#00A8E8] mb-1">₹99</div>
              <div className="text-gray-400 text-sm mb-2">Weekly</div>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#00A8E8]/20 hover:bg-[#00A8E8]/30 text-[#00A8E8] border border-[#00A8E8]/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Try Weekly
              </button>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-[#00A8E8]/10 to-[#0062E6]/10 rounded-lg border border-[#00A8E8]/30">
              <div className="text-2xl font-bold text-white mb-1">₹299</div>
              <div className="text-gray-400 text-sm mb-2">Monthly</div>
              <div className="text-green-400 text-xs mb-2">Most Popular</div>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#00A8E8] hover:bg-[#0096D6] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Subscribe
              </button>
            </div>
            <div className="text-center p-4 bg-gray-800/30 rounded-lg border border-gray-600">
              <div className="text-2xl font-bold text-[#00A8E8] mb-1">₹2,999</div>
              <div className="text-gray-400 text-sm mb-2">Yearly</div>
              <div className="text-green-400 text-xs mb-2">Save 17%</div>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#00A8E8]/20 hover:bg-[#00A8E8]/30 text-[#00A8E8] border border-[#00A8E8]/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Save More
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscription Perks */}
      <SubscriptionPerks className="mt-6" />

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
    </div>
  );
};

export default SubscriptionStatus;
