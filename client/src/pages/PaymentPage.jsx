import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import PaymentModal from '../components/payment/PaymentModal';
import BonusPoolCard from '../components/payment/BonusPoolCard';
import SubscriptionStatus from '../components/payment/SubscriptionStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '../components/NavBar';
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
    { id: 'overview', label: 'Overview', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    ) },
    { id: 'history', label: 'Payment History', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ) },
    { id: 'withdrawals', label: 'Withdrawals', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
      </svg>
    ) },
    { id: 'bonus-pools', label: 'Bonus Pools', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
      </svg>
    ) },
    { id: 'subscription', label: 'Subscription', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
      </svg>
    ) }
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
    <div className="min-h-screen bg-[#121212] text-white">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Payment Center</h1>
          <p className="text-gray-300">Manage your payments, subscriptions, and withdrawals</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 glass rounded-xl p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-[#2A2A2A]'
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
              <div className="glass rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
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
                    <p className="text-gray-400 text-sm">Total Withdrawn</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalWithdrawn)}</p>
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
                    <p className="text-gray-400 text-sm">Active Pools</p>
                    <p className="text-2xl font-bold text-white">{activeBonusPools.length}</p>
                  </div>
                  <div className="text-[#00A8E8]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Subscription</p>
                    <p className="text-2xl font-bold text-white">
                      {subscription?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="text-[#00A8E8]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="glass rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Payment History</h2>
                <button
                  onClick={() => handlePayment(PAYMENT_TYPES.BID_FEE)}
                  className="btn-primary"
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
                      className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600"
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
            <div className="glass rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Withdrawals</h2>
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="btn-primary"
                >
                  New Withdrawal
                </button>
              </div>

              {/* Withdrawal Form */}
              <div className="bg-[#2A2A2A] rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Request Withdrawal</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Amount (max ₹10,000)"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="flex-1 bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-[#00A8E8] focus:outline-none"
                    max="10000"
                  />
                  <button
                    onClick={handleWithdrawal}
                    disabled={!withdrawalAmount || withdrawalAmount <= 0}
                    className="btn-primary disabled:bg-gray-600 disabled:cursor-not-allowed"
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
                      className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600"
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
            <div className="glass rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Bonus Pools</h2>
                <button
                  onClick={() => handlePayment(PAYMENT_TYPES.BONUS_FUNDING)}
                  className="btn-primary"
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
            <div className="glass rounded-xl p-6 border border-gray-700">
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