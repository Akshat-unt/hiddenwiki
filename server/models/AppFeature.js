const mongoose = require('mongoose');

const appFeatureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['core', 'ui', 'security', 'admin', 'experimental'],
    default: 'core'
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  dependencies: [{
    feature: String,
    version: String,
    required: { type: Boolean, default: false }
  }],
  configuration: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  rollout: {
    strategy: {
      type: String,
      enum: ['all', 'percentage', 'whitelist', 'beta'],
      default: 'all'
    },
    percentage: { type: Number, min: 0, max: 100, default: 100 },
    whitelist: [String], // User IDs or roles
    betaUsers: [String] // User IDs
  },
  metrics: {
    usageCount: { type: Number, default: 0 },
    uniqueUsers: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    lastUsed: Date,
    averageResponseTime: { type: Number, default: 0 }
  },
  maintenance: {
    isUnderMaintenance: { type: Boolean, default: false },
    maintenanceReason: String,
    estimatedDowntime: Number, // in minutes
    scheduledMaintenance: {
      start: Date,
      end: Date,
      reason: String
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
appFeatureSchema.index({ name: 1 });
appFeatureSchema.index({ category: 1 });
appFeatureSchema.index({ isEnabled: 1 });
appFeatureSchema.index({ 'rollout.strategy': 1 });

// Method to check if feature is available for user
appFeatureSchema.methods.isAvailableForUser = function(userId, userRole = 'user') {
  if (!this.isEnabled || this.maintenance.isUnderMaintenance) {
    return false;
  }
  
  switch (this.rollout.strategy) {
    case 'all':
      return true;
    
    case 'percentage':
      // Simple hash-based percentage rollout
      const hash = require('crypto').createHash('md5').update(userId + this.name).digest('hex');
      const hashNumber = parseInt(hash.substring(0, 8), 16);
      const userPercentage = (hashNumber % 100) + 1;
      return userPercentage <= this.rollout.percentage;
    
    case 'whitelist':
      return this.rollout.whitelist.includes(userId) || this.rollout.whitelist.includes(userRole);
    
    case 'beta':
      return this.rollout.betaUsers.includes(userId) || userRole === 'admin';
    
    default:
      return false;
  }
};

// Method to record feature usage
appFeatureSchema.methods.recordUsage = function(userId, responseTime = 0, isError = false) {
  this.metrics.usageCount += 1;
  this.metrics.lastUsed = new Date();
  
  if (isError) {
    this.metrics.errorCount += 1;
  }
  
  // Update average response time
  if (responseTime > 0) {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.usageCount - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.usageCount;
  }
  
  return this.save();
};

// Method to toggle feature
appFeatureSchema.methods.toggle = function() {
  this.isEnabled = !this.isEnabled;
  return this.save();
};

// Method to set maintenance mode
appFeatureSchema.methods.setMaintenance = function(isUnderMaintenance, reason = '', estimatedDowntime = 0) {
  this.maintenance.isUnderMaintenance = isUnderMaintenance;
  this.maintenance.maintenanceReason = reason;
  this.maintenance.estimatedDowntime = estimatedDowntime;
  return this.save();
};

// Method to update rollout strategy
appFeatureSchema.methods.updateRollout = function(strategy, options = {}) {
  this.rollout.strategy = strategy;
  
  if (options.percentage !== undefined) {
    this.rollout.percentage = Math.max(0, Math.min(100, options.percentage));
  }
  
  if (options.whitelist) {
    this.rollout.whitelist = options.whitelist;
  }
  
  if (options.betaUsers) {
    this.rollout.betaUsers = options.betaUsers;
  }
  
  return this.save();
};

// Static method to get enabled features
appFeatureSchema.statics.getEnabled = function() {
  return this.find({ isEnabled: true }).sort({ category: 1, name: 1 });
};

// Static method to get features by category
appFeatureSchema.statics.getByCategory = function(category) {
  return this.find({ category }).sort({ name: 1 });
};

// Static method to get features for user
appFeatureSchema.statics.getForUser = async function(userId, userRole = 'user') {
  const features = await this.find({ isEnabled: true });
  return features.filter(feature => feature.isAvailableForUser(userId, userRole));
};

module.exports = mongoose.model('AppFeature', appFeatureSchema);
