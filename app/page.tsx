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
  useMediaQuery,
  Tab,
  Tabs,
  Paper
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
  Home as HomeIcon,
  Book as BookIcon,
  School as EducationIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// Import new components
import HistoricalSearch from './components/HistoricalSearch'
import SearchResults from './components/SearchResults'
import ArticleViewer from './components/ArticleViewer'
import TodayInHistory from './components/TodayInHistory'
import FeaturedArticle from './components/FeaturedArticle'
import { WikipediaSearchResult, wikipediaAPI } from './lib/wikipedia'

// Secret trigger mechanism
const SECRET_TRIGGER_SEQUENCE = ['click', 'click', 'click', 'click', 'click']
const SECRET_PHRASE = 'hiddenwiki'

export default function HomePage() {
  // Secret access state
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginCredentials, setLoginCredentials] = useState({
    username: '',
    password: '',
    totpCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  
  // UI state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  
  // Content state
  const [searchResults, setSearchResults] = useState<WikipediaSearchResult[]>([])
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'article'>('home')
  const [randomArticles, setRandomArticles] = useState<any[]>([])
  
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

  // Initialize with random articles
  useEffect(() => {
    loadRandomArticles()
  }, [])

  const loadRandomArticles = async () => {
    try {
      const indianHistoryTopics = [
        'Mahatma Gandhi',
        'Mughal Empire',
        'Indus Valley Civilization',
        'Indian independence movement',
        'Taj Mahal',
        'Ashoka the Great',
        'Chhatrapati Shivaji',
        'Indian National Congress',
        'Partition of India',
        'Akbar',
        'Chandragupta Maurya',
        'Indian art',
        'Vedic period',
        'Delhi Sultanate',
        'Jawaharlal Nehru',
        'Subhas Chandra Bose'
      ]
      
      const articles = []
      for (let i = 0; i < 6; i++) {
        const randomTopic = indianHistoryTopics[Math.floor(Math.random() * indianHistoryTopics.length)]
        const article = await wikipediaAPI.getPageSummary(randomTopic)
        if (article) articles.push(article)
      }
      setRandomArticles(articles)
    } catch (error) {
      console.error('Error loading random articles:', error)
    }
  }

  // Handle search results
  const handleSearchResults = (results: WikipediaSearchResult[]) => {
    setSearchResults(results)
    setCurrentView('search')
  }

  // Handle article selection
  const handleArticleSelect = (title: string) => {
    setSelectedArticle(title)
    setCurrentView('article')
  }

  // Handle back navigation
  const handleBack = () => {
    if (currentView === 'article') {
      setCurrentView('search')
      setSelectedArticle(null)
    } else if (currentView === 'search') {
      setCurrentView('home')
      setSearchResults([])
    }
  }

  // Handle secret search phrase
  const handleSecretSearch = (query: string) => {
    if (query.toLowerCase() === SECRET_PHRASE) {
      setShowLoginForm(true)
      toast.success('Access granted')
      return true
    }
    return false
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
    { name: 'Ancient India', icon: <HistoryIcon />, color: '#FF6B35', description: 'Explore ancient Indian civilizations, Vedic period, and early kingdoms', query: 'ancient India civilization Indus Valley Vedic' },
    { name: 'Mughal Empire', icon: <CultureIcon />, color: '#8B4513', description: 'Discover the Mughal dynasty, architecture, and cultural influence', query: 'Mughal Empire India Akbar Shah Jahan Taj Mahal' },
    { name: 'British Raj', icon: <GeographyIcon />, color: '#2E8B57', description: 'Learn about British colonial period and independence movement', query: 'British Raj India colonial independence Gandhi' },
    { name: 'Indian Leaders', icon: <BiographyIcon />, color: '#CD853F', description: 'Influential Indian leaders, freedom fighters, and personalities', query: 'Gandhi Nehru Subhas Chandra Bose Indian leaders' },
    { name: 'Indian Culture', icon: <CultureIcon />, color: '#DDA0DD', description: 'Art, literature, music, dance, festivals, and traditions of India', query: 'Indian culture art literature music dance festivals' },
    { name: 'Indian Science', icon: <ScienceIcon />, color: '#4682B4', description: 'Scientific achievements, ancient knowledge, and modern innovations', query: 'Indian science Aryabhata mathematics astronomy Ayurveda' }
  ]

  const tabs = [
    { label: 'Home', icon: <HomeIcon /> },
    { label: 'Research Tools', icon: <BookIcon /> },
    { label: 'Timeline', icon: <TimelineIcon /> },
    { label: 'Education', icon: <EducationIcon /> }
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
            {/* Main search is now on the homepage - this header is kept clean */}
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
        {/* Conditional Content Based on Current View */}
        {currentView === 'article' && selectedArticle ? (
          <ArticleViewer
            title={selectedArticle}
            onBack={handleBack}
            onArticleSelect={handleArticleSelect}
          />
        ) : currentView === 'search' ? (
          <Box>
            <Box sx={{ mb: 4 }}>
              <HistoricalSearch
                onSearchResults={handleSearchResults}
                onArticleSelect={handleArticleSelect}
                placeholder="Search historical topics, events, people..."
                showFilters={true}
              />
            </Box>
            <SearchResults
              results={searchResults}
              onArticleSelect={handleArticleSelect}
            />
          </Box>
        ) : (
          <>
        {/* Welcome Section */}
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h1" component="h1" gutterBottom>
                Welcome to HiddenWiki
              </Typography>
              <Typography variant="h5" color="text.secondary" paragraph>
                Your comprehensive gateway to historical knowledge, research tools, and educational resources
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Explore fascinating historical articles, discover events, and access powerful research tools
              </Typography>
              
              {/* Enhanced Search */}
              <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
                <HistoricalSearch
                  onSearchResults={handleSearchResults}
                  onArticleSelect={handleArticleSelect}
                  placeholder="Search Indian history, leaders, culture, empires, independence..."
                  showFilters={false}
                />
              </Box>
        </Box>

            {/* Navigation Tabs */}
            <Paper sx={{ mb: 4 }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                centered
                textColor="primary"
                indicatorColor="primary"
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    label={tab.label}
                    icon={tab.icon}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Paper>

            {/* Tab Content */}
            {activeTab === 0 && (
              <Grid container spacing={4}>
                {/* Featured Article */}
                <Grid item xs={12} md={6}>
                  <FeaturedArticle onArticleSelect={handleArticleSelect} />
                </Grid>

                {/* Today in History */}
                <Grid item xs={12} md={6}>
                  <TodayInHistory onArticleSelect={handleArticleSelect} />
                </Grid>
              </Grid>
            )}
          </>
        )}

            {/* Research Tools Tab */}
            {activeTab === 1 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Historical Dictionary
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Look up historical terms, concepts, and definitions with cross-references and etymology.
                      </Typography>
                      <Button variant="outlined" fullWidth>
                        Access Dictionary
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Citation Generator
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Automatically generate proper citations for historical sources and Wikipedia articles.
                      </Typography>
                      <Button variant="outlined" fullWidth>
                        Generate Citations
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Timeline Builder
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Create custom historical timelines for research and educational purposes.
                      </Typography>
                      <Button variant="outlined" fullWidth>
                        Build Timeline
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Research Notes
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Organize your historical research with our integrated note-taking system.
                      </Typography>
                      <Button variant="outlined" fullWidth>
                        Take Notes
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Timeline Tab */}
            {activeTab === 2 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Interactive Historical Timeline
                </Typography>
                <Typography color="text.secondary" paragraph>
                  Explore major historical events through an interactive timeline spanning from ancient civilizations to modern times.
                </Typography>
                <Button variant="contained" size="large">
                  Launch Timeline
                </Button>
              </Box>
            )}

            {/* Education Tab */}
            {activeTab === 3 && (
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <EducationIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Historical Quizzes
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Test your knowledge with interactive quizzes on various historical topics.
                      </Typography>
                      <Button variant="outlined">
                        Start Quiz
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <BookIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Study Guides
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Comprehensive study guides for different historical periods and topics.
                      </Typography>
                      <Button variant="outlined">
                        Browse Guides
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <HistoryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Virtual Tours
                      </Typography>
                      <Typography color="text.secondary" paragraph>
                        Take virtual tours of historical sites and archaeological discoveries.
                      </Typography>
                      <Button variant="outlined">
                        Start Tour
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

        {/* Historical Categories Section - Only show on Home tab */}
        {activeTab === 0 && (
          <>
                        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4, mt: 6 }}>
              Explore Indian Historical Periods
        </Typography>
        
        <Grid container spacing={4} sx={{ mb: 6 }}>
              {categories.map((category, index) => (
                <Grid item xs={12} md={6} lg={4} key={category.name}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => {
                      // Search for content in this category using the specific query
                      const categoryQuery = category.query || category.name.toLowerCase();
                      wikipediaAPI.searchHistoricalContent(categoryQuery, [], 20)
                        .then(results => {
                          if (results.length > 0) {
                            handleSearchResults(results);
                          } else {
                            toast.error(`No content found for ${category.name}`);
                          }
                        })
                        .catch(error => {
                          console.error('Category search error:', error);
                          toast.error('Failed to search category');
                        });
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: category.color, 
                          width: 64, 
                          height: 64, 
                          mx: 'auto', 
                          mb: 2 
                        }}
                      >
                        {category.icon}
                      </Avatar>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                        {category.description}
                  </Typography>
                </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      <Button size="small" variant="outlined">
                        Explore {category.name}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

            {/* Random Historical Articles */}
            {randomArticles.length > 0 && (
              <>
        <Typography variant="h2" component="h2" gutterBottom sx={{ mb: 4 }}>
                  Explore Indian History & Heritage
        </Typography>
        
                <Grid container spacing={4} sx={{ mb: 6 }}>
                  {randomArticles.slice(0, 3).map((article, index) => (
                    <Grid item xs={12} md={4} key={index}>
              <Card 
                sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                  cursor: 'pointer',
                          '&:hover': { boxShadow: 4 }
                        }}
                        onClick={() => handleArticleSelect(article.title)}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {article.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {article.extract?.substring(0, 150)}...
                  </Typography>
                </CardContent>
                        <CardActions>
                          <Button size="small" onClick={() => handleArticleSelect(article.title)}>
                            Read Article
                          </Button>
                          <Button size="small" onClick={loadRandomArticles}>
                            More Random
                          </Button>
                        </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
              </>
            )}
          </>
        )}

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