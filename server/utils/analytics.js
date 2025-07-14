import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Calculate revenue for a given period
export const calculateRevenue = async (startDate, endDate) => {
  const result = await Order.aggregate([
    {
      $match: {
        'paymentInfo.status': 'paid',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricing.total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.total' },
      },
    },
  ]);

  return result[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
};

// Get top selling products
export const getTopSellingProducts = async (limit = 10, startDate, endDate) => {
  const matchStage = {
    'paymentInfo.status': 'paid',
  };

  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  const result = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
  ]);

  return result;
};

// Get customer analytics
export const getCustomerAnalytics = async (startDate, endDate) => {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  const newCustomers = await User.countDocuments({
    ...matchStage,
    role: 'customer',
  });

  const returningCustomers = await Order.aggregate([
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
      },
    },
    {
      $match: {
        orderCount: { $gt: 1 },
      },
    },
    {
      $count: 'returningCustomers',
    },
  ]);

  const customerLifetimeValue = await Order.aggregate([
    {
      $match: {
        'paymentInfo.status': 'paid',
      },
    },
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$pricing.total' },
        orderCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        averageLifetimeValue: { $avg: '$totalSpent' },
        averageOrdersPerCustomer: { $avg: '$orderCount' },
      },
    },
  ]);

  return {
    newCustomers,
    returningCustomers: returningCustomers[0]?.returningCustomers || 0,
    averageLifetimeValue: customerLifetimeValue[0]?.averageLifetimeValue || 0,
    averageOrdersPerCustomer: customerLifetimeValue[0]?.averageOrdersPerCustomer || 0,
  };
};

// Get sales by category
export const getSalesByCategory = async (startDate, endDate) => {
  const matchStage = {
    'paymentInfo.status': 'paid',
  };

  if (startDate && endDate) {
    matchStage.createdAt = { $gte: startDate, $lte: endDate };
  }

  const result = await Order.aggregate([
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category.name',
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalQuantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  return result;
};

// Get conversion rate
export const getConversionRate = async (startDate, endDate) => {
  // This would require tracking page views/sessions
  // For now, we'll calculate based on users vs orders
  const totalUsers = await User.countDocuments({
    role: 'customer',
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const usersWithOrders = await Order.distinct('user', {
    createdAt: { $gte: startDate, $lte: endDate },
  });

  const conversionRate = totalUsers > 0 ? (usersWithOrders.length / totalUsers) * 100 : 0;

  return {
    totalUsers,
    usersWithOrders: usersWithOrders.length,
    conversionRate,
  };
};

// Get abandoned cart rate
export const getAbandonedCartRate = async () => {
  // This would require implementing cart tracking
  // For now, return a placeholder
  return {
    totalCarts: 0,
    abandonedCarts: 0,
    abandonmentRate: 0,
  };
};

// Get inventory analytics
export const getInventoryAnalytics = async () => {
  const result = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalStock: { $sum: '$stock' },
        lowStockProducts: {
          $sum: {
            $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0],
          },
        },
        outOfStockProducts: {
          $sum: {
            $cond: [{ $eq: ['$stock', 0] }, 1, 0],
          },
        },
        averageStock: { $avg: '$stock' },
      },
    },
  ]);

  return result[0] || {
    totalProducts: 0,
    totalStock: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    averageStock: 0,
  };
};