import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { CloseIcon, LockIcon } from "../../utils/iconUtils.jsx";

const BidPaymentModal = ({
  isOpen,
  onClose,
  paymentData,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const cardRef = useRef(null); // holds the Elements card instance
  const cashfreeRef = useRef(null); // holds the SDK instance

  useEffect(() => {
    if (isOpen && paymentData) initializePayment();
    // cleanup on close/unmount
    return () => {
      try {
        cardRef.current?.unmount?.();
      } catch {}
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentData]);

  const initializePayment = async () => {
    setLoading(true);
    setError("");

    const appId = import.meta.env.VITE_CASHFREE_APP_ID;
    const mode = (
      import.meta.env.VITE_CASHFREE_MODE || "sandbox"
    ).toLowerCase();

    try {
      // 1) Basic guards
      if (!appId) {
        setError("Cashfree App ID not configured");
        setLoading(false);
        return;
      }
      if (
        typeof window === "undefined" ||
        typeof window.Cashfree === "undefined"
      ) {
        setError("Cashfree SDK not loaded");
        setLoading(false);
        return;
      }

      // 2) Extract the *correct* token → paymentSessionId
      const order = paymentData?.order || {};
      const paymentSessionId =
        order.payment_session_id ||
        order.order_token || // some backends name it this way
        order.cf_order_id || // not ideal, but leaving as last fallback
        null;

      if (!paymentSessionId) {
        setError("Missing payment session id");
        setLoading(false);
        return;
      }

      // 3) Init SDK
      const cashfree = new window.Cashfree({ mode }); // "sandbox" | "production"
      cashfreeRef.current = cashfree;

      // ---- Option A: Hosted Checkout (recommended & easy) ----
      if (typeof cashfree.checkout === "function") {
        try {
          await cashfree.checkout({
            paymentSessionId,
            redirectTarget: "_modal", // or "_self" to redirect page
          });
          // Cashfree handles UI; result comes via redirect/webhook. You can still optimistically notify:
          return;
        } catch (e) {
          console.warn("Checkout fallback to Elements due to error:", e);
          // fall through to Elements
        }
      }

      // ---- Option B: Elements (create → mount → pay) ----
      // Ensure container exists in DOM
      const container =
        containerRef.current ||
        document.getElementById("cashfree-payment-container");
      if (!container) throw new Error("Payment container not found");

      // Clear container to avoid duplicate mounts
      container.innerHTML = "";

      if (typeof cashfree.create !== "function") {
        throw new Error(
          "Cashfree Elements API not available in this SDK build"
        );
      }

      // Create the card element and mount it into a REAL DOM node
      const card = cashfree.create("card", {
        // optional style/values config here
      });
      cardRef.current = card;
      card.mount(container); // ✅ pass DOM node (not a string without '#')

      // You control when to pay; here we auto-trigger once mounted.
      // Alternatively, attach to a "Pay" button click.
      try {
        const result = await cashfree.pay({
          paymentSessionId, // ✅ correct param
          paymentMethod: card, // pass the element instance
          savePaymentInstrument: false,
        });
        // Success callback
        onSuccess?.(result);
      } catch (payErr) {
        console.error("Cashfree pay error:", payErr);
        onError?.("Payment failed. Please try again.");
      }
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

          {/* Payment container for Elements (or left empty when using hosted checkout modal) */}
          <div
            id="cashfree-payment-container"
            ref={containerRef}
            className="min-h-[300px]"
          />

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
