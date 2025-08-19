import React, { createContext, useContext, useReducer, useEffect } from 'react';
import paymentApi from '../services/paymentApi.js';
import { PAYMENT_STATUS } from '../constants/paymentConstants.js';

// Initial state
const initialState = {
  // Payment state
  isProcessing: false,
  currentPayment: null,
  paymentError: null,
  
  // Subscription state
  subscription: {
    isActive: false,
    planType: null,
    expiresAt: null,
    autoRenew: false
  },
  
  // Bonus pools
  bonusPools: [],
  bonusPoolsLoading: false,
  
  // Payment history
  paymentHistory: [],
  paymentHistoryLoading: false,
  
  // Withdrawal state
  withdrawalHistory: [],
  withdrawalHistoryLoading: false
};

// Action types
const PAYMENT_ACTIONS = {
  SET_PROCESSING: 'SET_PROCESSING',
  SET_CURRENT_PAYMENT: 'SET_CURRENT_PAYMENT',
  SET_PAYMENT_ERROR: 'SET_PAYMENT_ERROR',
  CLEAR_PAYMENT_ERROR: 'CLEAR_PAYMENT_ERROR',
  SET_SUBSCRIPTION: 'SET_SUBSCRIPTION',
  SET_BONUS_POOLS: 'SET_BONUS_POOLS',
  SET_BONUS_POOLS_LOADING: 'SET_BONUS_POOLS_LOADING',
  SET_PAYMENT_HISTORY: 'SET_PAYMENT_HISTORY',
  SET_PAYMENT_HISTORY_LOADING: 'SET_PAYMENT_HISTORY_LOADING',
  SET_WITHDRAWAL_HISTORY: 'SET_WITHDRAWAL_HISTORY',
  SET_WITHDRAWAL_HISTORY_LOADING: 'SET_WITHDRAWAL_HISTORY_LOADING',
  ADD_PAYMENT_TO_HISTORY: 'ADD_PAYMENT_TO_HISTORY',
  UPDATE_BONUS_POOL: 'UPDATE_BONUS_POOL'
};

// Reducer
const paymentReducer = (state, action) => {
  switch (action.type) {
    case PAYMENT_ACTIONS.SET_PROCESSING:
      return { ...state, isProcessing: action.payload };
      
    case PAYMENT_ACTIONS.SET_CURRENT_PAYMENT:
      return { ...state, currentPayment: action.payload };
      
    case PAYMENT_ACTIONS.SET_PAYMENT_ERROR:
      return { ...state, paymentError: action.payload };
      
    case PAYMENT_ACTIONS.CLEAR_PAYMENT_ERROR:
      return { ...state, paymentError: null };
      
    case PAYMENT_ACTIONS.SET_SUBSCRIPTION:
      return { ...state, subscription: action.payload };
      
    case PAYMENT_ACTIONS.SET_BONUS_POOLS:
      return { ...state, bonusPools: action.payload };
      
    case PAYMENT_ACTIONS.SET_BONUS_POOLS_LOADING:
      return { ...state, bonusPoolsLoading: action.payload };
      
    case PAYMENT_ACTIONS.SET_PAYMENT_HISTORY:
      return { ...state, paymentHistory: action.payload };
      
    case PAYMENT_ACTIONS.SET_PAYMENT_HISTORY_LOADING:
      return { ...state, paymentHistoryLoading: action.payload };
      
    case PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY:
      return { ...state, withdrawalHistory: action.payload };
      
    case PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY_LOADING:
      return { ...state, withdrawalHistoryLoading: action.payload };
      
    case PAYMENT_ACTIONS.ADD_PAYMENT_TO_HISTORY:
      return { 
        ...state, 
        paymentHistory: [action.payload, ...state.paymentHistory] 
      };
      
    case PAYMENT_ACTIONS.UPDATE_BONUS_POOL:
      return {
        ...state,
        bonusPools: state.bonusPools.map(pool => 
          pool._id === action.payload._id ? action.payload : pool
        )
      };
      
    default:
      return state;
  }
};

// Create context
const PaymentContext = createContext();

// Provider component
export const PaymentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  // Load subscription status on mount
  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  // Load payment history on mount
  useEffect(() => {
    loadPaymentHistory();
  }, []);

  // Load bonus pools on mount
  useEffect(() => {
    loadBonusPools();
  }, []);

  // Load withdrawal history on mount
  useEffect(() => {
    loadWithdrawalHistory();
  }, []);

  // Load subscription status
  const loadSubscriptionStatus = async () => {
    try {
      const subscription = await paymentApi.getSubscriptionStatus();
      dispatch({ type: PAYMENT_ACTIONS.SET_SUBSCRIPTION, payload: subscription });
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  // Load payment history
  const loadPaymentHistory = async () => {
    dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_HISTORY_LOADING, payload: true });
    try {
      const history = await paymentApi.getPaymentHistory();
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_HISTORY, payload: history });
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_HISTORY_LOADING, payload: false });
    }
  };

  // Load bonus pools
  const loadBonusPools = async () => {
    dispatch({ type: PAYMENT_ACTIONS.SET_BONUS_POOLS_LOADING, payload: true });
    try {
      const pools = await paymentApi.getBonusPools();
      dispatch({ type: PAYMENT_ACTIONS.SET_BONUS_POOLS, payload: pools });
    } catch (error) {
      console.error('Error loading bonus pools:', error);
    } finally {
      dispatch({ type: PAYMENT_ACTIONS.SET_BONUS_POOLS_LOADING, payload: false });
    }
  };

  // Load withdrawal history
  const loadWithdrawalHistory = async () => {
    dispatch({ type: PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY_LOADING, payload: true });
    try {
      const history = await paymentApi.getWithdrawalHistory();
      dispatch({ type: PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY, payload: history });
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
    } finally {
      dispatch({ type: PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY_LOADING, payload: false });
    }
  };

  // Payment actions
  const paymentActions = {
    // Start payment processing
    startPayment: (paymentData) => {
      dispatch({ type: PAYMENT_ACTIONS.SET_PROCESSING, payload: true });
      dispatch({ type: PAYMENT_ACTIONS.SET_CURRENT_PAYMENT, payload: paymentData });
      dispatch({ type: PAYMENT_ACTIONS.CLEAR_PAYMENT_ERROR });
    },

    // Complete payment
    completePayment: (paymentResult) => {
      dispatch({ type: PAYMENT_ACTIONS.SET_PROCESSING, payload: false });
      dispatch({ type: PAYMENT_ACTIONS.SET_CURRENT_PAYMENT, payload: null });
      dispatch({ type: PAYMENT_ACTIONS.ADD_PAYMENT_TO_HISTORY, payload: paymentResult });
      
      // Reload subscription status if it was a subscription payment
      if (paymentResult.purpose === 'subscription') {
        loadSubscriptionStatus();
      }
    },

    // Handle payment error
    handlePaymentError: (error) => {
      dispatch({ type: PAYMENT_ACTIONS.SET_PROCESSING, payload: false });
      dispatch({ type: PAYMENT_ACTIONS.SET_CURRENT_PAYMENT, payload: null });
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_ERROR, payload: error.message });
    },

    // Clear payment error
    clearPaymentError: () => {
      dispatch({ type: PAYMENT_ACTIONS.CLEAR_PAYMENT_ERROR });
    },

    // Refresh data
    refreshData: () => {
      loadSubscriptionStatus();
      loadPaymentHistory();
      loadBonusPools();
      loadWithdrawalHistory();
    }
  };

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    return state.subscription.isActive;
  };

  // Check if user can perform action without payment
  const canPerformAction = (actionType) => {
    if (actionType === 'bid' || actionType === 'list_project') {
      return hasActiveSubscription();
    }
    return true;
  };

  const value = {
    ...state,
    ...paymentActions,
    hasActiveSubscription,
    canPerformAction
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentContext;
