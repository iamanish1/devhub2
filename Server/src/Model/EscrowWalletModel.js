import mongoose from 'mongoose';

const EscrowWalletSchema = new mongoose.Schema({
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
  // Escrow status
  status: {
    type: String,
    enum: ['active', 'locked', 'released', 'refunded', 'cancelled'],
    default: 'active',
    index: true
  },
  // Total amounts
  totalBidAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalBonusPool: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalEscrowAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  // Locked funds tracking
  lockedFunds: [{
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
    bidAmount: {
      type: Number,
      required: true,
      min: 0
    },
    bonusAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    lockStatus: {
      type: String,
      enum: ['pending', 'locked', 'released', 'moved_to_balance', 'refunded', 'withdrawn'],
      default: 'pending'
    },
    lockedAt: Date,
    releasedAt: Date,
    movedToBalanceAt: Date,
    refundedAt: Date,
    // Payment details
    paymentIntentId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    // Release details
    releaseReason: {
      type: String,
      enum: ['project_completion', 'manual_release', 'refund', 'cancellation'],
      default: 'project_completion'
    },
    releaseNotes: String,
    // Withdrawal details
    withdrawnAt: Date,
    withdrawalMethod: String,
    accountDetails: Object
  }],
  // Bonus pool distribution
  bonusPoolDistribution: {
    totalContributors: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    amountPerContributor: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    distributedAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  // Project completion tracking
  projectCompletion: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    completionNotes: String,
    qualityScore: {
      type: Number,
      min: 1,
      max: 10
    }
  },
  // Payment processing
  paymentProcessing: {
    lastProcessedAt: Date,
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    }
  },
  // Security and audit
  security: {
    lockHash: String,
    releaseHash: String,
    lastAuditAt: Date,
    auditLog: [{
      action: {
        type: String,
        enum: ['lock', 'release', 'refund', 'audit', 'move_to_balance'],
        required: true
      },
      amount: Number,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      notes: String,
      ipAddress: String,
      userAgent: String
    }]
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lockedAt: Date,
  releasedAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

// Indexes for performance
EscrowWalletSchema.index({ projectId: 1, status: 1 });
EscrowWalletSchema.index({ projectOwner: 1, status: 1 });
EscrowWalletSchema.index({ 'lockedFunds.userId': 1 });
EscrowWalletSchema.index({ createdAt: -1 });
EscrowWalletSchema.index({ status: 1, 'paymentProcessing.processingStatus': 1 });

// Pre-save middleware
EscrowWalletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total escrow amount if not already set
  if (!this.totalEscrowAmount) {
    this.totalEscrowAmount = this.totalBidAmount + this.totalBonusPool;
  }
  
  // Calculate bonus pool distribution if not already set
  if (this.bonusPoolDistribution && this.bonusPoolDistribution.totalContributors > 0) {
    if (!this.bonusPoolDistribution.amountPerContributor) {
      this.bonusPoolDistribution.amountPerContributor = 
        Math.floor(this.totalBonusPool / this.bonusPoolDistribution.totalContributors);
    }
    if (!this.bonusPoolDistribution.remainingAmount) {
      this.bonusPoolDistribution.remainingAmount = 
        this.totalBonusPool - this.bonusPoolDistribution.distributedAmount;
    }
  }
  
  // Validate amounts
  if (this.totalEscrowAmount < 0) {
    return next(new Error('Total escrow amount cannot be negative'));
  }
  
  if (this.bonusPoolDistribution && this.bonusPoolDistribution.remainingAmount < 0) {
    return next(new Error('Remaining bonus pool amount cannot be negative'));
  }
  
  next();
});

// Virtual properties
EscrowWalletSchema.virtual('isLocked').get(function() {
  return this.status === 'locked';
});

EscrowWalletSchema.virtual('isReleased').get(function() {
  return this.status === 'released';
});

EscrowWalletSchema.virtual('canRelease').get(function() {
  return this.status === 'locked' && this.projectCompletion.isCompleted;
});

EscrowWalletSchema.virtual('lockedFundsCount').get(function() {
  return this.lockedFunds.filter(fund => fund.lockStatus === 'locked').length;
});

EscrowWalletSchema.virtual('totalLockedAmount').get(function() {
  return this.lockedFunds
    .filter(fund => fund.lockStatus === 'locked')
    .reduce((sum, fund) => sum + fund.totalAmount, 0);
});

// Instance methods
EscrowWalletSchema.methods.lockUserFunds = function(userId, bidId, bidAmount, bonusAmount = 0) {
  const totalAmount = bidAmount + bonusAmount;
  
  // Check if funds are already locked for this user
  const existingLock = this.lockedFunds.find(fund => 
    fund.userId.toString() === userId.toString() && fund.bidId.toString() === bidId.toString()
  );
  
  if (existingLock) {
    throw new Error('Funds already locked for this user and bid');
  }
  
  // Add new locked fund
  this.lockedFunds.push({
    userId,
    bidId,
    bidAmount,
    bonusAmount,
    totalAmount,
    lockStatus: 'locked',
    lockedAt: new Date()
  });
  
  // Don't update totals here as they should be calculated when escrow wallet is created
  // The totals are already set correctly during escrow wallet creation
  
  // Update status
  if (this.status === 'active') {
    this.status = 'locked';
    this.lockedAt = new Date();
  }
  
  return this;
};

EscrowWalletSchema.methods.releaseUserFunds = function(userId, bidId, reason = 'project_completion') {
  const fund = this.lockedFunds.find(f => 
    f.userId.toString() === userId.toString() && f.bidId.toString() === bidId.toString()
  );
  
  if (!fund) {
    throw new Error('No locked funds found for this user and bid');
  }
  
  if (fund.lockStatus !== 'locked') {
    throw new Error(`Funds are not locked. Current status: ${fund.lockStatus}`);
  }
  
  // Update fund status
  fund.lockStatus = 'released';
  fund.releasedAt = new Date();
  fund.releaseReason = reason;
  
  // Update bonus pool distribution
  this.bonusPoolDistribution.distributedAmount += fund.bonusAmount;
  this.bonusPoolDistribution.remainingAmount -= fund.bonusAmount;
  
  // Check if all funds are released
  const allReleased = this.lockedFunds.every(fund => fund.lockStatus === 'released');
  if (allReleased) {
    this.status = 'released';
    this.releasedAt = new Date();
  }
  
  return this;
};

EscrowWalletSchema.methods.refundUserFunds = function(userId, bidId, reason = 'cancellation') {
  const fund = this.lockedFunds.find(f => 
    f.userId.toString() === userId.toString() && f.bidId.toString() === bidId.toString()
  );
  
  if (!fund) {
    throw new Error('No locked funds found for this user and bid');
  }
  
  if (fund.lockStatus !== 'locked') {
    throw new Error(`Funds are not locked. Current status: ${fund.lockStatus}`);
  }
  
  // Update fund status
  fund.lockStatus = 'refunded';
  fund.refundedAt = new Date();
  fund.releaseReason = 'refund';
  
  // Update totals
  this.totalBidAmount -= fund.bidAmount;
  // Don't subtract from totalBonusPool as it's the total pool amount
  // this.totalBonusPool -= fund.bonusAmount;
  this.totalEscrowAmount -= fund.totalAmount;
  
  return this;
};

EscrowWalletSchema.methods.moveFundsToBalance = function(userId) {
  const fund = this.lockedFunds.find(f => 
    f.userId.toString() === userId.toString()
  );
  
  if (!fund) {
    throw new Error('No escrow funds found for this user');
  }
  
  if (fund.lockStatus !== 'released') {
    throw new Error(`Funds cannot be moved to balance. Current status: ${fund.lockStatus}`);
  }
  
  if (fund.lockStatus === 'moved_to_balance') {
    throw new Error('Funds have already been moved to balance');
  }
  
  // Update fund status
  fund.lockStatus = 'moved_to_balance';
  fund.movedToBalanceAt = new Date();
  
  return this;
};

EscrowWalletSchema.methods.addAuditLog = function(action, amount, userId, notes = '', ipAddress = '', userAgent = '') {
  this.security.auditLog.push({
    action,
    amount,
    userId,
    notes,
    ipAddress,
    userAgent,
    timestamp: new Date()
  });
  
  this.security.lastAuditAt = new Date();
  return this;
};

// Static methods
EscrowWalletSchema.statics.findByProjectId = function(projectId) {
  return this.findOne({ projectId })
    .populate('projectOwner', 'username email')
    .populate('lockedFunds.userId', 'username email')
    .populate('projectCompletion.completedBy', 'username email');
};

EscrowWalletSchema.statics.findByProjectOwner = function(projectOwnerId) {
  return this.find({ projectOwner: projectOwnerId })
    .populate('projectId', 'project_Title Project_Description')
    .populate('lockedFunds.userId', 'username email')
    .sort({ createdAt: -1 });
};

EscrowWalletSchema.statics.findActiveEscrows = function() {
  return this.find({ 
    status: { $in: ['active', 'locked'] },
    'paymentProcessing.processingStatus': { $ne: 'processing' }
  });
};

export default mongoose.model('EscrowWallet', EscrowWalletSchema);
