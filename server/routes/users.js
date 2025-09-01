const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching profile',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

// Update user profile
router.patch('/profile', [
  body('profile.displayName').optional().isLength({ min: 1, max: 100 }).withMessage('Display name must be 1-100 characters'),
  body('profile.bio').optional().isLength({ max: 500 }).withMessage('Bio must be 500 characters or less'),
  body('preferences.theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme'),
  body('preferences.language').optional().isLength({ min: 2, max: 5 }).withMessage('Invalid language code'),
  body('preferences.notifications.email').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('preferences.notifications.push').optional().isBoolean().withMessage('Push notifications must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const updateData = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating profile',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

// Change password
router.post('/change-password', [
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
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Internal server error while changing password',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

// Setup 2FA
router.post('/setup-2fa', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ 
        error: 'Two-factor authentication is already enabled',
        code: 'TOTP_ALREADY_ENABLED'
      });
    }

    // Generate new TOTP secret
    const { generateTOTPSecret, generateQRCode } = require('../utils/twoFactor');
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

// Verify and enable 2FA
router.post('/verify-2fa', [
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
    const { verifyTOTP } = require('../utils/twoFactor');
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

// Disable 2FA
router.post('/disable-2fa', [
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
    const { verifyTOTP } = require('../utils/twoFactor');
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

// Get user's chats
router.get('/chats', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const chats = await Chat.findForUser(req.user._id)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Chat.countDocuments({
      participants: req.user._id,
      isActive: true
    });
    
    res.json({
      chats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching chats',
      code: 'GET_USER_CHATS_ERROR'
    });
  }
});

// Get user's activity
router.get('/activity', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Get user's recent messages
    const chats = await Chat.find({ participants: req.user._id })
      .populate('messages.sender', 'username profile.displayName')
      .sort({ 'messages.createdAt': -1 });
    
    let allMessages = [];
    chats.forEach(chat => {
      chat.messages.forEach(message => {
        if (message.sender.toString() === req.user._id.toString()) {
          allMessages.push({
            id: message._id,
            content: message.content,
            chatId: chat._id,
            chatType: chat.chatType,
            createdAt: message.createdAt
          });
        }
      });
    });
    
    // Sort by creation date and paginate
    allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const paginatedMessages = allMessages.slice(skip, skip + parseInt(limit));
    
    res.json({
      messages: paginatedMessages,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(allMessages.length / limit),
        hasNext: page * limit < allMessages.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching activity',
      code: 'GET_USER_ACTIVITY_ERROR'
    });
  }
});

// Delete user account
router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { password } = req.body;
    const user = await User.findById(req.user._id);

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        error: 'Invalid password',
        code: 'INVALID_PASSWORD'
      });
    }

    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();

    res.json({
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting account',
      code: 'DELETE_ACCOUNT_ERROR'
    });
  }
});

// Get user by ID (for other users to see profiles)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password -twoFactorSecret -loginAttempts -lockUntil');
    if (!user || !user.isActive) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching user',
      code: 'GET_USER_BY_ID_ERROR'
    });
  }
});

module.exports = router; 