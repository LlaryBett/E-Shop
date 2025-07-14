import { validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendEmail } from '../utils/sendEmail.js';
import { processPayment } from '../utils/stripe.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod,
    } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.title}`,
        });
      }

      const price = product.salePrice || product.price;
      subtotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        title: product.title,
        image: product.images[0]?.url || '',
        price,
        quantity: item.quantity,
        variant: item.variant,
        sku: product.sku,
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Calculate shipping and tax
    const shippingCost = calculateShipping(shippingMethod, subtotal);
    const tax = calculateTax(subtotal, shippingAddress.state);
    const total = subtotal + shippingCost + tax;

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentInfo: {
        method: paymentMethod,
        status: 'pending',
      },
      pricing: {
        subtotal,
        tax,
        shipping: shippingCost,
        total,
      },
      shippingInfo: {
        method: shippingMethod,
        cost: shippingCost,
        estimatedDelivery: calculateDeliveryDate(shippingMethod),
      },
    });

    // Process payment
    if (paymentMethod === 'stripe') {
      try {
        const paymentResult = await processPayment({
          amount: total * 100, // Convert to cents
          currency: 'usd',
          orderId: order._id,
          customerEmail: req.user.email,
        });

        order.paymentInfo.transactionId = paymentResult.id;
        order.paymentInfo.status = 'paid';
        order.paymentInfo.paidAt = new Date();
        await order.save();
      } catch (paymentError) {
        // Restore product stock if payment fails
        for (const item of orderItems) {
          const product = await Product.findById(item.product);
          product.stock += item.quantity;
          await product.save();
        }

        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: paymentError.message,
        });
      }
    }

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(order, req.user);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { user: req.user.id };

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order belongs to user or user is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order',
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = status;

    // Set delivery date if status is delivered
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    // Set cancelled date if status is cancelled
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      
      // Restore product stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    await order.save();

    // Send status update email
    try {
      await sendOrderStatusEmail(order);
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order',
      });
    }

    // Check if order can be cancelled
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped or delivered',
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
const calculateShipping = (method, subtotal) => {
  if (subtotal >= 50) return 0; // Free shipping over $50
  
  switch (method) {
    case 'express':
      return 15.99;
    case 'overnight':
      return 29.99;
    default:
      return 9.99;
  }
};

const calculateTax = (subtotal, state) => {
  // Simple tax calculation - in real app, use tax service
  const taxRates = {
    'CA': 0.0875,
    'NY': 0.08,
    'TX': 0.0625,
    'FL': 0.06,
  };
  
  const rate = taxRates[state] || 0.08;
  return subtotal * rate;
};

const calculateDeliveryDate = (method) => {
  const now = new Date();
  let days;
  
  switch (method) {
    case 'overnight':
      days = 1;
      break;
    case 'express':
      days = 3;
      break;
    default:
      days = 7;
  }
  
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};

const sendOrderConfirmationEmail = async (order, user) => {
  const message = `
    Dear ${user.name},
    
    Thank you for your order! Your order #${order.orderNumber} has been confirmed.
    
    Order Total: $${order.pricing.total.toFixed(2)}
    
    We'll send you another email when your order ships.
    
    Best regards,
    E-Shop Team
  `;

  await sendEmail({
    email: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    message,
  });
};

const sendOrderStatusEmail = async (order) => {
  const user = await User.findById(order.user);
  
  const message = `
    Dear ${user.name},
    
    Your order #${order.orderNumber} status has been updated to: ${order.status.toUpperCase()}
    
    ${order.shippingInfo.trackingNumber ? `Tracking Number: ${order.shippingInfo.trackingNumber}` : ''}
    
    Best regards,
    E-Shop Team
  `;

  await sendEmail({
    email: user.email,
    subject: `Order Update - ${order.orderNumber}`,
    message,
  });
};