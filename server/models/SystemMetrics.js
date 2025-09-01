const mongoose = require('mongoose');

const systemMetricsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  serverStats: {
    cpu: {
      usage: { type: Number, default: 0 },
      cores: { type: Number, default: 1 },
      loadAverage: [Number]
    },
    memory: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      free: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    disk: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      free: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    uptime: { type: Number, default: 0 },
    processes: { type: Number, default: 0 }
  },
  databaseStats: {
    connections: { type: Number, default: 0 },
    collections: { type: Number, default: 0 },
    documents: { type: Number, default: 0 },
    dataSize: { type: Number, default: 0 },
    indexSize: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }
  },
  apiStats: {
    requestsPerMinute: { type: Number, default: 0 },
    totalRequests: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    activeConnections: { type: Number, default: 0 }
  },
  appStats: {
    activeUsers: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    wikiSearches: { type: Number, default: 0 },
    articlesViewed: { type: Number, default: 0 },
    bookmarksCreated: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for performance
systemMetricsSchema.index({ timestamp: -1 });
systemMetricsSchema.index({ 'serverStats.cpu.usage': -1 });
systemMetricsSchema.index({ 'serverStats.memory.percentage': -1 });

// Static method to get latest metrics
systemMetricsSchema.statics.getLatest = function() {
  return this.findOne().sort({ timestamp: -1 });
};

// Static method to get metrics for time range
systemMetricsSchema.statics.getForTimeRange = function(startTime, endTime, limit = 100) {
  return this.find({
    timestamp: { $gte: startTime, $lte: endTime }
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Static method to cleanup old metrics (keep last 30 days)
systemMetricsSchema.statics.cleanup = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
};

module.exports = mongoose.model('SystemMetrics', systemMetricsSchema);
