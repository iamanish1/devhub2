import dotenv from 'dotenv';
import mongoose from 'mongoose';
import PaymentIntent from './src/Model/PaymentIntentModel.js';
import { verifyOrderWithRazorpay } from './src/services/razorpay.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Debug payment verification
const debugPayment = async (orderId) => {
  try {
    console.log('🔍 Debugging payment verification for orderId:', orderId);
    
    // Check environment variables
    console.log('\n📋 Environment Check:');
    console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET');
    console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT SET');
    console.log('RAZORPAY_ENV:', process.env.RAZORPAY_ENV || 'NOT SET');
    console.log('RAZORPAY_WEBHOOK_SECRET:', process.env.RAZORPAY_WEBHOOK_SECRET ? 'SET' : 'NOT SET');
    
    // Find payment intent
    console.log('\n🔍 Looking for payment intent...');
    const intent = await PaymentIntent.findOne({ orderId });
    
    if (!intent) {
      console.log('❌ No payment intent found with orderId:', orderId);
      
      // Try to find by intentId
      const intentById = await PaymentIntent.findById(orderId);
      if (intentById) {
        console.log('✅ Found payment intent by ID:', intentById._id);
        console.log('Status:', intentById.status);
        console.log('Purpose:', intentById.purpose);
        console.log('OrderId:', intentById.orderId);
      }
      return;
    }
    
    console.log('✅ Found payment intent:');
    console.log('ID:', intent._id);
    console.log('Status:', intent.status);
    console.log('Purpose:', intent.purpose);
    console.log('Amount:', intent.amount);
    console.log('OrderId:', intent.orderId);
    console.log('PaymentId:', intent.paymentId);
    console.log('Notes:', intent.notes);
    
    // Try to verify with Razorpay
    console.log('\n🔍 Verifying with Razorpay...');
    const verified = await verifyOrderWithRazorpay(intent.orderId);
    console.log('Razorpay verification result:', verified);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  
  const orderId = process.argv[2];
  if (!orderId) {
    console.log('Usage: node debug-payment.js <orderId>');
    process.exit(1);
  }
  
  await debugPayment(orderId);
  process.exit(0);
};

main();
