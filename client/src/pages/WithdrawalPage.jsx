import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import { PaymentModal } from '../components/payment/PaymentModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  PAYMENT_TYPES, 
  PAYMENT_AMOUNTS, 
  PAYMENT_STATUS 
} from '../constants/paymentConstants';
import { 
  formatCurrency, 
  getPaymentStatusColor, 
  getPaymentStatusIcon, 
  formatPaymentDate,
  calculateWithdrawalFee,
  calculateTotalWithdrawalAmount,
  validateWithdrawalAmount
} from '../utils/paymentUtils';

const WithdrawalPage = () => {
  const { 
    withdrawalHistory, 
    isProcessing, 
    refreshData,
    startPayment,
    completePayment,
    handlePaymentError 
  } = usePayment();

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    refreshData();
    // Calculate available balance (this would come from your backend)
    // For now, we'll simulate it
    setAvailableBalance(5000);
  }, [refreshData]);

  const handleWithdrawalAmountChange = (e) => {
    const amount = parseFloat(e.target.value) || 0;
    setWithdrawalAmount(amount);
    setValidationError('');
  };

  const handleWithdrawal = async () => {
    const validation = validateWithdrawalAmount(withdrawalAmount, availableBalance);
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    try {
      await startPayment(PAYMENT_TYPES.WITHDRAWAL_FEE, {
        amount: withdrawalAmount,
        fee: calculateWithdrawalFee(withdrawalAmount),
        totalAmount: calculateTotalWithdrawalAmount(withdrawalAmount)
      });
      setShowWithdrawalModal(true);
    } catch (error) {
      handlePaymentError(error);
    }
  };

  const withdrawalFee = calculateWithdrawalFee(withdrawalAmount);
  const totalAmount = calculateTotalWithdrawalAmount(withdrawalAmount);
  const validation = validateWithdrawalAmount(withdrawalAmount, availableBalance);

  const pendingWithdrawals = withdrawalHistory?.filter(w => w.status === PAYMENT_STATUS.PENDING) || [];
  const completedWithdrawals = withdrawalHistory?.filter(w => w.status === PAYMENT_STATUS.SUCCESS) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Withdrawals</h1>
          <p className="text-gray-300">Withdraw your earnings and manage your balance</p>
        </div>

        {/* Balance and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Balance</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(availableBalance)}</p>
              </div>
              <div className="text-green-400 text-2xl">💰</div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Withdrawn</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(completedWithdrawals.reduce((sum, w) => sum + w.amount, 0))}
                </p>
              </div>
              <div className="text-blue-400 text-2xl">💳</div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-white">{pendingWithdrawals.length}</p>
              </div>
              <div className="text-yellow-400 text-2xl">⏳</div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Withdrawal Fee</p>
                <p className="text-2xl font-bold text-white">₹15</p>
              </div>
              <div className="text-red-400 text-2xl">💸</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Request Withdrawal</h2>
            
            <div className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={handleWithdrawalAmountChange}
                    placeholder="0.00"
                    min="0"
                    max={PAYMENT_AMOUNTS.WITHDRAWAL_MAX}
                    className="w-full bg-gray-700 text-white px-8 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {validationError && (
                  <p className="text-red-400 text-sm mt-1">{validationError}</p>
                )}
              </div>

              {/* Fee Breakdown */}
              {withdrawalAmount > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-3">Fee Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-300">
                      <span>Withdrawal Amount:</span>
                      <span>{formatCurrency(withdrawalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Withdrawal Fee:</span>
                      <span>{formatCurrency(withdrawalFee)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 flex justify-between text-white font-semibold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Amount Buttons */}
              <div>
                <p className="text-gray-300 text-sm font-medium mb-3">Quick Amounts</p>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setWithdrawalAmount(amount)}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                    >
                      ₹{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdrawal Button */}
              <button
                onClick={handleWithdrawal}
                disabled={!validation.isValid || isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Request Withdrawal'}
              </button>

              {/* Terms */}
              <div className="text-gray-400 text-sm">
                <p>• Maximum withdrawal: ₹{PAYMENT_AMOUNTS.WITHDRAWAL_MAX.toLocaleString()}</p>
                <p>• Withdrawal fee: ₹{PAYMENT_AMOUNTS.WITHDRAWAL_FEE}</p>
                <p>• Processing time: 2-5 business days</p>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Withdrawal History</h2>
            
            {isProcessing ? (
              <LoadingSpinner />
            ) : withdrawalHistory?.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {withdrawalHistory.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getPaymentStatusColor(withdrawal.status)}`}>
                          {getPaymentStatusIcon(withdrawal.status)}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            Withdrawal #{withdrawal.id.slice(-8)}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {formatPaymentDate(withdrawal.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatCurrency(withdrawal.amount)}</p>
                        <p className={`text-sm ${getPaymentStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </p>
                      </div>
                    </div>
                    
                    {/* Additional Details */}
                    {withdrawal.fee && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>Fee:</span>
                          <span>{formatCurrency(withdrawal.fee)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">💳</div>
                <p className="text-gray-400 text-lg mb-2">No withdrawal history</p>
                <p className="text-gray-500">Your withdrawal requests will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <PaymentModal
            paymentType={PAYMENT_TYPES.WITHDRAWAL_FEE}
            isOpen={showWithdrawalModal}
            onClose={() => setShowWithdrawalModal(false)}
            customAmount={withdrawalAmount}
            onSuccess={() => {
              setWithdrawalAmount('');
              setShowWithdrawalModal(false);
              refreshData();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WithdrawalPage;
