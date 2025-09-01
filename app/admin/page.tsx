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
  Search as SearchIcon
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
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<DashboardIcon />} label="Dashboard" />
            <Tab icon={<SecurityIcon />} label="Security Logs" />
            <Tab icon={<PeopleIcon />} label="Users" />
            <Tab icon={<WarningIcon />} label="Suspicious Activity" />
            <Tab icon={<BlockIcon />} label="Blocked IPs" />
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

        {/* Security Logs Tab */}
        {currentTab === 1 && (
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
        {currentTab === 2 && (
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
        {currentTab === 3 && (
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
        {currentTab === 4 && (
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
