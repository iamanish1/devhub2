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
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(analytics.totalRevenue)}
              </p>
            </div>
            <div className="text-green-400 text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-white">
                {analytics.totalTransactions}
              </p>
            </div>
            <div className="text-blue-400 text-2xl">📊</div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Transaction</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(analytics.averageTransactionValue)}
              </p>
            </div>
            <div className="text-purple-400 text-2xl">📈</div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-white">
                {analytics.successRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-yellow-400 text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Charts and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          {chartData.length > 0 ? (
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-400">{item.date}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                      style={{ 
                        width: `${(item.revenue / Math.max(...chartData.map(d => d.revenue))) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm text-white">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No data available for selected time range
            </div>
          )}
        </div>

        {/* Payment Type Breakdown */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Types</h3>
          {Object.keys(analytics.typeBreakdown).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.typeBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-300 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-white font-semibold">
                      {formatCurrency(amount)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No payment data available
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Top Payment Type</h4>
              <p className="text-gray-300">
                {topPaymentType ? (
                  <>
                    <span className="text-blue-400 font-semibold capitalize">
                      {topPaymentType[0].replace('_', ' ')}
                    </span>
                    {' '}generated {formatCurrency(topPaymentType[1])}
                  </>
                ) : (
                  'No payment data available'
                )}
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Preferred Provider</h4>
              <p className="text-gray-300">
                {topProvider ? (
                  <>
                    <span className="text-green-400 font-semibold capitalize">
                      {topProvider[0]}
                    </span>
                    {' '}processed {formatCurrency(topProvider[1])}
                  </>
                ) : (
                  'No provider data available'
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Subscription Impact</h4>
              <p className="text-gray-300">
                {subscription?.isActive ? (
                  <>
                    Active subscription saving{' '}
                    <span className="text-purple-400 font-semibold">
                      {formatCurrency(calculateSubscriptionSavings(analytics.totalTransactions))}
                    </span>
                    {' '}on bid fees
                  </>
                ) : (
                  'No active subscription'
                )}
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Performance</h4>
              <p className="text-gray-300">
                {analytics.successRate >= 95 ? (
                  <span className="text-green-400">Excellent success rate</span>
                ) : analytics.successRate >= 90 ? (
                  <span className="text-yellow-400">Good success rate</span>
                ) : (
                  <span className="text-red-400">Needs improvement</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentAnalytics;
