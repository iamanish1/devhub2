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
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
        );
      case 'PAYMENT_DECLINED':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
          </svg>
        );
      case 'NETWORK_ERROR':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
      case 'TIMEOUT':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'INVALID_AMOUNT':
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: {
      y: "-100vh",
      opacity: 0,
    },
    visible: {
      y: "0",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
    exit: {
      y: "-100vh",
      opacity: 0,
    },
  };

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const iconInnerVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const detailsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

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
              {/* Error Icon */}
              <motion.div
                className="mx-auto w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={iconInnerVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-white text-3xl"
                >
                  {getErrorIcon()}
                </motion.div>
              </motion.div>

              {/* Error Message */}
              <motion.h2
                className="text-2xl font-bold text-white mb-2"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                Payment Failed
              </motion.h2>

              <motion.p
                className="text-gray-400 mb-6"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                {getErrorMessage()}
              </motion.p>

              {/* Error Details */}
              <motion.div
                className="bg-[#2A2A2A] rounded-lg p-4 mb-6"
                variants={detailsVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-white font-bold">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Type:</span>
                    <span className="text-white">
                      {getPaymentTypeDisplayName(paymentType)}
                    </span>
                  </div>
                  
                  {errorCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Error Code:</span>
                      <span className="text-red-400 font-mono text-sm">
                        {errorCode}
                      </span>
                    </div>
                  )}
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
                
                <button
                  onClick={onRetry}
                  className="btn-primary flex-1"
                >
                  Try Again
                </button>
              </motion.div>

              {/* Help Text */}
              <motion.p
                className="text-gray-500 text-xs mt-4"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                If the problem persists, please contact support
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentErrorModal;
