const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    if (user.isLocked) {
      return res.status(401).json({ 
        error: 'Account is temporarily locked due to multiple failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient privileges.',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }
    next();
  };
};

// Middleware to check if user is accessing their own resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Access denied. You can only access your own resources.',
      code: 'OWNERSHIP_REQUIRED'
    });
  };
};

// Middleware to check if user is participant in chat
const requireChatParticipant = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const Chat = require('../models/Chat');
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ 
        error: 'Chat not found.',
        code: 'CHAT_NOT_FOUND'
      });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ 
        error: 'Access denied. You are not a participant in this chat.',
        code: 'NOT_CHAT_PARTICIPANT'
      });
    }

    req.chat = chat;
    next();
  } catch (error) {
    console.error('Chat participant check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during chat access check.',
      code: 'CHAT_ACCESS_ERROR'
    });
  }
};

// Middleware to check if user is online (for real-time features)
const checkOnlineStatus = (req, res, next) => {
  // This could be enhanced to check against a Redis store of online users
  // For now, we'll just proceed
  next();
};

// Middleware to log authentication attempts
const logAuthAttempt = (req, res, next) => {
  const logData = {
    timestamp: new Date(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    endpoint: req.originalUrl,
    method: req.method,
    userId: req.user?._id || 'anonymous'
  };

  // In production, you might want to log this to a file or database
  console.log('Auth attempt:', logData);
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireRole,
  requireOwnershipOrAdmin,
  requireChatParticipant,
  checkOnlineStatus,
  logAuthAttempt
}; 