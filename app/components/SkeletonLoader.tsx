'use client'

import React from 'react';
import {
  Box,
  Skeleton,
  Card,
  CardContent,
  Grid,
  Paper
} from '@mui/material';

interface SkeletonLoaderProps {
  type: 'article' | 'search-results' | 'card-grid' | 'list' | 'article-content';
  count?: number;
}

export default function SkeletonLoader({ type, count = 3 }: SkeletonLoaderProps) {
  switch (type) {
    case 'article':
      return (
        <Box>
          {/* Article Header Skeleton */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={100} height={36} />
            </Box>
          </Paper>

          {/* Article Content Skeleton */}
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              {/* Title */}
              <Skeleton variant="text" width="80%" height={48} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 3 }} />
              
              {/* Controls */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Skeleton variant="rectangular" width={80} height={24} />
                <Skeleton variant="rectangular" width={100} height={24} />
                <Skeleton variant="rectangular" width={90} height={24} />
              </Box>

              {/* Image */}
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3, borderRadius: 1 }} />
              
              {/* Content */}
              <Paper sx={{ p: 3 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    variant="text" 
                    width={i === 7 ? '60%' : '100%'} 
                    height={20} 
                    sx={{ mb: 1 }} 
                  />
                ))}
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              {/* Sidebar */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Skeleton variant="text" width="70%" height={24} sx={{ mb: 2 }} />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                      <Skeleton variant="text" width="90%" height={16} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      );

    case 'search-results':
      return (
        <Box>
          {Array.from({ length: count }).map((_, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 1 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="70%" height={16} sx={{ mb: 1 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="rectangular" width={60} height={20} />
                      <Skeleton variant="rectangular" width={80} height={20} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      );

    case 'card-grid':
      return (
        <Grid container spacing={3}>
          {Array.from({ length: count }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" width="100%" height={140} />
                <CardContent>
                  <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width="100%" height={16} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="60%" height={16} sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rectangular" width={70} height={32} />
                    <Skeleton variant="rectangular" width={70} height={32} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );

    case 'list':
      return (
        <Paper>
          {Array.from({ length: count }).map((_, index) => (
            <Box key={index} sx={{ p: 2, borderBottom: index < count - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="70%" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
            </Box>
          ))}
        </Paper>
      );

    case 'article-content':
      return (
        <Paper sx={{ p: 3 }}>
          <Skeleton variant="text" width="90%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="70%" height={24} sx={{ mb: 3 }} />
          
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton 
              key={i} 
              variant="text" 
              width={i % 4 === 3 ? '60%' : '100%'} 
              height={18} 
              sx={{ mb: 1 }} 
            />
          ))}
          
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ my: 3, borderRadius: 1 }} />
          
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton 
              key={i + 12} 
              variant="text" 
              width={i === 7 ? '40%' : '100%'} 
              height={18} 
              sx={{ mb: 1 }} 
            />
          ))}
        </Paper>
      );

    default:
      return (
        <Box>
          {Array.from({ length: count }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" width="100%" height={60} sx={{ mb: 1 }} />
          ))}
        </Box>
      );
  }
}
