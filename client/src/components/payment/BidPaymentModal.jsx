import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, LockIcon } from '../../utils/iconUtils.jsx';

const BidPaymentModal = ({ isOpen, onClose, paymentData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && paymentData) {
      initializePayment();
    }
  }, [isOpen, paymentData]);

  const initializePayment = async () => {
    console.log("Initializing payment with data:", paymentData);
    
    if (!window.Cashfree) {
      console.error("Cashfree SDK not loaded");
      setError('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cashfree = new window.Cashfree({
        mode: import.meta.env.VITE_CASHFREE_MODE || "sandbox"
      });

      console.log("Cashfree SDK loaded, creating payment config...");

      const paymentConfig = {
        orderToken: paymentData.order.order_token,
        orderNumber: paymentData.order.order_id,
        appId: import.meta.env.VITE_CASHFREE_APP_ID,
        orderAmount: paymentData.amount,
        orderCurrency: "INR",
        customerName: localStorage.getItem("username") || "User",
        customerEmail: localStorage.getItem("email") || "user@example.com",
        customerPhone: localStorage.getItem("phone") || "9999999999",
        orderNote: "Bid fee payment",
        source: "web",
        returnUrl: `${window.location.origin}?payment=success`,
        notifyUrl: `${import.meta.env.VITE_API_URL}/api/webhooks/cashfree`
      };

      console.log("Payment config:", paymentConfig);

      const result = await cashfree.init(paymentConfig);
      console.log("Payment result:", result);
      
      if (result.transaction.status === "SUCCESS") {
        onSuccess(result);
      } else {
        onError("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError("Payment failed. Please try again.");
      onError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-blue-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center text-blue-300 mb-2">
              <LockIcon className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <div className="text-white">
              <div className="flex justify-between mb-1">
                <span>Bid Fee:</span>
                <span>₹{paymentData?.amount || 9}</span>
              </div>
              <div className="text-xs text-gray-400">
                Powered by Cashfree
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Initializing payment gateway...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Payment Gateway Container */}
          <div id="cashfree-payment-container" className="min-h-[300px]">
            {/* Cashfree will render the payment form here */}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Your payment is secured by Cashfree's encryption
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BidPaymentModal;
