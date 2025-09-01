'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Chip,
  Drawer,
  AppBar,
  Toolbar,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Timer as TimerIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface User {
  id: string
  username: string
  displayName: string
  avatar?: string
  role: string
}

interface Message {
  id: string
  content: string
  sender: string
  messageType: 'text' | 'file' | 'image'
  fileData?: any
  selfDestruct?: {
    enabled: boolean
    expiresAt: Date
  }
  isRead: boolean
  createdAt: Date
  isEdited?: boolean
  editedAt?: Date
}

interface Chat {
  id: string
  type: 'direct' | 'group'
  groupName?: string
  participants: User[]
  lastMessage?: {
    content: string
    sender: string
    timestamp: Date
  }
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newChatData, setNewChatData] = useState({
    type: 'direct' as 'direct' | 'group',
    participantId: '',
    groupName: '',
    participantIds: [] as string[]
  })
  const [selfDestruct, setSelfDestruct] = useState({
    enabled: false,
    hours: 24
  })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Initialize user and socket connection
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/')
      return
    }

    try {
      const userObj = JSON.parse(userData)
      setUser(userObj)
      
      // Initialize socket connection
      const newSocket = io('http://localhost:3001', {
        auth: { token }
      })
      
      newSocket.on('connect', () => {
        setIsConnected(true)
        toast.success('Connected to chat server')
      })
      
      newSocket.on('disconnect', () => {
        setIsConnected(false)
        toast.error('Disconnected from chat server')
      })
      
      newSocket.on('error', (error) => {
        toast.error(error.message || 'Socket error')
      })
      
      setSocket(newSocket)
      
      // Load chats
      loadChats()
      
      return () => {
        newSocket.close()
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
      router.push('/')
    }
  }, [router])

  // Load user's chats
  const loadChats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    }
  }

  // Load messages for a specific chat
  const loadMessages = async (chatId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.chat.messages)
        setCurrentChat(data.chat)
        
        // Join chat room via socket
        if (socket) {
          socket.emit('join_chat', chatId)
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !currentChat || !socket) return
    
    const messageData = {
      chatId: currentChat.id,
      content: newMessage.trim(),
      messageType: 'text' as const,
      selfDestruct: selfDestruct.enabled ? {
        enabled: true,
        expiresAt: new Date(Date.now() + selfDestruct.hours * 60 * 60 * 1000)
      } : undefined
    }
    
    socket.emit('send_message', messageData)
    setNewMessage('')
  }

  // Handle new message from socket
  useEffect(() => {
    if (!socket) return
    
    socket.on('new_message', (data) => {
      if (data.chatId === currentChat?.id) {
        setMessages(prev => [...prev, data.message])
      }
      
      // Update chat list with new message
      setChats(prev => prev.map(chat => {
        if (chat.id === data.chatId) {
          return {
            ...chat,
            lastMessage: data.message,
            unreadCount: chat.unreadCount + 1
          }
        }
        return chat
      }))
    })
    
    return () => {
      socket.off('new_message')
    }
  }, [socket, currentChat])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Create new chat
  const createNewChat = async () => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = newChatData.type === 'direct' ? 'http://localhost:3001/api/chats/direct' : 'http://localhost:3001/api/chats/group'
      const body = newChatData.type === 'direct' 
        ? { participantId: newChatData.participantId }
        : { groupName: newChatData.groupName, participantIds: newChatData.participantIds }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        const data = await response.json()
        setChats(prev => [data.chat, ...prev])
        setShowNewChatDialog(false)
        setNewChatData({
          type: 'direct',
          participantId: '',
          groupName: '',
          participantIds: []
        })
        toast.success('Chat created successfully')
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      toast.error('Failed to create chat')
    }
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (socket) {
      socket.close()
    }
    router.push('/')
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentChat || !socket) return
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size too large. Maximum 5MB allowed.')
      return
    }
    
    // For now, just show a message. In a real app, you'd upload to server first
    toast('File upload functionality coming soon')
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HiddenWiki Chat
          </Typography>
          
          <Chip 
            label={isConnected ? 'Online' : 'Offline'} 
            color={isConnected ? 'success' : 'error'}
            size="small"
            sx={{ mr: 2 }}
          />
          
          <IconButton color="inherit" onClick={() => setShowSettings(true)}>
            <SettingsIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex' }}>
        {/* Chat List Sidebar */}
        <Paper sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewChatDialog(true)}
            >
              New Chat
            </Button>
          </Box>
          
          <List sx={{ flexGrow: 1, overflow: 'auto' }}>
            {chats.map((chat) => (
              <ListItem
                key={chat.id}
                button
                selected={currentChat?.id === chat.id}
                onClick={() => loadMessages(chat.id)}
              >
                <ListItemAvatar>
                  <Avatar>
                    {chat.type === 'group' ? <GroupIcon /> : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={chat.type === 'group' ? chat.groupName : 
                    chat.participants.find(p => p.id !== user.id)?.displayName || 'Unknown User'}
                  secondary={chat.lastMessage?.content || 'No messages yet'}
                  secondaryTypographyProps={{ noWrap: true }}
                />
                {chat.unreadCount > 0 && (
                  <Badge badgeContent={chat.unreadCount} color="primary" />
                )}
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Chat Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {currentChat ? (
            <>
              {/* Chat Header */}
              <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">
                      {currentChat.type === 'group' ? currentChat.groupName : 
                        currentChat.participants.find(p => p.id !== user.id)?.displayName || 'Unknown User'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {currentChat.type === 'group' ? `${currentChat.participants.length} participants` : 'Direct message'}
                    </Typography>
                  </Box>
                  
                  <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Paper>

                             {/* Messages */}
               <Box sx={{ 
                 flexGrow: 1, 
                 overflow: 'auto', 
                 p: 2,
                 height: 0, // This forces the flex child to respect the parent's height
                 minHeight: 0 // Prevents flex items from growing beyond parent
               }}>
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.sender === user.id ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: message.sender === user.id ? 'primary.main' : 'grey.100',
                        color: message.sender === user.id ? 'white' : 'text.primary'
                      }}
                    >
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="caption" color="inherit">
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </Typography>
                        {message.selfDestruct?.enabled && (
                          <Chip
                            icon={<TimerIcon />}
                            label={`${selfDestruct.hours}h`}
                            size="small"
                            color="warning"
                          />
                        )}
                        {message.isEdited && (
                          <Typography variant="caption" color="inherit">
                            (edited)
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    multiline
                    maxRows={4}
                  />
                  
                  <input
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    style={{ display: 'none' }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload">
                    <IconButton component="span">
                      <AttachFileIcon />
                    </IconButton>
                  </label>
                  
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    endIcon={<SendIcon />}
                  >
                    Send
                  </Button>
                </Box>
                
                {/* Self-destruct toggle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={selfDestruct.enabled}
                      onChange={(e) => setSelfDestruct(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                  }
                  label="Self-destruct message"
                  sx={{ mt: 1 }}
                />
                
                {selfDestruct.enabled && (
                  <FormControl size="small" sx={{ ml: 2, minWidth: 120 }}>
                    <InputLabel>Duration</InputLabel>
                    <Select
                      value={selfDestruct.hours}
                      onChange={(e) => setSelfDestruct(prev => ({ ...prev, hours: e.target.value as number }))}
                      label="Duration"
                    >
                      <MenuItem value={1}>1 hour</MenuItem>
                      <MenuItem value={24}>24 hours</MenuItem>
                      <MenuItem value={168}>1 week</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Paper>
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              textAlign: 'center'
            }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Welcome to HiddenWiki Chat
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Select a chat from the sidebar to start messaging, or create a new one.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowNewChatDialog(true)}
              >
                Start New Chat
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onClose={() => setShowNewChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Chat</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Chat Type</InputLabel>
            <Select
              value={newChatData.type}
              onChange={(e) => setNewChatData(prev => ({ ...prev, type: e.target.value as 'direct' | 'group' }))}
              label="Chat Type"
            >
              <MenuItem value="direct">Direct Message</MenuItem>
              <MenuItem value="group">Group Chat</MenuItem>
            </Select>
          </FormControl>
          
          {newChatData.type === 'direct' ? (
            <TextField
              fullWidth
              label="Username or Email"
              value={newChatData.participantId}
              onChange={(e) => setNewChatData(prev => ({ ...prev, participantId: e.target.value }))}
              sx={{ mt: 2 }}
            />
          ) : (
            <>
              <TextField
                fullWidth
                label="Group Name"
                value={newChatData.groupName}
                onChange={(e) => setNewChatData(prev => ({ ...prev, groupName: e.target.value }))}
                sx={{ mt: 2 }}
              />
              <TextField
                fullWidth
                label="Participant Usernames (comma-separated)"
                value={newChatData.participantIds.join(', ')}
                onChange={(e) => setNewChatData(prev => ({ 
                  ...prev, 
                  participantIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                sx={{ mt: 2 }}
                placeholder="user1, user2, user3"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewChatDialog(false)}>Cancel</Button>
          <Button onClick={createNewChat} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>User Profile</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64 }}>
              {user.displayName?.[0] || user.username[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{user.displayName || user.username}</Typography>
              <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
              <Typography variant="body2" color="text.secondary">Role: {user.role}</Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>Chat Preferences</Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Desktop notifications"
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Sound notifications"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Chat Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Chat
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Chat
        </MenuItem>
      </Menu>
    </Box>
  )
} 