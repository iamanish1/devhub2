import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { CloseIcon, LockIcon } from "../../utils/iconUtils.jsx";

const BidPaymentModal = ({ isOpen, onClose, paymentData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const containerRef = useRef(null);
  const cardRef = useRef(null);      // Cashfree card element
  const cashfreeRef = useRef(null);  // SDK instance
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && paymentData && !initializedRef.current) {
      initializedRef.current = true;
      initializePayment();
    }
    return () => {
      try {
        cardRef.current?.unmount?.();
      } catch {}
      if (containerRef.current) containerRef.current.innerHTML = "";
      initializedRef.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentData]);

  const initializePayment = async () => {
    setLoading(true);
    setError("");

    const appId = import.meta.env.VITE_CASHFREE_APP_ID;
    const mode = (import.meta.env.VITE_CASHFREE_MODE || "sandbox").toLowerCase();

    try {
      if (!appId) throw new Error("Cashfree App ID not configured");
      if (typeof window === "undefined" || typeof window.Cashfree === "undefined")
        throw new Error("Cashfree SDK not loaded");

      const order = paymentData?.order || {};
      const paymentSessionId = order.payment_session_id || order.order_token || null;
      if (!paymentSessionId) throw new Error("Missing payment session id");

      const cashfree = new window.Cashfree({ mode });
      cashfreeRef.current = cashfree;

      // ---- OPTION A: Checkout Modal (preferred & easiest) ----
      if (typeof cashfree.checkout === "function") {
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_modal", // "_self" to redirect full page
        });
        return;
      }

      // ---- OPTION B: Elements ----
      const container = containerRef.current || document.getElementById("cashfree-payment-container");
      if (!container) throw new Error("Payment container not found");
      container.innerHTML = "";

      if (typeof cashfree.create !== "function")
        throw new Error("Cashfree Elements API not available");

      const card = cashfree.create("card", {});
      cardRef.current = card;

      // Try selector mount first, fallback to DOM node
      try {
        card.mount("#cashfree-payment-container");
      } catch {
        if (!(container instanceof Element)) throw new Error("Container invalid");
        card.mount(container);
      }

      setReady(true); // enable "Pay Now" button
    } catch (err) {
      console.error("Payment init error:", err);
      setError(err.message || "Payment failed. Please try again.");
      onError?.(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setLoading(true);
      const order = paymentData?.order || {};
      const paymentSessionId = order.payment_session_id || order.order_token || null;

      const result = await cashfreeRef.current.pay({
        paymentSessionId,
        paymentMethod: cardRef.current,
        savePaymentInstrument: false,
      });
      onSuccess?.(result);
    } catch (e) {
      console.error("Cashfree pay error:", e);
      onError?.("Payment failed. Please try again.");
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
                {!import.meta.env.VITE_CASHFREE_APP_ID
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
          <div id="cashfree-payment-container" ref={containerRef} className="min-h-[300px]" />

          {/* Pay Now button (only when Elements is active) */}
          {ready && !loading && (
            <button
              onClick={handlePayNow}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Pay Now
            </button>
          )}

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
