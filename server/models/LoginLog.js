const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  username: {
    type: String,
    required: true
  },
  loginType: {
    type: String,
    enum: ['success', 'failed', 'blocked', 'logout'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false,
    default: 'unknown'
  },
  deviceInfo: {
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
    device: { type: String, default: 'unknown' },
    isMobile: { type: Boolean, default: false },
    isBot: { type: Boolean, default: false }
  },
  location: {
    country: { type: String, default: 'unknown' },
    region: { type: String, default: 'unknown' },
    city: { type: String, default: 'unknown' },
    timezone: { type: String, default: 'UTC' },
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    }
  },
  sessionId: {
    type: String,
    default: null
  },
  failureReason: {
    type: String,
    enum: ['invalid_credentials', 'account_locked', 'invalid_totp', 'account_disabled', 'suspicious_activity', 'blocked_ip'],
    required: false,
    sparse: true
  },
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  flags: [{
    type: String,
    enum: ['new_device', 'new_location', 'tor_exit_node', 'vpn_detected', 'suspicious_timing', 'brute_force_attempt']
  }],
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
loginLogSchema.index({ user: 1, createdAt: -1 });
loginLogSchema.index({ ipAddress: 1, createdAt: -1 });
loginLogSchema.index({ loginType: 1, createdAt: -1 });
loginLogSchema.index({ riskScore: -1, createdAt: -1 });
loginLogSchema.index({ flags: 1, createdAt: -1 });
loginLogSchema.index({ createdAt: -1 }); // For cleanup and recent activity

// Static method to log login attempt
loginLogSchema.statics.logAttempt = async function(data) {
  const log = new this(data);
  await log.save();
  return log;
};

// Static method to get user's recent login history
loginLogSchema.statics.getUserHistory = function(userId, limit = 50) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'username email role');
};

// Static method to get suspicious activities
loginLogSchema.statics.getSuspiciousActivities = function(hoursBack = 24, minRiskScore = 50) {
  const timeThreshold = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  return this.find({
    createdAt: { $gte: timeThreshold },
    $or: [
      { riskScore: { $gte: minRiskScore } },
      { flags: { $exists: true, $ne: [] } },
      { loginType: 'blocked' }
    ]
  })
  .sort({ createdAt: -1 })
  .populate('user', 'username email role');
};

// Static method to get login statistics
loginLogSchema.statics.getStats = async function(timeframe = 24) {
  const timeThreshold = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: timeThreshold } } },
    {
      $group: {
        _id: '$loginType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
        uniqueIPs: { $addToSet: '$ipAddress' }
      }
    }
  ]);

  const result = {
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    blocked: 0,
    uniqueUsers: new Set(),
    uniqueIPs: new Set(),
    timeframe: `${timeframe} hours`
  };

  stats.forEach(stat => {
    result.totalAttempts += stat.count;
    result[stat._id] = stat.count;
    stat.uniqueUsers.forEach(user => result.uniqueUsers.add(user.toString()));
    stat.uniqueIPs.forEach(ip => result.uniqueIPs.add(ip));
  });

  result.uniqueUsers = result.uniqueUsers.size;
  result.uniqueIPs = result.uniqueIPs.size;

  return result;
};

// Static method to detect brute force attacks
loginLogSchema.statics.detectBruteForce = async function(ipAddress, timeWindow = 15, maxAttempts = 5) {
  const timeThreshold = new Date(Date.now() - timeWindow * 60 * 1000);
  
  const attempts = await this.countDocuments({
    ipAddress,
    loginType: 'failed',
    createdAt: { $gte: timeThreshold }
  });

  return attempts >= maxAttempts;
};

// Method to calculate risk score
loginLogSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Base score for failed attempts
  if (this.loginType === 'failed') score += 20;
  
  // Flag-based scoring
  this.flags.forEach(flag => {
    switch(flag) {
      case 'new_device': score += 15; break;
      case 'new_location': score += 20; break;
      case 'tor_exit_node': score += 40; break;
      case 'vpn_detected': score += 25; break;
      case 'suspicious_timing': score += 30; break;
      case 'brute_force_attempt': score += 50; break;
    }
  });

  // Time-based scoring (unusual hours)
  const hour = this.createdAt.getHours();
  if (hour < 6 || hour > 22) score += 10;

  this.riskScore = Math.min(score, 100);
  return this.riskScore;
};

module.exports = mongoose.model('LoginLog', loginLogSchema);
