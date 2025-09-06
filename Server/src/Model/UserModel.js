import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  usertype: {
    type: String,
    required: true,
    enum: ["Fresher Developer", "Senior Developer", "Junior Developer"],
    default: "fresher developer",
  },
  password: {
    type: String,
    required: function () {
      return !this.githubId;
    }, // Password required only if not using GitHub login
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true, // Allows `null` values without breaking uniqueness
  },
  // Free bid tracking (5 free bids for new users)
  freeBids: {
    remaining: { type: Number, default: 5 },
    used: { type: Number, default: 0 }
  },
  // Enhanced subscription system
  subscription: {
    isActive: { type: Boolean, default: false },
    planType: { 
      type: String, 
      enum: ['weekly', 'monthly', 'yearly'], 
      default: null 
    },
    planName: { 
      type: String, 
      enum: ['starter', 'pro', 'enterprise'], 
      default: null 
    },
    expiresAt: { type: Date },
    startedAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    paymentIntentId: { type: String },
    razorpaySubscriptionId: { type: String },
    features: {
      unlimitedBids: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      premiumBadge: { type: Boolean, default: false },
      earlyAccess: { type: Boolean, default: false },
      customProfile: { type: Boolean, default: false },
      projectBoosting: { type: Boolean, default: false },
      teamCollaboration: { type: Boolean, default: false }
    }
  },
  // Balance and withdrawal system
  balance: {
    available: { type: Number, default: 0, min: 0 }, // Available balance for withdrawal
    pending: { type: Number, default: 0, min: 0 },   // Pending withdrawals
    total: { type: Number, default: 0, min: 0 }      // Total earnings
  },
  // Bank account details for withdrawals
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String
  },
  // Withdrawal history
  withdrawals: [{
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    method: { type: String, default: 'bank_transfer' },
    referenceId: String,
    createdAt: { type: Date, default: Date.now },
    processedAt: Date,
    notes: String
  }]
});

const user = mongoose.model("user", UserSchema);

export default user; // exporting the User Model for use in other files. { UserSchema }; // Exporting the schema for use in other files.