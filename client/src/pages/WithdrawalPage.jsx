import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import PaymentModal from '../components/payment/PaymentModal';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '../components/NavBar';
import escrowWalletApi from '../services/escrowWalletApi';
import notificationService from '../services/notificationService';
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
} from '../utils/paymentUtils.jsx';

const WithdrawalPage = () => {
  const { 
    withdrawalHistory, 
    isProcessing, 
    refreshData
  } = usePayment();

  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user balance from API
  const fetchUserBalance = async () => {
    try {
      setLoading(true);
      const balanceData = await escrowWalletApi.getUserBalance();
      setAvailableBalance(balanceData.balance?.available || 0);
      setTotalEarnings(balanceData.balance?.total || 0);
      setPendingBalance(balanceData.balance?.pending || 0);
    } catch (error) {
      console.error('Error fetching user balance:', error);
      notificationService.error('Failed to fetch balance information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBalance();
    refreshData();
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
      // Use the new balance withdrawal API
      await escrowWalletApi.requestBalanceWithdrawal(
        withdrawalAmount,
        'bank_transfer'
      );
      
      notificationService.success('Withdrawal request submitted successfully');
      
      // Refresh balance data
      await fetchUserBalance();
      
      // Clear form
      setWithdrawalAmount('');
      setShowWithdrawalModal(false);
      
    } catch (error) {
      console.error('Withdrawal error:', error);
      const errorMessage = error.message || "Failed to process withdrawal request";
      setValidationError(errorMessage);
      notificationService.error(errorMessage);
    }
  };

  const withdrawalFee = calculateWithdrawalFee(withdrawalAmount);
  const totalAmount = calculateTotalWithdrawalAmount(withdrawalAmount);
  const validation = validateWithdrawalAmount(withdrawalAmount, availableBalance);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 mt-[5vmin]">
          <h1 className="text-4xl font-bold text-white mb-2">Withdrawals</h1>
          <p className="text-gray-300">Withdraw your earnings and manage your balance</p>
        </div>

        {/* Balance and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Balance</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(availableBalance)}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(pendingBalance)}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Withdrawal Fee</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(PAYMENT_AMOUNTS.WITHDRAWAL_FEE)}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="glass rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Request Withdrawal</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Withdrawal Amount
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount (max ₹10,000)"
                    value={withdrawalAmount}
                    onChange={handleWithdrawalAmountChange}
                    className="w-full bg-[#1E1E1E] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
                    max={PAYMENT_AMOUNTS.WITHDRAWAL_MAX}
                    min={PAYMENT_AMOUNTS.WITHDRAWAL_MIN}
                  />
                  {validationError && (
                    <p className="text-red-400 text-sm mt-1">{validationError}</p>
                  )}
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Quick Amounts
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[500, 1000, 2000, 5000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setWithdrawalAmount(amount)}
                        className="bg-[#2A2A2A] hover:bg-[#333] text-white px-4 py-2 rounded-lg border border-gray-600 transition-colors"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleWithdrawal}
                  disabled={!validation.isValid || isProcessing || availableBalance === 0}
                  className="w-full btn-primary disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : availableBalance === 0 ? 'No Available Balance' : 'Request Withdrawal'}
                </button>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div>
              <div className="bg-[#2A2A2A] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Fee Breakdown</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Requested Amount:</span>
                    <span className="text-white font-medium">
                      {withdrawalAmount ? formatCurrency(withdrawalAmount) : '₹0'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Withdrawal Fee (Deducted):</span>
                    <span className="text-red-400 font-medium">
                      -{formatCurrency(withdrawalFee)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-600 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">You Will Receive:</span>
                      <span className="gradient-text font-bold text-lg">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-[#1E1E1E] rounded-lg">
                  <h4 className="text-white font-medium mb-2">Important Notes:</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    <li>• Maximum withdrawal: {formatCurrency(PAYMENT_AMOUNTS.WITHDRAWAL_MAX)}</li>
                    <li>• Fixed fee: {formatCurrency(PAYMENT_AMOUNTS.WITHDRAWAL_FEE)} deducted per withdrawal</li>
                    <li>• Processing time: 2-5 business days</li>
                    <li>• Minimum withdrawal: {formatCurrency(PAYMENT_AMOUNTS.WITHDRAWAL_MIN)}</li>
                    <li>• Fee is automatically deducted from your withdrawal amount</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Withdrawal History</h2>

          {isProcessing ? (
            <LoadingSpinner />
          ) : withdrawalHistory?.length > 0 ? (
            <div className="space-y-4">
              {withdrawalHistory.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="bg-[#2A2A2A] rounded-lg p-6 border border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${getPaymentStatusColor(withdrawal.status)}`}>
                        {getPaymentStatusIcon(withdrawal.status)}
                      </div>
                      <div>
                        <p className="text-white font-semibold">Withdrawal Request</p>
                        <p className="text-gray-400 text-sm">
                          {formatPaymentDate(withdrawal.createdAt)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          ID: {withdrawal.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        {formatCurrency(withdrawal.amount)}
                      </p>
                      <p className={`text-sm font-medium ${getPaymentStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </p>
                      {withdrawal.fee && (
                        <p className="text-gray-400 text-xs">
                          Fee: {formatCurrency(withdrawal.fee)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Details */}
                  {withdrawal.description && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <p className="text-gray-300 text-sm">{withdrawal.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-2">No withdrawal history</p>
              <p className="text-gray-500">Start by requesting your first withdrawal</p>
            </div>
          )}
        </div>

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <PaymentModal
            paymentType={PAYMENT_TYPES.WITHDRAWAL_FEE}
            isOpen={showWithdrawalModal}
            onClose={() => setShowWithdrawalModal(false)}
            amount={withdrawalAmount}
            onSuccess={(result) => {
              console.log('Withdrawal payment successful:', result);
              setShowWithdrawalModal(false);
              setWithdrawalAmount('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WithdrawalPage;
