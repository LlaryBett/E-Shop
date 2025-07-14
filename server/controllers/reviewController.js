import { validationResult } from 'express-validator';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { 
      product: req.params.productId,
      isApproved: true 
    };

    // Rating filter
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Sort options
    let sort = { createdAt: -1 };
    if (req.query.sort === 'helpful') {
      sort = { helpful: -1, createdAt: -1 };
    } else if (req.query.sort === 'rating-high') {
      sort = { rating: -1, createdAt: -1 };
    } else if (req.query.sort === 'rating-low') {
      sort = { rating: 1, createdAt: -1 };
    }

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);
    const pages = Math.ceil(total / limit);

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { product: mongoose.Types.ObjectId(req.params.productId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      reviews,
      ratingStats,
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

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { product, rating, title, comment } = req.body;

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      'items.product': product,
      status: 'delivered',
    });

    const review = await Review.create({
      user: req.user.id,
      product,
      rating,
      title,
      comment,
      verified: !!hasPurchased,
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if review belongs to user
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review',
      });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('user', 'name avatar');

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on review helpfulness
// @route   POST /api/reviews/:id/vote
// @access  Private
export const voteReview = async (req, res, next) => {
  try {
    const { vote } = req.body; // 'helpful' or 'not-helpful'

    if (!['helpful', 'not-helpful'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type',
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if user already voted
    const existingVote = review.helpfulVotes.find(
      v => v.user.toString() === req.user.id
    );

    if (existingVote) {
      // Update existing vote
      existingVote.vote = vote;
    } else {
      // Add new vote
      review.helpfulVotes.push({
        user: req.user.id,
        vote,
      });
    }

    // Recalculate helpful count
    review.helpful = review.helpfulVotes.filter(v => v.vote === 'helpful').length;

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      helpful: review.helpful,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/user
// @access  Private
export const getUserReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'title images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: req.user.id });
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      reviews,
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