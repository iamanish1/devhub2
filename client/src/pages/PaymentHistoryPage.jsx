import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  PAYMENT_TYPES, 
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS 
} from '../constants/paymentConstants';
import { 
  formatCurrency, 
  getPaymentStatusColor, 
  getPaymentStatusIcon, 
  formatPaymentDate,
  getPaymentTypeDisplayName,
  getPaymentProviderDisplayName,
  isRecentPayment
} from '../utils/paymentUtils';

const PaymentHistoryPage = () => {
  const { paymentHistory, isProcessing, refreshData } = usePayment();
  
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!paymentHistory || !Array.isArray(paymentHistory)) {
      setFilteredPayments([]);
      return;
    }

    let filtered = [...paymentHistory];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPaymentTypeDisplayName(payment.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.type === typeFilter);
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(payment => payment.provider === providerFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate >= today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate >= monthAgo;
          });
          break;
        default:
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'type':
          aValue = getPaymentTypeDisplayName(a.type);
          bValue = getPaymentTypeDisplayName(b.type);
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPayments(filtered);
  }, [paymentHistory, searchTerm, statusFilter, typeFilter, providerFilter, dateFilter, sortBy, sortOrder]);

  const totalAmount = filteredPayments.reduce((sum, payment) => 
    payment.status === PAYMENT_STATUS.SUCCESS ? sum + payment.amount : sum, 0
  );

  const successfulPayments = filteredPayments.filter(payment => 
    payment.status === PAYMENT_STATUS.SUCCESS
  ).length;

  const failedPayments = filteredPayments.filter(payment => 
    payment.status === PAYMENT_STATUS.FAILED
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Payment History</h1>
          <p className="text-gray-300">Track all your payment transactions and activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{filteredPayments.length}</p>
              </div>
              <div className="text-blue-400 text-2xl">📊</div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="text-green-400 text-2xl">💰</div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Successful</p>
                <p className="text-2xl font-bold text-white">{successfulPayments}</p>
              </div>
              <div className="text-green-400 text-2xl">✅</div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-white">{failedPayments}</p>
              </div>
              <div className="text-red-400 text-2xl">❌</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Filters & Search</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value={PAYMENT_STATUS.SUCCESS}>Success</option>
                <option value={PAYMENT_STATUS.PENDING}>Pending</option>
                <option value={PAYMENT_STATUS.FAILED}>Failed</option>
                <option value={PAYMENT_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value={PAYMENT_TYPES.BID_FEE}>Bid Fee</option>
                <option value={PAYMENT_TYPES.BONUS_FUNDING}>Bonus Funding</option>
                <option value={PAYMENT_TYPES.SUBSCRIPTION}>Subscription</option>
                <option value={PAYMENT_TYPES.WITHDRAWAL_FEE}>Withdrawal</option>
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Providers</option>
                <option value={PAYMENT_PROVIDERS.CASHFREE}>Cashfree</option>
                <option value={PAYMENT_PROVIDERS.RAZORPAY}>Razorpay</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-gray-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="type">Type</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded border border-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          {isProcessing ? (
            <LoadingSpinner />
          ) : filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={`bg-gray-700/50 rounded-lg p-6 border border-gray-600 transition-all duration-200 hover:bg-gray-700/70 ${
                    isRecentPayment(payment.createdAt) ? 'ring-2 ring-blue-500/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${getPaymentStatusColor(payment.status)}`}>
                        {getPaymentStatusIcon(payment.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold">
                            {getPaymentTypeDisplayName(payment.type)}
                          </p>
                          {isRecentPayment(payment.createdAt) && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              Recent
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {formatPaymentDate(payment.createdAt)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          ID: {payment.id} • {getPaymentProviderDisplayName(payment.provider)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{formatCurrency(payment.amount)}</p>
                      <p className={`text-sm font-medium ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status}
                      </p>
                      {payment.fee && (
                        <p className="text-gray-400 text-xs">
                          Fee: {formatCurrency(payment.fee)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Details */}
                  {payment.description && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <p className="text-gray-300 text-sm">{payment.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-gray-400 text-lg mb-2">No payments found</p>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
