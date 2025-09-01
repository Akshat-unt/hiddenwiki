const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  encryptedContent: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text'
  },
  fileData: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  selfDestruct: {
    enabled: { type: Boolean, default: false },
    expiresAt: Date
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  chatType: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  groupName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  visibility: {
    // Track which users can see this chat
    visibleTo: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isVisible: {
        type: Boolean,
        default: true
      },
      hiddenAt: Date
    }]
  },
  settings: {
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 5242880 // 5MB
    },
    allowedFileTypes: [String],
    autoDeleteMessages: {
      type: Boolean,
      default: false
    },
    messageRetentionDays: {
      type: Number,
      default: 30
    }
  },
  encryption: {
    algorithm: {
      type: String,
      default: 'AES-256-GCM'
    },
    keyVersion: {
      type: Number,
      default: 1
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
chatSchema.index({ participants: 1 });
chatSchema.index({ 'visibility.visibleTo.userId': 1 });
chatSchema.index({ isActive: 1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

// Virtual for unread message count
chatSchema.virtual('unreadCount').get(function() {
  return this.messages.filter(msg => !msg.isRead).length;
});

// Pre-save middleware to update timestamp
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to add message
chatSchema.methods.addMessage = function(messageData) {
  const message = {
    sender: messageData.sender,
    content: messageData.content,
    encryptedContent: messageData.encryptedContent,
    messageType: messageData.messageType || 'text',
    fileData: messageData.fileData,
    isEncrypted: messageData.isEncrypted !== false,
    selfDestruct: messageData.selfDestruct
  };

  this.messages.push(message);
  
  // Update last message
  this.lastMessage = {
    content: messageData.content,
    sender: messageData.sender,
    timestamp: new Date()
  };

  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
  const now = new Date();
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = now;
    }
  });
  
  return this.save();
};

// Method to hide chat for user
chatSchema.methods.hideForUser = function(userId) {
  const visibilityEntry = this.visibility.visibleTo.find(
    entry => entry.userId.toString() === userId.toString()
  );
  
  if (visibilityEntry) {
    visibilityEntry.isVisible = false;
    visibilityEntry.hiddenAt = new Date();
  } else {
    this.visibility.visibleTo.push({
      userId,
      isVisible: false,
      hiddenAt: new Date()
    });
  }
  
  return this.save();
};

// Method to show chat for user
chatSchema.methods.showForUser = function(userId) {
  const visibilityEntry = this.visibility.visibleTo.find(
    entry => entry.userId.toString() === userId.toString()
  );
  
  if (visibilityEntry) {
    visibilityEntry.isVisible = true;
    visibilityEntry.hiddenAt = undefined;
  } else {
    this.visibility.visibleTo.push({
      userId,
      isVisible: true
    });
  }
  
  return this.save();
};

// Method to check if user can see this chat
chatSchema.methods.isVisibleToUser = function(userId) {
  const visibilityEntry = this.visibility.visibleTo.find(
    entry => entry.userId.toString() === userId.toString()
  );
  
  return visibilityEntry ? visibilityEntry.isVisible : true;
};

// Method to get visible messages for user
chatSchema.methods.getVisibleMessages = function(userId) {
  if (!this.isVisibleToUser(userId)) {
    return [];
  }
  
  return this.messages.filter(message => {
    // Check if message has expired
    if (message.selfDestruct?.enabled && message.selfDestruct?.expiresAt) {
      return new Date() < message.selfDestruct.expiresAt;
    }
    return true;
  });
};

// Static method to find chats for user
chatSchema.statics.findForUser = function(userId) {
  return this.find({
    participants: userId,
    isActive: true,
    $or: [
      { 'visibility.visibleTo.userId': { $ne: userId } },
      { 'visibility.visibleTo.userId': userId, 'visibility.visibleTo.isVisible': true }
    ]
  }).populate('participants', 'username profile.displayName profile.avatar');
};

// Static method to cleanup expired messages
chatSchema.statics.cleanupExpiredMessages = async function() {
  const now = new Date();
  
  const result = await this.updateMany(
    {
      'messages.selfDestruct.enabled': true,
      'messages.selfDestruct.expiresAt': { $lt: now }
    },
    {
      $pull: {
        messages: {
          'selfDestruct.enabled': true,
          'selfDestruct.expiresAt': { $lt: now }
        }
      }
    }
  );
  
  return result;
};

module.exports = mongoose.model('Chat', chatSchema); 