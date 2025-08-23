import mongoose from 'mongoose';

const BonusPoolSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectListing',
    required: false // Allow null for new projects
  },
  projectOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  contributorCount: {
    type: Number,
    required: true
  },
  amountPerContributor: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'funded', 'distributed', 'cancelled'],
    default: 'pending'
  },
  // Payment details
  paymentIntentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentIntent'
  },
  orderId: String, // Razorpay order id
  payoutId: String, // Razorpay payout id for distribution
  // Distribution tracking
  distributedAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  // New project fields
  projectTitle: String,
  isNewProject: {
    type: Boolean,
    default: false
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  fundedAt: Date,
  distributedAt: Date
});

BonusPoolSchema.pre('save', function(next) {
  if (this.isModified('totalAmount') || this.isModified('distributedAmount')) {
    this.remainingAmount = this.totalAmount - this.distributedAmount;
  }
  next();
});

export default mongoose.model('BonusPool', BonusPoolSchema);
