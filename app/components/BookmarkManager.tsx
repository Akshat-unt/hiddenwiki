'use client'

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Folder as FolderIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  AccessTime as TimeIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  timestamp: number;
  category: string;
  notes?: string;
  readingProgress?: number;
  estimatedReadTime?: number;
}

interface BookmarkCategory {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface BookmarkManagerProps {
  onArticleSelect?: (title: string) => void;
}

export default function BookmarkManager({ onArticleSelect }: BookmarkManagerProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [categories, setCategories] = useState<BookmarkCategory[]>([
    { id: 'general', name: 'General', color: '#1976d2', count: 0 },
    { id: 'ancient', name: 'Ancient History', color: '#8b4513', count: 0 },
    { id: 'medieval', name: 'Medieval', color: '#4caf50', count: 0 },
    { id: 'modern', name: 'Modern History', color: '#ff9800', count: 0 },
    { id: 'culture', name: 'Culture', color: '#9c27b0', count: 0 }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkItem | null>(null);

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('articleBookmarks');
    if (savedBookmarks) {
      const parsed = JSON.parse(savedBookmarks);
      setBookmarks(parsed);
      updateCategoryCounts(parsed);
    }
  }, []);

  // Update category counts
  const updateCategoryCounts = (bookmarkList: BookmarkItem[]) => {
    const counts = bookmarkList.reduce((acc, bookmark) => {
      acc[bookmark.category] = (acc[bookmark.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setCategories(prev => prev.map(cat => ({
      ...cat,
      count: counts[cat.id] || 0
    })));
  };

  // Add bookmark
  const addBookmark = (title: string, category: string = 'general', notes?: string) => {
    const newBookmark: BookmarkItem = {
      id: Date.now().toString(),
      title,
      timestamp: Date.now(),
      category,
      notes
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    localStorage.setItem('articleBookmarks', JSON.stringify(updatedBookmarks));
    updateCategoryCounts(updatedBookmarks);
  };

  // Delete bookmark
  const deleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    setBookmarks(updatedBookmarks);
    localStorage.setItem('articleBookmarks', JSON.stringify(updatedBookmarks));
    updateCategoryCounts(updatedBookmarks);
  };

  // Edit bookmark
  const editBookmark = (bookmark: BookmarkItem) => {
    setEditingBookmark(bookmark);
    setEditDialogOpen(true);
  };

  // Save edited bookmark
  const saveEditedBookmark = (updatedBookmark: BookmarkItem) => {
    const updatedBookmarks = bookmarks.map(b => 
      b.id === updatedBookmark.id ? updatedBookmark : b
    );
    setBookmarks(updatedBookmarks);
    localStorage.setItem('articleBookmarks', JSON.stringify(updatedBookmarks));
    updateCategoryCounts(updatedBookmarks);
    setEditDialogOpen(false);
    setEditingBookmark(null);
  };

  // Filter bookmarks by category
  const filteredBookmarks = selectedCategory === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.category === selectedCategory);

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, bookmark: BookmarkItem) => {
    setMenuAnchor(event.currentTarget);
    setSelectedBookmark(bookmark);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedBookmark(null);
  };

  // Share bookmark
  const shareBookmark = (bookmark: BookmarkItem) => {
    if (navigator.share) {
      navigator.share({
        title: bookmark.title,
        text: `Check out this historical article: ${bookmark.title}`,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(`${bookmark.title} - ${window.location.origin}`);
    }
    handleMenuClose();
  };

  return (
    <Box>
      {/* Category Filter */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bookmarked Articles ({bookmarks.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`All (${bookmarks.length})`}
            onClick={() => setSelectedCategory('all')}
            color={selectedCategory === 'all' ? 'primary' : 'default'}
            variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
          />
          {categories.map(category => (
            <Chip
              key={category.id}
              label={`${category.name} (${category.count})`}
              onClick={() => setSelectedCategory(category.id)}
              color={selectedCategory === category.id ? 'primary' : 'default'}
              variant={selectedCategory === category.id ? 'filled' : 'outlined'}
              sx={{ 
                backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                borderColor: category.color
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Bookmarks List */}
      {filteredBookmarks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BookmarkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bookmarks yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start bookmarking articles to build your personal knowledge library
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredBookmarks.map((bookmark) => {
            const category = categories.find(c => c.id === bookmark.category);
            return (
              <Grid item xs={12} md={6} lg={4} key={bookmark.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ 
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {bookmark.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, bookmark)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip
                        size="small"
                        label={category?.name || 'General'}
                        sx={{ backgroundColor: category?.color, color: 'white' }}
                      />
                      <Chip
                        size="small"
                        icon={<TimeIcon />}
                        label={new Date(bookmark.timestamp).toLocaleDateString()}
                        variant="outlined"
                      />
                    </Box>

                    {bookmark.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {bookmark.notes.length > 100 
                          ? `${bookmark.notes.substring(0, 100)}...` 
                          : bookmark.notes
                        }
                      </Typography>
                    )}

                    {bookmark.readingProgress && bookmark.readingProgress > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Reading Progress: {Math.round(bookmark.readingProgress)}%
                        </Typography>
                        <Box sx={{ width: '100%', height: 4, backgroundColor: 'grey.200', borderRadius: 2, mt: 0.5 }}>
                          <Box 
                            sx={{ 
                              width: `${bookmark.readingProgress}%`, 
                              height: '100%', 
                              backgroundColor: category?.color || 'primary.main',
                              borderRadius: 2 
                            }} 
                          />
                        </Box>
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<ArticleIcon />}
                      onClick={() => onArticleSelect?.(bookmark.title)}
                      variant="contained"
                    >
                      Read
                    </Button>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => editBookmark(bookmark)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteBookmark(bookmark.id)}
                        title="Delete"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedBookmark && editBookmark(selectedBookmark)}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => selectedBookmark && shareBookmark(selectedBookmark)}>
          <ShareIcon sx={{ mr: 1 }} /> Share
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedBookmark) deleteBookmark(selectedBookmark.id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Bookmark</DialogTitle>
        <DialogContent>
          {editingBookmark && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Title"
                value={editingBookmark.title}
                onChange={(e) => setEditingBookmark({
                  ...editingBookmark,
                  title: e.target.value
                })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="Category"
                value={editingBookmark.category}
                onChange={(e) => setEditingBookmark({
                  ...editingBookmark,
                  category: e.target.value
                })}
                sx={{ mb: 2 }}
              >
                {categories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={editingBookmark.notes || ''}
                onChange={(e) => setEditingBookmark({
                  ...editingBookmark,
                  notes: e.target.value
                })}
                placeholder="Add your notes about this article..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => editingBookmark && saveEditedBookmark(editingBookmark)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Export utility function to add bookmark from other components
export const addToBookmarks = (title: string, category: string = 'general', notes?: string) => {
  const existingBookmarks = JSON.parse(localStorage.getItem('articleBookmarks') || '[]');
  
  // Check if already bookmarked
  if (existingBookmarks.find((b: BookmarkItem) => b.title === title)) {
    return false; // Already bookmarked
  }

  const newBookmark: BookmarkItem = {
    id: Date.now().toString(),
    title,
    timestamp: Date.now(),
    category,
    notes
  };

  const updatedBookmarks = [...existingBookmarks, newBookmark];
  localStorage.setItem('articleBookmarks', JSON.stringify(updatedBookmarks));
  return true; // Successfully added
};

// Export utility function to check if article is bookmarked
export const isBookmarked = (title: string): boolean => {
  const bookmarks = JSON.parse(localStorage.getItem('articleBookmarks') || '[]');
  return bookmarks.some((b: BookmarkItem) => b.title === title);
};

// Export utility function to remove bookmark
export const removeFromBookmarks = (title: string) => {
  const bookmarks = JSON.parse(localStorage.getItem('articleBookmarks') || '[]');
  const updatedBookmarks = bookmarks.filter((b: BookmarkItem) => b.title !== title);
  localStorage.setItem('articleBookmarks', JSON.stringify(updatedBookmarks));
};
