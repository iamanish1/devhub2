import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  actualHours: {
    type: Number,
    min: 0,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const ProjectTaskSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  // Project chunks/tasks
  tasks: [TaskSchema],
  // Team members and their roles
  teamMembers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    role: {
      type: String,
      enum: ['contributor', 'lead', 'reviewer', 'admin'],
      default: 'contributor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canCreateTasks: {
        type: Boolean,
        default: false
      },
      canAssignTasks: {
        type: Boolean,
        default: false
      },
      canReviewTasks: {
        type: Boolean,
        default: false
      },
      canManageTeam: {
        type: Boolean,
        default: false
      },
      canViewAllTasks: {
        type: Boolean,
        default: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  }],
  // Project milestones
  milestones: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    dueDate: {
      type: Date,
      required: true
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    tasks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    }
  }],
  // Project resources and files
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    type: {
      type: String,
      enum: ['document', 'image', 'video', 'code', 'other'],
      default: 'document'
    },
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    tags: [String]
  }],
  // Project settings and configuration
  settings: {
    allowTaskCreation: {
      type: Boolean,
      default: true
    },
    allowTaskAssignment: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoAssignTasks: {
      type: Boolean,
      default: false
    },
    notificationPreferences: {
      taskAssigned: {
        type: Boolean,
        default: true
      },
      taskCompleted: {
        type: Boolean,
        default: true
      },
      milestoneReached: {
        type: Boolean,
        default: true
      },
      commentAdded: {
        type: Boolean,
        default: true
      }
    }
  },
  // Project statistics
  statistics: {
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    },
    inProgressTasks: {
      type: Number,
      default: 0
    },
    pendingTasks: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    actualHours: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    averageTaskDuration: {
      type: Number,
      default: 0
    }
  },
  // Project timeline and deadlines
  timeline: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    actualStartDate: Date,
    actualEndDate: Date,
    isDelayed: {
      type: Boolean,
      default: false
    },
    delayReason: String
  },
  // Activity log
  activityLog: [{
    action: {
      type: String,
      enum: ['task_created', 'task_assigned', 'task_completed', 'task_updated', 'milestone_reached', 'member_joined', 'member_left', 'file_uploaded', 'comment_added'],
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    target: {
      type: String,
      enum: ['task', 'milestone', 'member', 'file', 'project'],
      required: true
    },
    targetId: mongoose.Schema.Types.ObjectId,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
ProjectTaskSchema.index({ projectId: 1, status: 1 });
ProjectTaskSchema.index({ projectOwner: 1, status: 1 });
ProjectTaskSchema.index({ 'teamMembers.userId': 1 });
ProjectTaskSchema.index({ 'tasks.assignedTo': 1 });
ProjectTaskSchema.index({ 'tasks.status': 1 });
ProjectTaskSchema.index({ createdAt: -1 });

// Pre-save middleware to update statistics
ProjectTaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update statistics
  if (this.tasks && this.tasks.length > 0) {
    this.statistics.totalTasks = this.tasks.length;
    this.statistics.completedTasks = this.tasks.filter(task => task.status === 'completed').length;
    this.statistics.inProgressTasks = this.tasks.filter(task => task.status === 'in_progress').length;
    this.statistics.pendingTasks = this.tasks.filter(task => task.status === 'pending').length;
    
    this.statistics.completionRate = this.statistics.totalTasks > 0 
      ? Math.round((this.statistics.completedTasks / this.statistics.totalTasks) * 100) 
      : 0;
    
    const totalEstimatedHours = this.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const totalActualHours = this.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    
    this.statistics.totalHours = totalEstimatedHours;
    this.statistics.actualHours = totalActualHours;
    
    const completedTasks = this.tasks.filter(task => task.status === 'completed' && task.actualHours > 0);
    this.statistics.averageTaskDuration = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => sum + task.actualHours, 0) / completedTasks.length 
      : 0;
  }
  
  // Update timeline
  if (this.timeline.endDate && new Date() > this.timeline.endDate && this.status === 'active') {
    this.timeline.isDelayed = true;
  }
  
  next();
});

// Virtual properties
ProjectTaskSchema.virtual('isOverdue').get(function() {
  return this.timeline.endDate && new Date() > this.timeline.endDate;
});

ProjectTaskSchema.virtual('daysRemaining').get(function() {
  if (!this.timeline.endDate) return null;
  const now = new Date();
  const end = new Date(this.timeline.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

ProjectTaskSchema.virtual('activeTeamMembers').get(function() {
  return this.teamMembers.filter(member => member.isActive);
});

// Instance methods
ProjectTaskSchema.methods.addTeamMember = function(userId, role = 'contributor', permissions = {}) {
  const existingMember = this.teamMembers.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a team member');
  }
  
  this.teamMembers.push({
    userId,
    role,
    permissions: {
      canCreateTasks: permissions.canCreateTasks || false,
      canAssignTasks: permissions.canAssignTasks || false,
      canReviewTasks: permissions.canReviewTasks || false,
      canManageTeam: permissions.canManageTeam || false,
      canViewAllTasks: permissions.canViewAllTasks !== false
    }
  });
  
  this.addActivityLog('member_joined', userId, 'member', userId, { role, permissions });
  
  return this;
};

ProjectTaskSchema.methods.removeTeamMember = function(userId) {
  const memberIndex = this.teamMembers.findIndex(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a team member');
  }
  
  this.teamMembers[memberIndex].isActive = false;
  this.addActivityLog('member_left', userId, 'member', userId);
  
  return this;
};

ProjectTaskSchema.methods.createTask = function(taskData, createdBy) {
  const task = {
    ...taskData,
    assignedBy: createdBy,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  this.tasks.push(task);
  this.addActivityLog('task_created', createdBy, 'task', task._id, taskData);
  
  return task;
};

ProjectTaskSchema.methods.assignTask = function(taskId, assignedTo, assignedBy) {
  const task = this.tasks.id(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  task.assignedTo = assignedTo;
  task.updatedAt = new Date();
  
  this.addActivityLog('task_assigned', assignedBy, 'task', taskId, { assignedTo });
  
  return task;
};

ProjectTaskSchema.methods.completeTask = function(taskId, completedBy) {
  const task = this.tasks.id(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  task.status = 'completed';
  task.completedAt = new Date();
  task.completedBy = completedBy;
  task.progress = 100;
  task.updatedAt = new Date();
  
  this.addActivityLog('task_completed', completedBy, 'task', taskId);
  
  return task;
};

ProjectTaskSchema.methods.addComment = function(taskId, userId, content) {
  const task = this.tasks.id(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  task.comments.push({
    user: userId,
    content,
    timestamp: new Date()
  });
  
  this.addActivityLog('comment_added', userId, 'task', taskId, { content: content.substring(0, 100) });
  
  return task;
};

ProjectTaskSchema.methods.addActivityLog = function(action, user, target, targetId, details = {}) {
  this.activityLog.push({
    action,
    user,
    target,
    targetId,
    details,
    timestamp: new Date()
  });
  
  // Keep only last 1000 activities
  if (this.activityLog.length > 1000) {
    this.activityLog = this.activityLog.slice(-1000);
  }
  
  return this;
};

// Static methods
ProjectTaskSchema.statics.findByProjectId = function(projectId) {
  return this.findOne({ projectId })
    .populate('projectOwner', 'username email')
    .populate('teamMembers.userId', 'username email')
    .populate('tasks.assignedTo', 'username email')
    .populate('tasks.assignedBy', 'username email')
    .populate('tasks.completedBy', 'username email')
    .populate('tasks.comments.user', 'username email')
    .populate('milestones.completedBy', 'username email')
    .populate('resources.uploadedBy', 'username email')
    .populate('activityLog.user', 'username email');
};

ProjectTaskSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { projectOwner: userId },
      { 'teamMembers.userId': userId }
    ]
  })
    .populate('projectOwner', 'username email')
    .populate('teamMembers.userId', 'username email')
    .sort({ updatedAt: -1 });
};

ProjectTaskSchema.statics.findUserTasks = function(userId) {
  return this.find({
    'tasks.assignedTo': userId,
    'tasks.status': { $ne: 'completed' }
  })
    .populate('projectOwner', 'username email')
    .populate('tasks.assignedTo', 'username email')
    .sort({ 'tasks.dueDate': 1 });
};

export default mongoose.model('ProjectTask', ProjectTaskSchema);