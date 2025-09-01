const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { generateTOTPSecret, verifyTOTP, generateQRCode } = require('../utils/twoFactor');
const loginTracker = require('../utils/loginTracker');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login endpoint
router.post('/login', authLimiter, [
  body('identifier').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('totpCode').optional().isLength({ min: 6, max: 6 }).withMessage('TOTP code must be 6 digits')
], async (req, res) => {
  try {
    // Get request metadata for tracking
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Check if IP should be blocked (with error handling)
    let shouldBlock = false;
    try {
      shouldBlock = await loginTracker.shouldBlockIP(ipAddress);
      if (shouldBlock) {
        await loginTracker.logAttempt({
          user: null,
          username: req.body.identifier || 'unknown',
          loginType: 'blocked',
          ipAddress,
          userAgent,
          failureReason: 'suspicious_activity'
        });
        
        return res.status(429).json({ 
          error: 'Access temporarily blocked due to suspicious activity',
          code: 'IP_BLOCKED'
        });
      }
    } catch (trackingError) {
      console.warn('Login tracking error (non-critical):', trackingError.message);
      // Continue with login process even if tracking fails
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { identifier, password, totpCode } = req.body;

    // Find user by username or email
    const user = await User.findByUsernameOrEmail(identifier);
    
    if (!user) {
      // Log failed attempt (non-critical)
      try {
        await loginTracker.logAttempt({
          user: null,
          username: identifier,
          loginType: 'failed',
          ipAddress,
          userAgent,
          failureReason: 'invalid_credentials'
        });
      } catch (trackingError) {
        console.warn('Login tracking error (non-critical):', trackingError.message);
      }
      
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      try {
        await loginTracker.logAttempt({
          user: user._id,
          username: user.username,
          loginType: 'failed',
          ipAddress,
          userAgent,
          failureReason: 'account_locked'
        });
      } catch (trackingError) {
        console.warn('Login tracking error (non-critical):', trackingError.message);
      }
      
      return res.status(423).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Check if account is active
    if (!user.isActive) {
      try {
        await loginTracker.logAttempt({
          user: user._id,
          username: user.username,
          loginType: 'failed',
          ipAddress,
          userAgent,
          failureReason: 'account_disabled'
        });
      } catch (trackingError) {
        console.warn('Login tracking error (non-critical):', trackingError.message);
      }
      
      return res.status(423).json({ 
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      
      // Log failed attempt (non-critical)
      try {
        await loginTracker.logAttempt({
          user: user._id,
          username: user.username,
          loginType: 'failed',
          ipAddress,
          userAgent,
          failureReason: 'invalid_credentials'
        });
      } catch (trackingError) {
        console.warn('Login tracking error (non-critical):', trackingError.message);
      }
      
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return res.status(400).json({ 
          error: 'Two-factor authentication code required',
          code: 'TOTP_REQUIRED'
        });
      }

      const isTOTPValid = verifyTOTP(user.twoFactorSecret, totpCode);
      if (!isTOTPValid) {
        // Log failed 2FA attempt (non-critical)
        try {
          await loginTracker.logAttempt({
            user: user._id,
            username: user.username,
            loginType: 'failed',
            ipAddress,
            userAgent,
            failureReason: 'invalid_totp'
          });
        } catch (trackingError) {
          console.warn('Login tracking error (non-critical):', trackingError.message);
        }
        
        return res.status(401).json({ 
          error: 'Invalid two-factor authentication code',
          code: 'INVALID_TOTP'
        });
      }
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Generate JWT token and session ID
    const sessionId = loginTracker.generateSessionId();
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role,
        sessionId: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login (non-critical)
    try {
      await loginTracker.logAttempt({
        user: user._id,
        username: user.username,
        loginType: 'success',
        ipAddress,
        userAgent,
        sessionId: sessionId
      });
    } catch (trackingError) {
      console.warn('Login tracking error (non-critical):', trackingError.message);
    }

    // Return user data and token
    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error during login',
      code: 'LOGIN_ERROR'
    });
  }
});

// Register endpoint (admin only)
router.post('/register', authenticateToken, [
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only admins can register new users',
        code: 'ADMIN_REQUIRED'
      });
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, role = 'user' } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username or email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error during registration',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// Setup 2FA endpoint
router.post('/setup-2fa', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: 'Two-factor authentication is already enabled',
        code: 'TOTP_ALREADY_ENABLED'
      });
    }

    // Generate new TOTP secret
    const secret = generateTOTPSecret();
    const qrCode = await generateQRCode(user.email, secret);

    // Store secret temporarily (user needs to verify before enabling)
    user.twoFactorSecret = secret;
    await user.save();

    res.json({
      message: '2FA setup initiated',
      secret,
      qrCode,
      instructions: 'Scan the QR code with your authenticator app and enter the code to verify'
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ 
      error: 'Internal server error during 2FA setup',
      code: 'TOTP_SETUP_ERROR'
    });
  }
});

// Verify and enable 2FA endpoint
router.post('/verify-2fa', authenticateToken, [
  body('totpCode').isLength({ min: 6, max: 6 }).withMessage('TOTP code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { totpCode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.twoFactorSecret) {
      return res.status(400).json({ 
        error: '2FA setup not initiated',
        code: 'TOTP_NOT_INITIATED'
      });
    }

    // Verify TOTP code
    const isValid = verifyTOTP(user.twoFactorSecret, totpCode);
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Invalid TOTP code',
        code: 'INVALID_TOTP'
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save();

    res.json({
      message: 'Two-factor authentication enabled successfully',
      enabled: true
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ 
      error: 'Internal server error during 2FA verification',
      code: 'TOTP_VERIFICATION_ERROR'
    });
  }
});

// Disable 2FA endpoint
router.post('/disable-2fa', authenticateToken, [
  body('totpCode').isLength({ min: 6, max: 6 }).withMessage('TOTP code must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { totpCode } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: 'Two-factor authentication is not enabled',
        code: 'TOTP_NOT_ENABLED'
      });
    }

    // Verify TOTP code before disabling
    const isValid = verifyTOTP(user.twoFactorSecret, totpCode);
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Invalid TOTP code',
        code: 'INVALID_TOTP'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    res.json({
      message: 'Two-factor authentication disabled successfully',
      enabled: false
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ 
      error: 'Internal server error during 2FA disable',
      code: 'TOTP_DISABLE_ERROR'
    });
  }
});

// Change password endpoint
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      error: 'Internal server error during password change',
      code: 'PASSWORD_CHANGE_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching user data',
      code: 'GET_USER_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Log logout (non-critical)
    try {
      await loginTracker.logAttempt({
        user: req.user._id,
        username: req.user.username,
        loginType: 'logout',
        ipAddress,
        userAgent,
        sessionId: req.user.sessionId || null
      });
    } catch (trackingError) {
      console.warn('Login tracking error (non-critical):', trackingError.message);
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
});

module.exports = router; 