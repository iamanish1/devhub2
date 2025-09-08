import mongoose from "mongoose";
import user from "./UserModel.js";
import ProjectListing from "./ProjectListingModel.js";

const BiddingSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProjectListing",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  bid_amount: {
    type: Number,
    required: true,
    comment: "User's original bid amount (without fee)"
  },
  bid_fee: {
    type: Number,
    default: 9,
    comment: "Bidding fee (₹9)"
  },
  total_amount: {
    type: Number,
    required: true,
    comment: "Total amount including bid fee (bid_amount + bid_fee)"
  },
  year_of_experience: {
    type: Number,
    required: true,
  },
  bid_description: {
    type: String,
    required: true,
  },
  hours_avilable_per_week: {
    type: Number,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  bid_status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },
  // Payment and escrow related fields
  payment_status: {
    type: String,
    enum: ["pending", "locked", "paid", "refunded", "free"],
    default: "pending",
    comment: "pending: not paid yet, locked: in escrow, paid: to contributor, refunded: back to bidder, free: no payment required"
  },
  escrow_details: {
    locked_at: Date,
    payment_intent_id: String,
    provider: { type: String, default: 'razorpay' }
  },
  // Free bid tracking
  is_free_bid: {
    type: Boolean,
    default: false,
    comment: "Whether this bid used a free bid credit"
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

// Update timestamp on save
BiddingSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Calculate total amount before saving
BiddingSchema.pre('save', function(next) {
  if (this.isModified('bid_amount') || this.isNew) {
    this.total_amount = this.bid_amount + this.bid_fee;
  }
  next();
});

// Add a unique compound index for safety
BiddingSchema.index({ project_id: 1, user_id: 1 }, { unique: true });

const Bidding = mongoose.model("Bidding", BiddingSchema);
export default Bidding;
