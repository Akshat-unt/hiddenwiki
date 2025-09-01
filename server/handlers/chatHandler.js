const Chat = require('../models/Chat');
const User = require('../models/User');

const chatHandler = (io, socket) => {
  // Join chat room
  socket.on('join_chat', async (chatId) => {
    try {
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Leave previous chat room
      socket.leaveAll();
      
      // Join new chat room
      socket.join(`chat_${chatId}`);
      socket.join(`user_${socket.userId}`);
      
      socket.emit('joined_chat', { chatId });
      
      // Notify other participants
      socket.to(`chat_${chatId}`).emit('user_joined_chat', {
        chatId,
        userId: socket.userId,
        username: socket.user.username
      });
      
    } catch (error) {
      console.error('Join chat error:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  // Send message
  socket.on('send_message', async (data) => {
    try {
      const { chatId, content, messageType = 'text', selfDestruct } = data;
      
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Validate message content
      if (!content || content.trim().length === 0) {
        socket.emit('error', { message: 'Message content cannot be empty' });
        return;
      }

      // Check file size if it's a file message
      if (messageType === 'file' && data.fileData && data.fileData.size > chat.settings.maxFileSize) {
        socket.emit('error', { message: 'File size exceeds limit' });
        return;
      }

      // Prepare message data
      const messageData = {
        sender: socket.userId,
        content: content.trim(),
        encryptedContent: content.trim(), // Will be encrypted by the API route
        messageType,
        fileData: data.fileData,
        selfDestruct: selfDestruct?.enabled ? {
          enabled: true,
          expiresAt: new Date(selfDestruct.expiresAt)
        } : undefined
      };

      // Add message to chat
      await chat.addMessage(messageData);

      // Get the added message
      const addedMessage = chat.messages[chat.messages.length - 1];

      // Emit to all participants in the chat
      io.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message: {
          id: addedMessage._id,
          content: addedMessage.content,
          sender: socket.userId,
          messageType: addedMessage.messageType,
          fileData: addedMessage.fileData,
          selfDestruct: addedMessage.selfDestruct,
          isRead: false,
          createdAt: addedMessage.createdAt
        }
      });

      // Update last message for all participants
      io.to(`chat_${chatId}`).emit('chat_updated', {
        chatId,
        lastMessage: {
          content: addedMessage.content,
          sender: socket.userId,
          timestamp: addedMessage.createdAt
        },
        unreadCount: chat.unreadCount
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('mark_read', async (data) => {
    try {
      const { chatId, messageIds } = data;
      
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Mark messages as read
      const now = new Date();
      let updated = false;
      
      chat.messages.forEach(message => {
        if (messageIds.includes(message._id.toString()) && 
            message.sender.toString() !== socket.userId && 
            !message.isRead) {
          message.isRead = true;
          message.readAt = now;
          updated = true;
        }
      });

      if (updated) {
        await chat.save();
        
        // Emit read receipts
        io.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          messageIds,
          readBy: socket.userId,
          readAt: now
        });
      }

    } catch (error) {
      console.error('Mark read error:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Typing indicator
  socket.on('typing_start', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_typing', {
      chatId,
      userId: socket.userId,
      username: socket.user.username
    });
  });

  socket.on('typing_stop', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_stopped_typing', {
      chatId,
      userId: socket.userId
    });
  });

  // Online status
  socket.on('set_status', (data) => {
    const { status } = data;
    socket.user.status = status;
    
    // Emit to all users
    io.emit('user_status_changed', {
      userId: socket.userId,
      status
    });
  });

  // File upload progress
  socket.on('file_upload_progress', (data) => {
    const { chatId, progress, filename } = data;
    socket.to(`chat_${chatId}`).emit('file_upload_progress', {
      chatId,
      userId: socket.userId,
      progress,
      filename
    });
  });

  // Delete message (only sender or admin)
  socket.on('delete_message', async (data) => {
    try {
      const { chatId, messageId } = data;
      
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Find the message
      const message = chat.messages.id(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user can delete the message
      if (message.sender.toString() !== socket.userId && socket.user.role !== 'admin') {
        socket.emit('error', { message: 'Cannot delete message' });
        return;
      }

      // Remove message
      chat.messages.pull(messageId);
      await chat.save();

      // Emit to all participants
      io.to(`chat_${chatId}`).emit('message_deleted', {
        chatId,
        messageId,
        deletedBy: socket.userId
      });

    } catch (error) {
      console.error('Delete message error:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Edit message (only sender)
  socket.on('edit_message', async (data) => {
    try {
      const { chatId, messageId, newContent } = data;
      
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Find the message
      const message = chat.messages.id(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Check if user can edit the message
      if (message.sender.toString() !== socket.userId) {
        socket.emit('error', { message: 'Cannot edit message' });
        return;
      }

      // Update message
      message.content = newContent;
      message.encryptedContent = newContent; // Will be encrypted by the API
      message.editedAt = new Date();
      message.isEdited = true;
      
      await chat.save();

      // Emit to all participants
      io.to(`chat_${chatId}`).emit('message_edited', {
        chatId,
        messageId,
        newContent,
        editedAt: message.editedAt,
        editedBy: socket.userId
      });

    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // React to message
  socket.on('react_to_message', async (data) => {
    try {
      const { chatId, messageId, reaction } = data;
      
      // Verify user is participant in chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Find the message
      const message = chat.messages.id(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }

      // Add or update reaction
      if (!message.reactions) {
        message.reactions = [];
      }

      const existingReaction = message.reactions.find(r => r.userId.toString() === socket.userId);
      if (existingReaction) {
        existingReaction.reaction = reaction;
        existingReaction.updatedAt = new Date();
      } else {
        message.reactions.push({
          userId: socket.userId,
          reaction,
          createdAt: new Date()
        });
      }

      await chat.save();

      // Emit to all participants
      io.to(`chat_${chatId}`).emit('message_reaction', {
        chatId,
        messageId,
        userId: socket.userId,
        reaction,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('React to message error:', error);
      socket.emit('error', { message: 'Failed to react to message' });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    // Emit offline status to all users
    io.emit('user_offline', {
      userId: socket.userId,
      username: socket.user.username
    });
  });
};

module.exports = chatHandler; 