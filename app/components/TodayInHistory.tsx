'use client'

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  Skeleton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon,
  Person as PersonIcon,
  LocalHospital as DeathIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { wikipediaAPI, HistoricalEvent, formatHistoricalDate } from '../lib/wikipedia';

interface TodayInHistoryProps {
  onArticleSelect?: (title: string) => void;
  maxEvents?: number;
}

export default function TodayInHistory({ onArticleSelect, maxEvents = 10 }: TodayInHistoryProps) {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTodaysEvents();
  }, []);

  const loadTodaysEvents = async () => {
    setLoading(true);
    try {
      const todaysEvents = await wikipediaAPI.getOnThisDay();
      setEvents(todaysEvents.slice(0, maxEvents));
    } catch (error) {
      console.error('Error loading today\'s events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'births':
        return <PersonIcon color="primary" />;
      case 'deaths':
        return <DeathIcon color="secondary" />;
      default:
        return <EventIcon color="action" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'births':
        return 'success';
      case 'deaths':
        return 'error';
      default:
        return 'primary';
    }
  };

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(event => event.category === selectedCategory);

  const categories = ['all', ...new Set(events.map(event => event.category))];

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Skeleton width={200} />
          </Typography>
          {[...Array(5)].map((_, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={60} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Today in History - {new Date().toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
          <IconButton onClick={loadTodaysEvents} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Category Filters */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <Chip
              key={category}
              label={category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              onClick={() => setSelectedCategory(category)}
              color={selectedCategory === category ? 'primary' : 'default'}
              size="small"
              variant={selectedCategory === category ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        {filteredEvents.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No historical events found for today.
          </Typography>
        ) : (
          <>
            <List>
              {filteredEvents.slice(0, expanded ? filteredEvents.length : 5).map((event, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      cursor: onArticleSelect ? 'pointer' : 'default',
                      '&:hover': onArticleSelect ? { backgroundColor: 'action.hover' } : {}
                    }}
                    onClick={() => {
                      if (onArticleSelect && event.title) {
                        // Clean the title for better Wikipedia lookup
                        const cleanTitle = event.title
                          .replace(/^\d+\s*[-–]\s*/, '') // Remove year prefix like "1947 - "
                          .replace(/\s*\([^)]*\)$/, '') // Remove parenthetical info at end
                          .trim();
                        onArticleSelect(cleanTitle);
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.default' }}>
                        {getCategoryIcon(event.category)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="body1" component="span">
                            {event.title}
                          </Typography>
                          <Chip
                            label={event.category}
                            size="small"
                            color={getCategoryColor(event.category) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {event.year && (
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              {formatHistoricalDate(event.year)}
                            </Typography>
                          )}
                          {event.extract && (
                            <Typography variant="body2" color="text.secondary">
                              {event.extract.length > 150 
                                ? `${event.extract.substring(0, 150)}...`
                                : event.extract
                              }
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    {event.thumbnail && (
                      <Box sx={{ ml: 1 }}>
                        <img
                          src={event.thumbnail.source}
                          alt={event.title}
                          style={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 4
                          }}
                        />
                      </Box>
                    )}
                  </ListItem>
                  {index < filteredEvents.slice(0, expanded ? filteredEvents.length : 5).length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>

            {filteredEvents.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button
                  onClick={() => setExpanded(!expanded)}
                  endIcon={
                    <ExpandMoreIcon 
                      sx={{ 
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                      }} 
                    />
                  }
                >
                  {expanded ? 'Show Less' : `Show ${filteredEvents.length - 5} More Events`}
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
