import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { CloseIcon, LockIcon } from "../../utils/iconUtils.jsx";

const RazorpayPaymentModal = ({ isOpen, onClose, paymentData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const containerRef = useRef(null);
  const razorpayRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && paymentData && !initializedRef.current) {
      initializedRef.current = true;
      initializePayment();
    }
    return () => {
      try {
        if (razorpayRef.current) {
          razorpayRef.current.close();
        }
      } catch {
        // Ignore unmount errors
      }
      if (containerRef.current) containerRef.current.innerHTML = "";
      initializedRef.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentData]);

  const initializePayment = async () => {
    setLoading(true);
    setError("");

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const mode = (import.meta.env.VITE_RAZORPAY_MODE || "test").toLowerCase();

    try {
      if (!keyId) throw new Error("Razorpay Key ID not configured");
      if (typeof window === "undefined" || typeof window.Razorpay === "undefined")
        throw new Error("Razorpay SDK not loaded");

      const order = paymentData?.order || {};
      const orderId = order.order_id || order.payment_session_id || null;
      if (!orderId) throw new Error("Missing order ID");

      console.log("🔧 Initializing Razorpay SDK with mode:", mode);

      // Create Razorpay options
      const options = {
        key: keyId,
        amount: Math.round(paymentData?.amount * 100), // Convert to paise
        currency: "INR",
        name: "DeveloperProduct",
        description: "Payment for " + (paymentData?.purpose || "service"),
        order_id: orderId,
        handler: function (response) {
          console.log("✅ Payment success:", response);
          onSuccess?.(response);
        },
        prefill: {
          name: localStorage.getItem("username") || "User",
          email: localStorage.getItem("email") || order.customer_details?.customer_email || "user@example.com",
          contact: localStorage.getItem("phone") || order.customer_details?.customer_phone || "9999999999"
        },
        notes: {
          orderId: orderId,
          purpose: paymentData?.purpose || "payment"
        },
        theme: {
          color: "#3b82f6"
        },
        modal: {
          ondismiss: function() {
            console.log("🔒 Payment modal dismissed");
            onClose?.();
          }
        }
      };

      // Create Razorpay instance
      const razorpay = new window.Razorpay(options);
      razorpayRef.current = razorpay;

      console.log("🔧 Razorpay instance created:", razorpay);

      // Open the payment modal
      razorpay.open();
      setReady(true);

    } catch (err) {
      console.error("Payment init error:", err);
      setError(err.message || "Payment failed. Please try again.");
      onError?.(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-blue-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Complete Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
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
                <span>Total Payment:</span>
                <span>₹{paymentData?.amount || 9}</span>
              </div>
              <div className="text-xs text-gray-400">Includes bid amount + ₹9 fee</div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">
                {!import.meta.env.VITE_RAZORPAY_KEY_ID
                  ? "Test Mode: Simulating payment..."
                  : "Loading payment form..."}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Container for Elements */}
          <div id="razorpay-payment-container" ref={containerRef} className="min-h-[300px]" />

          {/* Pay Now button (only when Elements is active) */}
          {ready && !loading && (
            <button
              onClick={() => razorpayRef.current?.open()}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Pay Now
            </button>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Your payment is secured by Razorpay's encryption
            </p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default RazorpayPaymentModal;
