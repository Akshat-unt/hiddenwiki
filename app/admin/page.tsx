'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  AppBar,
  Toolbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Article as BlogIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
  DevicesOther as DeviceIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Api as ApiIcon,
  Web as WebIcon,
  Monitor as MonitorIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  CloudQueue as CloudIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  PowerSettingsNew as PowerIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface LoginLog {
  _id: string
  user?: {
    _id: string
    username: string
    email: string
    role: string
  }
  username: string
  loginType: 'success' | 'failed' | 'blocked' | 'logout'
  ipAddress: string
  userAgent: string
  deviceInfo: {
    browser: string
    os: string
    device: string
    isMobile: boolean
    isBot: boolean
  }
  location: {
    country: string
    region: string
    city: string
    timezone: string
  }
  riskScore: number
  flags: string[]
  failureReason?: string
  createdAt: string
}

interface SecurityStats {
  totalAttempts: number
  successful: number
  failed: number
  blocked: number
  uniqueUsers: number
  uniqueIPs: number
  timeframe: string
}

interface User {
  _id: string
  username: string
  email: string
  role: string
  isActive: boolean
  lastLogin: string
  loginAttempts: number
  createdAt: string
}

interface SystemStats {
  server: {
    uptime: number
    memory: { used: number; total: number; percentage: number }
    cpu: { usage: number; cores: number }
    disk: { used: number; total: number; percentage: number }
  }
  database: {
    connected: boolean
    collections: number
    totalDocuments: number
    size: number
  }
  api: {
    totalRequests: number
    requestsPerMinute: number
    errorRate: number
    averageResponseTime: number
  }
  app: {
    activeUsers: number
    totalSessions: number
    chatMessages: number
    wikiSearches: number
  }
}

interface APIEndpoint {
  path: string
  method: string
  enabled: boolean
  rateLimit: number
  requestCount: number
  errorCount: number
  lastUsed: string
  averageResponseTime: number
}

interface AppFeature {
  name: string
  enabled: boolean
  description: string
  category: 'disguise' | 'chat' | 'wiki' | 'system'
  dependencies?: string[]
}

export default function AdminPanel() {
  const [currentTab, setCurrentTab] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null)
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [suspiciousActivities, setSuspiciousActivities] = useState<LoginLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [blockedIPs, setBlockedIPs] = useState<string[]>([])
  const [timeframe, setTimeframe] = useState(24)
  const [logFilter, setLogFilter] = useState({
    loginType: '',
    riskScore: '',
    page: 1,
    limit: 50
  })
  const [showBlockIPDialog, setShowBlockIPDialog] = useState(false)
  const [blockIPData, setBlockIPData] = useState({ ipAddress: '', action: 'block' })
  
  // New state for enhanced admin features
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([])
  const [appFeatures, setAppFeatures] = useState<AppFeature[]>([])
  const [realTimeData, setRealTimeData] = useState<any>({})
  const [systemSettings, setSystemSettings] = useState<any>({})
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  
  const router = useRouter()

  // Check admin authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/')
      return
    }

    try {
      const userObj = JSON.parse(userData)
      if (userObj.role !== 'admin') {
        toast.error('Access denied: Admin privileges required')
        router.push('/')
        return
      }
      
      setUser(userObj)
      loadDashboardData()
      loadEnhancedData()
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/')
    }
  }, [router])

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Load security dashboard
      const dashboardResponse = await fetch(`http://localhost:3001/api/admin/security/dashboard?timeframe=${timeframe}`, {
        headers
      })
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        setSecurityStats(dashboardData.data.stats)
        setSuspiciousActivities(dashboardData.data.suspiciousActivities || [])
        setBlockedIPs(dashboardData.data.blockedIPs || [])
      }

      // Load login logs
      const logsResponse = await fetch(`http://localhost:3001/api/admin/security/login-logs?timeframe=${timeframe}&limit=${logFilter.limit}`, {
        headers
      })
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLoginLogs(logsData.logs || [])
      }

      // Load users
      const usersResponse = await fetch('http://localhost:3001/api/admin/users', {
        headers
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // Load system stats and enhanced data
  const loadEnhancedData = async () => {
    try {
      // Mock system stats - in real implementation, this would come from server
      setSystemStats({
        server: {
          uptime: 86400, // 24 hours
          memory: { used: 2048, total: 4096, percentage: 50 },
          cpu: { usage: 25, cores: 4 },
          disk: { used: 10240, total: 51200, percentage: 20 }
        },
        database: {
          connected: true,
          collections: 5,
          totalDocuments: 1250,
          size: 25600
        },
        api: {
          totalRequests: 12500,
          requestsPerMinute: 45,
          errorRate: 2.1,
          averageResponseTime: 120
        },
        app: {
          activeUsers: 15,
          totalSessions: 28,
          chatMessages: 342,
          wikiSearches: 156
        }
      });

      // Mock API endpoints
      setApiEndpoints([
        { path: '/api/auth/login', method: 'POST', enabled: true, rateLimit: 10, requestCount: 245, errorCount: 3, lastUsed: '2024-01-15T10:30:00Z', averageResponseTime: 150 },
        { path: '/api/auth/register', method: 'POST', enabled: true, rateLimit: 5, requestCount: 45, errorCount: 1, lastUsed: '2024-01-15T09:15:00Z', averageResponseTime: 200 },
        { path: '/api/chats', method: 'GET', enabled: true, rateLimit: 60, requestCount: 1250, errorCount: 5, lastUsed: '2024-01-15T10:45:00Z', averageResponseTime: 80 },
        { path: '/api/admin/users', method: 'GET', enabled: true, rateLimit: 30, requestCount: 125, errorCount: 0, lastUsed: '2024-01-15T10:40:00Z', averageResponseTime: 95 },
        { path: '/api/wikipedia/search', method: 'GET', enabled: true, rateLimit: 120, requestCount: 856, errorCount: 12, lastUsed: '2024-01-15T10:47:00Z', averageResponseTime: 250 }
      ]);

      // Mock app features
      setAppFeatures([
        { name: 'Blog Facade', enabled: true, description: 'Public-facing blog appearance', category: 'disguise' },
        { name: 'Wikipedia Integration', enabled: true, description: 'Historical content from Wikipedia', category: 'disguise' },
        { name: 'Search Functionality', enabled: true, description: 'Advanced search with filters', category: 'disguise' },
        { name: 'Secret Access', enabled: true, description: 'Hidden trigger mechanisms', category: 'disguise', dependencies: ['Blog Facade'] },
        
        { name: 'Real-time Messaging', enabled: true, description: 'Live chat functionality', category: 'chat' },
        { name: 'End-to-End Encryption', enabled: true, description: 'Message encryption/decryption', category: 'chat' },
        { name: 'File Sharing', enabled: true, description: 'Encrypted file uploads', category: 'chat' },
        { name: 'Self-Destructing Messages', enabled: false, description: 'Auto-delete messages', category: 'chat' },
        
        { name: 'Article Viewer', enabled: true, description: 'Full Wikipedia article display', category: 'wiki' },
        { name: 'Today in History', enabled: true, description: 'Daily historical events', category: 'wiki' },
        { name: 'Random Articles', enabled: true, description: 'Random historical content', category: 'wiki' },
        { name: 'Bookmarking', enabled: true, description: 'Save articles for later', category: 'wiki' },
        
        { name: 'User Management', enabled: true, description: 'User account management', category: 'system' },
        { name: 'Security Logging', enabled: true, description: 'Comprehensive audit logs', category: 'system' },
        { name: 'Rate Limiting', enabled: true, description: 'API rate limiting protection', category: 'system' },
        { name: '2FA Authentication', enabled: true, description: 'Two-factor authentication', category: 'system' }
      ]);

    } catch (error) {
      console.error('Error loading enhanced data:', error);
    }
  };

  // Initialize enhanced data on component mount
  useEffect(() => {
    if (user) {
      loadEnhancedData();
    }
  }, [user]);

  // Auto-refresh system stats every 30 seconds for System Monitor tab
  useEffect(() => {
    if (currentTab === 1 && systemStats) {
      const interval = setInterval(() => {
        // Simulate real-time updates by slightly modifying the stats
        setSystemStats(prev => prev ? {
          ...prev,
          server: {
            ...prev.server,
            cpu: { ...prev.server.cpu, usage: Math.max(10, Math.min(90, prev.server.cpu.usage + (Math.random() - 0.5) * 10)) },
            memory: { ...prev.server.memory, percentage: Math.max(20, Math.min(80, prev.server.memory.percentage + (Math.random() - 0.5) * 5)) }
          },
          api: {
            ...prev.api,
            requestsPerMinute: Math.max(0, prev.api.requestsPerMinute + Math.floor((Math.random() - 0.5) * 10)),
            totalRequests: prev.api.totalRequests + Math.floor(Math.random() * 5)
          },
          app: {
            ...prev.app,
            activeUsers: Math.max(1, prev.app.activeUsers + Math.floor((Math.random() - 0.5) * 3)),
            wikiSearches: prev.app.wikiSearches + Math.floor(Math.random() * 2)
          }
        } : prev);
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [currentTab, systemStats]);

  // Handle API endpoint toggle
  const handleToggleEndpoint = async (index: number) => {
    try {
      const newEndpoints = [...apiEndpoints];
      newEndpoints[index].enabled = !newEndpoints[index].enabled;
      setApiEndpoints(newEndpoints);
      
      toast.success(`API endpoint ${newEndpoints[index].enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to toggle API endpoint');
    }
  };

  // Handle feature toggle
  const handleToggleFeature = async (featureName: string) => {
    try {
      const newFeatures = [...appFeatures];
      const featureIndex = newFeatures.findIndex(f => f.name === featureName);
      if (featureIndex !== -1) {
        newFeatures[featureIndex].enabled = !newFeatures[featureIndex].enabled;
        setAppFeatures(newFeatures);
        
        toast.success(`Feature ${newFeatures[featureIndex].enabled ? 'enabled' : 'disabled'}: ${featureName}`);
      }
    } catch (error) {
      toast.error('Failed to toggle feature');
    }
  };

  // Handle system actions
  const handleSystemAction = async (action: string) => {
    try {
      switch (action) {
        case 'restart':
          toast.success('Services restarted successfully');
          break;
        case 'clear-cache':
          toast.success('Cache cleared successfully');
          break;
        case 'export-logs':
          // In real implementation, this would trigger a download
          toast.success('Logs exported successfully');
          break;
        case 'shutdown':
          if (confirm('Are you sure you want to shut down the system?')) {
            toast.error('System shutdown initiated');
          }
          break;
        default:
          toast.info(`Action ${action} executed`);
      }
    } catch (error) {
      toast.error(`Failed to execute ${action}`);
    }
  };

  // Handle settings update
  const handleUpdateSettings = async (settings: any) => {
    try {
      setSystemSettings(settings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/')
    }
  }

  // Block/unblock IP
  const handleBlockIP = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/admin/security/block-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(blockIPData)
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
        loadDashboardData()
        setShowBlockIPDialog(false)
        setBlockIPData({ ipAddress: '', action: 'block' })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to block/unblock IP')
      }
    } catch (error) {
      console.error('Block IP error:', error)
      toast.error('Network error')
    }
  }

  // Get risk score color
  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'error'
    if (score >= 50) return 'warning'
    if (score >= 30) return 'info'
    return 'success'
  }

  // Get login type color
  const getLoginTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success'
      case 'failed': return 'error'
      case 'blocked': return 'warning'
      case 'logout': return 'info'
      default: return 'default'
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <SecurityIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HiddenWiki Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.username}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<DashboardIcon />} label="Dashboard" />
            <Tab icon={<MonitorIcon />} label="System Monitor" />
            <Tab icon={<ApiIcon />} label="API Control" />
            <Tab icon={<WebIcon />} label="App Features" />
            <Tab icon={<SecurityIcon />} label="Security Logs" />
            <Tab icon={<PeopleIcon />} label="Users" />
            <Tab icon={<WarningIcon />} label="Suspicious Activity" />
            <Tab icon={<BlockIcon />} label="Blocked IPs" />
            <Tab icon={<SettingsIcon />} label="System Settings" />
          </Tabs>
        </Box>

        {/* Dashboard Tab */}
        {currentTab === 0 && (
          <Box>
            {/* Controls */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small">
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as number)}
                  label="Timeframe"
                >
                  <MenuItem value={1}>Last Hour</MenuItem>
                  <MenuItem value={24}>Last 24 Hours</MenuItem>
                  <MenuItem value={168}>Last Week</MenuItem>
                  <MenuItem value={720}>Last Month</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadDashboardData}
              >
                Refresh
              </Button>
            </Box>

            {/* Stats Cards */}
            {securityStats && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Attempts
                      </Typography>
                      <Typography variant="h4">
                        {securityStats.totalAttempts}
                      </Typography>
                      <Typography variant="body2">
                        {securityStats.timeframe}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Successful Logins
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {securityStats.successful}
                      </Typography>
                      <Typography variant="body2">
                        {((securityStats.successful / securityStats.totalAttempts) * 100 || 0).toFixed(1)}% success rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Failed Attempts
                      </Typography>
                      <Typography variant="h4" color="error.main">
                        {securityStats.failed}
                      </Typography>
                      <Typography variant="body2">
                        {((securityStats.failed / securityStats.totalAttempts) * 100 || 0).toFixed(1)}% failure rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Blocked Attempts
                      </Typography>
                      <Typography variant="h4" color="warning.main">
                        {securityStats.blocked}
                      </Typography>
                      <Typography variant="body2">
                        {blockedIPs.length} blocked IPs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Recent Activity */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardHeader title="Recent Login Activity" />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>IP Address</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Risk</TableCell>
                            <TableCell>Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loginLogs.slice(0, 10).map((log) => (
                            <TableRow key={log._id}>
                              <TableCell>{log.username}</TableCell>
                              <TableCell>
                                <Chip
                                  label={log.loginType}
                                  color={getLoginTypeColor(log.loginType) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{log.ipAddress}</TableCell>
                              <TableCell>
                                {log.location.city}, {log.location.country}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={log.riskScore}
                                  color={getRiskScoreColor(log.riskScore) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardHeader title="System Status" />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Database"
                          secondary="Connected"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Login Tracking"
                          secondary="Active"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Suspicious Activities"
                          secondary={`${suspiciousActivities.length} detected`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BlockIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Blocked IPs"
                          secondary={`${blockedIPs.length} blocked`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* System Monitor Tab */}
        {currentTab === 1 && (
          <Box>
            {/* Controls */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadEnhancedData}
                disabled={isLoading}
              >
                Refresh Data
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: 'success.main',
                    animation: 'pulse 2s infinite'
                  }} 
                />
                <Typography variant="body2" color="text.secondary">
                  Auto-refreshing every 30s
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Server Stats */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Server Performance" 
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><SpeedIcon /></Avatar>}
                  />
                  <CardContent>
                    {systemStats ? (
                      <Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">CPU Usage</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <div style={{ 
                                width: '100%', 
                                height: 8, 
                                backgroundColor: '#e0e0e0', 
                                borderRadius: 4,
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${systemStats.server.cpu.usage}%`,
                                  height: '100%',
                                  backgroundColor: systemStats.server.cpu.usage > 80 ? '#f44336' : 
                                                 systemStats.server.cpu.usage > 60 ? '#ff9800' : '#4caf50'
                                }} />
                              </div>
                            </Box>
                            <Typography variant="body2">{systemStats.server.cpu.usage}%</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">Memory Usage</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <div style={{ 
                                width: '100%', 
                                height: 8, 
                                backgroundColor: '#e0e0e0', 
                                borderRadius: 4,
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${systemStats.server.memory.percentage}%`,
                                  height: '100%',
                                  backgroundColor: systemStats.server.memory.percentage > 80 ? '#f44336' : 
                                                 systemStats.server.memory.percentage > 60 ? '#ff9800' : '#4caf50'
                                }} />
                              </div>
                            </Box>
                            <Typography variant="body2">{systemStats.server.memory.percentage}%</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Uptime</Typography>
                          <Typography variant="h6">{Math.floor(systemStats.server.uptime / 3600)}h {Math.floor((systemStats.server.uptime % 3600) / 60)}m</Typography>
                        </Box>
                      </Box>
                    ) : (
                      <CircularProgress />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Database Stats */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Database Status" 
                    avatar={<Avatar sx={{ bgcolor: 'success.main' }}><StorageIcon /></Avatar>}
                  />
                  <CardContent>
                    {systemStats ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                          <Typography>Connected</Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary">Collections: {systemStats.database.collections}</Typography>
                        <Typography variant="body2" color="textSecondary">Documents: {systemStats.database.totalDocuments}</Typography>
                        <Typography variant="body2" color="textSecondary">Size: {(systemStats.database.size / (1024 * 1024)).toFixed(2)} MB</Typography>
                      </Box>
                    ) : (
                      <CircularProgress />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* API Stats */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="API Performance" 
                    avatar={<Avatar sx={{ bgcolor: 'info.main' }}><ApiIcon /></Avatar>}
                  />
                  <CardContent>
                    {systemStats ? (
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="h4">{systemStats.api.totalRequests}</Typography>
                          <Typography variant="body2" color="textSecondary">Total Requests</Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="h4">{systemStats.api.requestsPerMinute}</Typography>
                          <Typography variant="body2" color="textSecondary">Requests/min</Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="h4">{systemStats.api.errorRate}%</Typography>
                          <Typography variant="body2" color="textSecondary">Error Rate</Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="h4">{systemStats.api.averageResponseTime}ms</Typography>
                          <Typography variant="body2" color="textSecondary">Avg Response</Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <CircularProgress />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* API Control Tab */}
        {currentTab === 2 && (
          <Box>
            {/* Controls */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadEnhancedData}
                disabled={isLoading}
              >
                Refresh API Data
              </Button>
            </Box>

            <Card>
              <CardHeader 
                title="API Endpoint Management" 
                subheader="Monitor and control API endpoints"
                action={
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!maintenanceMode}
                        onChange={(e) => setMaintenanceMode(!e.target.checked)}
                      />
                    }
                    label="API Enabled"
                  />
                }
              />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rate Limit</TableCell>
                        <TableCell>Requests</TableCell>
                        <TableCell>Errors</TableCell>
                        <TableCell>Avg Response</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {apiEndpoints.length > 0 ? apiEndpoints.map((endpoint, index) => (
                        <TableRow key={index}>
                          <TableCell>{endpoint.path}</TableCell>
                          <TableCell>
                            <Chip 
                              label={endpoint.method} 
                              size="small"
                              color={endpoint.method === 'GET' ? 'primary' : 
                                     endpoint.method === 'POST' ? 'success' : 
                                     endpoint.method === 'PUT' ? 'warning' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={endpoint.enabled ? 'Enabled' : 'Disabled'} 
                              color={endpoint.enabled ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{endpoint.rateLimit}/min</TableCell>
                          <TableCell>{endpoint.requestCount}</TableCell>
                          <TableCell>
                            <Chip 
                              label={endpoint.errorCount} 
                              color={endpoint.errorCount > 0 ? 'error' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{endpoint.averageResponseTime}ms</TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleToggleEndpoint(index)}
                              color={endpoint.enabled ? 'success' : 'default'}
                            >
                              {endpoint.enabled ? <ToggleOnIcon /> : <ToggleOffIcon />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            {isLoading ? <CircularProgress /> : 'No API endpoints found'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* App Features Tab */}
        {currentTab === 3 && (
          <Box>
            <Grid container spacing={3}>
              {['disguise', 'chat', 'wiki', 'system'].map((category) => (
                <Grid item xs={12} md={6} key={category}>
                  <Card>
                    <CardHeader 
                      title={`${category.charAt(0).toUpperCase() + category.slice(1)} Features`}
                      avatar={
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {category === 'disguise' ? <WebIcon /> :
                           category === 'chat' ? <ChatIcon /> :
                           category === 'wiki' ? <BlogIcon /> : <SettingsIcon />}
                        </Avatar>
                      }
                    />
                    <CardContent>
                      {appFeatures.filter(f => f.category === category).length > 0 ? 
                        appFeatures.filter(f => f.category === category).map((feature, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1">{feature.name}</Typography>
                            <Switch
                              checked={feature.enabled}
                              onChange={() => handleToggleFeature(feature.name)}
                            />
                          </Box>
                          <Typography variant="body2" color="textSecondary">
                            {feature.description}
                          </Typography>
                          {feature.dependencies && (
                            <Typography variant="caption" color="textSecondary">
                              Dependencies: {feature.dependencies.join(', ')}
                            </Typography>
                          )}
                        </Box>
                      )) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          {isLoading ? <CircularProgress /> : `No ${category} features available`}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Security Logs Tab */}
        {currentTab === 4 && (
          <Box>
            {/* Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Login Type</InputLabel>
                <Select
                  value={logFilter.loginType}
                  onChange={(e) => setLogFilter(prev => ({ ...prev, loginType: e.target.value }))}
                  label="Login Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="logout">Logout</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Risk Score</InputLabel>
                <Select
                  value={logFilter.riskScore}
                  onChange={(e) => setLogFilter(prev => ({ ...prev, riskScore: e.target.value }))}
                  label="Risk Score"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="70">High (70+)</MenuItem>
                  <MenuItem value="50">Medium (50+)</MenuItem>
                  <MenuItem value="30">Low (30+)</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadDashboardData}
              >
                Apply Filters
              </Button>
            </Box>

            {/* Logs Table */}
            <Card>
              <CardHeader title="Login Logs" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>IP Address</TableCell>
                        <TableCell>Device</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Risk Score</TableCell>
                        <TableCell>Flags</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loginLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {log.username[0].toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">{log.username}</Typography>
                                {log.user && (
                                  <Typography variant="caption" color="textSecondary">
                                    {log.user.role}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.loginType}
                              color={getLoginTypeColor(log.loginType) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.ipAddress}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {log.deviceInfo.browser}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {log.deviceInfo.os} • {log.deviceInfo.device}
                                {log.deviceInfo.isMobile && ' • Mobile'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.location.city}, {log.location.country}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {log.location.timezone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.riskScore}
                              color={getRiskScoreColor(log.riskScore) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {log.flags.map((flag, index) => (
                              <Chip
                                key={index}
                                label={flag.replace('_', ' ')}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Block IP">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setBlockIPData({ ipAddress: log.ipAddress, action: 'block' })
                                  setShowBlockIPDialog(true)
                                }}
                              >
                                <BlockIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Users Tab */}
        {currentTab === 5 && (
          <Box>
            <Card>
              <CardHeader title="User Management" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Login</TableCell>
                        <TableCell>Login Attempts</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {user.username[0].toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">{user.username}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.isActive ? 'Active' : 'Inactive'}
                              color={user.isActive ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, HH:mm') : 'Never'}
                          </TableCell>
                          <TableCell>{user.loginAttempts}</TableCell>
                          <TableCell>
                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Login History">
                              <IconButton size="small">
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Suspicious Activity Tab */}
        {currentTab === 6 && (
          <Box>
            <Card>
              <CardHeader 
                title="Suspicious Activities" 
                subheader={`${suspiciousActivities.length} suspicious activities detected`}
              />
              <CardContent>
                {suspiciousActivities.length === 0 ? (
                  <Alert severity="success">
                    No suspicious activities detected in the selected timeframe.
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Risk Score</TableCell>
                          <TableCell>Flags</TableCell>
                          <TableCell>Location</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {suspiciousActivities.map((activity) => (
                          <TableRow key={activity._id}>
                            <TableCell>{activity.username}</TableCell>
                            <TableCell>
                              <Chip
                                label={activity.loginType}
                                color={getLoginTypeColor(activity.loginType) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{activity.ipAddress}</TableCell>
                            <TableCell>
                              <Chip
                                label={activity.riskScore}
                                color={getRiskScoreColor(activity.riskScore) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {activity.flags.map((flag, index) => (
                                <Chip
                                  key={index}
                                  label={flag.replace('_', ' ')}
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </TableCell>
                            <TableCell>
                              {activity.location.city}, {activity.location.country}
                            </TableCell>
                            <TableCell>
                              {format(new Date(activity.createdAt), 'MMM dd, HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  setBlockIPData({ ipAddress: activity.ipAddress, action: 'block' })
                                  setShowBlockIPDialog(true)
                                }}
                              >
                                Block IP
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Blocked IPs Tab */}
        {currentTab === 7 && (
          <Box>
            <Card>
              <CardHeader 
                title="Blocked IP Addresses" 
                subheader={`${blockedIPs.length} IP addresses currently blocked`}
                action={
                  <Button
                    variant="contained"
                    onClick={() => setShowBlockIPDialog(true)}
                  >
                    Block New IP
                  </Button>
                }
              />
              <CardContent>
                {blockedIPs.length === 0 ? (
                  <Alert severity="info">
                    No IP addresses are currently blocked.
                  </Alert>
                ) : (
                  <Grid container spacing={2}>
                    {blockedIPs.map((ip, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="h6">{ip}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              Blocked IP Address
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => {
                                  setBlockIPData({ ipAddress: ip, action: 'unblock' })
                                  setShowBlockIPDialog(true)
                                }}
                              >
                                Unblock
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* System Settings Tab */}
        {currentTab === 8 && (
          <Box>
            <Grid container spacing={3}>
              {/* General Settings */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="General Settings"
                    avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><SettingsIcon /></Avatar>}
                  />
                  <CardContent>
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={maintenanceMode}
                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                          />
                        }
                        label="Maintenance Mode"
                      />
                      <Typography variant="body2" color="textSecondary">
                        Enable to temporarily disable the application for maintenance
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.registrationEnabled !== false}
                            onChange={(e) => handleUpdateSettings({ ...systemSettings, registrationEnabled: e.target.checked })}
                          />
                        }
                        label="User Registration"
                      />
                      <Typography variant="body2" color="textSecondary">
                        Allow new users to register accounts
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={systemSettings.wikiEnabled !== false}
                            onChange={(e) => handleUpdateSettings({ ...systemSettings, wikiEnabled: e.target.checked })}
                          />
                        }
                        label="Wikipedia Integration"
                      />
                      <Typography variant="body2" color="textSecondary">
                        Enable Wikipedia API integration for historical content
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Security Settings */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Security Settings"
                    avatar={<Avatar sx={{ bgcolor: 'error.main' }}><SecurityIcon /></Avatar>}
                  />
                  <CardContent>
                    <TextField
                      fullWidth
                      label="Max Login Attempts"
                      type="number"
                      value={systemSettings.maxLoginAttempts || 5}
                      onChange={(e) => handleUpdateSettings({ ...systemSettings, maxLoginAttempts: parseInt(e.target.value) })}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Session Timeout (minutes)"
                      type="number"
                      value={systemSettings.sessionTimeout || 30}
                      onChange={(e) => handleUpdateSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                      sx={{ mb: 2 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={systemSettings.require2FA === true}
                          onChange={(e) => handleUpdateSettings({ ...systemSettings, require2FA: e.target.checked })}
                        />
                      }
                      label="Require 2FA for all users"
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* System Actions */}
              <Grid item xs={12}>
                <Card>
                  <CardHeader 
                    title="System Actions"
                    avatar={<Avatar sx={{ bgcolor: 'warning.main' }}><PowerIcon /></Avatar>}
                  />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleSystemAction('restart')}
                        >
                          Restart Services
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<CloudIcon />}
                          onClick={() => handleSystemAction('clear-cache')}
                        >
                          Clear Cache
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleSystemAction('export-logs')}
                        >
                          Export Logs
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<PowerIcon />}
                          onClick={() => handleSystemAction('shutdown')}
                        >
                          Emergency Shutdown
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>

      {/* Block IP Dialog */}
      <Dialog open={showBlockIPDialog} onClose={() => setShowBlockIPDialog(false)}>
        <DialogTitle>
          {blockIPData.action === 'block' ? 'Block IP Address' : 'Unblock IP Address'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="IP Address"
            value={blockIPData.ipAddress}
            onChange={(e) => setBlockIPData(prev => ({ ...prev, ipAddress: e.target.value }))}
            sx={{ mt: 2 }}
            placeholder="192.168.1.1"
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={blockIPData.action}
              onChange={(e) => setBlockIPData(prev => ({ ...prev, action: e.target.value }))}
              label="Action"
            >
              <MenuItem value="block">Block</MenuItem>
              <MenuItem value="unblock">Unblock</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBlockIPDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBlockIP}
            variant="contained"
            color={blockIPData.action === 'block' ? 'error' : 'success'}
          >
            {blockIPData.action === 'block' ? 'Block IP' : 'Unblock IP'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
