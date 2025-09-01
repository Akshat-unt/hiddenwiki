'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Article as ArticleIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingIcon,
  Close as CloseIcon,
  Keyboard as KeyboardIcon
} from '@mui/icons-material';
import { wikipediaAPI, WikipediaSearchResult } from '../lib/wikipedia';
import { debounce } from 'lodash';

interface QuickSearchProps {
  open: boolean;
  onClose: () => void;
  onArticleSelect: (title: string) => void;
  onSearchResults: (results: WikipediaSearchResult[]) => void;
}

interface QuickSearchResult {
  type: 'search' | 'history' | 'bookmark' | 'trending';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export default function QuickSearch({ open, onClose, onArticleSelect, onSearchResults }: QuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Popular/trending searches
  const trendingSearches = [
    'Mughal Empire',
    'Indian Independence',
    'Ancient India',
    'British Raj',
    'Mahatma Gandhi',
    'Ashoka the Great',
    'Delhi Sultanate',
    'Vijayanagara Empire'
  ];

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      loadInitialResults();
    }
  }, [open]);

  // Load initial results (history, bookmarks, trending)
  const loadInitialResults = () => {
    const initialResults: QuickSearchResult[] = [];

    // Add recent searches
    const recentSearches = JSON.parse(localStorage.getItem('searchHistory') || '[]').slice(0, 3);
    recentSearches.forEach((item: any) => {
      initialResults.push({
        type: 'history',
        title: item.query,
        subtitle: `${item.resultCount} results • ${new Date(item.timestamp).toLocaleDateString()}`,
        icon: <HistoryIcon />
      });
    });

    // Add bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('articleBookmarks') || '[]').slice(0, 3);
    bookmarks.forEach((item: any) => {
      initialResults.push({
        type: 'bookmark',
        title: item.title,
        subtitle: `Bookmarked • ${item.category}`,
        icon: <BookmarkIcon />
      });
    });

    // Add trending searches
    trendingSearches.slice(0, 4).forEach(search => {
      initialResults.push({
        type: 'trending',
        title: search,
        subtitle: 'Trending topic',
        icon: <TrendingIcon />
      });
    });

    setResults(initialResults);
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        loadInitialResults();
        return;
      }

      setLoading(true);
      try {
        const searchResults = await wikipediaAPI.searchHistoricalContent(searchQuery, [], 8);
        const quickResults: QuickSearchResult[] = searchResults.map(result => ({
          type: 'search',
          title: result.title,
          subtitle: result.snippet.replace(/<[^>]*>/g, '').substring(0, 100) + '...',
          icon: <ArticleIcon />
        }));

        setResults(quickResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Quick search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200),
    []
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  // Handle result selection
  const handleResultSelect = (result: QuickSearchResult) => {
    if (result.type === 'search' || result.type === 'bookmark') {
      onArticleSelect(result.title);
    } else {
      // For history and trending, perform a search
      setQuery(result.title);
      performSearch(result.title);
    }
    onClose();
  };

  // Perform full search
  const performSearch = async (searchQuery: string) => {
    try {
      const searchResults = await wikipediaAPI.searchHistoricalContent(searchQuery, [], 20);
      onSearchResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '10%',
          m: 0,
          borderRadius: 2,
          minHeight: 400
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Search Input */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Search articles, bookmarks, or browse trending topics..."
            value={query}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              }
            }}
          />
        </Box>

        {/* Results List */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {results.length === 0 && !loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Start typing to search
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search historical articles, browse bookmarks, or explore trending topics
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {results.map((result, index) => (
                <ListItem
                  key={`${result.type}-${result.title}-${index}`}
                  button
                  selected={index === selectedIndex}
                  onClick={() => handleResultSelect(result)}
                  sx={{
                    py: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected'
                    }
                  }}
                >
                  <ListItemIcon>
                    {result.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {result.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={result.type}
                          color={
                            result.type === 'bookmark' ? 'primary' :
                            result.type === 'history' ? 'secondary' :
                            result.type === 'trending' ? 'warning' : 'default'
                          }
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={result.subtitle}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer with keyboard shortcuts */}
        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid', 
          borderColor: 'divider',
          backgroundColor: 'background.default'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <KeyboardIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" color="text.secondary">
                ↑↓ navigate
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                ↵ select
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                esc close
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Press Ctrl+K to open anywhere
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// Global keyboard shortcut hook
export const useQuickSearch = (onOpen: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
};
