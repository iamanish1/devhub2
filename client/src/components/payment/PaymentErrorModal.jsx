import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/paymentUtils';
import { getPaymentTypeDisplayName } from '../../utils/paymentUtils';

const PaymentErrorModal = ({ 
  isOpen, 
  onClose, 
  onRetry,
  paymentType, 
  amount, 
  error,
  errorCode 
}) => {
  if (!isOpen) return null;

  const getErrorMessage = (code) => {
    switch (code) {
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient funds in your account. Please check your balance and try again.';
      case 'PAYMENT_DECLINED':
        return 'Your payment was declined by the bank. Please check your payment method and try again.';
      case 'NETWORK_ERROR':
        return 'Network connection error. Please check your internet connection and try again.';
      case 'TIMEOUT':
        return 'Payment request timed out. Please try again.';
      case 'INVALID_AMOUNT':
        return 'Invalid payment amount. Please enter a valid amount and try again.';
      default:
        return error || 'An unexpected error occurred. Please try again.';
    }
  };

  const getErrorIcon = (code) => {
    switch (code) {
      case 'INSUFFICIENT_FUNDS':
        return '💰';
      case 'PAYMENT_DECLINED':
        return '💳';
      case 'NETWORK_ERROR':
        return '🌐';
      case 'TIMEOUT':
        return '⏰';
      case 'INVALID_AMOUNT':
        return '⚠️';
      default:
        return '❌';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 300 }}
            className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", damping: 15, stiffness: 300 }}
              className="text-4xl"
            >
              {getErrorIcon(errorCode)}
            </motion.div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
            <p className="text-gray-300 mb-4">
              Your {getPaymentTypeDisplayName(paymentType)} could not be processed.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                {getErrorMessage(errorCode)}
              </p>
            </div>
          </motion.div>

          {/* Payment Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-700/50 rounded-xl p-4 mb-6"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold text-lg">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">
                  {getPaymentTypeDisplayName(paymentType)}
                </span>
              </div>
              {errorCode && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Error Code:</span>
                  <span className="text-red-400 text-sm font-mono">
                    {errorCode}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            )}
          </motion.div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-center"
          >
            <p className="text-gray-400 text-sm">
              Need help? Contact our support team
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentErrorModal;
