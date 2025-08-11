import { validationResult } from 'express-validator';
import { stkPush } from '../mpesa/mpesa.stk.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js'; // Add this import
import { sendEmail } from '../utils/sendEmail.js';
import { processPayment } from '../utils/stripe.js';
import PDFDocument from 'pdfkit';
import NotificationService from '../middleware/NotificationService.js';
import Coupon from '../models/Coupon.js'; // Import Coupon model
import ShippingMethod from '../models/ShippingMethod.js';
import TaxRate from '../models/TaxRate.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    // Input validation
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
      totalAmount,
      appliedCoupon,
      phoneNumber
    } = req.body;

    // Validate M-Pesa requirements
    if (paymentMethod === 'mpesa') {
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for M-Pesa payments',
        });
      }
      // Accept 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
      const normalized = phoneNumber
        .replace(/^\+/, '') // remove leading +
        .replace(/^0/, '254'); // convert leading 0 to 254

      if (!/^254[17]\d{8}$/.test(normalized)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Kenyan phone number format',
        });
      }
      req.body.phoneNumber = normalized; // use normalized for saving and payment
    }

    // Process order items and validate stock
    let subtotal = 0;
    const orderItems = [];
    const productsToUpdate = [];

    for (const item of items) {
      const productId = typeof item.product === 'string' ? item.product : item.product?._id;
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${productId}`,
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

      productsToUpdate.push({ product, quantity: item.quantity });
    }

    // Process coupon if applied
    let discountAmount = 0;
    let couponDetails = null;
    if (appliedCoupon?.code) {
      couponDetails = await Coupon.findOne({ code: appliedCoupon.code, isActive: true });
      
      if (!couponDetails) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inactive coupon code',
        });
      }
      
      if (subtotal < couponDetails.minAmount) {
        return res.status(400).json({
          success: false,
          message: `Coupon requires minimum order of Ksh ${couponDetails.minAmount}`,
        });
      }
      
      if (couponDetails.maxUses && couponDetails.usedCount >= couponDetails.maxUses) {
        return res.status(400).json({
          success: false,
          message: 'Coupon usage limit reached',
        });
      }
      
      discountAmount = couponDetails.type === 'percentage' 
        ? subtotal * (couponDetails.amount / 100) 
        : couponDetails.amount;
    }

    // Calculate order totals
    const discountedSubtotal = subtotal - discountAmount;
    
    const shippingMethodObj = await ShippingMethod.findById(shippingMethod);
    const shippingCost = shippingMethodObj 
      ? (shippingMethodObj.name === 'Free Shipping' && 
         shippingMethodObj.minFree && 
         discountedSubtotal >= shippingMethodObj.minFree)
        ? 0 
        : shippingMethodObj.cost
      : 0;

    const taxRates = await TaxRate.find({});
    const taxRule = taxRates.find(r => discountedSubtotal >= r.min && discountedSubtotal <= r.max);
    const tax = taxRule ? discountedSubtotal * taxRule.rate : 0;
    
    const calculatedTotal = discountedSubtotal + shippingCost + tax;

    // Validate calculated total matches frontend total
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total amount mismatch',
      });
    }

    // Create and save order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      status: 'pending', // explicitly set
      paymentInfo: {
        method: paymentMethod,
        status: 'pending',
        phoneNumber: paymentMethod === 'mpesa' ? req.body.phoneNumber : undefined
      },
      pricing: {
        subtotal,
        discount: discountAmount,
        tax,
        shipping: shippingCost,
        total: calculatedTotal,
      },
      appliedCoupon: couponDetails ? {
        code: couponDetails.code,
        type: couponDetails.type,
        amount: couponDetails.amount,
        minAmount: couponDetails.minAmount,
        _id: couponDetails._id
      } : undefined,
      shippingInfo: {
        method: shippingMethod,
        cost: shippingCost,
        estimatedDelivery: calculateDeliveryDate(shippingMethod),
      },
    });

    await order.save();

    // Update product stock
    for (const { product, quantity } of productsToUpdate) {
      product.stock -= quantity;
      await product.save({ validateBeforeSave: false });
    }

    // Update user stats
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        user.orderCount = (user.orderCount || 0) + 1;
        user.totalSpent = (user.totalSpent || 0) + calculatedTotal;
        
        // Update loyalty tier
        if (user.totalSpent >= 5000) user.loyalty = 'platinum';
        else if (user.totalSpent >= 2000) user.loyalty = 'gold';
        else if (user.totalSpent >= 1000) user.loyalty = 'silver';
        else user.loyalty = 'bronze';

        await user.save();
      }
    } catch (userUpdateError) {
      console.error('Failed to update user stats:', userUpdateError);
    }

    // Process payment
    try {
      if (paymentMethod === 'mpesa') {
        // Initiate M-Pesa STK Push
        const amountInt = Math.round(calculatedTotal);
        const stkResponse = await stkPush(
          req.body.phoneNumber,
          amountInt,
          order.orderNumber,
          `Payment for order ${order.orderNumber}`
        );

        // Update order with M-Pesa references
        order.paymentInfo.merchantRequestID = stkResponse.MerchantRequestID;
        order.paymentInfo.checkoutRequestID = stkResponse.CheckoutRequestID;
        await order.save();

        // Do NOT mark as paid here! Wait for callback.
        return res.status(201).json({
          success: true,
          order,
          mpesaResponse: stkResponse,
          message: 'Order created. Awaiting M-Pesa payment confirmation.'
        });
      } else {
        // For non-M-Pesa payments
        try {
          await sendOrderConfirmationEmail(order, req.user);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        return res.status(201).json({
          success: true,
          order
        });
      }
    } catch (paymentError) {
      // Restore product stock if payment fails
      for (const { product, quantity } of productsToUpdate) {
        product.stock += quantity;
        await product.save({ validateBeforeSave: false });
      }

      return res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentError.message,
      });
    }
  } catch (error) {
    next(error);
  }
};



// Helper function


// Helper functions (would be in separate files)






function calculateDeliveryDate(method) {
  // Implement delivery date estimation
  const days = {
    standard: 5,
    express: 2,
    overnight: 1,
  };
  const date = new Date();
  date.setDate(date.getDate() + (days[method] || 7));
  return date;
}

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

    // Only allow cancellation within 15 minutes of order creation
    const now = new Date();
    const createdAt = new Date(order.createdAt);
    const diffMinutes = (now - createdAt) / (1000 * 60);
    if (diffMinutes > 15) {
      return res.status(400).json({
        success: false,
        message: 'Order can only be cancelled within 15 minutes of placement'
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

export const getOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Optionally check user permissions here

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text(`Invoice for Order ${order.orderNumber}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Total: $${order.pricing.total.toFixed(2)}`);
    doc.moveDown();
    doc.text('Items:');
    order.items.forEach(item => {
      doc.text(`- ${item.title} x${item.quantity} ($${item.price.toFixed(2)} each)`);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
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

// @desc    Reorder items
// @route   POST /api/orders/:id/reorder
// @access  Private
export const reorderOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    // Optionally check user permissions here
    res.status(200).json({ success: true, items: order.items });
  } catch (error) {
    next(error);
  }
};