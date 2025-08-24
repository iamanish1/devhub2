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
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectListing',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  dueDate: {
    type: Date,
    default: null
  },
  estimatedHours: {
    type: Number,
    default: 0,
    min: 0
  },
  actualHours: {
    type: Number,
    default: 0,
    min: 0
  },
  completionNotes: {
    type: String,
    trim: true
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    size: Number,
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
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask'
  }],
  milestone: {
    type: String,
    trim: true
  },
  timeLogs: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    loggedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ createdBy: 1, createdAt: -1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ priority: 1, status: 1 });

// Virtual for calculating total time logged
TaskSchema.virtual('totalTimeLogged').get(function() {
  return this.timeLogs.reduce((total, log) => total + log.hours, 0);
});

// Virtual for calculating efficiency
TaskSchema.virtual('efficiency').get(function() {
  if (this.estimatedHours === 0) return 0;
  return ((this.estimatedHours - this.actualHours) / this.estimatedHours) * 100;
});

// Pre-save middleware to update progress based on status
TaskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    switch (this.status) {
      case 'pending':
        this.progress = 0;
        break;
      case 'in_progress':
        this.progress = 50;
        break;
      case 'review':
        this.progress = 80;
        break;
      case 'completed':
        this.progress = 100;
        break;
      case 'cancelled':
        this.progress = 0;
        break;
    }
  }
  next();
});

// Static method to get project statistics
TaskSchema.statics.getProjectStatistics = async function(projectId) {
  const tasks = await this.find({ projectId });
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
  
  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    progressPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    totalEstimatedHours,
    totalActualHours,
    efficiency: totalEstimatedHours > 0 ? ((totalEstimatedHours - totalActualHours) / totalEstimatedHours) * 100 : 0
  };
};

// Instance method to add time log
TaskSchema.methods.addTimeLog = function(userId, hours, description) {
  this.timeLogs.push({
    userId,
    hours,
    description,
    loggedAt: new Date()
  });
  this.actualHours += hours;
  return this.save();
};

// Instance method to add comment
TaskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    content,
    author: userId,
    createdAt: new Date()
  });
  return this.save();
};

const ProjectTask = mongoose.model('ProjectTask', TaskSchema);

export default ProjectTask;