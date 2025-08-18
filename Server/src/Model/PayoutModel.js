import mongoose from "mongoose";

const PayoutSchema = new mongoose.Schema({
  provider: { 
    type: String, 
    enum: ['cashfree', 'razorpayx'] 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user' 
  },
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProjectListing' 
  },
  amount: Number,
  feeApplied: Number,
  status: { 
    type: String, 
    enum: ['queued', 'processed', 'failed', 'reversed'], 
    default: 'queued' 
  },
  externalId: String
}, { 
  timestamps: true 
});

const Payout = mongoose.model('Payout', PayoutSchema);
export default Payout;
