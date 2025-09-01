// Wikipedia API integration utilities
import { getFallbackArticle, getFallbackSearchResults } from './fallbackContent';

export interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
  size: number;
  wordcount: number;
  timestamp: string;
}

export interface WikipediaPage {
  title: string;
  extract: string;
  content?: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  coordinates?: {
    lat: number;
    lon: number;
  };
  pageid: number;
  timestamp: string;
}

export interface WikipediaFeatured {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls: {
    desktop: {
      page: string;
    };
  };
}

export interface HistoricalEvent {
  title: string;
  extract: string;
  year?: number;
  date?: string;
  category: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

class WikipediaAPI {
  private readonly baseUrl = 'https://en.wikipedia.org/api/rest_v1';
  private readonly apiUrl = 'https://en.wikipedia.org/w/api.php';
  
  // Search Wikipedia articles
  async search(query: string, limit: number = 10): Promise<WikipediaSearchResult[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }
      
      const data = await response.json();
      const results = data.query?.search || [];
      
      // If no results from Wikipedia, try fallback content
      if (results.length === 0) {
        const fallbackResults = getFallbackSearchResults(query);
        return fallbackResults.slice(0, limit);
      }
      
      return results;
    } catch (error) {
      console.error('Wikipedia search error:', error);
      
      // Return fallback results on error
      const fallbackResults = getFallbackSearchResults(query);
      return fallbackResults.slice(0, limit);
    }
  }

  // Get page summary
  async getPageSummary(title: string): Promise<WikipediaPage | null> {
    try {
      const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
      
      // Try REST API first
      try {
        const response = await fetch(`${this.baseUrl}/page/summary/${encodedTitle}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'HiddenWiki/1.0 (https://hiddenwiki.app) Educational Platform'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            title: data.title,
            extract: data.extract,
            thumbnail: data.thumbnail,
            coordinates: data.coordinates,
            pageid: data.pageid,
            timestamp: data.timestamp
          };
        }
      } catch (restError) {
        console.warn('REST API failed, trying action API:', restError);
      }
      
      // Fallback to action API
      const fallbackResponse = await fetch(
        `${this.apiUrl}?action=query&format=json&origin=*&prop=extracts|pageimages|info&exintro=1&explaintext=1&exsectionformat=plain&piprop=thumbnail&pithumbsize=300&inprop=url&titles=${encodedTitle}`
      );
      
      if (!fallbackResponse.ok) {
        throw new Error(`Wikipedia API error: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      const pages = fallbackData.query?.pages;
      
      if (!pages) {
        throw new Error('No pages found');
      }
      
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];
      
      if (pageId === '-1') {
        throw new Error('Page not found');
      }
      
      return {
        title: page.title,
        extract: page.extract || 'No extract available.',
        thumbnail: page.thumbnail ? {
          source: page.thumbnail.source,
          width: page.thumbnail.width,
          height: page.thumbnail.height
        } : undefined,
        pageid: parseInt(pageId),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Wikipedia page summary error:', error);
      
      // Try fallback content
      const fallbackArticle = getFallbackArticle(title);
      if (fallbackArticle) {
        return {
          title: fallbackArticle.title,
          extract: fallbackArticle.extract,
          content: fallbackArticle.content,
          pageid: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    }
  }

  // Get full page content
  async getPageContent(title: string): Promise<string | null> {
    try {
      const encodedTitle = encodeURIComponent(title.replace(/ /g, '_'));
      
      // Try REST API first for HTML content
      try {
        const response = await fetch(`${this.baseUrl}/page/html/${encodedTitle}`, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'HiddenWiki/1.0 (https://hiddenwiki.app) Educational Platform'
          }
        });
        
        if (response.ok) {
          return await response.text();
        }
      } catch (restError) {
        console.warn('HTML content API failed, trying action API:', restError);
      }
      
      // Fallback to action API for wikitext/extract
      const fallbackResponse = await fetch(
        `${this.apiUrl}?action=query&format=json&origin=*&prop=extracts&exlimit=1&explaintext=0&exsectionformat=wiki&titles=${encodedTitle}`
      );
      
      if (!fallbackResponse.ok) {
        throw new Error(`Wikipedia API error: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      const pages = fallbackData.query?.pages;
      
      if (!pages) {
        return null;
      }
      
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];
      
      if (pageId === '-1') {
        return null;
      }
      
      // Convert basic formatting to HTML
      let content = page.extract || '';
      if (content) {
        // Basic text formatting
        content = content
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>')
          .replace(/^/, '<p>')
          .replace(/$/, '</p>');
      }
      
      return content;
      
    } catch (error) {
      console.error('Wikipedia page content error:', error);
      
      // Try fallback content
      const fallbackArticle = getFallbackArticle(title);
      if (fallbackArticle) {
        return fallbackArticle.content;
      }
      
      return null;
    }
  }

  // Get featured article of the day
  async getFeaturedArticle(date?: Date): Promise<WikipediaFeatured | null> {
    try {
      const targetDate = date || new Date();
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      
      const response = await fetch(`${this.baseUrl}/feed/featured/${year}/${month}/${day}`);
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.tfa || null;
    } catch (error) {
      console.error('Wikipedia featured article error:', error);
      return null;
    }
  }

  // Get "On This Day" historical events
  async getOnThisDay(date?: Date): Promise<HistoricalEvent[]> {
    try {
      const targetDate = date || new Date();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      
      const response = await fetch(`${this.baseUrl}/feed/onthisday/all/${month}/${day}`);
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }
      
      const data = await response.json();
      const events: HistoricalEvent[] = [];
      
      // Process different types of events
      ['events', 'births', 'deaths'].forEach(category => {
        if (data[category]) {
          data[category].forEach((event: any) => {
            events.push({
              title: event.text,
              extract: event.pages?.[0]?.extract || '',
              year: event.year,
              date: `${month}/${day}`,
              category: category,
              thumbnail: event.pages?.[0]?.thumbnail
            });
          });
        }
      });
      
      return events.sort((a, b) => (b.year || 0) - (a.year || 0));
    } catch (error) {
      console.error('Wikipedia on this day error:', error);
      return [];
    }
  }

  // Get random historical article
  async getRandomHistoricalArticle(): Promise<WikipediaPage | null> {
    try {
      // Get a random page from history categories
      const historyCategories = [
        'Ancient_history',
        'Medieval_history',
        'Modern_history',
        'Military_history',
        'Political_history',
        'Social_history',
        'Cultural_history'
      ];
      
      const randomCategory = historyCategories[Math.floor(Math.random() * historyCategories.length)];
      
      const response = await fetch(
        `${this.apiUrl}?action=query&generator=categorymembers&gcmtitle=Category:${randomCategory}&gcmlimit=50&format=json&origin=*&prop=extracts&exintro=1&exlimit=1&exchars=300`
      );
      
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status}`);
      }
      
      const data = await response.json();
      const pages = data.query?.pages;
      
      if (!pages) return null;
      
      const pageIds = Object.keys(pages);
      const randomPageId = pageIds[Math.floor(Math.random() * pageIds.length)];
      const page = pages[randomPageId];
      
      return {
        title: page.title,
        extract: page.extract || '',
        pageid: parseInt(randomPageId),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Wikipedia random article error:', error);
      return null;
    }
  }

  // Search within specific historical categories
  async searchHistoricalContent(query: string, categories: string[] = [], limit: number = 10): Promise<WikipediaSearchResult[]> {
    try {
      let searchQuery = query;
      
      // Add category filters if specified
      if (categories.length > 0) {
        const categoryFilter = categories.map(cat => `incategory:"${cat}"`).join(' OR ');
        searchQuery = `${query} (${categoryFilter})`;
      }
      
      return await this.search(searchQuery, limit);
    } catch (error) {
      console.error('Wikipedia historical search error:', error);
      return [];
    }
  }

  // Get related articles
  async getRelatedArticles(title: string, limit: number = 5): Promise<WikipediaSearchResult[]> {
    try {
      const page = await this.getPageSummary(title);
      if (!page) return [];
      
      // Extract key terms from the extract for related search
      const keyTerms = page.extract
        .split(/[.,;:!?]/)
        .slice(0, 3)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 10)
        .join(' ');
      
      const related = await this.search(keyTerms, limit + 5);
      
      // Filter out the original article
      return related
        .filter(article => article.title !== title)
        .slice(0, limit);
    } catch (error) {
      console.error('Wikipedia related articles error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const wikipediaAPI = new WikipediaAPI();

// Utility functions for historical content
export const getHistoricalPeriod = (year: number): string => {
  if (year < 500) return 'Ancient';
  if (year < 1500) return 'Medieval';
  if (year < 1800) return 'Early Modern';
  if (year < 1900) return 'Modern';
  return 'Contemporary';
};

export const formatHistoricalDate = (year: number, month?: number, day?: number): string => {
  const period = getHistoricalPeriod(year);
  let dateStr = '';
  
  if (year < 0) {
    dateStr = `${Math.abs(year)} BCE`;
  } else {
    dateStr = `${year} CE`;
  }
  
  if (month && day) {
    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleString('default', { month: 'long' });
    dateStr = `${monthName} ${day}, ${dateStr}`;
  }
  
  return `${dateStr} (${period} Period)`;
};

export const extractHistoricalEntities = (text: string): string[] => {
  // Simple regex patterns to extract historical entities
  const patterns = [
    /\b\d{1,4}\s?(BCE?|CE?|AD|BC)\b/gi, // Dates
    /\b[A-Z][a-z]+\s+Empire\b/g, // Empires
    /\b[A-Z][a-z]+\s+Dynasty\b/g, // Dynasties
    /\b[A-Z][a-z]+\s+War\b/g, // Wars
    /\b[A-Z][a-z]+\s+Revolution\b/g, // Revolutions
  ];
  
  const entities: string[] = [];
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.push(...matches);
    }
  });
  
  return [...new Set(entities)]; // Remove duplicates
};
