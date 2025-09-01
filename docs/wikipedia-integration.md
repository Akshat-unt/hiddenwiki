# Wikipedia API Integration Guide

## Overview

This document describes the Wikipedia API integration implemented in the HiddenWiki platform, providing comprehensive access to historical content and research tools.

## API Endpoints Used

### 1. Wikipedia REST API
- **Base URL**: `https://en.wikipedia.org/api/rest_v1`
- **Page Summary**: `/page/summary/{title}` - Get article summary with metadata
- **Page Content**: `/page/html/{title}` - Get full HTML content
- **Featured Article**: `/feed/featured/{year}/{month}/{day}` - Daily featured article
- **On This Day**: `/feed/onthisday/all/{month}/{day}` - Historical events

### 2. MediaWiki API
- **Base URL**: `https://en.wikipedia.org/w/api.php`
- **Search**: `?action=query&list=search` - Search articles
- **Random**: `?action=query&generator=random` - Get random articles
- **Categories**: `?action=query&generator=categorymembers` - Browse by category

## Key Features

### Search Functionality
- **Live Search**: Real-time search suggestions as users type
- **Advanced Filters**: Filter by category, time period, region, and date range
- **Historical Categories**: Pre-defined historical categories for focused searches
- **Recent Searches**: Local storage of user search history

### Content Display
- **Article Viewer**: Full Wikipedia article display with enhanced formatting
- **Featured Articles**: Daily featured historical articles
- **Today in History**: Historical events for the current date
- **Random Discovery**: Random historical article suggestions

### Research Tools
- **Bookmarking**: Save articles for later reference
- **Citation Generator**: Generate proper citations for Wikipedia sources
- **Related Articles**: Intelligent suggestions for related content
- **Historical Entity Extraction**: Extract dates, empires, wars, etc. from text

## Implementation Details

### Core Classes

#### `WikipediaAPI`
Main class handling all Wikipedia API interactions:

```typescript
class WikipediaAPI {
  // Search Wikipedia articles
  async search(query: string, limit: number = 10): Promise<WikipediaSearchResult[]>
  
  // Get page summary with metadata
  async getPageSummary(title: string): Promise<WikipediaPage | null>
  
  // Get full page content (HTML)
  async getPageContent(title: string): Promise<string | null>
  
  // Get featured article of the day
  async getFeaturedArticle(date?: Date): Promise<WikipediaFeatured | null>
  
  // Get historical events for a specific date
  async getOnThisDay(date?: Date): Promise<HistoricalEvent[]>
  
  // Get random historical article
  async getRandomHistoricalArticle(): Promise<WikipediaPage | null>
  
  // Search within specific categories
  async searchHistoricalContent(query: string, categories: string[], limit: number): Promise<WikipediaSearchResult[]>
  
  // Get related articles
  async getRelatedArticles(title: string, limit: number): Promise<WikipediaSearchResult[]>
}
```

### React Components

#### `HistoricalSearch`
Advanced search component with filtering capabilities:
- Autocomplete search with live suggestions
- Advanced filters panel
- Recent searches display
- Debounced search to prevent API spam

#### `SearchResults`
Display search results with pagination and sorting:
- Sortable results (relevance, title, size, date)
- Pagination for large result sets
- Highlighted search terms
- Article metadata display

#### `ArticleViewer`
Full article display with enhanced features:
- Wikipedia article rendering
- Bookmarking functionality
- Related articles sidebar
- Share and print options
- Historical entity extraction

#### `TodayInHistory`
Display historical events for current date:
- Categorized events (births, deaths, events)
- Expandable event list
- Clickable events to view full articles
- Refresh functionality

#### `FeaturedArticle`
Daily featured article display:
- Responsive image display
- Article summary with read more
- Direct link to full article
- Fallback error handling

## Error Handling

### API Rate Limiting
- Debounced search requests (300ms delay)
- Request caching to reduce API calls
- Graceful fallback for failed requests

### CORS Handling
- All Wikipedia APIs support CORS with `origin=*` parameter
- No proxy server required for direct browser access

### Error States
- Loading states for all async operations
- Error messages with retry options
- Fallback content when APIs are unavailable

## Performance Optimizations

### Caching Strategy
- Browser localStorage for recent searches
- Component-level state caching for search results
- Image lazy loading for article thumbnails

### Request Optimization
- Parallel API requests where possible
- Minimal data fetching (only required fields)
- Debounced user interactions

## Security Considerations

### Content Sanitization
- All HTML content is sanitized before display
- XSS protection through React's built-in escaping
- Limited iframe embedding for security

### API Security
- No authentication required (public APIs)
- Rate limiting handled by Wikipedia
- No sensitive data transmission

## Browser Compatibility

### Supported Features
- Fetch API for HTTP requests
- LocalStorage for data persistence
- Modern JavaScript features (async/await)

### Fallbacks
- Error boundaries for component failures
- Graceful degradation for unsupported features
- Progressive enhancement approach

## Usage Examples

### Basic Search
```typescript
const results = await wikipediaAPI.search('Ancient Rome', 10);
```

### Get Article Content
```typescript
const article = await wikipediaAPI.getPageSummary('Roman Empire');
const content = await wikipediaAPI.getPageContent('Roman Empire');
```

### Today in History
```typescript
const events = await wikipediaAPI.getOnThisDay(new Date());
```

### Category Search
```typescript
const results = await wikipediaAPI.searchHistoricalContent(
  'medieval', 
  ['Medieval_history'], 
  20
);
```

## Future Enhancements

### Planned Features
- Multi-language support
- Offline content caching
- Advanced text analysis
- Image gallery integration
- Audio pronunciations

### API Extensions
- Wikidata integration for structured data
- Commons API for media files
- OpenStreetMap for geographical data
- Archive.org for historical documents

## Troubleshooting

### Common Issues

#### Search Not Working
- Check network connectivity
- Verify CORS settings
- Check browser console for errors

#### Slow Loading
- Check network speed
- Clear browser cache
- Reduce search result limit

#### Missing Images
- Wikipedia images may have CORS restrictions
- Thumbnails are preferred over full images
- Check image URL validity

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('wikipedia-debug', 'true');
```

## Contributing

### Adding New Features
1. Update the `WikipediaAPI` class with new methods
2. Create corresponding React components
3. Add error handling and loading states
4. Update documentation and tests

### API Changes
- Monitor Wikipedia API changelog
- Test with different article types
- Handle breaking changes gracefully
- Update type definitions

## Resources

- [Wikipedia API Documentation](https://www.mediawiki.org/wiki/API:Main_page)
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/)
- [MediaWiki Action API](https://www.mediawiki.org/wiki/API:Query)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
