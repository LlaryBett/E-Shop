const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const { validateReview, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get('/product/:productId', validateObjectId, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', rating } = req.query;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Build filter for reviews
    let reviewFilter = {};
    if (rating) {
      reviewFilter.rating = parseInt(rating);
    }

    // Filter reviews based on criteria
    let reviews = product.reviews.filter(review => {
      if (rating && review.rating !== parseInt(rating)) {
        return false;
      }
      return true;
    });

    // Sort reviews
    switch (sort) {
      case 'rating':
        reviews.sort((a, b) => a.rating - b.rating);
        break;
      case '-rating':
        reviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'helpful':
        reviews.sort((a, b) => a.helpful.count - b.helpful.count);
        break;
      case '-helpful':
        reviews.sort((a, b) => b.helpful.count - a.helpful.count);
        break;
      case 'createdAt':
        reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case '-createdAt':
      default:
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReviews = reviews.slice(skip, skip + parseInt(limit));

    // Calculate pagination info
    const total = reviews.length;
    const totalPages = Math.ceil(total / parseInt(limit));

    // Populate user information
    await Product.populate(paginatedReviews, {
      path: 'user',
      select: 'name'
    });

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        },
        summary: {
          averageRating: product.rating.average,
          totalReviews: product.rating.count,
          ratingDistribution
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/reviews/product/:productId
// @desc    Add a review for a product
// @access  Private
router.post('/product/:productId', auth, validateObjectId, validateReview, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Check if user has purchased this product (for verified purchase)
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': req.params.productId,
      status: 'delivered'
    });

    // Create new review
    const newReview = {
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
      isVerifiedPurchase: !!hasPurchased,
      helpful: {
        count: 0,
        users: []
      }
    };

    product.reviews.push(newReview);
    await product.save();

    // Populate the new review
    const addedReview = product.reviews[product.reviews.length - 1];
    await Product.populate(addedReview, {
      path: 'user',
      select: 'name'
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        review: addedReview,
        productRating: {
          average: product.rating.average,
          count: product.rating.count
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.put('/:reviewId', auth, validateObjectId, validateReview, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Find the product containing this review
    const product = await Product.findOne({
      'reviews._id': req.params.reviewId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }

    // Update review
    review.rating = rating;
    review.comment = comment;
    review.updatedAt = new Date();

    await product.save();

    // Populate the updated review
    await Product.populate(review, {
      path: 'user',
      select: 'name'
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: {
        review,
        productRating: {
          average: product.rating.average,
          count: product.rating.count
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete('/:reviewId', auth, validateObjectId, async (req, res) => {
  try {
    // Find the product containing this review
    const product = await Product.findOne({
      'reviews._id': req.params.reviewId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // Remove review
    product.reviews.pull({ _id: req.params.reviewId });
    await product.save();

    res.json({
      success: true,
      message: 'Review deleted successfully',
      data: {
        productRating: {
          average: product.rating.average,
          count: product.rating.count
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting review',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/reviews/:reviewId/helpful
// @desc    Mark a review as helpful
// @access  Private
router.post('/:reviewId/helpful', auth, validateObjectId, async (req, res) => {
  try {
    // Find the product containing this review
    const product = await Product.findOne({
      'reviews._id': req.params.reviewId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    // Check if user already marked this review as helpful
    if (review.helpful.users.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    // Add user to helpful users and increment count
    review.helpful.users.push(req.user._id);
    review.helpful.count += 1;

    await product.save();

    res.json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        helpfulCount: review.helpful.count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error marking review as helpful',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/reviews/:reviewId/helpful
// @desc    Remove helpful mark from a review
// @access  Private
router.delete('/:reviewId/helpful', auth, validateObjectId, async (req, res) => {
  try {
    // Find the product containing this review
    const product = await Product.findOne({
      'reviews._id': req.params.reviewId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const review = product.reviews.id(req.params.reviewId);

    // Check if user has marked this review as helpful
    if (!review.helpful.users.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have not marked this review as helpful'
      });
    }

    // Remove user from helpful users and decrement count
    review.helpful.users.pull(req.user._id);
    review.helpful.count = Math.max(0, review.helpful.count - 1);

    await product.save();

    res.json({
      success: true,
      message: 'Helpful mark removed from review',
      data: {
        helpfulCount: review.helpful.count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error removing helpful mark',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/reviews/user
// @desc    Get current user's reviews
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Find all products that have reviews by this user
    const productsWithUserReviews = await Product.find({
      'reviews.user': req.user._id,
      status: 'active'
    }, {
      title: 1,
      images: 1,
      price: 1,
      salePrice: 1,
      reviews: {
        $elemMatch: { user: req.user._id }
      }
    });

    // Format the response
    const userReviews = productsWithUserReviews.map(product => ({
      _id: product.reviews[0]._id,
      product: {
        id: product._id,
        title: product.title,
        image: product.images[0]?.url,
        price: product.price,
        salePrice: product.salePrice
      },
      rating: product.reviews[0].rating,
      comment: product.reviews[0].comment,
      isVerifiedPurchase: product.reviews[0].isVerifiedPurchase,
      helpful: product.reviews[0].helpful,
      createdAt: product.reviews[0].createdAt,
      updatedAt: product.reviews[0].updatedAt
    }));

    // Sort by creation date (newest first)
    userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReviews = userReviews.slice(skip, skip + parseInt(limit));

    const total = userReviews.length;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user reviews',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
