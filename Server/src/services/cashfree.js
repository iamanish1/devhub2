import axios from 'axios';
import { logger } from '../utils/logger.js';

// Debug environment variables
console.log('🔍 [Cashfree] Environment variables check:');
console.log('🔍 [Cashfree] CASHFREE_APP_ID:', process.env.CASHFREE_APP_ID ? 'SET' : 'NOT SET');
console.log('🔍 [Cashfree] CASHFREE_SECRET_KEY:', process.env.CASHFREE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('🔍 [Cashfree] CASHFREE_ENV:', process.env.CASHFREE_ENV || 'NOT SET');

const BASE = process.env.CASHFREE_ENV === 'sandbox'
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg';

console.log('🔍 [Cashfree] Using BASE URL:', BASE);

const headers = () => {
  const headerObj = {
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
    'x-api-version': '2022-09-01',
    'Content-Type': 'application/json'
  };
  
  console.log('🔍 [Cashfree] Headers (without secret):', {
    'x-client-id': headerObj['x-client-id'] ? 'SET' : 'NOT SET',
    'x-client-secret': headerObj['x-client-secret'] ? 'SET' : 'NOT SET',
    'x-api-version': headerObj['x-api-version'],
    'Content-Type': headerObj['Content-Type']
  });
  
  return headerObj;
};

export const createOrder = async ({ orderId, amount, customer, notes }) => {
  try {
    console.log('🔍 [Cashfree] Creating order with:', {
      orderId,
      amount,
      customer: { customer_id: customer.customer_id, customer_email: customer.customer_email },
      notes
    });
    
    const { data } = await axios.post(`${BASE}/orders`, {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: customer,
      order_note: notes
    }, { headers: headers() });
    
    logger.info('Cashfree order created', { 
      orderId: data.order_id, 
      amount: data.order_amount 
    });
    
    return data;
  } catch (error) {
    console.error('❌ [Cashfree] Error creating order:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    logger.error('Error creating Cashfree order', error.response?.data || error.message);
    throw error;
  }
};

export const getOrder = async (orderId) => {
  try {
    const { data } = await axios.get(`${BASE}/orders/${orderId}`, {
      headers: headers()
    });
    
    return data;
  } catch (error) {
    logger.error('Error fetching Cashfree order', error.response?.data || error.message);
    throw error;
  }
};

export const verifyWebhookSignature = (payload, signature) => {
  // If your Cashfree plan provides HMAC signature header, implement verification here
  // For now, we'll return true as a placeholder
  logger.debug('Cashfree webhook signature verification', { 
    signature: signature ? 'present' : 'missing' 
  });
  return true;
};

export const createRefund = async (orderId, refundId, amount, reason) => {
  try {
    const { data } = await axios.post(`${BASE}/orders/${orderId}/refunds`, {
      refund_id: refundId,
      refund_amount: amount,
      refund_note: reason
    }, { headers: headers() });
    
    logger.info('Cashfree refund created', { 
      refundId: data.refund_id, 
      amount: data.refund_amount 
    });
    
    return data;
  } catch (error) {
    logger.error('Error creating Cashfree refund', error.response?.data || error.message);
    throw error;
  }
};
