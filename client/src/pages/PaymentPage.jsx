import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import NavBar from '../components/NavBar';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentHistoryPage from './PaymentHistoryPage';
import PaymentAnalytics from '../components/payment/PaymentAnalytics';
import SubscriptionStatus from '../components/payment/SubscriptionStatus';
import { formatCurrency } from '../utils/paymentUtils.jsx';
import { PAYMENT_STATUS } from '../constants/paymentConstants';

const PaymentPage = () => {
  const { 
    subscription, 
    bonusPools, 
    isProcessing,
    refreshData,
    getPaymentStats
  } = usePayment();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        await refreshData();
      } catch (err) {
        setError('Failed to load payment data. Please try again.');
        console.error('Error loading payment data:', err);
      }
    };
    
    loadData();
  }, [refreshData]);

  const stats = getPaymentStats();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'history', label: 'Payment History', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'subscription', label: 'Subscription', icon: '⭐' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} subscription={subscription} bonusPools={bonusPools} />;
      case 'history':
        return <PaymentHistoryPage />;
      case 'analytics':
        return <PaymentAnalytics />;
      case 'subscription':
        return <SubscriptionStatus />;
      default:
        return <OverviewTab stats={stats} subscription={subscription} bonusPools={bonusPools} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 mt-[5vmin]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Payment Center</h1>
              <p className="text-gray-300">Manage your payments, subscriptions, and payment methods</p>
            </div>
            <button
              onClick={refreshData}
              disabled={isProcessing}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Refresh
            </button>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="glass rounded-xl p-2 border border-gray-700 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#00A8E8] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {isProcessing ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, subscription, bonusPools }) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Payments</p>
              <p className="text-2xl font-bold text-white">{stats.totalPayments}</p>
            </div>
            <div className="text-[#00A8E8]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Spent</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
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
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.totalPayments > 0 
                  ? Math.round((stats.successfulPayments / stats.totalPayments) * 100)
                  : 0}%
              </p>
            </div>
            <div className="text-green-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Failed Payments</p>
              <p className="text-2xl font-bold text-red-400">{stats.failedPayments}</p>
            </div>
            <div className="text-red-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Subscription Status</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Premium Subscription</p>
            <p className={`text-lg font-semibold ${subscription.isActive ? 'text-green-400' : 'text-gray-400'}`}>
              {subscription.isActive ? 'Active' : 'Inactive'}
            </p>
            {subscription.isActive && subscription.expiresAt && (
              <p className="text-gray-500 text-sm">
                Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-right">
            {subscription.isActive ? (
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm border border-green-500/30">
                Premium
              </span>
            ) : (
              <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm border border-gray-500/30">
                Free Plan
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bonus Pools */}
      {bonusPools && bonusPools.length > 0 && (
        <div className="glass rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Bonus Pools</h2>
          <div className="space-y-3">
            {bonusPools.slice(0, 3).map((pool) => (
              <div key={pool.id} className="flex items-center justify-between bg-[#2A2A2A] rounded-lg p-3 border border-gray-600">
                <div>
                  <p className="text-white font-medium">{pool.projectTitle}</p>
                  <p className="text-gray-400 text-sm">
                    {pool.contributorCount} contributors • {formatCurrency(pool.minRequired)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  pool.status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {pool.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-[#2A2A2A] hover:bg-[#333] text-white p-4 rounded-lg border border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-[#00A8E8]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">New Payment</p>
                <p className="text-gray-400 text-sm">Make a payment</p>
              </div>
            </div>
          </button>
          
          <button className="bg-[#2A2A2A] hover:bg-[#333] text-white p-4 rounded-lg border border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-[#00A8E8]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">View History</p>
                <p className="text-gray-400 text-sm">Payment history</p>
              </div>
            </div>
          </button>
          
          <button className="bg-[#2A2A2A] hover:bg-[#333] text-white p-4 rounded-lg border border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-[#00A8E8]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Settings</p>
                <p className="text-gray-400 text-sm">Payment settings</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 