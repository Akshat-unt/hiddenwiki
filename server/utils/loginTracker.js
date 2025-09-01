const UAParser = require('ua-parser-js');
const LoginLog = require('../models/LoginLog');
const User = require('../models/User');
const crypto = require('crypto');

class LoginTracker {
  constructor() {
    this.suspiciousIPs = new Set();
    this.knownTorExits = new Set(); // In production, load from external source
    this.knownVPNs = new Set(); // In production, load from external source
  }

  /**
   * Parse user agent and extract device information with error handling
   */
  parseUserAgent(userAgent) {
    try {
      if (!userAgent || userAgent === 'unknown') {
        return {
          browser: 'unknown',
          os: 'unknown',
          device: 'unknown',
          isMobile: false,
          isBot: false
        };
      }
      
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      
      return {
        browser: result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : 'unknown',
        os: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : 'unknown',
        device: result.device.model || result.device.type || 'Desktop',
        isMobile: result.device.type === 'mobile' || result.device.type === 'tablet',
        isBot: /bot|crawler|spider|scraper/i.test(userAgent)
      };
    } catch (error) {
      console.error('⚠️ Error parsing user agent:', error.message);
      return {
        browser: 'unknown',
        os: 'unknown',
        device: 'unknown',
        isMobile: false,
        isBot: false
      };
    }
  }

  /**
   * Get location information from IP with real geolocation and fallbacks
   */
  async getLocationFromIP(ipAddress) {
    try {
      // Handle localhost/development IPs
      if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'localhost' || !ipAddress) {
        return {
          country: 'Local',
          region: 'Development',
          city: 'Localhost',
          timezone: 'UTC',
          coordinates: { lat: 0, lng: 0 }
        };
      }

      // Try real geolocation service (free tier of ip-api.com)
      try {
        const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,timezone,lat,lon`, {
          timeout: 5000 // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            return {
              country: data.country || 'unknown',
              region: data.regionName || 'unknown',
              city: data.city || 'unknown',
              timezone: data.timezone || 'UTC',
              coordinates: { lat: data.lat || 0, lng: data.lon || 0 }
            };
          }
        }
      } catch (apiError) {
        console.warn('🌍 Geolocation API failed, using fallback:', apiError.message);
      }

      // Fallback to default location
      return {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
        timezone: 'UTC',
        coordinates: { lat: 0, lng: 0 }
      };
      
    } catch (error) {
      console.error('⚠️ Error getting location:', error.message);
      return {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
        timezone: 'UTC',
        coordinates: { lat: 0, lng: 0 }
      };
    }
  }

  /**
   * Detect suspicious activity flags with robust error handling
   */
  async detectFlags(userId, ipAddress, deviceInfo, location) {
    const flags = [];

    try {
      // Only check for new device/location if we have a valid userId
      if (userId) {
        try {
          // Check for new device
          const recentLogins = await LoginLog.find({
            user: userId,
            loginType: 'success',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days
          }).limit(50);

          const knownDevices = new Set(
            recentLogins.map(log => 
              `${log.deviceInfo?.browser || 'unknown'}-${log.deviceInfo?.os || 'unknown'}`
            )
          );

          const currentDevice = `${deviceInfo.browser || 'unknown'}-${deviceInfo.os || 'unknown'}`;
          if (!knownDevices.has(currentDevice)) {
            flags.push('new_device');
          }

          // Check for new location
          const knownLocations = new Set(
            recentLogins.map(log => 
              `${log.location?.country || 'unknown'}-${log.location?.city || 'unknown'}`
            )
          );

          const currentLocation = `${location.country || 'unknown'}-${location.city || 'unknown'}`;
          if (!knownLocations.has(currentLocation)) {
            flags.push('new_location');
          }
        } catch (historyError) {
          console.warn('⚠️ Could not check login history for flags:', historyError.message);
        }
      }

      // Check for Tor exit node (mock - in production, use real Tor exit list)
      if (this.knownTorExits.has(ipAddress)) {
        flags.push('tor_exit_node');
      }

      // Check for VPN (mock - in production, use VPN detection service)
      if (this.knownVPNs.has(ipAddress)) {
        flags.push('vpn_detected');
      }

      // Check for suspicious timing (multiple rapid attempts)
      try {
        const recentAttempts = await LoginLog.countDocuments({
          ipAddress,
          createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // 5 minutes
        });

        if (recentAttempts > 3) {
          flags.push('suspicious_timing');
        }
      } catch (timingError) {
        console.warn('⚠️ Could not check timing for flags:', timingError.message);
      }

      // Check for brute force
      try {
        const isBruteForce = await LoginLog.detectBruteForce(ipAddress);
        if (isBruteForce) {
          flags.push('brute_force_attempt');
        }
      } catch (bruteError) {
        console.warn('⚠️ Could not check brute force for flags:', bruteError.message);
      }

    } catch (error) {
      console.error('⚠️ Error detecting flags:', error.message);
    }

    return flags;
  }

  /**
   * Calculate risk score based on flags and context
   */
  calculateRiskScore(loginType, flags) {
    let score = 0;

    // Base score for failed attempts
    if (loginType === 'failed') score += 20;
    if (loginType === 'blocked') score += 30;

    // Flag-based scoring
    flags.forEach(flag => {
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
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Log a login attempt with comprehensive error handling
   */
  async logAttempt({
    user,
    username,
    loginType,
    ipAddress,
    userAgent,
    failureReason = null,
    sessionId = null
  }) {
    try {
      // Provide safe defaults
      const safeUserAgent = userAgent || 'unknown';
      const safeIpAddress = ipAddress || 'unknown';
      const safeUsername = username || 'unknown';
      
      console.log(`📝 Logging ${loginType} attempt for ${safeUsername} from ${safeIpAddress}`);

      // Parse device information
      const deviceInfo = this.parseUserAgent(safeUserAgent);

      // Get location information
      const location = await this.getLocationFromIP(safeIpAddress);

      // Detect suspicious flags
      const flags = await this.detectFlags(user, safeIpAddress, deviceInfo, location);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(loginType, flags);

      // Prepare log data
      const logData = {
        username: safeUsername,
        loginType,
        ipAddress: safeIpAddress,
        userAgent: safeUserAgent,
        deviceInfo,
        location,
        flags,
        riskScore
      };

      // Only add optional fields if they have valid values
      if (user) {
        logData.user = user;
      }
      if (sessionId) {
        logData.sessionId = sessionId;
      }
      if (failureReason) {
        logData.failureReason = failureReason;
      }

      // Create and save the log
      const loginLog = new LoginLog(logData);
      await loginLog.save();

      console.log(`✅ Login attempt logged successfully: ${loginType} for ${safeUsername} (Risk: ${riskScore})`);

      // Add to suspicious IPs if high risk
      if (riskScore >= 70) {
        this.suspiciousIPs.add(safeIpAddress);
        console.log(`🚨 High-risk IP detected: ${safeIpAddress} (Score: ${riskScore})`);
      }

      return loginLog;

    } catch (error) {
      console.error('❌ Failed to log login attempt:', error.message);
      console.error('Login data:', { user, username, loginType, ipAddress, userAgent, failureReason, sessionId });
      // Don't throw - logging should not break the login process
      return null;
    }
  }

  /**
   * Check if an IP should be blocked
   */
  async shouldBlockIP(ipAddress) {
    try {
      if (!ipAddress || ipAddress === 'unknown') {
        return false;
      }

      // Check if IP is in suspicious list
      if (this.suspiciousIPs.has(ipAddress)) {
        return true;
      }

      // Check recent failed attempts
      const recentFailures = await LoginLog.countDocuments({
        ipAddress,
        loginType: { $in: ['failed', 'blocked'] },
        createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
      });

      if (recentFailures >= 5) {
        this.suspiciousIPs.add(ipAddress);
        console.log(`🚫 Blocking IP due to repeated failures: ${ipAddress}`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('⚠️ Error checking IP block status:', error.message);
      return false; // Fail open - don't block if we can't determine
    }
  }

  /**
   * Get dashboard data for admin panel
   */
  async getDashboardData(timeframe = 24) {
    try {
      const timeThreshold = new Date(Date.now() - timeframe * 60 * 60 * 1000);

      // Get basic stats
      const stats = await LoginLog.getStats(timeframe);

      // Get suspicious activities
      const suspiciousActivities = await LoginLog.getSuspiciousActivities(timeframe, 50);

      // Get blocked IPs
      const blockedIPs = Array.from(this.suspiciousIPs);

      return {
        stats,
        suspiciousActivities: suspiciousActivities || [],
        blockedIPs
      };

    } catch (error) {
      console.error('⚠️ Error getting dashboard data:', error.message);
      return {
        stats: {
          totalAttempts: 0,
          successful: 0,
          failed: 0,
          blocked: 0,
          uniqueUsers: 0,
          uniqueIPs: 0,
          timeframe: `${timeframe} hours`
        },
        suspiciousActivities: [],
        blockedIPs: []
      };
    }
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(timeframe = 24, minRiskScore = 50) {
    try {
      return await LoginLog.getSuspiciousActivities(timeframe, minRiskScore);
    } catch (error) {
      console.error('⚠️ Error getting suspicious activities:', error.message);
      return [];
    }
  }

  /**
   * Get user login history
   */
  async getUserHistory(userId, limit = 50) {
    try {
      return await LoginLog.getUserHistory(userId, limit);
    } catch (error) {
      console.error('⚠️ Error getting user history:', error.message);
      return [];
    }
  }

  /**
   * Block/unblock an IP address
   */
  async toggleIPBlock(ipAddress, action) {
    try {
      if (action === 'block') {
        this.suspiciousIPs.add(ipAddress);
        console.log(`🚫 Manually blocked IP: ${ipAddress}`);
      } else if (action === 'unblock') {
        this.suspiciousIPs.delete(ipAddress);
        console.log(`✅ Manually unblocked IP: ${ipAddress}`);
      }
      return true;
    } catch (error) {
      console.error('⚠️ Error toggling IP block:', error.message);
      return false;
    }
  }

  /**
   * Get list of blocked IPs
   */
  getBlockedIPs() {
    return Array.from(this.suspiciousIPs);
  }
}

module.exports = new LoginTracker();