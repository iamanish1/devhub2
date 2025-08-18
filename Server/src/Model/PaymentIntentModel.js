import mongoose from "mongoose";

const PaymentIntentSchema = new mongoose.Schema({
  provider: { 
    type: String, 
    enum: ['razorpay', 'cashfree'], 
    required: true 
  },
  purpose: { 
    type: String, 
    enum: ['bid_fee', 'listing', 'bonus', 'subscription'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  }, // INR whole number
  currency: { 
    type: String, 
    default: 'INR' 
  },
  orderId: String,     // provider order id
  paymentId: String,   // provider payment id
  status: { 
    type: String, 
    enum: ['created', 'paid', 'failed'], 
    default: 'created' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    index: true 
  },
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProjectListing', 
    index: true 
  },
  notes: mongoose.Schema.Types.Mixed
}, { 
  timestamps: true 
});

const PaymentIntent = mongoose.model('PaymentIntent', PaymentIntentSchema);
export default PaymentIntent;
