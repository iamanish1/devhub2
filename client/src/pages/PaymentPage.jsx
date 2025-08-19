import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import { PaymentModal } from '../components/payment/PaymentModal';
import { BonusPoolCard } from '../components/payment/BonusPoolCard';
import { SubscriptionStatus } from '../components/payment/SubscriptionStatus';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  PAYMENT_TYPES, 
  PAYMENT_AMOUNTS, 
  PAYMENT_STATUS,
  SUBSCRIPTION_BENEFITS 
} from '../constants/paymentConstants';
import { 
  formatCurrency, 
  getPaymentStatusColor, 
  getPaymentStatusIcon, 
  formatPaymentDate,
  getPaymentTypeDisplayName,
  calculateSubscriptionSavings,
  generatePaymentSummary
} from '../utils/paymentUtils';

const PaymentPage = () => {
  const {
    subscription,
    paymentHistory,
    withdrawalHistory,
    bonusPools,
    isProcessing,
    refreshData
  } = usePayment();

  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handlePayment = (type) => {
    setPaymentType(type);
    setShowPaymentModal(true);
  };

  const handleWithdrawal = () => {
    if (!withdrawalAmount || withdrawalAmount <= 0) return;
    setShowWithdrawalModal(true);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'history', label: 'Payment History', icon: '📋' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💳' },
    { id: 'bonus-pools', label: 'Bonus Pools', icon: '💰' },
    { id: 'subscription', label: 'Subscription', icon: '⭐' }
  ];

  const recentPayments = paymentHistory?.slice(0, 5) || [];
  const recentWithdrawals = withdrawalHistory?.slice(0, 5) || [];

  const totalSpent = paymentHistory?.reduce((sum, payment) => 
    payment.status === PAYMENT_STATUS.SUCCESS ? sum + payment.amount : sum, 0
  ) || 0;

  const totalWithdrawn = withdrawalHistory?.reduce((sum, withdrawal) => 
    withdrawal.status === PAYMENT_STATUS.SUCCESS ? sum + withdrawal.amount : sum, 0
  ) || 0;

  const activeBonusPools = bonusPools?.filter(pool => pool.status === 'active') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Payment Center</h1>
          <p className="text-gray-300">Manage your payments, subscriptions, and withdrawals</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
                  </div>
                  <div className="text-blue-400 text-2xl">💰</div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Withdrawn</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalWithdrawn)}</p>
                  </div>
                  <div className="text-green-400 text-2xl">💳</div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Pools</p>
                    <p className="text-2xl font-bold text-white">{activeBonusPools.length}</p>
                  </div>
                  <div className="text-yellow-400 text-2xl">🏆</div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Subscription</p>
                    <p className="text-2xl font-bold text-white">
                      {subscription?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="text-purple-400 text-2xl">⭐</div>
                </div>
              </div>
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Payment History</h2>
                <button
                  onClick={() => handlePayment(PAYMENT_TYPES.BID_FEE)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  New Payment
                </button>
              </div>

              {isProcessing ? (
                <LoadingSpinner />
              ) : paymentHistory?.length > 0 ? (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getPaymentStatusColor(payment.status)}`}>
                            {getPaymentStatusIcon(payment.status)}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {getPaymentTypeDisplayName(payment.type)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {formatPaymentDate(payment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(payment.amount)}</p>
                          <p className={`text-sm ${getPaymentStatusColor(payment.status)}`}>
                            {payment.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No payment history found</p>
                </div>
              )}
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Withdrawals</h2>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  New Withdrawal
                </button>
              </div>

              {/* Withdrawal Form */}
              <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Request Withdrawal</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Amount (max ₹10,000)"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                    max="10000"
                  />
                  <button
                    onClick={handleWithdrawal}
                    disabled={!withdrawalAmount || withdrawalAmount <= 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Withdrawal fee: ₹15 (up to ₹10,000 limit)
                </p>
              </div>

              {/* Withdrawal History */}
              {withdrawalHistory?.length > 0 ? (
                <div className="space-y-4">
                  {withdrawalHistory.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getPaymentStatusColor(withdrawal.status)}`}>
                            {getPaymentStatusIcon(withdrawal.status)}
                          </div>
                          <div>
                            <p className="text-white font-medium">Withdrawal</p>
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No withdrawal history found</p>
                </div>
              )}
            </div>
          )}

          {/* Bonus Pools Tab */}
          {activeTab === 'bonus-pools' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Bonus Pools</h2>
                <button
                  onClick={() => handlePayment(PAYMENT_TYPES.BONUS_FUNDING)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Pool
                </button>
              </div>

              {bonusPools?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bonusPools.map((pool) => (
                    <BonusPoolCard key={pool.id} pool={pool} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No bonus pools found</p>
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <SubscriptionStatus />
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && paymentType && (
          <PaymentModal
            paymentType={paymentType}
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setPaymentType(null);
            }}
          />
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <PaymentModal
            paymentType={PAYMENT_TYPES.WITHDRAWAL_FEE}
            isOpen={showWithdrawalModal}
            onClose={() => setShowWithdrawalModal(false)}
            customAmount={withdrawalAmount}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentPage; 