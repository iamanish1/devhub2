import mongoose from 'mongoose';

const PayoutSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['cashfree', 'razorpay'],
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectListing'
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  payoutId: String, // Razorpay payout id
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date
});

export default mongoose.model('Payout', PayoutSchema);
