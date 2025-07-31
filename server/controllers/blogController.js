import { validationResult } from 'express-validator';
import Blog from '../models/Blog.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
// @desc
// @desc    Get all blog posts
// @route   GET /api/blog
// @access  Public
export const getBlogPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { status: 'published' };

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Search filter
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Tag filter
    if (req.query.tag) {
      query.tags = { $in: [req.query.tag] };
    }

    const posts = await Blog.find(query)
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        page,
        pages,
        total,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog post
// @route   GET /api/blog/:slug
// @access  Public
export const getBlogPost = async (req, res, next) => {
  try {
    const post = await Blog.findOne({ 
      slug: req.params.slug,
      status: 'published' 
    }).populate('author', 'name avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    // Increment views
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private/Admin
export const createBlogPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Handle featured image upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'blog');
      req.body.featuredImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    req.body.author = req.user.id;

    const post = await Blog.create(req.body);
    await post.populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog post
// @route   PUT /api/blog/:id
// @access  Private/Admin
export const updateBlogPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    let post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    // Handle new featured image upload
    if (req.file) {
      // Delete old image
      if (post.featuredImage && post.featuredImage.public_id) {
        await deleteFromCloudinary(post.featuredImage.public_id);
      }

      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer, 'blog');
      req.body.featuredImage = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    post = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('author', 'name avatar');

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private/Admin
export const deleteBlogPost = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    // Delete featured image from cloudinary
    if (post.featuredImage && post.featuredImage.public_id) {
      await deleteFromCloudinary(post.featuredImage.public_id);
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike blog post
// @route   POST /api/blog/:id/like
// @access  Private
export const likeBlogPost = async (req, res, next) => {
  try {
    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== req.user.id);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to blog post
// @route   POST /api/blog/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required',
      });
    }

    const post = await Blog.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found',
      });
    }

    post.comments.push({
      user: req.user.id,
      comment: comment.trim(),
    });

    await post.save();
    await post.populate('comments.user', 'name avatar');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: newComment,
    });
  } catch (error) {
    next(error);
  }
};
