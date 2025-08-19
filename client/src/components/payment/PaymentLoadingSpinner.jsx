import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentLoadingSpinner = ({ 
  isVisible, 
  message = "Processing payment...",
  showProgress = true 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Initializing payment...",
    "Validating details...",
    "Connecting to payment gateway...",
    "Processing transaction...",
    "Finalizing payment..."
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isVisible, steps.length]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
        >
          {/* Loading Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
            <p className="text-gray-300 text-sm">
              Please don't close this window or refresh the page
            </p>
          </div>

          {/* Progress Steps */}
          {showProgress && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                />
              </div>

              {/* Progress Percentage */}
              <div className="text-center">
                <span className="text-blue-400 font-semibold">{progress}%</span>
              </div>

              {/* Current Step */}
              <div className="bg-gray-700/50 rounded-lg p-3">
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white text-sm text-center"
                >
                  {steps[currentStep]}
                </motion.p>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-center space-x-2">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: index <= currentStep ? 1 : 0.5 }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <span>🔒</span>
              <span>Secure payment processing</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentLoadingSpinner;
