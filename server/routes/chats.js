const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { authenticateToken, requireChatParticipant } = require('../middleware/auth');
const { encryptMessage, decryptMessage } = require('../utils/encryption');

const router = express.Router();

// Get all chats for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.findForUser(req.user._id);
    
    res.json({
      chats: chats.map(chat => ({
        id: chat._id,
        type: chat.chatType,
        groupName: chat.groupName,
        participants: chat.participants.map(p => ({
          id: p._id,
          username: p.username,
          displayName: p.profile?.displayName || p.username,
          avatar: p.profile?.avatar
        })),
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCount,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching chats',
      code: 'GET_CHATS_ERROR'
    });
  }
});

// Get a specific chat with messages
router.get('/:chatId', authenticateToken, requireChatParticipant, async (req, res) => {
  try {
    const chat = req.chat;
    
    // Get visible messages for the user
    const visibleMessages = chat.getVisibleMessages(req.user._id);
    
    res.json({
      chat: {
        id: chat._id,
        type: chat.chatType,
        groupName: chat.groupName,
        participants: chat.participants.map(p => ({
          id: p._id,
          username: p.username,
          displayName: p.profile?.displayName || p.username,
          avatar: p.profile?.avatar
        })),
        messages: visibleMessages.map(msg => ({
          id: msg._id,
          content: msg.content,
          sender: msg.sender,
          messageType: msg.messageType,
          fileData: msg.fileData,
          isEncrypted: msg.isEncrypted,
          selfDestruct: msg.selfDestruct,
          isRead: msg.isRead,
          readAt: msg.readAt,
          createdAt: msg.createdAt
        })),
        settings: chat.settings,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching chat',
      code: 'GET_CHAT_ERROR'
    });
  }
});

// Create a new direct chat
router.post('/direct', authenticateToken, [
  body('participantId').notEmpty().withMessage('Participant username or ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { participantId } = req.body;

    // Check if participant exists (by ID or username)
    let participant;
    if (participantId.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid MongoDB ObjectId
      participant = await User.findById(participantId);
    } else {
      // It's a username or email
      participant = await User.findOne({
        $or: [
          { username: participantId },
          { email: participantId }
        ]
      });
    }
    if (!participant) {
      return res.status(404).json({ 
        error: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND'
      });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      chatType: 'direct',
      participants: { $all: [req.user._id, participant._id] }
    });

    if (existingChat) {
      return res.status(400).json({ 
        error: 'Direct chat already exists',
        code: 'CHAT_EXISTS',
        chatId: existingChat._id
      });
    }

    // Create new direct chat
    const chat = new Chat({
      participants: [req.user._id, participant._id],
      chatType: 'direct'
    });

    await chat.save();

    res.status(201).json({
      message: 'Direct chat created successfully',
      chat: {
        id: chat._id,
        type: chat.chatType,
        participants: [
          {
            id: req.user._id,
            username: req.user.username,
            displayName: req.user.profile?.displayName || req.user.username,
            avatar: req.user.profile?.avatar
          },
          {
            id: participant._id,
            username: participant.username,
            displayName: participant.profile?.displayName || participant.username,
            avatar: participant.profile?.avatar
          }
        ],
        createdAt: chat.createdAt
      }
    });
  } catch (error) {
    console.error('Create direct chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error while creating chat',
      code: 'CREATE_CHAT_ERROR'
    });
  }
});

// Create a new group chat
router.post('/group', authenticateToken, [
  body('groupName').notEmpty().withMessage('Group name is required'),
  body('participantIds').isArray({ min: 1 }).withMessage('At least one participant is required'),
  body('participantIds.*').isMongoId().withMessage('Valid participant ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { groupName, participantIds } = req.body;

    // Check if participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({ 
        error: 'One or more participants not found',
        code: 'PARTICIPANTS_NOT_FOUND'
      });
    }

    // Create new group chat
    const chat = new Chat({
      participants: [req.user._id, ...participantIds],
      chatType: 'group',
      groupName,
      groupAdmin: req.user._id
    });

    await chat.save();

    res.status(201).json({
      message: 'Group chat created successfully',
      chat: {
        id: chat._id,
        type: chat.chatType,
        groupName: chat.groupName,
        groupAdmin: chat.groupAdmin,
        participants: [
          {
            id: req.user._id,
            username: req.user.username,
            displayName: req.user.profile?.displayName || req.user.username,
            avatar: req.user.profile?.avatar
          },
          ...participants.map(p => ({
            id: p._id,
            username: p.username,
            displayName: p.profile?.displayName || p.username,
            avatar: p.profile?.avatar
          }))
        ],
        createdAt: chat.createdAt
      }
    });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error while creating group chat',
      code: 'CREATE_GROUP_CHAT_ERROR'
    });
  }
});

// Send a message to a chat
router.post('/:chatId/messages', authenticateToken, requireChatParticipant, [
  body('content').notEmpty().withMessage('Message content is required'),
  body('messageType').optional().isIn(['text', 'file', 'image']).withMessage('Invalid message type'),
  body('selfDestruct').optional().isObject().withMessage('Self-destruct must be an object'),
  body('selfDestruct.enabled').optional().isBoolean().withMessage('Self-destruct enabled must be boolean'),
  body('selfDestruct.expiresAt').optional().isISO8601().withMessage('Self-destruct expiresAt must be valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { content, messageType = 'text', selfDestruct } = req.body;
    const chat = req.chat;

    // Encrypt message content
    const encryptedContent = encryptMessage(content);

    // Prepare message data
    const messageData = {
      sender: req.user._id,
      content,
      encryptedContent,
      messageType,
      selfDestruct: selfDestruct?.enabled ? {
        enabled: true,
        expiresAt: new Date(selfDestruct.expiresAt)
      } : undefined
    };

    // Add message to chat
    await chat.addMessage(messageData);

    // Emit to socket.io (handled in chatHandler)
    req.app.get('io').to(`chat_${chat._id}`).emit('new_message', {
      chatId: chat._id,
      message: {
        id: chat.messages[chat.messages.length - 1]._id,
        content: messageData.content,
        sender: req.user._id,
        messageType: messageData.messageType,
        selfDestruct: messageData.selfDestruct,
        createdAt: new Date()
      }
    });

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: chat.messages[chat.messages.length - 1]._id
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      error: 'Internal server error while sending message',
      code: 'SEND_MESSAGE_ERROR'
    });
  }
});

// Mark messages as read
router.post('/:chatId/read', authenticateToken, requireChatParticipant, async (req, res) => {
  try {
    const chat = req.chat;
    
    await chat.markAsRead(req.user._id);

    res.json({
      message: 'Messages marked as read successfully'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      error: 'Internal server error while marking messages as read',
      code: 'MARK_READ_ERROR'
    });
  }
});

// Hide chat for user (logout effect)
router.post('/:chatId/hide', authenticateToken, requireChatParticipant, async (req, res) => {
  try {
    const chat = req.chat;
    
    await chat.hideForUser(req.user._id);

    res.json({
      message: 'Chat hidden successfully'
    });
  } catch (error) {
    console.error('Hide chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error while hiding chat',
      code: 'HIDE_CHAT_ERROR'
    });
  }
});

// Show chat for user
router.post('/:chatId/show', authenticateToken, requireChatParticipant, async (req, res) => {
  try {
    const chat = req.chat;
    
    await chat.showForUser(req.user._id);

    res.json({
      message: 'Chat shown successfully'
    });
  } catch (error) {
    console.error('Show chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error while showing chat',
      code: 'SHOW_CHAT_ERROR'
    });
  }
});

// Update chat settings (admin or group admin only)
router.patch('/:chatId/settings', authenticateToken, requireChatParticipant, [
  body('settings').isObject().withMessage('Settings must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { settings } = req.body;
    const chat = req.chat;

    // Check if user can modify settings
    if (chat.chatType === 'group' && chat.groupAdmin.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only group admin can modify group settings',
        code: 'GROUP_ADMIN_REQUIRED'
      });
    }

    // Update settings
    Object.assign(chat.settings, settings);
    await chat.save();

    res.json({
      message: 'Chat settings updated successfully',
      settings: chat.settings
    });
  } catch (error) {
    console.error('Update chat settings error:', error);
    res.status(500).json({ 
      error: 'Internal server error while updating chat settings',
      code: 'UPDATE_CHAT_SETTINGS_ERROR'
    });
  }
});

// Delete chat (admin only or group admin for group chats)
router.delete('/:chatId', authenticateToken, requireChatParticipant, async (req, res) => {
  try {
    const chat = req.chat;

    // Check if user can delete chat
    if (chat.chatType === 'group' && chat.groupAdmin.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only group admin can delete group chat',
        code: 'GROUP_ADMIN_REQUIRED'
      });
    }

    if (chat.chatType === 'direct' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only admin can delete direct chats',
        code: 'ADMIN_REQUIRED'
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

module.exports = router; 