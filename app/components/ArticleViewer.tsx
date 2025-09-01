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
  Language as LanguageIcon
} from '@mui/icons-material';
import { wikipediaAPI, WikipediaPage, WikipediaSearchResult, extractHistoricalEntities } from '../lib/wikipedia';

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

  useEffect(() => {
    loadArticle();
  }, [title]);

  useEffect(() => {
    // Check if article is bookmarked
    const bookmarks = JSON.parse(localStorage.getItem('wikipediaBookmarks') || '[]');
    setBookmarked(bookmarks.includes(title));
  }, [title]);

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load article summary and content in parallel
      const [summary, htmlContent, related] = await Promise.all([
        wikipediaAPI.getPageSummary(title),
        wikipediaAPI.getPageContent(title),
        wikipediaAPI.getRelatedArticles(title, 6)
      ]);

      if (!summary) {
        throw new Error('Article not found');
      }

      setArticle(summary);
      setContent(htmlContent || summary.extract);
      setRelatedArticles(related);

      // Extract historical entities from the content
      const entities = extractHistoricalEntities(summary.extract);
      setHistoricalEntities(entities.slice(0, 10)); // Limit to 10 entities

    } catch (err) {
      console.error('Error loading article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('wikipediaBookmarks') || '[]');
    
    if (bookmarked) {
      const updated = bookmarks.filter((bookmark: string) => bookmark !== title);
      localStorage.setItem('wikipediaBookmarks', JSON.stringify(updated));
      setBookmarked(false);
    } else {
      const updated = [title, ...bookmarks].slice(0, 50); // Limit to 50 bookmarks
      localStorage.setItem('wikipediaBookmarks', JSON.stringify(updated));
      setBookmarked(true);
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
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={40} width="80%" sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={20} width="100%" />
        <Skeleton variant="text" height={20} width="100%" />
        <Skeleton variant="text" height={20} width="60%" />
      </Box>
    );
  }

  if (error || !article) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {error || 'Article not found'}
        </Typography>
        <Typography>
          The requested article could not be loaded. Please try searching for a different topic.
        </Typography>
        <Button onClick={onBack} sx={{ mt: 1 }}>
          Go Back
        </Button>
      </Alert>
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

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Chip icon={<LanguageIcon />} label="Wikipedia" color="primary" size="small" />
          <Typography variant="body2" color="text.secondary">
            Last updated: {new Date(article.timestamp).toLocaleDateString()}
          </Typography>
        </Box>
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
          <Paper sx={{ p: 3 }}>
            {content.includes('<') ? (
              // Render HTML content
              <Box
                dangerouslySetInnerHTML={{ __html: content }}
                sx={{
                  '& img': { maxWidth: '100%', height: 'auto' },
                  '& table': { width: '100%', borderCollapse: 'collapse' },
                  '& th, & td': { padding: 1, border: '1px solid #ddd' },
                  '& blockquote': { 
                    borderLeft: '4px solid #ccc', 
                    paddingLeft: 2, 
                    fontStyle: 'italic' 
                  },
                  lineHeight: 1.7
                }}
              />
            ) : (
              // Render plain text
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                {content || article.extract}
              </Typography>
            )}
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
    </Box>
  );
}
