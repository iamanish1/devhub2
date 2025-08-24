import mongoose from 'mongoose';

const ProjectSelectionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectListing',
    required: true,
    index: true
  },
  projectOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  // Selection configuration
  selectionMode: {
    type: String,
    enum: ['manual', 'automatic', 'hybrid'],
    default: 'hybrid',
    required: true
  },
  requiredContributors: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  maxBidsToConsider: {
    type: Number,
    required: true,
    default: 50,
    min: 1,
    max: 200
  },
  // Skill matching criteria
  requiredSkills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    weight: { 
      type: Number, 
      min: 1, 
      max: 10, 
      default: 5 
    },
    required: { 
      type: Boolean, 
      default: false 
    },
    category: {
      type: String,
      enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile', 'AI/ML', 'Other'],
      default: 'Other'
    }
  }],
  // Selection criteria weights (must sum to 100)
  criteriaWeights: {
    skillMatch: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 40 
    },
    bidAmount: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 30 
    },
    experience: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 20 
    },
    availability: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 10 
    }
  },
  // Selection status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'pending',
    index: true
  },
  // Selected users
  selectedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bidding',
      required: true
    },
    selectionScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    selectionReason: {
      type: String,
      enum: ['manual', 'automatic', 'hybrid'],
      required: true
    },
    skillMatchScore: Number,
    bidAmountScore: Number,
    experienceScore: Number,
    availabilityScore: Number,
    selectedAt: { 
      type: Date, 
      default: Date.now 
    },
    notificationSent: { 
      type: Boolean, 
      default: false 
    },
    notificationSentAt: Date,
    acceptedByUser: {
      type: Boolean,
      default: false
    },
    acceptedAt: Date,
    escrowLocked: {
      type: Boolean,
      default: false
    },
    escrowLockedAt: Date
  }],
  // Selection process tracking
  selectionStartedAt: Date,
  selectionCompletedAt: Date,
  totalBidsConsidered: { 
    type: Number, 
    default: 0 
  },
  totalBidsAvailable: { 
    type: Number, 
    default: 0 
  },
  // Error tracking
  lastError: {
    message: String,
    timestamp: Date,
    retryCount: { type: Number, default: 0 }
  },
  // Manual overrides
  manualOverrides: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    action: {
      type: String,
      enum: ['select', 'deselect', 'priority'],
      required: true
    },
    reason: String,
    overriddenAt: { type: Date, default: Date.now }
  }],
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for performance
ProjectSelectionSchema.index({ projectId: 1, status: 1 });
ProjectSelectionSchema.index({ projectOwner: 1, status: 1 });
ProjectSelectionSchema.index({ 'selectedUsers.userId': 1 });
ProjectSelectionSchema.index({ createdAt: -1 });

// Pre-save middleware to validate criteria weights
ProjectSelectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Validate that criteria weights sum to 100
  const weights = this.criteriaWeights;
  const totalWeight = weights.skillMatch + weights.bidAmount + weights.experience + weights.availability;
  
  if (Math.abs(totalWeight - 100) > 0.01) {
    return next(new Error('Criteria weights must sum to 100'));
  }
  
  // Validate required contributors
  if (this.requiredContributors < 1) {
    return next(new Error('Required contributors must be at least 1'));
  }
  
  // Validate max bids to consider
  if (this.maxBidsToConsider < 1) {
    return next(new Error('Max bids to consider must be at least 1'));
  }
  
  next();
});

// Virtual for selection progress
ProjectSelectionSchema.virtual('selectionProgress').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'pending') return 0;
  if (this.status === 'in_progress') {
    return Math.min(90, (this.selectedUsers.length / this.requiredContributors) * 100);
  }
  return 0;
});

// Instance methods
ProjectSelectionSchema.methods.isSelectionComplete = function() {
  return this.selectedUsers.length >= this.requiredContributors;
};

ProjectSelectionSchema.methods.canAddMoreUsers = function() {
  return this.selectedUsers.length < this.requiredContributors;
};

ProjectSelectionSchema.methods.getUserSelectionStatus = function(userId) {
  const selection = this.selectedUsers.find(s => s.userId.toString() === userId.toString());
  return selection ? {
    selected: true,
    score: selection.selectionScore,
    reason: selection.selectionReason,
    accepted: selection.acceptedByUser,
    escrowLocked: selection.escrowLocked
  } : { selected: false };
};

// Static methods
ProjectSelectionSchema.statics.findByProjectId = function(projectId) {
  return this.findOne({ projectId }).populate('selectedUsers.userId', 'username email');
};

ProjectSelectionSchema.statics.findByProjectOwner = function(projectOwnerId) {
  return this.find({ projectOwner: projectOwnerId })
    .populate('projectId', 'project_Title Project_Description')
    .populate('selectedUsers.userId', 'username email')
    .sort({ createdAt: -1 });
};

export default mongoose.model('ProjectSelection', ProjectSelectionSchema);
