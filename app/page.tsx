'use client'

import React, { useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box,
  Chip,
  Avatar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Search as SearchIcon,
  Menu as MenuIcon,
  History as HistoryIcon,
  Science as ScienceIcon,
  Computer as TechnologyIcon,
  TheaterComedy as CultureIcon,
  Public as GeographyIcon,
  Person as BiographyIcon,
  Home as HomeIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// Secret trigger mechanism
const SECRET_TRIGGER_SEQUENCE = ['click', 'click', 'click', 'click', 'click']
const SECRET_PHRASE = 'hiddenwiki'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: '',
    totpCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()

  // Handle secret trigger clicks
  const handleSecretClick = () => {
    const now = Date.now()
    
    // Reset if too much time has passed
    if (now - lastClickTime > 5000) {
      setClickCount(1)
      setLastClickTime(now)
      return
    }
    
    const newCount = clickCount + 1
    setClickCount(newCount)
    setLastClickTime(now)
    
    // Check if secret sequence is complete
    if (newCount >= SECRET_TRIGGER_SEQUENCE.length) {
      setShowLoginForm(true)
      setClickCount(0)
      toast.success('Access granted')
    }
  }

  // Handle search with secret phrase detection
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchQuery.toLowerCase() === SECRET_PHRASE) {
      setShowLoginForm(true)
      setSearchQuery('')
      toast.success('Access granted')
      return
    }
    
    // Normal search functionality would go here
    toast('Search functionality coming soon')
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: loginCredentials.username,
          password: loginCredentials.password,
          totpCode: loginCredentials.totpCode || undefined
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Store token and redirect to chat
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('Login successful!')
        router.push('/chat')
      } else {
        toast.error(data.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Sample blog posts data
  const featuredPosts = [
    {
      id: 1,
      title: 'The Ancient Civilizations of Mesopotamia',
      excerpt: 'Explore the cradle of civilization where writing, agriculture, and urban life first emerged...',
      category: 'history',
      author: 'Dr. Sarah Johnson',
      publishedAt: '2024-01-15',
      views: 1247,
      tags: ['ancient', 'civilization', 'mesopotamia']
    },
    {
      id: 2,
      title: 'Quantum Computing: The Future of Information Processing',
      excerpt: 'Discover how quantum mechanics is revolutionizing the way we process and store information...',
      category: 'technology',
      author: 'Prof. Michael Chen',
      publishedAt: '2024-01-12',
      views: 892,
      tags: ['quantum', 'computing', 'technology']
    },
    {
      id: 3,
      title: 'The Human Brain: Understanding Consciousness',
      excerpt: 'Delve into the most complex organ in the human body and the mysteries of consciousness...',
      category: 'science',
      author: 'Dr. Emily Rodriguez',
      publishedAt: '2024-01-10',
      views: 1563,
      tags: ['neuroscience', 'consciousness', 'brain']
    }
  ]

  const categories = [
    { name: 'History', icon: <HistoryIcon />, color: '#8B4513' },
    { name: 'Science', icon: <ScienceIcon />, color: '#2E8B57' },
    { name: 'Technology', icon: <TechnologyIcon />, color: '#4682B4' },
    { name: 'Culture', icon: <CultureIcon />, color: '#DDA0DD' },
    { name: 'Geography', icon: <GeographyIcon />, color: '#F4A460' },
    { name: 'Biography', icon: <BiographyIcon />, color: '#CD853F' }
  ]

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* App Bar */}
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HiddenWiki
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex' }}>
              <TextField
                size="small"
                placeholder="Search HiddenWiki..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ 
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'transparent' },
                    '&.Mui-focused fieldset': { borderColor: 'transparent' }
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ ml: 1 }}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </form>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem button>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <Divider />
            {categories.map((category) => (
              <ListItem button key={category.name}>
                <ListItemIcon sx={{ color: category.color }}>
                  {category.icon}
                </ListItemIcon>
                <ListItemText primary={category.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Welcome to HiddenWiki
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Your gateway to knowledge across history, science, technology, culture, geography, and biography
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover fascinating articles written by experts in their fields
          </Typography>
        </Box>

        {/* Featured Posts */}
        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4 }}>
          Featured Articles
        </Typography>
        
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {featuredPosts.map((post) => (
            <Grid item xs={12} md={4} key={post.id}>
              <Card>
                <CardContent>
                  <Chip 
                    label={post.category} 
                    size="small" 
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="h5" component="h3" gutterBottom>
                    {post.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {post.excerpt}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    By {post.author} • {new Date(post.publishedAt).toLocaleDateString()} • {post.views} views
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    Read More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Categories */}
        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4 }}>
          Explore Categories
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {categories.map((category) => (
            <Grid item xs={6} sm={4} md={2} key={category.name}>
              <Card 
                sx={{ 
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardContent>
                  <Avatar 
                    sx={{ 
                      width: 56, 
                      height: 56, 
                      mx: 'auto', 
                      mb: 2,
                      backgroundColor: category.color 
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  <Typography variant="h6" component="h3">
                    {category.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Secret Trigger Area */}
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            borderTop: '1px solid #e0e0e0',
            mt: 8
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            About HiddenWiki
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            HiddenWiki is committed to providing accurate, well-researched information across all fields of knowledge.
            Our team of experts ensures that every article meets the highest standards of academic rigor.
          </Typography>
          
          {/* Hidden trigger image */}
          <Box
            component="img"
            src="/wiki-logo.png"
            alt="HiddenWiki Logo"
            sx={{ 
              width: 100, 
              height: 100, 
              cursor: 'pointer',
              opacity: 0.8,
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 1 }
            }}
            onClick={handleSecretClick}
          />
          
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Click to learn more about our mission
          </Typography>
          
          {/* Discrete admin portal link */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              color="inherit"
              onClick={() => router.push('/admin/login')}
              sx={{ 
                opacity: 0.5,
                fontSize: '0.75rem',
                '&:hover': { opacity: 0.8 }
              }}
            >
              System Administration
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Login Modal */}
      <Drawer
        anchor="right"
        open={showLoginForm}
        onClose={() => setShowLoginForm(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400 } }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Access Restricted Area
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please enter your credentials to continue.
          </Typography>
          
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              value={loginCredentials.username}
              onChange={(e) => setLoginCredentials(prev => ({ ...prev, username: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginCredentials.password}
              onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="2FA Code (if enabled)"
              value={loginCredentials.totpCode}
              onChange={(e) => setLoginCredentials(prev => ({ ...prev, totpCode: e.target.value }))}
              margin="normal"
              placeholder="Optional"
            />
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowLoginForm(false)}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Box>
      </Drawer>
    </Box>
  )
} 