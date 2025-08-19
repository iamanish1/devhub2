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
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="glass rounded-xl p-8 border border-gray-700 shadow-2xl text-center">
              {/* Success Icon */}
              <motion.div
                className="mx-auto w-20 h-20 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full flex items-center justify-center mb-6"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={checkmarkVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-white text-3xl"
                >
                  ✓
                </motion.div>
              </motion.div>

              {/* Success Message */}
              <motion.h2
                className="text-2xl font-bold text-white mb-2"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                Payment Successful!
              </motion.h2>

              <motion.p
                className="text-gray-400 mb-6"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                Your {getPaymentTypeDisplayName(paymentType)} payment has been processed successfully.
              </motion.p>

              {/* Payment Details */}
              <motion.div
                className="bg-[#2A2A2A] rounded-lg p-4 mb-6"
                variants={detailsVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Amount:</span>
                    <span className="gradient-text font-bold text-lg">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  
                  {transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Transaction ID:</span>
                      <span className="text-white font-mono text-sm">
                        {transactionId.slice(-8)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Status:</span>
                    <span className="text-green-400 font-medium">Completed</span>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="flex gap-3"
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
              >
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                
                {onContinue && (
                  <button
                    onClick={onContinue}
                    className="btn-primary flex-1"
                  >
                    Continue
                  </button>
                )}
              </motion.div>

              {/* Auto-close notice */}
              <motion.p
                className="text-gray-500 text-xs mt-4"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                This window will close automatically in {countdown} seconds
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentSuccessModal;
