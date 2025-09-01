'use client'

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Breadcrumbs,
  Link,
  Chip,
  Button,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Alert
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Print as PrintIcon,
  OpenInNew as ExternalIcon,
  Language as LanguageIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
  FontDownload as FontIcon,
  Brightness6 as BrightnessIcon,
  KeyboardArrowUp as ArrowUpIcon
} from '@mui/icons-material';
import { wikipediaAPI, WikipediaPage, WikipediaSearchResult, extractHistoricalEntities } from '../lib/wikipedia';
import { addToBookmarks, isBookmarked, removeFromBookmarks } from './BookmarkManager';
import { addToReadingHistory, getReadingProgress } from './ReadingHistory';
import SkeletonLoader from './SkeletonLoader';

interface ArticleViewerProps {
  title: string;
  onBack?: () => void;
  onArticleSelect?: (title: string) => void;
}

export default function ArticleViewer({ title, onBack, onArticleSelect }: ArticleViewerProps) {
  const [article, setArticle] = useState<WikipediaPage | null>(null);
  const [content, setContent] = useState<string>('');
  const [relatedArticles, setRelatedArticles] = useState<WikipediaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [historicalEntities, setHistoricalEntities] = useState<string[]>([]);
  
  // Enhanced UX state
  const [isExpanded, setIsExpanded] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number>(0);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);

  useEffect(() => {
    loadArticle();
    setReadingStartTime(Date.now());
  }, [title]);

  // Calculate reading time
  useEffect(() => {
    if (content) {
      const wordsPerMinute = 200;
      const textLength = content.replace(/<[^>]*>/g, '').split(' ').length;
      setReadingTime(Math.ceil(textLength / wordsPerMinute));
    }
  }, [content]);

  // Handle scroll progress and back to top visibility with throttling
  useEffect(() => {
    let ticking = false;
    let lastSavedProgress = 0;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          
          // Prevent division by zero
          if (docHeight <= 0) {
            ticking = false;
            return;
          }
          
          const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
          
          // Only update state if progress changed significantly (reduces re-renders)
          setScrollProgress(prevProgress => {
            if (Math.abs(progress - prevProgress) > 0.5) {
              return progress;
            }
            return prevProgress;
          });
          
          // Show back to top button after scrolling 300px
          setShowBackToTop(scrollTop > 300);

          // Track reading progress (throttled to prevent excessive calls)
          if (scrollTop > lastScrollPosition && progress > 10) {
            setLastScrollPosition(scrollTop);
            
            // Save reading progress every 10% increment (but not more than once per increment)
            const currentProgressIncrement = Math.floor(progress / 10);
            const lastProgressIncrement = Math.floor(lastSavedProgress / 10);
            
            if (currentProgressIncrement > lastProgressIncrement) {
              const timeSpent = Math.floor((Date.now() - readingStartTime) / 1000);
              if (timeSpent > 5) { // Only track if spent more than 5 seconds
                addToReadingHistory(title, timeSpent, progress, 'General');
                lastSavedProgress = progress;
              }
            }
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [title, readingStartTime]); // Removed problematic dependencies

  // Back to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Check if article is bookmarked using the new bookmark system
    setBookmarked(isBookmarked(title));
  }, [title]);

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to load article summary first
      const summary = await wikipediaAPI.getPageSummary(title);

      if (!summary) {
        // If we can't find the exact title, try searching for similar articles
        const searchResults = await wikipediaAPI.search(title, 5);
        if (searchResults.length > 0) {
          const firstResult = searchResults[0];
          const altSummary = await wikipediaAPI.getPageSummary(firstResult.title);
          if (altSummary) {
            setArticle(altSummary);
            setContent(altSummary.extract);
            setRelatedArticles(searchResults.slice(1));
            return;
          }
        }
        throw new Error('Article not found');
      }

      // Load content and related articles in parallel
      const [htmlContent, related] = await Promise.all([
        wikipediaAPI.getPageContent(title).catch(() => null),
        wikipediaAPI.getRelatedArticles(title, 6).catch(() => [])
      ]);

      setArticle(summary);
      setContent(htmlContent || summary.extract);
      setRelatedArticles(related);

      // Extract historical entities from the content
      const entities = extractHistoricalEntities(summary.extract);
      setHistoricalEntities(entities.slice(0, 10)); // Limit to 10 entities

    } catch (err) {
      console.error('Error loading article:', err);
      
      // Provide more specific error messages
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.message.includes('not found')) {
        setError(`Article "${title}" not found. Please try searching for a different topic.`);
      } else {
        setError('Failed to load article. This might be due to network issues or the article may not exist.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    if (bookmarked) {
      removeFromBookmarks(title);
      setBookmarked(false);
    } else {
      const success = addToBookmarks(title, 'general');
      if (success) {
        setBookmarked(true);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.extract.substring(0, 200) + '...',
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`
        });
      } catch (err) {
        console.log('Share failed:', err);
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (article) {
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`;
      navigator.clipboard.writeText(url).then(() => {
        // You might want to show a toast notification here
        console.log('URL copied to clipboard');
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const openInWikipedia = () => {
    if (article) {
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return <SkeletonLoader type="article" />;
  }

  if (error || !article) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Article Loading Error
          </Typography>
          <Typography paragraph>
            {error || 'The requested article could not be loaded. Please try searching for a different topic.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => {
                setError(null);
                loadArticle();
              }}
            >
              Try Again
            </Button>
            {onBack && (
              <Button variant="outlined" onClick={onBack}>
                Go Back
              </Button>
            )}
          </Box>
        </Alert>
        
        {/* Suggestions for common issues */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Troubleshooting Tips:
          </Typography>
          <Typography component="div">
            <ul>
              <li>Check your internet connection</li>
              <li>Try searching for the article with different keywords</li>
              <li>The article title might be slightly different on Wikipedia</li>
              <li>Some articles might be temporarily unavailable</li>
            </ul>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            If the problem persists, try browsing our categories or using the search function to find related historical content.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Navigation */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {onBack && (
              <IconButton onClick={onBack}>
                <BackIcon />
              </IconButton>
            )}
            <Breadcrumbs>
              <Link 
                color="inherit" 
                href="#" 
                onClick={(e) => { e.preventDefault(); onBack?.(); }}
              >
                Search Results
              </Link>
              <Typography color="text.primary">{article.title}</Typography>
            </Breadcrumbs>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={handleBookmark} color={bookmarked ? 'primary' : 'default'}>
              <BookmarkIcon />
            </IconButton>
            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
            <IconButton onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
            <IconButton onClick={openInWikipedia}>
              <ExternalIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Article Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          {article.title}
        </Typography>
        
        {article.extract && (
          <Typography variant="h6" color="text.secondary" paragraph sx={{ fontStyle: 'italic' }}>
            {article.extract.substring(0, 200)}...
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Chip icon={<LanguageIcon />} label="Wikipedia" color="primary" size="small" />
          <Chip icon={<TimeIcon />} label={`${readingTime} min read`} size="small" variant="outlined" />
          <Chip icon={<ViewIcon />} label="Historical Article" size="small" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(article.timestamp).toLocaleDateString()}
          </Typography>
        </Box>

        {/* Reading Controls */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Reading Controls:
          </Typography>
          <IconButton
            size="small"
            onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
            disabled={fontSize <= 12}
          >
            <FontIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography variant="body2" sx={{ mx: 1 }}>
            {fontSize}px
          </Typography>
          <IconButton
            size="small"
            onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
            disabled={fontSize >= 24}
          >
            <FontIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDarkMode(!darkMode)}
            color={darkMode ? 'primary' : 'default'}
          >
            <BrightnessIcon />
          </IconButton>
        </Box>

        {/* Reading Progress */}
        {scrollProgress > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Reading Progress:
              </Typography>
              <Typography variant="body2" color="primary">
                {Math.round(scrollProgress)}%
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 4, backgroundColor: 'grey.200', borderRadius: 2 }}>
              <Box 
                sx={{ 
                  width: `${scrollProgress}%`, 
                  height: '100%', 
                  backgroundColor: 'primary.main',
                  borderRadius: 2,
                  transition: 'width 0.3s ease'
                }} 
              />
            </Box>
          </Box>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Article Image */}
          {article.thumbnail && (
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <img
                src={article.thumbnail.source}
                alt={article.title}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 8,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
              />
            </Box>
          )}

          {/* Article Content */}
          <Paper sx={{ 
            p: 3, 
            backgroundColor: darkMode ? 'grey.900' : 'background.paper',
            color: darkMode ? 'white' : 'inherit'
          }}>
            {content.includes('<') ? (
              // Render HTML content with see more functionality
              <Box>
                <Box
                  dangerouslySetInnerHTML={{ 
                    __html: isExpanded ? content : content.substring(0, 2000) + (content.length > 2000 ? '...' : '')
                  }}
                  sx={{
                    '& img': { maxWidth: '100%', height: 'auto' },
                    '& table': { width: '100%', borderCollapse: 'collapse' },
                    '& th, & td': { padding: 1, border: '1px solid #ddd' },
                    '& blockquote': { 
                      borderLeft: '4px solid #ccc', 
                      paddingLeft: 2, 
                      fontStyle: 'italic' 
                    },
                    lineHeight: 1.7,
                    fontSize: `${fontSize}px`,
                    '& p': { fontSize: `${fontSize}px`, lineHeight: 1.7 },
                    '& h1, & h2, & h3, & h4, & h5, & h6': { 
                      fontSize: `${fontSize + 4}px`,
                      fontWeight: 'bold',
                      margin: '1em 0 0.5em 0'
                    }
                  }}
                />
                {content.length > 2000 && (
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setIsExpanded(!isExpanded)}
                      endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ minWidth: 140 }}
                    >
                      {isExpanded ? 'Show Less' : 'Read More'}
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              // Render plain text with see more functionality
              <Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.7,
                    fontSize: `${fontSize}px`
                  }}
                >
                  {isExpanded 
                    ? (content || article.extract)
                    : (content || article.extract).substring(0, 1000) + 
                      ((content || article.extract).length > 1000 ? '...' : '')
                  }
                </Typography>
                {(content || article.extract).length > 1000 && (
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setIsExpanded(!isExpanded)}
                      endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ minWidth: 140 }}
                    >
                      {isExpanded ? 'Show Less' : 'Read More'}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
            
            {/* Article Stats */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Article length: {content.replace(/<[^>]*>/g, '').split(' ').length} words
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated reading time: {readingTime} minutes
              </Typography>
            </Box>
          </Paper>

          {/* Historical Entities */}
          {historicalEntities.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Historical References
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {historicalEntities.map((entity, index) => (
                    <Chip
                      key={index}
                      label={entity}
                      size="small"
                      variant="outlined"
                      onClick={() => onArticleSelect?.(entity)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Coordinates */}
          {article.coordinates && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Location
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coordinates: {article.coordinates.lat.toFixed(4)}, {article.coordinates.lon.toFixed(4)}
                </Typography>
                <Button 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${article.coordinates!.lat},${article.coordinates!.lon}`;
                    window.open(url, '_blank');
                  }}
                >
                  View on Map
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Related Articles
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {relatedArticles.map((related, index) => (
                  <Box key={related.pageid} sx={{ mb: 2 }}>
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onArticleSelect?.(related.title);
                      }}
                      sx={{ 
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {related.title}
                      </Typography>
                    </Link>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      dangerouslySetInnerHTML={{ __html: related.snippet }}
                      sx={{ display: 'block', mb: 1 }}
                    />
                    {index < relatedArticles.length - 1 && <Divider />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000
          }}
        >
          <IconButton
            onClick={scrollToTop}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              boxShadow: 3,
              '&:hover': {
                backgroundColor: 'primary.dark',
                boxShadow: 6
              },
              width: 56,
              height: 56
            }}
          >
            <ArrowUpIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
