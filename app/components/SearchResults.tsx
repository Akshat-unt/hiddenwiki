'use client'

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { WikipediaSearchResult } from '../lib/wikipedia';
import SkeletonLoader from './SkeletonLoader';

interface SearchResultsProps {
  results: WikipediaSearchResult[];
  onArticleSelect: (title: string) => void;
  loading?: boolean;
  query?: string;
}

const RESULTS_PER_PAGE = 10;

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'size', label: 'Article Size' },
  { value: 'timestamp', label: 'Last Updated' }
];

export default function SearchResults({ 
  results, 
  onArticleSelect, 
  loading = false, 
  query = '' 
}: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevance');

  // Sort results based on selected criteria
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'size':
        return b.size - a.size;
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      default:
        return 0; // Keep original order for relevance
    }
  });

  // Paginate results
  const totalPages = Math.ceil(sortedResults.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const paginatedResults = sortedResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    const resultsElement = document.getElementById('search-results');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const highlightSearchTerms = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  if (loading) {
    return <SkeletonLoader type="search-results" count={5} />;
  }

  if (results.length === 0 && query) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          No Results Found
        </Typography>
        <Typography color="text.secondary">
          No historical content found for "{query}". Try different search terms or browse categories.
        </Typography>
      </Box>
    );
  }

  if (results.length === 0 && !query) {
    return null; // Don't show anything if no query and no results
  }

  return (
    <Box id="search-results">
      {/* Results Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {results.length} result{results.length !== 1 ? 's' : ''} 
          {query && ` for "${query}"`}
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Results Grid */}
      <Grid container spacing={3}>
        {paginatedResults.map((result, index) => (
          <Grid item xs={12} key={result.pageid}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => onArticleSelect(result.title)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    component="h3"
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 'bold',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerms(result.title, query) 
                    }}
                  />
                  
                  <Chip 
                    label={`ID: ${result.pageid}`} 
                    size="small" 
                    variant="outlined"
                    color="primary"
                  />
                </Box>

                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  paragraph
                  sx={{ lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ 
                    __html: highlightSearchTerms(result.snippet, query) 
                  }}
                />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CategoryIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {formatSize(result.size)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        Updated {formatDate(result.timestamp)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ViewIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        ~{result.wordcount} words
                      </Typography>
                    </Box>
                  </Box>

                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArticleSelect(result.title);
                    }}
                  >
                    Read Article
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Results Summary */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex + 1}-{Math.min(startIndex + RESULTS_PER_PAGE, results.length)} of {results.length} results
        </Typography>
      </Box>
    </Box>
  );
}
