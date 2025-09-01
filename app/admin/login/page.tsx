'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
  Avatar
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: '',
    totpCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  
  const router = useRouter()

  // Check if already logged in as admin
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        if (user.role === 'admin') {
          router.push('/admin')
          return
        }
      } catch (error) {
        // Invalid user data, continue to login
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: credentials.identifier,
          password: credentials.password,
          totpCode: credentials.totpCode || undefined
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Check if user is admin
        if (data.user.role !== 'admin') {
          setError('Access denied: Administrator privileges required')
          return
        }

        // Store token and user data
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        toast.success('Admin login successful!')
        router.push('/admin')
      } else {
        if (data.code === 'TOTP_REQUIRED') {
          setRequires2FA(true)
          setError('Two-factor authentication code required')
        } else {
          setError(data.error || 'Login failed')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    if (error) setError('') // Clear error when user starts typing
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              color: 'white',
              p: 4,
              textAlign: 'center'
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <AdminIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Admin Portal
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              HiddenWiki Administration Panel
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username or Email"
                variant="outlined"
                value={credentials.identifier}
                onChange={handleInputChange('identifier')}
                sx={{ mb: 3 }}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SecurityIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={credentials.password}
                onChange={handleInputChange('password')}
                sx={{ mb: 3 }}
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {requires2FA && (
                <TextField
                  fullWidth
                  label="2FA Code"
                  variant="outlined"
                  value={credentials.totpCode}
                  onChange={handleInputChange('totpCode')}
                  sx={{ mb: 3 }}
                  disabled={isLoading}
                  placeholder="123456"
                  inputProps={{ maxLength: 6 }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading || !credentials.identifier || !credentials.password}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    Authenticating...
                  </>
                ) : (
                  'Access Admin Panel'
                )}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Authorized personnel only
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                All login attempts are monitored and logged
              </Typography>
            </Box>
          </CardContent>
        </Paper>

        {/* Security Notice */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            🔒 This is a secure admin portal with advanced threat detection
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Suspicious activities will be automatically blocked
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
