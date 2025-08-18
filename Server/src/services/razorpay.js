import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import { logger } from '../utils/logger.js';

// Initialize Razorpay only if environment variables are set
let rzp = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    logger.info('Razorpay initialized successfully');
  } else {
    logger.warn('Razorpay environment variables not set. Razorpay services will not be available.');
  }
} catch (error) {
  logger.warn('Failed to initialize Razorpay:', error.message);
  rzp = null;
}

export const createOrder = async ({ amount, notes }) => {
  try {
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }
    
    const order = await rzp.orders.create({ 
      amount: amount * 100, 
      currency: 'INR', 
      notes 
    });
    
    logger.info('Razorpay order created', { orderId: order.id, amount });
    return order;
  } catch (error) {
    logger.error('Error creating Razorpay order', error);
    throw error;
  }
};

export const verifySignature = (payload, signature, secret = process.env.RAZORPAY_WEBHOOK_SECRET) => {
  try {
    const hmac = createHmac('sha256', secret).update(payload).digest('hex');
    const isValid = hmac === signature;
    
    logger.debug('Razorpay signature verification', { 
      isValid, 
      expected: hmac, 
      received: signature 
    });
    
    return isValid;
  } catch (error) {
    logger.error('Error verifying Razorpay signature', error);
    return false;
  }
};

// Razorpay Route transfer (marketplace split)
export const createTransfer = async ({ account, amount, notes }) => {
  try {
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }
    
    const transfer = await rzp.transfers.create({ 
      account, 
      amount: amount * 100, 
      currency: 'INR', 
      notes 
    });
    
    logger.info('Razorpay Route transfer created', { 
      transferId: transfer.id, 
      account, 
      amount 
    });
    
    return transfer;
  } catch (error) {
    logger.error('Error creating Razorpay Route transfer', error);
    throw error;
  }
};

// Get payment details
export const getPayment = async (paymentId) => {
  try {
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }
    
    const payment = await rzp.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error('Error fetching Razorpay payment', error);
    throw error;
  }
};

// Get order details
export const getOrder = async (orderId) => {
  try {
    if (!rzp) {
      throw new Error('Razorpay not initialized. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }
    
    const order = await rzp.orders.fetch(orderId);
    return order;
  } catch (error) {
    logger.error('Error fetching Razorpay order', error);
    throw error;
  }
};

export { rzp };
