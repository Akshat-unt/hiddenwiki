'use client'

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Skeleton,
  IconButton
} from '@mui/material';
import {
  Star as StarIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { wikipediaAPI, WikipediaFeatured } from '../lib/wikipedia';

interface FeaturedArticleProps {
  onArticleSelect?: (title: string) => void;
  date?: Date;
}

export default function FeaturedArticle({ onArticleSelect, date }: FeaturedArticleProps) {
  const [featured, setFeatured] = useState<WikipediaFeatured | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedArticle();
  }, [date]);

  const loadFeaturedArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      const article = await wikipediaAPI.getFeaturedArticle(date);
      setFeatured(article);
    } catch (err) {
      console.error('Error loading featured article:', err);
      setError('Failed to load featured article');
    } finally {
      setLoading(false);
    }
  };

  const handleReadMore = () => {
    if (featured && onArticleSelect) {
      onArticleSelect(featured.title);
    } else if (featured) {
      window.open(featured.content_urls.desktop.page, '_blank');
    }
  };

  if (loading) {
    return (
      <Card>
        <Skeleton variant="rectangular" height={200} />
        <CardContent>
          <Skeleton variant="text" height={40} width="80%" />
          <Skeleton variant="text" height={20} width="100%" />
          <Skeleton variant="text" height={20} width="100%" />
          <Skeleton variant="text" height={20} width="60%" />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" height={36} width={120} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error || !featured) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" gutterBottom>
              {error || 'No featured article available for today'}
            </Typography>
            <Button onClick={loadFeaturedArticle} startIcon={<RefreshIcon />}>
              Try Again
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {featured.thumbnail && (
        <CardMedia
          component="img"
          height="200"
          image={featured.thumbnail.source}
          alt={featured.title}
          sx={{ objectFit: 'cover' }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Chip
            icon={<StarIcon />}
            label="Featured Article"
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
          <IconButton size="small" onClick={loadFeaturedArticle}>
            <RefreshIcon />
          </IconButton>
        </Box>

        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          {featured.title}
        </Typography>

        <Typography 
          variant="body1" 
          color="text.secondary" 
          paragraph
          sx={{ 
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.6
          }}
        >
          {featured.extract}
        </Typography>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleReadMore}
            endIcon={onArticleSelect ? undefined : <OpenIcon />}
            fullWidth
          >
            {onArticleSelect ? 'Read Full Article' : 'Read on Wikipedia'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
