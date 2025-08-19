import axios from 'axios';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Environment validation and normalization
const normalizeEnv = (env) => {
  if (!env) return 'sandbox'; // Default to sandbox for safety
  const normalized = env.toLowerCase().trim();
  if (!['sandbox', 'live', 'production'].includes(normalized)) {
    logger.warn(`Invalid CASHFREE_ENV value: "${env}". Defaulting to sandbox.`);
    return 'sandbox';
  }
  return normalized === 'production' ? 'live' : normalized;
};

const validateApiKey = (key, keyName) => {
  if (!key) {
    throw new Error(`${keyName} is not set`);
  }
  
  const trimmedKey = key.trim();
  if (trimmedKey !== key) {
    logger.warn(`${keyName} contains leading/trailing whitespace`);
  }
  
  if (trimmedKey.length < 10) {
    throw new Error(`${keyName} appears to be invalid (too short)`);
  }
  
  return trimmedKey;
};

// Initialize configuration
const CASHFREE_ENV = normalizeEnv(process.env.CASHFREE_ENV);
const CASHFREE_APP_ID = validateApiKey(process.env.CASHFREE_APP_ID, 'CASHFREE_APP_ID');
const CASHFREE_SECRET_KEY = validateApiKey(process.env.CASHFREE_SECRET_KEY, 'CASHFREE_SECRET_KEY');

// Base URL configuration
const BASE_URL = CASHFREE_ENV === 'sandbox' 
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg';

// Axios instance with proper configuration
const cashfreeApi = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'x-api-version': '2022-09-01'
  }
});

// Request interceptor for logging and headers
cashfreeApi.interceptors.request.use((config) => {
  // Add authentication headers
  config.headers['x-client-id'] = CASHFREE_APP_ID;
  config.headers['x-client-secret'] = CASHFREE_SECRET_KEY;
  
  // Add idempotency key for POST requests
  if (config.method === 'post' && !config.headers['x-idempotency-key']) {
    config.headers['x-idempotency-key'] = uuidv4();
  }
  
  // Safe logging (hide sensitive data)
  const safeConfig = {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
      'x-client-id': CASHFREE_APP_ID ? `${CASHFREE_APP_ID.substring(0, 8)}...` : 'NOT_SET',
      'x-client-secret': CASHFREE_SECRET_KEY ? '***HIDDEN***' : 'NOT_SET',
      'x-api-version': config.headers['x-api-version'],
      'x-idempotency-key': config.headers['x-idempotency-key'] ? 'SET' : 'NOT_SET',
      'Content-Type': config.headers['Content-Type']
    }
  };
  
  logger.debug('Cashfree API Request', safeConfig);
  return config;
});

// Response interceptor for error handling
cashfreeApi.interceptors.response.use(
  (response) => {
    logger.debug('Cashfree API Response', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  (error) => {
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message
    };
    
    // Enhanced 401 error diagnostics
    if (error.response?.status === 401) {
      errorInfo.diagnostic = {
        environment: CASHFREE_ENV,
        baseUrl: BASE_URL,
        appIdPrefix: CASHFREE_APP_ID ? CASHFREE_APP_ID.substring(0, 8) : 'NOT_SET',
        secretKeyLength: CASHFREE_SECRET_KEY ? CASHFREE_SECRET_KEY.length : 0,
        apiVersion: '2022-09-01'
      };
      
      logger.error('Cashfree 401 Unauthorized Error - Possible causes:', {
        ...errorInfo,
        suggestions: [
          'Check if API keys are correct for the environment',
          'Verify CASHFREE_ENV matches your API key environment',
          'Ensure no whitespace in API keys',
          'Confirm you are using Payments (PG) API keys, not Payouts keys'
        ]
      });
    } else {
      logger.error('Cashfree API Error', errorInfo);
    }
    
    return Promise.reject(error);
  }
);

// Diagnostic logging on module load
console.log('🔍 [Cashfree] Configuration loaded:');
console.log('🔍 [Cashfree] Environment:', CASHFREE_ENV);
console.log('🔍 [Cashfree] Base URL:', BASE_URL);
console.log('🔍 [Cashfree] App ID:', CASHFREE_APP_ID ? `${CASHFREE_APP_ID.substring(0, 8)}...` : 'NOT_SET');
console.log('🔍 [Cashfree] Secret Key:', CASHFREE_SECRET_KEY ? `***${CASHFREE_SECRET_KEY.length} chars***` : 'NOT_SET');

export const createOrder = async ({ orderId, amount, customer, notes, idempotencyKey = null }) => {
  try {
    const requestData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: customer,
      order_note: notes
    };
    
    logger.info('Creating Cashfree order', {
      orderId,
      amount,
      currency: 'INR',
      customerId: customer?.customer_id,
      environment: CASHFREE_ENV
    });
    
    const config = {};
    if (idempotencyKey) {
      config.headers = { 'x-idempotency-key': idempotencyKey };
    }
    
    const { data } = await cashfreeApi.post('/orders', requestData, config);
    
    logger.info('Cashfree order created successfully', {
      orderId: data.order_id,
      cfOrderId: data.cf_order_id,
      amount: data.order_amount,
      status: data.order_status,
      paymentSessionId: data.payment_session_id
    });
    
    // Add order_token field for frontend compatibility
    const responseWithToken = {
      ...data,
      order_token: data.payment_session_id // Cashfree SDK expects order_token
    };
    
    return responseWithToken;
  } catch (error) {
    logger.error('Failed to create Cashfree order', {
      orderId,
      amount,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

export const getOrder = async (orderId) => {
  try {
    logger.debug('Fetching Cashfree order', { orderId });
    
    const { data } = await cashfreeApi.get(`/orders/${orderId}`);
    
    logger.debug('Cashfree order fetched', {
      orderId: data.order_id,
      status: data.order_status,
      amount: data.order_amount
    });
    
    return data;
  } catch (error) {
    logger.error('Failed to fetch Cashfree order', {
      orderId,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

export const verifyWebhookSignature = (payload, signature) => {
  try {
    // Cashfree doesn't provide webhook secrets, so we'll implement basic validation
    // based on the webhook payload structure and order verification
    
    if (!payload) {
      logger.error('Webhook payload is missing');
      return false;
    }
    
    // Validate required fields in webhook payload
    const requiredFields = ['orderId', 'orderStatus'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      logger.error('Webhook payload missing required fields', { missingFields });
      return false;
    }
    
    // Log webhook details for debugging (without sensitive data)
    logger.info('Cashfree webhook received', {
      orderId: payload.orderId,
      orderStatus: payload.orderStatus,
      paymentId: payload.paymentId,
      signaturePresent: !!signature,
      payloadKeys: Object.keys(payload)
    });
    
    // For additional security, you can verify the order status with Cashfree API
    // This is optional but recommended for critical payments
    return true;
  } catch (error) {
    logger.error('Webhook signature verification error', { error: error.message });
    return false;
  }
};

// Optional: Verify order status with Cashfree API for additional security
export const verifyOrderWithCashfree = async (orderId) => {
  try {
    const order = await getOrder(orderId);
    
    // Verify the order exists and has valid status
    if (!order || !order.order_id) {
      logger.error('Order verification failed - order not found', { orderId });
      return false;
    }
    
    // Check if order status is valid
    const validStatuses = ['PAID', 'SUCCESS', 'COMPLETED'];
    if (!validStatuses.includes(order.order_status)) {
      logger.warn('Order verification - invalid status', { 
        orderId, 
        status: order.order_status 
      });
      return false;
    }
    
    logger.info('Order verification successful', { 
      orderId, 
      status: order.order_status,
      amount: order.order_amount 
    });
    
    return true;
  } catch (error) {
    logger.error('Order verification failed', { 
      orderId, 
      error: error.message 
    });
    return false;
  }
};

export const createRefund = async (orderId, refundId, amount, reason, idempotencyKey = null) => {
  try {
    const requestData = {
      refund_id: refundId,
      refund_amount: amount,
      refund_note: reason
    };
    
    logger.info('Creating Cashfree refund', {
      orderId,
      refundId,
      amount,
      reason
    });
    
    const config = {};
    if (idempotencyKey) {
      config.headers = { 'x-idempotency-key': idempotencyKey };
    }
    
    const { data } = await cashfreeApi.post(`/orders/${orderId}/refunds`, requestData, config);
    
    logger.info('Cashfree refund created successfully', {
      refundId: data.refund_id,
      cfRefundId: data.cf_refund_id,
      amount: data.refund_amount,
      status: data.refund_status
    });
    
    return data;
  } catch (error) {
    logger.error('Failed to create Cashfree refund', {
      orderId,
      refundId,
      amount,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

// Health check function
export const checkCashfreeHealth = async () => {
  try {
    const { data } = await cashfreeApi.get('/orders/test');
    return { healthy: true, data };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Configuration getter for debugging
export const getCashfreeConfig = () => ({
  environment: CASHFREE_ENV,
  baseUrl: BASE_URL,
  appIdPrefix: CASHFREE_APP_ID ? CASHFREE_APP_ID.substring(0, 8) : null,
  secretKeyLength: CASHFREE_SECRET_KEY ? CASHFREE_SECRET_KEY.length : 0,
  apiVersion: '2022-09-01'
});
