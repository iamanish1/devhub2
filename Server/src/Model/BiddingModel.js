import mongoose from 'mongoose'; 
import user from './UserModel.js';
import ProjectListing from './ProjectListingModel.js';

const BiddingSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectListing', // Use model name as a string
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Use model name as a string
    required: true,
  },
  bid_amount: {
    type: Number,
    required: true,
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
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Add a unique compound index for safety
BiddingSchema.index({ project_id: 1, user_id: 1 }, { unique: true });

const Bidding = mongoose.model('Bidding', BiddingSchema);
export default Bidding;
