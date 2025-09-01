const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (!user.isActive) {
      return next(new Error('Authentication error: Account deactivated'));
    }

    if (user.isLocked) {
      return next(new Error('Authentication error: Account locked'));
    }

    // Attach user data to socket
    socket.userId = user._id.toString();
    socket.user = user;
    
    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    }
    
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }

    console.error('Socket auth error:', error);
    return next(new Error('Authentication error: Internal server error'));
  }
};

module.exports = socketAuth; 