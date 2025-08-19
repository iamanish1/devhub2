import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { CloseIcon, LockIcon } from "../../utils/iconUtils.jsx";

/**
 * Checkout-only version for Cashfree v3 SDK.
 * Assumes index.html includes:
 *   <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
 *
 * Flow:
 *  - Guard env + SDK presence
 *  - Require `payment_session_id` in paymentData.order (or `order_token` fallback)
 *  - Call cashfree.checkout({ paymentSessionId, redirectTarget: "_modal" })
 *  - Success/failure confirmed via webhook + optional GET from your backend
 */
const BidPaymentModal = ({ isOpen, onClose, paymentData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && paymentData && !initializedRef.current) {
      initializedRef.current = true;
      initializePayment();
    }
    return () => {
      initializedRef.current = false;
      setError("");
      setLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentData]);

  const initializePayment = async () => {
    setLoading(true);
    setError("");

    try {
      // Guards
      const appId = import.meta.env.VITE_CASHFREE_APP_ID;
      if (!appId) throw new Error("Cashfree App ID not configured");
      if (typeof window === "undefined" || typeof window.Cashfree === "undefined") {
        throw new Error("Cashfree SDK not loaded");
      }

      const order = paymentData?.order || {};
      const paymentSessionId = order.payment_session_id || order.order_token || null;
      if (!paymentSessionId) throw new Error("Missing payment session id");

      const mode = (import.meta.env.VITE_CASHFREE_MODE || "sandbox").toLowerCase();
      const cashfree = new window.Cashfree({ mode });

      // ✅ Checkout Modal (v3)
      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_modal", // or "_self" for full-page redirect
      });

      // From here, rely on your webhook + optional backend verification.
      // If you want optimistic UI, you can show a "processing" state here.

    } catch (err) {
      console.error("Payment init error:", err);
      const msg = err?.message || "Payment failed. Please try again.";
      setError(msg);
      onError?.(msg);
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
              <div className="text-xs text-gray-400">
                Includes bid amount + ₹9 fee
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">
                {!import.meta.env.VITE_CASHFREE_APP_ID
                  ? "Test Mode: Simulating payment..."
                  : "Opening secure payment..."}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Note: No Elements container needed for v3 Checkout */}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Your payment is secured by Cashfree's encryption
            </p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default BidPaymentModal;
