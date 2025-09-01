const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Chat = require('../models/Chat');
const BlogPost = require('../models/BlogPost');
const LoginLog = require('../models/LoginLog');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const loginTracker = require('../utils/loginTracker');

const router = express.Router();

// All admin routes require admin authentication
router.use(authenticateToken, requireAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }
    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('username email role isActive lastLogin loginAttempts createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: skip + users.length < totalUsers,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error while fetching users' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const activeUserCount = await User.countDocuments({ isActive: true });
    const chatCount = await Chat.countDocuments();
    const activeChatCount = await Chat.countDocuments({ isActive: true });
    const blogPostCount = await BlogPost.countDocuments();
    const publishedPostCount = await BlogPost.countDocuments({ status: 'published' });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email role createdAt lastLogin');

    const recentChats = await Chat.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('participants', 'username');

    res.json({
      stats: {
        users: {
          total: userCount,
          active: activeUserCount,
          inactive: userCount - activeUserCount
        },
        chats: {
          total: chatCount,
          active: activeChatCount,
          inactive: chatCount - activeChatCount
        },
        blogPosts: {
          total: blogPostCount,
          published: publishedPostCount,
          draft: blogPostCount - publishedPostCount
        }
      },
      recentActivity: {
        users: recentUsers,
        chats: recentChats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching statistics',
      code: 'GET_STATS_ERROR'
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status !== undefined) {
      query.isActive = status === 'active';
    }
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching users',
      code: 'GET_USERS_ERROR'
    });
  }
});

// Get user details
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Get user's chats
    const userChats = await Chat.find({ participants: userId })
      .populate('participants', 'username profile.displayName')
      .sort({ updatedAt: -1 });
    
    res.json({
      user,
      chats: userChats
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching user details',
      code: 'GET_USER_DETAILS_ERROR'
    });
  }
});

// Update user
router.patch('/users/:userId', [
  body('isActive').optional().isBoolean(),
  body('role').optional().isIn(['admin', 'user']),
  body('profile.displayName').optional().isLength({ min: 1, max: 100 }),
  body('profile.bio').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const updateData = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating user',
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is trying to delete themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account',
        code: 'SELF_DELETE_ERROR'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Soft delete - mark as inactive
    user.isActive = false;
    await user.save();
    
    res.json({
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting user',
      code: 'DELETE_USER_ERROR'
    });
  }
});

// Get all chats
router.get('/chats', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (type) {
      query.chatType = type;
    }
    
    if (search) {
      query.$or = [
        { 'participants.username': { $regex: search, $options: 'i' } },
        { groupName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const chats = await Chat.find(query)
      .populate('participants', 'username profile.displayName')
      .populate('groupAdmin', 'username')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Chat.countDocuments(query);
    
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
    console.error('Get chats error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching chats',
      code: 'GET_CHATS_ERROR'
    });
  }
});

// Get chat details
router.get('/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId)
      .populate('participants', 'username profile.displayName profile.avatar')
      .populate('groupAdmin', 'username')
      .populate('messages.sender', 'username profile.displayName');
    
    if (!chat) {
      return res.status(404).json({ 
        error: 'Chat not found',
        code: 'CHAT_NOT_FOUND'
      });
    }
    
    res.json({ chat });
  } catch (error) {
    console.error('Get chat details error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching chat details',
      code: 'GET_CHAT_DETAILS_ERROR'
    });
  }
});

// Delete chat
router.delete('/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ 
        error: 'Chat not found',
        code: 'CHAT_NOT_FOUND'
      });
    }
    
    // Soft delete - mark as inactive
    chat.isActive = false;
    await chat.save();
    
    res.json({
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting chat',
      code: 'DELETE_CHAT_ERROR'
    });
  }
});

// Get all blog posts
router.get('/blog-posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    const posts = await BlogPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await BlogPost.countDocuments(query);
    
    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching blog posts',
      code: 'GET_BLOG_POSTS_ERROR'
    });
  }
});

// Create blog post
router.post('/blog-posts', [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isIn(['history', 'science', 'technology', 'culture', 'geography', 'biography']),
  body('status').optional().isIn(['published', 'draft', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, content, category, status = 'draft', tags = [] } = req.body;
    
    const post = new BlogPost({
      title,
      content,
      category,
      status,
      tags,
      author: req.user.username
    });
    
    await post.save();
    
    res.status(201).json({
      message: 'Blog post created successfully',
      post
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ 
      error: 'Internal server error while creating blog post',
      code: 'CREATE_BLOG_POST_ERROR'
    });
  }
});

// Update blog post
router.patch('/blog-posts/:postId', [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('category').optional().isIn(['history', 'science', 'technology', 'culture', 'geography', 'biography']),
  body('status').optional().isIn(['published', 'draft', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { postId } = req.params;
    const updateData = req.body;
    
    const post = await BlogPost.findByIdAndUpdate(
      postId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Blog post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    res.json({
      message: 'Blog post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating blog post',
      code: 'UPDATE_BLOG_POST_ERROR'
    });
  }
});

// Delete blog post
router.delete('/blog-posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const post = await BlogPost.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({ 
        error: 'Blog post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    res.json({
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ 
      error: 'Internal server error while deleting blog post',
      code: 'DELETE_BLOG_POST_ERROR'
    });
  }
});

// System maintenance
router.post('/maintenance/cleanup', async (req, res) => {
  try {
    // Clean up expired messages
    const expiredMessagesResult = await Chat.cleanupExpiredMessages();
    
    // Clean up old inactive users (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const inactiveUsersResult = await User.updateMany(
      { 
        isActive: false, 
        updatedAt: { $lt: thirtyDaysAgo },
        role: { $ne: 'admin' }
      },
      { $set: { isActive: false } }
    );
    
    res.json({
      message: 'Maintenance completed successfully',
      results: {
        expiredMessages: expiredMessagesResult,
        inactiveUsers: inactiveUsersResult
      }
    });
  } catch (error) {
    console.error('Maintenance error:', error);
    res.status(500).json({ 
      error: 'Internal server error during maintenance',
      code: 'MAINTENANCE_ERROR'
    });
  }
});

// Get system logs (placeholder - in production you'd want a proper logging system)
router.get('/logs', async (req, res) => {
  try {
    // This is a placeholder. In production, you'd want to implement proper logging
    res.json({
      message: 'Logging system not implemented yet',
      logs: []
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching logs',
      code: 'GET_LOGS_ERROR'
    });
  }
});

// ============= LOGIN MONITORING ROUTES =============

// Get login security dashboard
router.get('/security/dashboard', async (req, res) => {
  try {
    const { timeframe = 24 } = req.query;
    const dashboardData = await loginTracker.getDashboardData(parseInt(timeframe));
    
    res.json({
      message: 'Security dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (error) {
    console.error('Get security dashboard error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching security dashboard',
      code: 'GET_SECURITY_DASHBOARD_ERROR'
    });
  }
});

// Get all login logs with filtering
router.get('/security/login-logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      loginType, 
      userId, 
      ipAddress, 
      timeframe = 24,
      riskScore 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const timeThreshold = new Date(Date.now() - timeframe * 60 * 60 * 1000);
    
    // Build query
    let query = { createdAt: { $gte: timeThreshold } };
    
    if (loginType) query.loginType = loginType;
    if (userId) query.user = userId;
    if (ipAddress) query.ipAddress = ipAddress;
    if (riskScore) query.riskScore = { $gte: parseInt(riskScore) };
    
    const [logs, total] = await Promise.all([
      LoginLog.find(query)
        .populate('user', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LoginLog.countDocuments(query)
    ]);
    
    res.json({
      message: 'Login logs retrieved successfully',
      logs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get login logs error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching login logs',
      code: 'GET_LOGIN_LOGS_ERROR'
    });
  }
});

// Get suspicious activities
router.get('/security/suspicious', async (req, res) => {
  try {
    const { hoursBack = 24, minRiskScore = 50 } = req.query;
    
    const suspiciousActivities = await LoginLog.getSuspiciousActivities(
      parseInt(hoursBack), 
      parseInt(minRiskScore)
    );
    
    res.json({
      message: 'Suspicious activities retrieved successfully',
      activities: suspiciousActivities,
      count: suspiciousActivities.length
    });
  } catch (error) {
    console.error('Get suspicious activities error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching suspicious activities',
      code: 'GET_SUSPICIOUS_ACTIVITIES_ERROR'
    });
  }
});

// Get user's login history
router.get('/security/user-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await LoginLog.getUserHistory(userId, parseInt(limit));
    
    res.json({
      message: 'User login history retrieved successfully',
      history,
      count: history.length
    });
  } catch (error) {
    console.error('Get user login history error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching user login history',
      code: 'GET_USER_LOGIN_HISTORY_ERROR'
    });
  }
});

// Block/unblock IP address
router.post('/security/block-ip', [
  body('ipAddress').isIP().withMessage('Valid IP address is required'),
  body('action').isIn(['block', 'unblock']).withMessage('Action must be block or unblock')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { ipAddress, action } = req.body;
    
    if (action === 'block') {
      loginTracker.suspiciousIPs.add(ipAddress);
      
      res.json({
        message: `IP address ${ipAddress} has been blocked`,
        action: 'blocked'
      });
    } else {
      loginTracker.suspiciousIPs.delete(ipAddress);
      
      res.json({
        message: `IP address ${ipAddress} has been unblocked`,
        action: 'unblocked'
      });
    }
  } catch (error) {
    console.error('Block IP error:', error);
    res.status(500).json({ 
      error: 'Internal server error while blocking/unblocking IP',
      code: 'BLOCK_IP_ERROR'
    });
  }
});

// Get blocked IPs
router.get('/security/blocked-ips', async (req, res) => {
  try {
    const blockedIPs = Array.from(loginTracker.suspiciousIPs);
    
    res.json({
      message: 'Blocked IPs retrieved successfully',
      blockedIPs,
      count: blockedIPs.length
    });
  } catch (error) {
    console.error('Get blocked IPs error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching blocked IPs',
      code: 'GET_BLOCKED_IPS_ERROR'
    });
  }
});

module.exports = router; 