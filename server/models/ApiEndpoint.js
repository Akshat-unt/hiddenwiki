const mongoose = require('mongoose');

const apiEndpointSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rateLimit: {
    windowMs: { type: Number, default: 15 * 60 * 1000 }, // 15 minutes
    maxRequests: { type: Number, default: 100 },
    enabled: { type: Boolean, default: true }
  },
  authentication: {
    required: { type: Boolean, default: false },
    roles: [{ type: String, enum: ['admin', 'user'] }]
  },
  monitoring: {
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    lastAccessed: Date,
    errorRate: { type: Number, default: 0 }
  },
  maintenance: {
    isUnderMaintenance: { type: Boolean, default: false },
    maintenanceMessage: String,
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
apiEndpointSchema.index({ endpoint: 1, method: 1 });
apiEndpointSchema.index({ isActive: 1 });
apiEndpointSchema.index({ 'authentication.required': 1 });

// Method to record API call
apiEndpointSchema.methods.recordCall = function(success = true, responseTime = 0) {
  this.monitoring.totalRequests += 1;
  this.monitoring.lastAccessed = new Date();
  
  if (success) {
    this.monitoring.successfulRequests += 1;
  } else {
    this.monitoring.failedRequests += 1;
  }
  
  // Update average response time
  const totalTime = this.monitoring.avgResponseTime * (this.monitoring.totalRequests - 1) + responseTime;
  this.monitoring.avgResponseTime = totalTime / this.monitoring.totalRequests;
  
  // Update error rate
  this.monitoring.errorRate = (this.monitoring.failedRequests / this.monitoring.totalRequests) * 100;
  
  return this.save();
};

// Method to toggle endpoint status
apiEndpointSchema.methods.toggle = function() {
  this.isActive = !this.isActive;
  return this.save();
};

// Method to set maintenance mode
apiEndpointSchema.methods.setMaintenance = function(isUnderMaintenance, message = '') {
  this.maintenance.isUnderMaintenance = isUnderMaintenance;
  this.maintenance.maintenanceMessage = message;
  return this.save();
};

// Static method to get active endpoints
apiEndpointSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ endpoint: 1 });
};

// Static method to get endpoints by method
apiEndpointSchema.statics.getByMethod = function(method) {
  return this.find({ method: method.toUpperCase() }).sort({ endpoint: 1 });
};

// Static method to get performance statistics
apiEndpointSchema.statics.getPerformanceStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalRequests: { $sum: '$monitoring.totalRequests' },
        totalSuccessful: { $sum: '$monitoring.successfulRequests' },
        totalFailed: { $sum: '$monitoring.failedRequests' },
        avgResponseTime: { $avg: '$monitoring.avgResponseTime' },
        avgErrorRate: { $avg: '$monitoring.errorRate' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRequests: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    avgResponseTime: 0,
    avgErrorRate: 0
  };
};

module.exports = mongoose.model('ApiEndpoint', apiEndpointSchema);
