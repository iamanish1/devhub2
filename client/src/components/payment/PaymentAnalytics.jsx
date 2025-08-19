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
              <p className="text-gray-400 text-sm">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{analytics.totalTransactions}</p>
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
              <p className="text-gray-400 text-sm">Avg Transaction</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(analytics.averageTransaction)}</p>
            </div>
            <div className="text-[#00A8E8]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">{analytics.successRate}%</p>
            </div>
            <div className="text-[#00A8E8]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
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
                <div className="text-[#00A8E8]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                </div>
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
            <div className="text-[#00A8E8] mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <p className="text-white font-bold text-xl">{analytics.subscriptionImpact.activeSubscriptions}</p>
            <p className="text-gray-400 text-sm">Active Subscriptions</p>
          </div>
          <div className="text-center">
            <div className="text-[#00A8E8] mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <p className="text-white font-bold text-xl">{formatCurrency(analytics.subscriptionImpact.monthlyRevenue)}</p>
            <p className="text-gray-400 text-sm">Monthly Revenue</p>
          </div>
          <div className="text-center">
            <div className="text-[#00A8E8] mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <p className="text-white font-bold text-xl">{analytics.subscriptionImpact.growthRate}%</p>
            <p className="text-gray-400 text-sm">Growth Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalytics;
