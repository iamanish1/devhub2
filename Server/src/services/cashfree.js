import axios from 'axios';
import { logger } from '../utils/logger.js';

const BASE = process.env.CASHFREE_ENV === 'sandbox'
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg';

const headers = () => ({
  'x-client-id': process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  'x-api-version': '2022-09-01',
  'Content-Type': 'application/json'
});

export const createOrder = async ({ orderId, amount, customer, notes }) => {
  try {
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
