// Add this at the top of your orderController.js
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { stkPush } from '../mpesa/mpesa.stk.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js'; // Add this import
import { sendEmail } from '../utils/sendEmail.js';

import PDFDocument from 'pdfkit';
import NotificationService from '../middleware/NotificationService.js';
import Coupon from '../models/Coupon.js'; // Import Coupon model
import ShippingMethod from '../models/ShippingMethod.js';
import TaxRate from '../models/TaxRate.js';
import { PendingOrder } from '../models/PendingOrder.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private

export const createOrder = async (req, res, next) => {
  try {
    console.log('🛒 New order request received:', {
      userId: req.user.id,
      paymentMethod: req.body.paymentMethod,
      items: req.body.items?.length,
      isEmailVerified: req.user.isEmailVerified // Log this for debugging
    });

    // Update the property name to match the user object
    if (!req.user.isEmailVerified) { // Changed from isVerified to isEmailVerified
      console.log('❌ Unverified user attempted checkout:', req.user.email);
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before placing an order. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true
      });
    }

    // Input validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
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
      const normalized = phoneNumber
        .replace(/^\+/, '')
        .replace(/^0/, '254');

      if (!/^254[17]\d{8}$/.test(normalized)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Kenyan phone number format',
        });
      }
      req.body.phoneNumber = normalized;
    }

    // Process order items and validate stock (without deducting yet)
    let subtotal = 0;
    const orderItems = [];
    const productsToUpdate = [];

    console.log('🧮 Starting price calculations...');
    console.log('📦 Processing items:', items.length);

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

      console.log(`📝 Item calculation:`, {
        productId,
        title: product.title,
        price,
        quantity: item.quantity,
        lineTotal: price * item.quantity
      });

      orderItems.push({
        product: product._id,
        title: product.title,
        image: product.images[0]?.url || '',
        price,
        quantity: item.quantity,
        variant: item.variant,
        sku: product.sku,
      });

      productsToUpdate.push({ product: product._id, quantity: item.quantity });
    }

    console.log('💰 Base subtotal:', subtotal);

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
      
      console.log('🎫 Coupon applied:', {
        code: appliedCoupon.code,
        type: couponDetails.type,
        amount: couponDetails.amount,
        discountAmount
      });
    }

    // Calculate order totals
    const discountedSubtotal = subtotal - discountAmount;
    console.log('💰 After discount:', discountedSubtotal);
    
    const shippingMethodObj = await ShippingMethod.findById(shippingMethod);
    const shippingCost = shippingMethodObj 
      ? (shippingMethodObj.name === 'Free Shipping' && 
         shippingMethodObj.minFree && 
         discountedSubtotal >= shippingMethodObj.minFree)
        ? 0 
        : shippingMethodObj.cost
      : 0;
    
    console.log('🚚 Shipping:', {
      method: shippingMethodObj?.name,
      cost: shippingCost,
      minFree: shippingMethodObj?.minFree
    });

    const taxRates = await TaxRate.find({});
    const taxRule = taxRates.find(r => discountedSubtotal >= r.min && discountedSubtotal <= r.max);
    const tax = taxRule ? discountedSubtotal * taxRule.rate : 0;
    
    console.log('💵 Tax calculation:', {
      rule: taxRule ? `${taxRule.rate * 100}%` : 'No applicable tax',
      amount: tax
    });

    const calculatedTotal = discountedSubtotal + shippingCost + tax;
    
    console.log('🧾 Final totals:', {
      subtotal,
      discount: discountAmount,
      discountedSubtotal,
      shipping: shippingCost,
      tax,
      calculatedTotal,
      receivedTotal: totalAmount,
      difference: Math.abs(calculatedTotal - totalAmount)
    });

    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      console.warn('❌ Total amount mismatch:', {
        calculated: calculatedTotal,
        received: totalAmount,
        difference: Math.abs(calculatedTotal - totalAmount)
      });
      return res.status(400).json({
        success: false,
        message: 'Total amount mismatch',
        debug: {
          calculated: calculatedTotal,
          received: totalAmount,
          difference: Math.abs(calculatedTotal - totalAmount)
        }
      });
    }

    // Process payment based on method
    try {
      // Only allow M-Pesa payments
      if (paymentMethod !== 'mpesa') {
        console.log('❌ Invalid payment method:', paymentMethod);
        return res.status(400).json({
          success: false,
          message: 'Only M-Pesa payments are accepted at this time',
        });
      }

      console.log('💰 Initiating M-Pesa payment:', {
        phone: req.body.phoneNumber,
        amount: calculatedTotal
      });

      // Initiate M-Pesa payment
      const amountInt = Math.round(calculatedTotal);
      const tempReference = `TEMP_${Date.now()}`;
      
      const stkResponse = await stkPush(
        req.body.phoneNumber,
        amountInt,
        tempReference,
        `Payment for your purchase`
      );

      if (!stkResponse.MerchantRequestID) {
        console.error('❌ STK push failed:', stkResponse);
        throw new Error('Failed to initiate M-Pesa payment');
      }

      console.log('✅ STK push successful:', {
        MerchantRequestID: stkResponse.MerchantRequestID,
        CheckoutRequestID: stkResponse.CheckoutRequestID
      });

      // Store the technical response data in the pending order
      const pendingOrder = new PendingOrder({
        merchantRequestID: stkResponse.MerchantRequestID,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        userId: req.user.id,
        items: orderItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
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
        productsToUpdate,
        phoneNumber: req.body.phoneNumber
      });

      await pendingOrder.save();
      console.log('✅ Pending order created:', pendingOrder._id);

      // Send only user-facing information to frontend
      return res.status(200).json({
        success: true,
        message: 'Please check your phone and enter M-Pesa PIN to complete payment',
        // Only include what's needed for frontend polling
        pollUrl: `/api/orders/payment-status/${pendingOrder._id}`,
        pollInterval: 5000
      });

    } catch (paymentError) {
      console.error('💥 Payment processing error:', paymentError);
      return res.status(400).json({
        success: false,
        message: 'Payment processing failed. Please try again.',
      });
    }
  } catch (error) {
    console.error('💥 Order creation error:', error);
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
      await NotificationService.sendOrderNotification(order.user, {
        status: 'order_delivered',
        orderNumber: order.orderNumber,
        orderId: order._id
      });
    } else if (status === 'shipped') {
      await NotificationService.sendOrderNotification(order.user, {
        status: 'order_shipped',
        orderNumber: order.orderNumber,
        orderId: order._id,
        estimatedDays: order.shippingInfo?.estimatedDelivery 
          ? Math.ceil((new Date(order.shippingInfo.estimatedDelivery) - new Date()) / (1000 * 60 * 60 * 24))
          : 5
      });
    } else if (status === 'cancelled') {
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

    // Send cancellation notification
    await NotificationService.sendOrderNotification(order.user, {
      status: 'order_canceled',
      orderNumber: order.orderNumber,
      orderId: order._id
    });

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
    doc.text(`Total: Ksh ${order.pricing.total.toFixed(2)}`);
    doc.moveDown();
    doc.text('Items:');
    order.items.forEach(item => {
      doc.text(`- ${item.title} x${item.quantity} (Ksh ${item.price.toFixed(2)} each)`);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
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

export const checkPaymentStatus = async (req, res) => {
  console.log("\n🔄 [checkPaymentStatus] NEW REQUEST ==================================");
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log("🌐 Request URL:", req.originalUrl);
  console.log("🔢 Method:", req.method);
  console.log("📦 Request params:", JSON.stringify(req.params, null, 2));
  console.log("🔐 Authenticated user:", req.user ? {
    id: req.user._id,
    email: req.user.email,
    role: req.user.role
  } : "No user in request");

  try {
    const { pendingOrderId } = req.params;
    console.log("\n🔎 [1/3] Looking for PendingOrder with ID:", pendingOrderId);
    
    if (!mongoose.Types.ObjectId.isValid(pendingOrderId)) {
      console.log("❌ Invalid PendingOrder ID format");
      return res.status(400).json({
        success: false,
        error: "invalid_id_format",
        message: "The provided order ID is not valid"
      });
    }

    const pendingOrder = await PendingOrder.findById(pendingOrderId).lean();
    console.log("📦 [2/3] PendingOrder query result:", pendingOrder ? {
      status: pendingOrder.status,
      merchantRequestID: pendingOrder.merchantRequestID,
      createdAt: pendingOrder.createdAt
    } : "Not found in database");

    if (!pendingOrder) {
      console.log("\n❌ [ERROR] No pending order found with ID:", pendingOrderId);
      console.log("Possible causes:");
      console.log("- Order was never created");
      console.log("- Order was deleted/cleaned up");
      console.log("- ID is incorrect");
      
      return res.status(404).json({
        success: false,
        error: "not_found",
        paymentStatus: 'not_found',
        message: 'Payment request not found',
        action: {
          type: 'redirect',
          destination: '/cart',
          message: 'Return to cart and try again'
        }
      });
    }

    console.log("\n📊 [3/3] Processing status:", pendingOrder.status.toUpperCase());
    
    switch (pendingOrder.status) {
      case 'processed':
        console.log("✅ Status = processed, searching for related Order...");
        const order = await Order.findOne({
          'paymentInfo.merchantRequestID': pendingOrder.merchantRequestID
        }).lean();
        
        console.log("📄 Related Order found:", order ? {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status
        } : "None found - possible data inconsistency");
        
        if (!order) {
          console.warn("⚠️ Data inconsistency: PendingOrder marked as processed but no Order found");
        }

        return res.status(200).json({
          success: true,
          paymentStatus: 'completed',
          message: 'Payment successful! Your order has been confirmed.',
          orderDetails: order ? {
            orderId: order._id,
            orderNumber: order.orderNumber
          } : null,
          action: {
            type: 'redirect',
            destination: '/orders',  // Changed from `/orders/${order._id}` to just '/orders'
            message: 'View your orders'
          }
        });

      case 'failed':
        console.log("❌ Status = failed");
        console.log("Failure reason:", pendingOrder.failureReason || 'Not specified');
        return res.status(200).json({
          success: false,
          paymentStatus: 'failed',
          message: pendingOrder.failureReason || 'Payment failed.',
          details: 'This could be due to insufficient funds, wrong PIN, or cancelled transaction.',
          
          action: {
            type: 'retry',
            message: 'Retry Payment',
            originalAmount: pendingOrder.pricing.total
          },
          retryAllowed: true
        });

      case 'pending':
        console.log("⏳ Status = pending");
        console.log("Time since creation:", 
          Math.floor((new Date() - new Date(pendingOrder.createdAt)) / 1000), 
          "seconds");
        return res.status(200).json({
          success: true,
          paymentStatus: 'pending',
          message: 'Waiting for your payment confirmation',
          nextSteps: [
            'Check your phone for the M-Pesa prompt',
            'Enter your M-Pesa PIN to complete payment',
            'Do not close this page'
          ],
          pendingOrderId: pendingOrder._id
        });

      case 'expired':
        console.log("⌛ Status = expired");
        console.log("Expired at:", pendingOrder.updatedAt);
        return res.status(200).json({
          success: false,
          paymentStatus: 'expired',
          message: 'Payment request expired',
          details: 'You took too long to complete the payment',
          nextSteps: [
            'Click retry to get a new payment prompt',
            'Complete the payment within 2 minutes'
          ],
          action: {
            type: 'retry',
            message: 'Retry Payment',
            originalAmount: pendingOrder.pricing.total
          },
          retryAllowed: true
        });

      default:
        console.log("🤷 Unknown status:", pendingOrder.status);
        return res.status(200).json({
          success: false,
          paymentStatus: 'unknown',
          message: 'Unable to determine payment status',
          action: {
            type: 'support',
            message: 'Contact Support',
            reference: pendingOrder.merchantRequestID
          }
        });
    }

  } catch (error) {
    console.error('\n💥 [CRITICAL ERROR] in checkPaymentStatus:', error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack.split("\n")[0] // Just first line of stack trace
    });
    
    return res.status(500).json({
      success: false,
      error: "server_error",
      paymentStatus: 'error',
      message: 'Error checking payment status',
      technicalDetails: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        type: error.name
      } : undefined,
      action: {
        type: 'reload',
        message: 'Refresh page to try again'
      }
    });
  }
};
 
// @desc    Update an order (status, paymentStatus, trackingNumber, notes)
// @route   PUT /orders/:id
// @access  Admin
export const updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus, trackingNumber, notes } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = notes;

    await order.save();

    // 🔑 Re-fetch with population so frontend always gets consistent data
    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'title price images');

    return res.json({ order: populatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};





