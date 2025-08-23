import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '../components/NavBar';
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
    <div className="min-h-screen bg-[#121212] text-white">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 mt-[5vmin]">
          <h1 className="text-4xl font-bold text-white mb-2">Payment History</h1>
          <p className="text-gray-300">Track all your payment transactions and activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{filteredPayments.length}</p>
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
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
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
                <p className="text-gray-400 text-sm">Successful</p>
                <p className="text-2xl font-bold text-white">{successfulPayments}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-white">{failedPayments}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Filters & Search</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
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
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
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
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              >
                <option value="all">All Providers</option>
                <option value={PAYMENT_PROVIDERS.RAZORPAY}>Razorpay</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
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
              className="bg-[#1E1E1E] text-white px-3 py-1 rounded border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="type">Type</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white px-3 py-1 rounded border border-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Payment List */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          {isProcessing ? (
            <LoadingSpinner />
          ) : filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className={`bg-[#2A2A2A] rounded-lg p-6 border border-gray-600 transition-all duration-200 hover:bg-[#333] ${
                    isRecentPayment(payment.createdAt) ? 'ring-2 ring-[#00A8E8]/50' : ''
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
                            <span className="bg-[#00A8E8] text-white text-xs px-2 py-1 rounded-full">
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
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
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
