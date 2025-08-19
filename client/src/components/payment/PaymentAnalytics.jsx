import React, { useState, useEffect } from 'react';
import { usePayment } from '../../context/PaymentContext';
import { 
  PAYMENT_TYPES, 
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS 
} from '../../constants/paymentConstants';
import { 
  formatCurrency, 
  calculateSubscriptionSavings,
  generatePaymentSummary 
} from '../../utils/paymentUtils';

const PaymentAnalytics = () => {
  const { paymentHistory, withdrawalHistory, subscription } = usePayment();
  const [timeRange, setTimeRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Calculate analytics data
  const calculateAnalytics = () => {
    if (!paymentHistory || !Array.isArray(paymentHistory)) return {};

    const now = new Date();
    const timeRanges = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const daysAgo = timeRanges[timeRange];
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const filteredPayments = paymentHistory.filter(payment => 
      new Date(payment.createdAt) >= cutoffDate
    );

    const successfulPayments = filteredPayments.filter(p => 
      p.status === PAYMENT_STATUS.SUCCESS
    );

    const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalTransactions = successfulPayments.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Payment type breakdown
    const typeBreakdown = {};
    successfulPayments.forEach(payment => {
      typeBreakdown[payment.type] = (typeBreakdown[payment.type] || 0) + payment.amount;
    });

    // Provider breakdown
    const providerBreakdown = {};
    successfulPayments.forEach(payment => {
      providerBreakdown[payment.provider] = (providerBreakdown[payment.provider] || 0) + payment.amount;
    });

    // Daily revenue for chart
    const dailyRevenue = {};
    successfulPayments.forEach(payment => {
      const date = new Date(payment.createdAt).toDateString();
      dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount;
    });

    // Success rate
    const successRate = filteredPayments.length > 0 
      ? (successfulPayments.length / filteredPayments.length) * 100 
      : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      typeBreakdown,
      providerBreakdown,
      dailyRevenue,
      successRate,
      filteredPayments: successfulPayments
    };
  };

  const analytics = calculateAnalytics();

  // Generate chart data
  const generateChartData = () => {
    const { dailyRevenue } = analytics;
    const dates = Object.keys(dailyRevenue).sort();
    
    return dates.map(date => ({
      date: new Date(date).toLocaleDateString(),
      revenue: dailyRevenue[date]
    }));
  };

  const chartData = generateChartData();

  // Get top performing metrics
  const getTopMetrics = () => {
    const { typeBreakdown, providerBreakdown } = analytics;
    
    const topPaymentType = Object.entries(typeBreakdown)
      .sort(([,a], [,b]) => b - a)[0];
    
    const topProvider = Object.entries(providerBreakdown)
      .sort(([,a], [,b]) => b - a)[0];

    return { topPaymentType, topProvider };
  };

  const { topPaymentType, topProvider } = getTopMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Payment Analytics</h2>
        <div className="text-sm text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalRevenue)}</p>
            </div>
            <div className="text-[#00A8E8] text-2xl">💰</div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{analytics.totalTransactions}</p>
            </div>
            <div className="text-[#00A8E8] text-2xl">📊</div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Transaction</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.averageTransaction)}</p>
            </div>
            <div className="text-[#00A8E8] text-2xl">📈</div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">{analytics.successRate}%</p>
            </div>
            <div className="text-[#00A8E8] text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.revenueTrend.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-[#00A8E8] to-[#0062E6] rounded-t"
                  style={{ height: `${(value / Math.max(...analytics.revenueTrend)) * 200}px` }}
                />
                <span className="text-gray-400 text-xs mt-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Type Breakdown */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Types</h3>
          <div className="space-y-3">
            {analytics.paymentTypeBreakdown.map((type) => (
              <div key={type.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#00A8E8]" />
                  <span className="text-gray-300">{type.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatCurrency(type.amount)}</p>
                  <p className="text-gray-400 text-sm">{type.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Providers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analytics.providerBreakdown.map((provider) => (
            <div key={provider.name} className="bg-[#2A2A2A] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">{provider.name}</span>
                <span className="text-[#00A8E8] font-bold">{provider.percentage}%</span>
              </div>
              <div className="w-full bg-[#1E1E1E] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] h-2 rounded-full"
                  style={{ width: `${provider.percentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-400">{provider.transactions} transactions</span>
                <span className="text-white">{formatCurrency(provider.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.insights.map((insight, index) => (
            <div key={index} className="bg-[#2A2A2A] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-[#00A8E8] text-xl">💡</div>
                <div>
                  <p className="text-white font-medium mb-1">{insight.title}</p>
                  <p className="text-gray-400 text-sm">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Impact */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Subscription Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-[#00A8E8] text-3xl mb-2">⭐</div>
            <p className="text-white font-bold text-xl">{analytics.subscriptionImpact.activeSubscriptions}</p>
            <p className="text-gray-400 text-sm">Active Subscriptions</p>
          </div>
          <div className="text-center">
            <div className="text-[#00A8E8] text-3xl mb-2">💰</div>
            <p className="text-white font-bold text-xl">{formatCurrency(analytics.subscriptionImpact.monthlyRevenue)}</p>
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
          </div>
          <div className="text-center">
            <div className="text-[#00A8E8] text-3xl mb-2">📈</div>
            <p className="text-white font-bold text-xl">{analytics.subscriptionImpact.growthRate}%</p>
            <p className="text-gray-400 text-sm">Growth Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalytics;
