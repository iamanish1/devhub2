import mongoose from "mongoose";

const BonusPoolSchema = new mongoose.Schema({
  projectId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProjectListing', 
    index: true, 
    required: true 
  },
  totalBonus: { 
    type: Number, 
    required: true 
  },
  commission: { 
    rate: { 
      type: Number, 
      default: 0.10 
    }, 
    amount: { 
      type: Number, 
      required: true 
    } 
  },
  splits: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'user' 
    },
    amount: Number,
    routeTransferId: String, // Razorpay Route transfer id (if used)
    payoutId: String         // if using Cashfree/RazorpayX instead
  }],
  status: { 
    type: String, 
    enum: ['funded', 'released', 'refunded'], 
    default: 'funded' 
  }
}, { 
  timestamps: true 
});

const BonusPool = mongoose.model('BonusPool', BonusPoolSchema);
export default BonusPool;
