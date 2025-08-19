import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/paymentUtils';
import { getPaymentTypeDisplayName } from '../../utils/paymentUtils';

const PaymentSuccessModal = ({ 
  isOpen, 
  onClose, 
  paymentType, 
  amount, 
  transactionId,
  onContinue 
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15, stiffness: 300 }}
            className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", damping: 15, stiffness: 300 }}
              className="text-4xl"
            >
              ✅
            </motion.div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-300">
              Your {getPaymentTypeDisplayName(paymentType)} has been processed successfully.
            </p>
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
              {transactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Transaction ID:</span>
                  <span className="text-blue-400 text-sm font-mono">
                    {transactionId.slice(-8)}
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
            {onContinue && (
              <button
                onClick={onContinue}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            )}
          </motion.div>

          {/* Auto-close indicator */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-1 bg-blue-500 rounded-full mt-4"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentSuccessModal;
