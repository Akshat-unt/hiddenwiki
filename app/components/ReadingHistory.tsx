'use client'

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  History as HistoryIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingIcon,
  Today as TodayIcon,
  CalendarToday as CalendarIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

interface ReadingHistoryItem {
  id: string;
  title: string;
  timestamp: number;
  readingTime: number; // in seconds
  progress: number; // percentage 0-100
  category: string;
  completed: boolean;
}

interface ReadingStats {
  totalArticles: number;
  totalReadingTime: number; // in minutes
  averageProgress: number;
  articlesThisWeek: number;
  completedArticles: number;
  favoriteCategory: string;
}

interface ReadingHistoryProps {
  onArticleSelect?: (title: string) => void;
}

export default function ReadingHistory({ onArticleSelect }: ReadingHistoryProps) {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [stats, setStats] = useState<ReadingStats>({
    totalArticles: 0,
    totalReadingTime: 0,
    averageProgress: 0,
    articlesThisWeek: 0,
    completedArticles: 0,
    favoriteCategory: 'General'
  });
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'today'>('all');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Load reading history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('readingHistory');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed);
      calculateStats(parsed);
    }
  }, []);

  // Calculate reading statistics
  const calculateStats = (historyItems: ReadingHistoryItem[]) => {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date().setHours(0, 0, 0, 0);

    const totalReadingTime = historyItems.reduce((sum, item) => sum + item.readingTime, 0);
    const averageProgress = historyItems.length > 0 
      ? historyItems.reduce((sum, item) => sum + item.progress, 0) / historyItems.length 
      : 0;
    
    const articlesThisWeek = historyItems.filter(item => item.timestamp > weekAgo).length;
    const completedArticles = historyItems.filter(item => item.completed).length;
    
    // Find favorite category
    const categoryCount = historyItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'General'
    );

    setStats({
      totalArticles: historyItems.length,
      totalReadingTime: Math.round(totalReadingTime / 60), // Convert to minutes
      averageProgress: Math.round(averageProgress),
      articlesThisWeek,
      completedArticles,
      favoriteCategory
    });
  };

  // Filter history items
  const filteredHistory = history.filter(item => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'completed':
        return item.completed;
      case 'in-progress':
        return !item.completed && item.progress > 0;
      case 'today':
        return item.timestamp >= todayStart;
      default:
        return true;
    }
  }).sort((a, b) => b.timestamp - a.timestamp);

  // Delete history item
  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('readingHistory', JSON.stringify(updatedHistory));
    calculateStats(updatedHistory);
  };

  // Clear all history
  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('readingHistory');
    calculateStats([]);
    setClearDialogOpen(false);
  };

  // Format reading time
  const formatReadingTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'General': '#1976d2',
      'Ancient': '#8b4513',
      'Medieval': '#4caf50',
      'Modern': '#ff9800',
      'Culture': '#9c27b0',
      'Science': '#00bcd4',
      'Biography': '#f44336'
    };
    return colors[category] || '#757575';
  };

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <ArticleIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.totalArticles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Articles Read
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TimeIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.totalReadingTime}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Minutes Read
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.averageProgress}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CalendarIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {stats.articlesThisWeek}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This Week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Chips and Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`All (${history.length})`}
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label={`Completed (${stats.completedArticles})`}
            onClick={() => setFilter('completed')}
            color={filter === 'completed' ? 'primary' : 'default'}
            variant={filter === 'completed' ? 'filled' : 'outlined'}
          />
          <Chip
            label="In Progress"
            onClick={() => setFilter('in-progress')}
            color={filter === 'in-progress' ? 'primary' : 'default'}
            variant={filter === 'in-progress' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Today"
            onClick={() => setFilter('today')}
            color={filter === 'today' ? 'primary' : 'default'}
            variant={filter === 'today' ? 'filled' : 'outlined'}
          />
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearIcon />}
          onClick={() => setClearDialogOpen(true)}
          disabled={history.length === 0}
        >
          Clear History
        </Button>
      </Box>

      {/* Reading History List */}
      {filteredHistory.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filter === 'all' ? 'No reading history yet' : `No ${filter} articles`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filter === 'all' 
              ? 'Start reading articles to track your learning journey' 
              : `Try changing the filter to see more articles`
            }
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {filteredHistory.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem sx={{ py: 2 }}>
                  <Avatar sx={{ 
                    mr: 2, 
                    bgcolor: getCategoryColor(item.category),
                    width: 40,
                    height: 40
                  }}>
                    <ArticleIcon />
                  </Avatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {item.title}
                        </Typography>
                        {item.completed && (
                          <Chip size="small" label="Completed" color="success" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Chip
                            size="small"
                            label={item.category}
                            sx={{ 
                              backgroundColor: getCategoryColor(item.category),
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatReadingTime(item.readingTime)} • {new Date(item.timestamp).toLocaleDateString()}
                          </Typography>
                        </Box>
                        
                        {item.progress > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={item.progress}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(item.progress)}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onArticleSelect?.(item.title)}
                      sx={{ mr: 1 }}
                    >
                      {item.completed ? 'Re-read' : 'Continue'}
                    </Button>
                    <IconButton
                      edge="end"
                      onClick={() => deleteHistoryItem(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Clear History Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>Clear Reading History</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear your entire reading history? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button onClick={clearAllHistory} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Export utility functions for other components to use
export const addToReadingHistory = (
  title: string, 
  readingTime: number, 
  progress: number = 0, 
  category: string = 'General'
) => {
  const existingHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]');
  
  // Check if article already exists in history
  const existingIndex = existingHistory.findIndex((item: ReadingHistoryItem) => item.title === title);
  
  if (existingIndex >= 0) {
    // Update existing entry
    existingHistory[existingIndex] = {
      ...existingHistory[existingIndex],
      timestamp: Date.now(),
      readingTime: existingHistory[existingIndex].readingTime + readingTime,
      progress: Math.max(existingHistory[existingIndex].progress, progress),
      completed: progress >= 95 // Mark as completed if 95% or more
    };
  } else {
    // Add new entry
    const newItem: ReadingHistoryItem = {
      id: Date.now().toString(),
      title,
      timestamp: Date.now(),
      readingTime,
      progress,
      category,
      completed: progress >= 95
    };
    existingHistory.unshift(newItem);
  }

  // Keep only last 100 items
  const trimmedHistory = existingHistory.slice(0, 100);
  localStorage.setItem('readingHistory', JSON.stringify(trimmedHistory));
};

export const getReadingProgress = (title: string): number => {
  const history = JSON.parse(localStorage.getItem('readingHistory') || '[]');
  const item = history.find((h: ReadingHistoryItem) => h.title === title);
  return item ? item.progress : 0;
};
