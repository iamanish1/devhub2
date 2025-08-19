import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';

const PaymentMethodManager = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock payment methods data (replace with actual API calls)
  const mockPaymentMethods = [
    {
      id: '1',
      type: 'card',
      provider: 'cashfree',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: '12',
      expiryYear: '2025',
      isDefault: true,
      name: 'John Doe'
    },
    {
      id: '2',
      type: 'upi',
      provider: 'razorpay',
      upiId: 'john.doe@okicici',
      isDefault: false,
      name: 'John Doe'
    }
  ];

  useEffect(() => {
    // Load payment methods
    setPaymentMethods(mockPaymentMethods);
  }, []);

  const handleAddMethod = async (methodData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMethod = {
        id: Date.now().toString(),
        ...methodData,
        isDefault: paymentMethods.length === 0
      };
      
      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding payment method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (methodId) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      );
    } catch (error) {
      console.error('Error setting default method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (type, brand) => {
    switch (type) {
      case 'card':
        return brand === 'Visa' ? '💳' : '💳';
      case 'upi':
        return '📱';
      case 'netbanking':
        return '🏦';
      case 'wallet':
        return '👛';
      default:
        return '💳';
    }
  };

  const getMethodDisplayName = (method) => {
    if (method.type === 'card') {
      return `${method.brand} •••• ${method.last4}`;
    } else if (method.type === 'upi') {
      return `UPI - ${method.upiId}`;
    }
    return method.type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl">
                  {getMethodIcon(method.type, method.brand)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">
                      {getMethodDisplayName(method)}
                    </h3>
                    {method.isDefault && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {method.name} • {method.provider}
                  </p>
                  {method.type === 'card' && (
                    <p className="text-gray-500 text-xs">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    disabled={isLoading}
                    className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDeleteMethod(method.id)}
                  disabled={isLoading}
                  className="text-red-400 hover:text-red-300 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {paymentMethods.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💳</div>
            <p className="text-gray-400 text-lg mb-2">No payment methods</p>
            <p className="text-gray-500">Add a payment method to get started</p>
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Payment Method</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <AddPaymentMethodForm
                onSubmit={handleAddMethod}
                onCancel={() => setShowAddForm(false)}
                isLoading={isLoading}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Add Payment Method Form Component
const AddPaymentMethodForm = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    type: 'card',
    provider: 'cashfree',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
    upiId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Type Selection */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Payment Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'card' }))}
            className={`p-3 rounded-lg border transition-all ${
              formData.type === 'card'
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-white font-medium">💳 Card</div>
          </button>
          
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'upi' }))}
            className={`p-3 rounded-lg border transition-all ${
              formData.type === 'upi'
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-white font-medium">📱 UPI</div>
          </button>
        </div>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Payment Provider
        </label>
        <select
          name="provider"
          value={formData.provider}
          onChange={handleInputChange}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="cashfree">Cashfree</option>
          <option value="razorpay">Razorpay</option>
        </select>
      </div>

      {/* Card Fields */}
      {formData.type === 'card' && (
        <>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Card Number
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              maxLength="19"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Month
              </label>
              <input
                type="text"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={handleInputChange}
                placeholder="MM"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength="2"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Year
              </label>
              <input
                type="text"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={handleInputChange}
                placeholder="YY"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength="2"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                placeholder="123"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength="4"
              />
            </div>
          </div>
        </>
      )}

      {/* UPI Fields */}
      {formData.type === 'upi' && (
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            UPI ID
          </label>
          <input
            type="text"
            name="upiId"
            value={formData.upiId}
            onChange={handleInputChange}
            placeholder="username@bank"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Name Field */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add Method'}
        </button>
      </div>
    </form>
  );
};

export default PaymentMethodManager;
