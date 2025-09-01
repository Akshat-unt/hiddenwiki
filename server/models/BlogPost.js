const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: 300
  },
  author: {
    type: String,
    default: 'Wiki Editor'
  },
  category: {
    type: String,
    enum: ['history', 'science', 'technology', 'culture', 'geography', 'biography'],
    default: 'history'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'published'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ status: 1 });
blogPostSchema.index({ publishedAt: -1 });
blogPostSchema.index({ featured: 1 });

// Pre-save middleware to generate slug if not provided
blogPostSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  if (this.isModified('content') && !this.excerpt) {
    this.excerpt = this.content.substring(0, 300).replace(/<[^>]*>/g, '');
  }
  
  this.updatedAt = new Date();
  next();
});

// Method to increment view count
blogPostSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to get related posts
blogPostSchema.methods.getRelatedPosts = function(limit = 5) {
  return this.constructor.find({
    _id: { $ne: this._id },
    category: this.category,
    status: 'published'
  })
  .limit(limit)
  .select('title slug excerpt category publishedAt')
  .sort({ publishedAt: -1 });
};

// Static method to get posts by category
blogPostSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({
    category,
    status: 'published'
  })
  .limit(limit)
  .select('title slug excerpt category publishedAt views')
  .sort({ publishedAt: -1 });
};

// Static method to get featured posts
blogPostSchema.statics.getFeatured = function(limit = 5) {
  return this.find({
    featured: true,
    status: 'published'
  })
  .limit(limit)
  .select('title slug excerpt category publishedAt views')
  .sort({ publishedAt: -1 });
};

// Static method to search posts
blogPostSchema.statics.search = function(query, limit = 20) {
  return this.find({
    $and: [
      { status: 'published' },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
  .limit(limit)
  .select('title slug excerpt category publishedAt views')
  .sort({ publishedAt: -1 });
};

// Static method to get popular posts
blogPostSchema.statics.getPopular = function(limit = 10) {
  return this.find({
    status: 'published'
  })
  .limit(limit)
  .select('title slug excerpt category publishedAt views')
  .sort({ views: -1 });
};

module.exports = mongoose.model('BlogPost', blogPostSchema); 