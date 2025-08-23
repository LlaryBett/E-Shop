import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Banner from '../models/Banner.js';
import Category from '../models/Category.js';
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl, isCloudinaryVideo } from '../utils/cloudinary.js';

 // Get admin dashboard stats 


//Get admin dashboard stats 
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Total counts
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'paid' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Growth calculations
    const lastMonthUsers = await User.countDocuments({ 
      role: 'customer',
      createdAt: { $gte: lastMonth }
    });
    const lastMonthProducts = await Product.countDocuments({ 
      createdAt: { $gte: lastMonth }
    });
    const lastMonthOrders = await Order.countDocuments({ 
      createdAt: { $gte: lastMonth }
    });

    const lastMonthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          'paymentInfo.status': 'paid',
          createdAt: { $gte: lastMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    // Calculate growth percentages
    const userGrowth = totalUsers > 0 ? (lastMonthUsers / totalUsers) * 100 : 0;
    const productGrowth = totalProducts > 0 ? (lastMonthProducts / totalProducts) * 100 : 0;
    const orderGrowth = totalOrders > 0 ? (lastMonthOrders / totalOrders) * 100 : 0;
    const revenueGrowth = totalRevenue > 0 ? (lastMonthRevenue / totalRevenue) * 100 : 0;

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Top products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { 
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    // Monthly revenue data for chart
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          'paymentInfo.status': 'paid',
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        userGrowth,
        productGrowth,
        orderGrowth,
        revenueGrowth,
        recentOrders,
        topProducts,
        monthlyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) {
        query.createdAt.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        query.createdAt.$lte = new Date(req.query.dateTo);
      }
    }

    // Search filter
    if (req.query.search) {
      query.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: req.query.search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      orders,
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

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // Search filter
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Status filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      products,
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

// @desc    Get sales analytics
// @route   GET /api/admin/analytics/sales
// @access  Private/Admin
export const getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) };
        break;
    }

    // Daily sales data
    const dailySales = await Order.aggregate([
      {
        $match: {
          'paymentInfo.status': 'paid',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category sales
    const categorySales = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'paid', createdAt: dateFilter } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        dailySales,
        categorySales,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all banners
// @route   GET /api/admin/banners
// @access  Private/Admin
export const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ position: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload new banners
// @route   POST /api/admin/banners
// @access  Private/Admin
export const uploadBanners = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Parse positions and isActive values from request body
    let positions = [];
    let isActiveValues = [];
    
    if (req.body.positions) {
      try {
        positions = JSON.parse(req.body.positions);
      } catch (e) {
        positions = [];
      }
    }
    
    if (req.body.isActive) {
      try {
        isActiveValues = JSON.parse(req.body.isActive);
      } catch (e) {
        isActiveValues = [];
      }
    }

    const uploadedBanners = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(file.buffer, file.originalname, 'banners');
        
        // Determine file type
        const isVideo = isCloudinaryVideo(uploadResult.secure_url);
        const fileType = isVideo ? 'video' : 'image';
        
        // Create banner record with optional position and isActive
        const bannerData = {
          name: file.originalname,
          url: uploadResult.secure_url,
          type: fileType,
          publicId: uploadResult.public_id
        };
        
        // Add position if provided
        if (positions[i] !== undefined) {
          bannerData.position = positions[i];
        }
        
        // Add isActive if provided
        if (isActiveValues[i] !== undefined) {
          bannerData.isActive = isActiveValues[i];
        }
        
        const banner = new Banner(bannerData);
        await banner.save();
        uploadedBanners.push(banner);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Continue with other files even if one fails
        continue;
      }
    }

    res.status(201).json({
      success: true,
      data: uploadedBanners
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete from Cloudinary if we have the publicId
    if (banner.publicId) {
      const resourceType = banner.type === 'video' ? 'video' : 'image';
      await deleteFromCloudinary(banner.publicId, resourceType);
    }

    await Banner.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update banner properties
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res, next) => {
  try {
    const { name, position, isActive } = req.body;
    
    // Find the banner first
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Prepare update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (position !== undefined) updates.position = position;
    if (isActive !== undefined) updates.isActive = isActive;

    // Update the banner
    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: updatedBanner
    });
  } catch (error) {
    next(error);
  }
};
