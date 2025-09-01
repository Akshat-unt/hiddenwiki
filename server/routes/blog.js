const express = require('express');
const BlogPost = require('../models/BlogPost');

const router = express.Router();

// Get all published blog posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query = {
        $and: [
          { status: 'published' },
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { content: { $regex: search, $options: 'i' } },
              { tags: { $in: [new RegExp(search, 'i')] } }
            ]
          }
        ]
      };
    }
    
    const posts = await BlogPost.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug excerpt category publishedAt views tags');
    
    const total = await BlogPost.countDocuments(query);
    
    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching blog posts',
      code: 'GET_BLOG_POSTS_ERROR'
    });
  }
});

// Get featured blog posts
router.get('/featured', async (req, res) => {
  try {
    const posts = await BlogPost.getFeatured(5);
    res.json({ posts });
  } catch (error) {
    console.error('Get featured posts error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching featured posts',
      code: 'GET_FEATURED_POSTS_ERROR'
    });
  }
});

// Get popular blog posts
router.get('/popular', async (req, res) => {
  try {
    const posts = await BlogPost.getPopular(10);
    res.json({ posts });
  } catch (error) {
    console.error('Get popular posts error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching popular posts',
      code: 'GET_POPULAR_POSTS_ERROR'
    });
  }
});

// Get posts by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const posts = await BlogPost.find({
      category,
      status: 'published'
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('title slug excerpt category publishedAt views tags');
    
    const total = await BlogPost.countDocuments({
      category,
      status: 'published'
    });
    
    res.json({
      posts,
      category,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts by category error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching posts by category',
      code: 'GET_POSTS_BY_CATEGORY_ERROR'
    });
  }
});

// Get a specific blog post by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const post = await BlogPost.findOne({ 
      slug, 
      status: 'published' 
    }).populate('category', 'name');
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Blog post not found',
        code: 'POST_NOT_FOUND'
      });
    }
    
    // Increment view count
    await post.incrementViews();
    
    // Get related posts
    const relatedPosts = await post.getRelatedPosts(5);
    
    res.json({
      post: {
        id: post._id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        author: post.author,
        category: post.category,
        tags: post.tags,
        views: post.views + 1, // Include the increment
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt
      },
      relatedPosts
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching blog post',
      code: 'GET_BLOG_POST_ERROR'
    });
  }
});

// Search blog posts
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Search query is required',
        code: 'SEARCH_QUERY_REQUIRED'
      });
    }
    
    const posts = await BlogPost.search(query.trim(), parseInt(limit));
    const total = posts.length;
    
    res.json({
      posts,
      query: query.trim(),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search blog posts error:', error);
    res.status(500).json({ 
      error: 'Internal server error while searching blog posts',
      code: 'SEARCH_BLOG_POSTS_ERROR'
    });
  }
});

// Get blog categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching categories',
      code: 'GET_CATEGORIES_ERROR'
    });
  }
});

// Get blog tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    
    res.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching tags',
      code: 'GET_TAGS_ERROR'
    });
  }
});

// Get posts by tag
router.get('/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const posts = await BlogPost.find({
      tags: { $in: [new RegExp(tag, 'i')] },
      status: 'published'
    })
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select('title slug excerpt category publishedAt views tags');
    
    const total = await BlogPost.countDocuments({
      tags: { $in: [new RegExp(tag, 'i')] },
      status: 'published'
    });
    
    res.json({
      posts,
      tag,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts by tag error:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching posts by tag',
      code: 'GET_POSTS_BY_TAG_ERROR'
    });
  }
});

module.exports = router; 