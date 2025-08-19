import mongoose from 'mongoose';

const PaymentIntentSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['cashfree'],
    required: true
  },
  purpose: {
    type: String,
    enum: ['bid_fee', 'bonus_funding', 'listing', 'subscription', 'withdrawal_fee'],
    required: true
  },
  amount: {
    type: Number,
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
  orderId: String,
  status: {
    type: String,
    enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
    default: 'created'
  },
  notes: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PaymentIntentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('PaymentIntent', PaymentIntentSchema);
