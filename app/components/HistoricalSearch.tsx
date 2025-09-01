'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Grid,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  History as HistoryIcon,
  AccessTime as TimeIcon,
  Public as LocationIcon
} from '@mui/icons-material';
import { wikipediaAPI, WikipediaSearchResult } from '../lib/wikipedia';
import { debounce } from 'lodash';

interface SearchFilters {
  category: string;
  timePeriod: string;
  yearRange: [number, number];
  region: string;
}

interface HistoricalSearchProps {
  onSearchResults: (results: WikipediaSearchResult[]) => void;
  onArticleSelect: (title: string) => void;
  placeholder?: string;
  showFilters?: boolean;
}

const HISTORICAL_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'History_of_India', label: 'History of India' },
  { value: 'Ancient_India', label: 'Ancient India' },
  { value: 'Medieval_India', label: 'Medieval India' },
  { value: 'Mughal_Empire', label: 'Mughal Empire' },
  { value: 'British_Raj', label: 'British Raj' },
  { value: 'Indian_independence_movement', label: 'Independence Movement' },
  { value: 'Culture_of_India', label: 'Indian Culture' },
  { value: 'Indian_art', label: 'Indian Art' },
  { value: 'Indian_philosophy', label: 'Indian Philosophy' }
];

const TIME_PERIODS = [
  { value: '', label: 'All Periods' },
  { value: 'ancient', label: 'Ancient (Before 500 CE)' },
  { value: 'medieval', label: 'Medieval (500-1500 CE)' },
  { value: 'early_modern', label: 'Early Modern (1500-1800 CE)' },
  { value: 'modern', label: 'Modern (1800-1900 CE)' },
  { value: 'contemporary', label: 'Contemporary (1900-Present)' }
];

const REGIONS = [
  { value: '', label: 'All Regions' },
  { value: 'North India', label: 'North India' },
  { value: 'South India', label: 'South India' },
  { value: 'East India', label: 'East India' },
  { value: 'West India', label: 'West India' },
  { value: 'Central India', label: 'Central India' },
  { value: 'Bengal', label: 'Bengal' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' }
];

export default function HistoricalSearch({
  onSearchResults,
  onArticleSelect,
  placeholder = "Search Indian history, leaders, culture, empires...",
  showFilters = true
}: HistoricalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<WikipediaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    timePeriod: '',
    yearRange: [-3000, 2024],
    region: ''
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('historicalSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const categories = filters.category ? [filters.category] : [];
        const results = await wikipediaAPI.searchHistoricalContent(query, categories, 8);
        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [filters.category]
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle search submission
  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Save to recent searches
      const updatedRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
      setRecentSearches(updatedRecent);
      localStorage.setItem('historicalSearches', JSON.stringify(updatedRecent));

      // Perform search with filters
      const categories = filters.category ? [filters.category] : [];
      let results = await wikipediaAPI.searchHistoricalContent(query, categories, 20);

      // Apply additional filters
      if (filters.timePeriod) {
        results = filterByTimePeriod(results, filters.timePeriod);
      }

      if (filters.region) {
        results = filterByRegion(results, filters.region);
      }

      onSearchResults(results);
      setSuggestions([]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter results by time period
  const filterByTimePeriod = (results: WikipediaSearchResult[], period: string): WikipediaSearchResult[] => {
    // This is a simplified implementation - in a real app, you'd need more sophisticated date extraction
    const periodKeywords: Record<string, string[]> = {
      ancient: ['ancient', 'BC', 'BCE', 'antiquity', 'classical'],
      medieval: ['medieval', 'middle ages', 'feudal', 'crusade', 'byzantine'],
      early_modern: ['renaissance', 'reformation', 'baroque', 'enlightenment'],
      modern: ['industrial', 'revolution', 'colonial', 'imperial', '19th century'],
      contemporary: ['modern', 'world war', '20th century', '21st century', 'contemporary']
    };

    const keywords = periodKeywords[period] || [];
    return results.filter(result => 
      keywords.some(keyword => 
        result.title.toLowerCase().includes(keyword) || 
        result.snippet.toLowerCase().includes(keyword)
      )
    );
  };

  // Filter results by region
  const filterByRegion = (results: WikipediaSearchResult[], region: string): WikipediaSearchResult[] => {
    return results.filter(result => 
      result.title.toLowerCase().includes(region.toLowerCase()) || 
      result.snippet.toLowerCase().includes(region.toLowerCase())
    );
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      timePeriod: '',
      yearRange: [-3000, 2024],
      region: ''
    });
  };

  // Handle recent search click
  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
      {/* Main Search Input */}
      <Autocomplete
        freeSolo
        options={suggestions}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.title}
        renderOption={(props, option) => (
          <Box component="li" {...props} onClick={() => onArticleSelect(option.title)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {option.title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
                dangerouslySetInnerHTML={{ __html: option.snippet }}
              />
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {showFilters && (
                    <IconButton
                      onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                      color={showFiltersPanel ? 'primary' : 'default'}
                    >
                      <FilterIcon />
                    </IconButton>
                  )}
                  {searchQuery && (
                    <IconButton onClick={() => setSearchQuery('')}>
                      <ClearIcon />
                    </IconButton>
                  )}
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'background.paper',
                }
              }
            }}
          />
        )}
        loading={loading}
        loadingText="Searching historical content..."
        noOptionsText="No historical content found"
        PaperComponent={({ children, ...props }) => (
          <Paper {...props} sx={{ mt: 1, boxShadow: 3 }}>
            {children}
          </Paper>
        )}
      />

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Collapse in={showFiltersPanel}>
          <Paper sx={{ mt: 2, p: 3, backgroundColor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Advanced Search Filters
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    {HISTORICAL_CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Period</InputLabel>
                  <Select
                    value={filters.timePeriod}
                    onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
                  >
                    {TIME_PERIODS.map((period) => (
                      <MenuItem key={period.value} value={period.value}>
                        {period.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={filters.region}
                    onChange={(e) => handleFilterChange('region', e.target.value)}
                  >
                    {REGIONS.map((region) => (
                      <MenuItem key={region.value} value={region.value}>
                        {region.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>
                  Year Range: {filters.yearRange[0]} - {filters.yearRange[1]}
                </Typography>
                <Slider
                  value={filters.yearRange}
                  onChange={(_, value) => handleFilterChange('yearRange', value)}
                  valueLabelDisplay="auto"
                  min={-3000}
                  max={2024}
                  step={50}
                  marks={[
                    { value: -3000, label: '3000 BCE' },
                    { value: 0, label: '0 CE' },
                    { value: 1000, label: '1000 CE' },
                    { value: 2024, label: '2024 CE' }
                  ]}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button onClick={() => handleSearch()} variant="contained">
                Apply Filters
              </Button>
              <Button onClick={clearFilters} variant="outlined">
                Clear Filters
              </Button>
            </Box>
          </Paper>
        </Collapse>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && !searchQuery && (
        <Paper sx={{ mt: 2, p: 2, backgroundColor: 'background.default' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <HistoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Recent Searches
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {recentSearches.slice(0, 5).map((search, index) => (
              <Chip
                key={index}
                label={search}
                size="small"
                onClick={() => handleRecentSearchClick(search)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
