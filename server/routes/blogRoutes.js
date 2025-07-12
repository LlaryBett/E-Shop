const express = require('express');
const BlogPost = require('../models/BlogPost');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/blog
// @desc    Get all published blog posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const {
      category,
      tag,
      search,
      featured,
      sort = '-publishedAt'
    } = req.query;

    // Build query
    const query = { status: 'published' };
    
    if (category) {
      query.category = category;
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await BlogPost.find(query)
      .populate('author', 'name email avatar')
      .select('-content') // Exclude full content for list view
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching blog posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/blog/categories
// @desc    Get blog categories with post counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: categories.map(cat => ({
        name: cat._id,
        count: cat.count
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching blog categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/blog/tags
// @desc    Get popular tags
// @access  Public
router.get('/tags', async (req, res) => {
  try {
    const tags = await BlogPost.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: tags.map(tag => ({
        name: tag._id,
        count: tag.count
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching blog tags',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/blog/featured
// @desc    Get featured blog posts
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const posts = await BlogPost.find({ 
      status: 'published', 
      featured: true 
    })
      .populate('author', 'name avatar')
      .select('-content')
      .sort('-publishedAt')
      .limit(limit);

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/blog/:slug
// @desc    Get single blog post by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    })
      .populate('author', 'name email avatar bio')
      .populate('comments.user', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment views
    await post.incrementViews();

    // Get related posts
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } }
      ]
    })
      .populate('author', 'name avatar')
      .select('-content')
      .sort('-publishedAt')
      .limit(3);

    res.json({
      success: true,
      data: {
        post,
        relatedPosts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching blog post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/blog
// @desc    Create new blog post
// @access  Private (Admin)
router.post('/', [
  auth,
  authorize('admin'),
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('excerpt').trim().isLength({ min: 10, max: 500 }).withMessage('Excerpt must be between 10 and 500 characters'),
  body('content').trim().isLength({ min: 100 }).withMessage('Content must be at least 100 characters'),
  body('category').isIn(['news', 'tips', 'reviews', 'guides', 'announcements']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const postData = {
      ...req.body,
      author: req.user._id
    };

    const post = new BlogPost(postData);
    post.calculateReadTime();
    await post.save();

    await post.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Blog post with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error creating blog post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/blog/:id
// @desc    Update blog post
// @access  Private (Admin)
router.put('/:id', [
  auth,
  authorize('admin'),
  validateObjectId
], async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    Object.assign(post, req.body);
    post.calculateReadTime();
    await post.save();

    await post.populate('author', 'name email avatar');

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating blog post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/blog/:id
// @desc    Delete blog post
// @access  Private (Admin)
router.delete('/:id', [
  auth,
  authorize('admin'),
  validateObjectId
], async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting blog post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/blog/:id/like
// @desc    Like/unlike blog post
// @access  Private
router.post('/:id/like', [auth, validateObjectId], async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const existingLike = post.likes.find(like => 
      like.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Remove like
      post.likes.pull(existingLike._id);
      await post.save();
      
      res.json({
        success: true,
        message: 'Like removed',
        data: { liked: false, likeCount: post.likeCount }
      });
    } else {
      // Add like
      post.likes.push({ user: req.user._id });
      await post.save();
      
      res.json({
        success: true,
        message: 'Post liked',
        data: { liked: true, likeCount: post.likeCount }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error processing like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/blog/:id/comment
// @desc    Add comment to blog post
// @access  Private
router.post('/:id/comment', [
  auth,
  validateObjectId,
  body('content').trim().isLength({ min: 5, max: 1000 }).withMessage('Comment must be between 5 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await BlogPost.findById(req.params.id);
    
    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const comment = {
      user: req.user._id,
      content: req.body.content
    };

    post.comments.push(comment);
    await post.save();

    await post.populate('comments.user', 'name avatar');
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
