import React, { useState, useEffect, useMemo } from 'react';
import { usePayment } from '../../context/PaymentContext';
import { formatCurrency, formatPaymentAmount } from '../../utils/paymentUtils.jsx';
import { PAYMENT_ANALYTICS_PERIODS, PAYMENT_TYPES } from '../../constants/paymentConstants';
import LoadingSpinner from '../LoadingSpinner';

const PaymentAnalytics = () => {
  const { paymentAnalytics, analyticsLoading, paymentHistory, refreshData } = usePayment();
  const [selectedPeriod, setSelectedPeriod] = useState(PAYMENT_ANALYTICS_PERIODS.MONTH);
  const [error, setError] = useState(null);

  // Calculate analytics from payment history if server analytics not available
  const calculatedAnalytics = useMemo(() => {
    if (!paymentHistory || !Array.isArray(paymentHistory)) return null;

    const now = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case PAYMENT_ANALYTICS_PERIODS.WEEK:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case PAYMENT_ANALYTICS_PERIODS.MONTH:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case PAYMENT_ANALYTICS_PERIODS.QUARTER:
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case PAYMENT_ANALYTICS_PERIODS.YEAR:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filteredPayments = paymentHistory.filter(payment => 
      new Date(payment.createdAt) >= startDate
    );

    // Group by payment type
    const byType = filteredPayments.reduce((acc, payment) => {
      const type = payment.type || payment.purpose;
      if (!acc[type]) {
        acc[type] = { count: 0, amount: 0, successful: 0, failed: 0 };
      }
      acc[type].count++;
      acc[type].amount += payment.amount || 0;
      if (payment.status === 'success' || payment.status === 'paid') {
        acc[type].successful++;
      } else if (payment.status === 'failed') {
        acc[type].failed++;
      }
      return acc;
    }, {});

    // Monthly trends
    const monthlyTrends = [];
    const months = {};
    
    filteredPayments.forEach(payment => {
      const date = new Date(payment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { amount: 0, count: 0 };
      }
      months[monthKey].amount += payment.amount || 0;
      months[monthKey].count++;
    });

    Object.entries(months).forEach(([period, data]) => {
      monthlyTrends.push({ period, ...data });
    });

    return {
      period: selectedPeriod,
      summary: {
        totalPayments: filteredPayments.length,
        totalAmount: filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        successfulPayments: filteredPayments.filter(p => 
          p.status === 'success' || p.status === 'paid'
        ).length,
        failedPayments: filteredPayments.filter(p => p.status === 'failed').length
      },
      byPurpose: Object.entries(byType).map(([type, data]) => ({
        _id: type,
        count: data.count,
        totalAmount: data.amount,
        successfulPayments: data.successful,
        failedPayments: data.failed
      })),
      monthlyTrends,
      recentActivity: filteredPayments.slice(0, 10).map(payment => ({
        id: payment.id || payment._id,
        purpose: payment.type || payment.purpose,
        amount: payment.amount,
        status: payment.status,
        provider: payment.provider,
        projectTitle: payment.projectId?.project_Title || 'N/A',
        createdAt: payment.createdAt
      }))
    };
  }, [paymentHistory, selectedPeriod]);

  const analytics = paymentAnalytics || calculatedAnalytics;

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setError(null);
        await refreshData();
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Error loading analytics:', err);
      }
    };
    
    loadAnalytics();
  }, [refreshData]);

  if (analyticsLoading) {
    return (
      <div className="glass rounded-xl p-6 border border-gray-700">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-6 border border-gray-700">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => refreshData()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass rounded-xl p-6 border border-gray-700">
        <div className="text-center">
          <p className="text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Payment Analytics</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-[#1E1E1E] text-white px-3 py-1 rounded border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
          >
            <option value={PAYMENT_ANALYTICS_PERIODS.WEEK}>Last 7 Days</option>
            <option value={PAYMENT_ANALYTICS_PERIODS.MONTH}>Last 30 Days</option>
            <option value={PAYMENT_ANALYTICS_PERIODS.QUARTER}>Last 90 Days</option>
            <option value={PAYMENT_ANALYTICS_PERIODS.YEAR}>Last Year</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600">
            <p className="text-gray-400 text-sm">Total Payments</p>
            <p className="text-2xl font-bold text-white">{analytics.summary.totalPayments}</p>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600">
            <p className="text-gray-400 text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(analytics.summary.totalAmount)}</p>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600">
            <p className="text-gray-400 text-sm">Success Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {analytics.summary.totalPayments > 0 
                ? Math.round((analytics.summary.successfulPayments / analytics.summary.totalPayments) * 100)
                : 0}%
            </p>
          </div>
          <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600">
            <p className="text-gray-400 text-sm">Failed Payments</p>
            <p className="text-2xl font-bold text-red-400">{analytics.summary.failedPayments}</p>
          </div>
        </div>
      </div>

      {/* Payment Types Breakdown */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Types Breakdown</h3>
        <div className="space-y-4">
          {analytics.byPurpose.map((type) => (
            <div key={type._id} className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">
                  {type._id === 'bid_fee' ? 'Bid Fees' :
                   type._id === 'bonus_funding' ? 'Bonus Funding' :
                   type._id === 'subscription' ? 'Subscriptions' :
                   type._id === 'withdrawal_fee' ? 'Withdrawal Fees' :
                   type._id === 'listing' ? 'Listing Fees' : type._id}
                </h4>
                <span className="text-gray-400 text-sm">{type.count} payments</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-white font-bold">{formatCurrency(type.totalAmount)}</span>
                  <span className="text-green-400 text-sm">{type.successfulPayments} successful</span>
                  {type.failedPayments > 0 && (
                    <span className="text-red-400 text-sm">{type.failedPayments} failed</span>
                  )}
                </div>
                <div className="w-24 bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${type.count > 0 ? (type.successfulPayments / type.count) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trends */}
      {analytics.monthlyTrends && analytics.monthlyTrends.length > 0 && (
        <div className="glass rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Trends</h3>
          <div className="space-y-3">
            {analytics.monthlyTrends.map((trend) => (
              <div key={trend.period} className="flex items-center justify-between bg-[#2A2A2A] rounded-lg p-3 border border-gray-600">
                <span className="text-white font-medium">{trend.period}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">{trend.count} payments</span>
                  <span className="text-white font-bold">{formatCurrency(trend.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="glass rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between bg-[#2A2A2A] rounded-lg p-3 border border-gray-600">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'success' || activity.status === 'paid' 
                      ? 'bg-green-500' 
                      : activity.status === 'failed' 
                      ? 'bg-red-500' 
                      : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="text-white text-sm">
                      {activity.purpose === 'bid_fee' ? 'Bid Fee' :
                       activity.purpose === 'bonus_funding' ? 'Bonus Funding' :
                       activity.purpose === 'subscription' ? 'Subscription' :
                       activity.purpose === 'withdrawal_fee' ? 'Withdrawal Fee' :
                       activity.purpose === 'listing' ? 'Listing Fee' : activity.purpose}
                    </p>
                    <p className="text-gray-400 text-xs">{activity.projectTitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatCurrency(activity.amount)}</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAnalytics;
