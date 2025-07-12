const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth, admin, ownerOrAdmin } = require('../middleware/auth');
const { validateUserUpdate, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const users = await User.find(filter)
      .select('-password -passwordResetToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Owner or Admin)
router.get('/:id', auth, validateObjectId, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('cart.product', 'title price images')
      .populate('wishlist', 'title price images')
      .select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's order statistics if admin or owner
    let orderStats = null;
    if (req.user.role === 'admin' || req.user._id.toString() === user._id.toString()) {
      const orderStatsResult = await Order.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' }
          }
        }
      ]);

      orderStats = orderStatsResult[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0
      };
    }

    res.json({
      success: true,
      data: {
        user,
        orderStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Owner or Admin)
router.put('/:id', auth, validateObjectId, validateUserUpdate, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only admin can change role and isActive
    const allowedUpdates = ['name', 'email', 'phone', 'preferences'];
    if (req.user.role === 'admin') {
      allowedUpdates.push('role', 'isActive');
    }

    // Filter updates to only allowed fields
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(user, updates);
    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          preferences: user.preferences,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete/Deactivate user account
// @access  Private (Owner or Admin)
router.delete('/:id', auth, validateObjectId, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by deactivating the account
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/users/:id/addresses
// @desc    Add new address to user
// @access  Private (Owner or Admin)
router.post('/:id/addresses', auth, validateObjectId, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { isDefault, ...addressData } = req.body;

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      ...addressData,
      isDefault: isDefault || user.addresses.length === 0
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: {
        address: user.addresses[user.addresses.length - 1]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error adding address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id/addresses/:addressId
// @desc    Update user address
// @access  Private (Owner or Admin)
router.put('/:id/addresses/:addressId', auth, validateObjectId, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const { isDefault, ...addressData } = req.body;

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    Object.assign(address, addressData);
    if (isDefault !== undefined) {
      address.isDefault = isDefault;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/users/:id/addresses/:addressId
// @desc    Delete user address
// @access  Private (Owner or Admin)
router.delete('/:id/addresses/:addressId', auth, validateObjectId, ownerOrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull({ _id: req.params.addressId });

    // If deleted address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user statistics (Admin only)
// @access  Private (Admin)
router.get('/:id/stats', auth, admin, validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get comprehensive user statistics
    const stats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const userStats = stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      completedOrders: 0,
      cancelledOrders: 0
    };

    // Add additional user info
    userStats.registrationDate = user.createdAt;
    userStats.lastLogin = user.lastLogin;
    userStats.cartItems = user.cart.length;
    userStats.wishlistItems = user.wishlist.length;
    userStats.savedAddresses = user.addresses.length;

    res.json({
      success: true,
      data: {
        userStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
