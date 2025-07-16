import { validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js'; // Add this import
import { sendEmail } from '../utils/sendEmail.js';
import { processPayment } from '../utils/stripe.js';
import PDFDocument from 'pdfkit';

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
      totalAmount,
    } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];
    const productsToUpdate = [];

    for (const item of items) {
      // Handle both string ID and full product object
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

      // Track products for stock update
      productsToUpdate.push({
        product,
        quantity: item.quantity
      });
    }

    // Calculate shipping and tax
    const shippingCost = calculateShipping(shippingMethod, subtotal);
    const tax = calculateTax(subtotal, shippingAddress.state);
    const calculatedTotal = subtotal + shippingCost + tax;

    // Validate total amount matches calculated total
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      console.log('Order total mismatch debug:', {
        calculatedTotal,
        totalAmountFromFrontend: totalAmount,
        subtotal,
        shippingCost,
        tax
      });
      return res.status(400).json({
        success: false,
        message: 'Total amount mismatch',
      });
    }

    // Create order
    const order = new Order({
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
        total: totalAmount,
      },
      shippingInfo: {
        method: shippingMethod,
        cost: shippingCost,
        estimatedDelivery: calculateDeliveryDate(shippingMethod),
      },
    });

    // Save order to generate order number
    await order.save();

    // Update product stocks only after order is successfully created
    for (const { product, quantity } of productsToUpdate) {
      product.stock -= quantity;
      await product.save({ validateBeforeSave: false });
    }

    // --- Update user orderCount, totalSpent, and loyalty ---
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        user.orderCount = (user.orderCount || 0) + 1;
        user.totalSpent = (user.totalSpent || 0) + subtotal + shippingCost + tax;

        // Loyalty logic (example: based on totalSpent)
        if (user.totalSpent >= 5000) {
          user.loyalty = 'platinum';
        } else if (user.totalSpent >= 2000) {
          user.loyalty = 'gold';
        } else if (user.totalSpent >= 1000) {
          user.loyalty = 'silver';
        } else {
          user.loyalty = 'bronze';
        }

        await user.save();
      }
    } catch (userUpdateError) {
      console.error('Failed to update user order stats:', userUpdateError);
      // Don't fail the order just because user stats update failed
    }
    // --- End user stats update ---

    // Process payment based on method
    try {
      switch (paymentMethod) {
        case 'stripe':
          const paymentResult = await processStripePayment({
            amount: totalAmount * 100, // Convert to cents
            currency: 'usd',
            orderId: order._id,
            customerEmail: req.user.email,
          });
          order.paymentInfo.transactionId = paymentResult.id;
          order.paymentInfo.status = 'paid';
          order.paymentInfo.paidAt = new Date();
          break;

        case 'card':
          // Handle generic card payment (could be your own processor)
          const cardPaymentResult = await processCardPayment({
            amount: totalAmount,
            orderId: order._id,
            user: req.user
          });
          order.paymentInfo.transactionId = cardPaymentResult.transactionId;
          order.paymentInfo.status = cardPaymentResult.success ? 'paid' : 'failed';
          if (cardPaymentResult.success) {
            order.paymentInfo.paidAt = new Date();
          }
          break;

        case 'paypal':
          // Handle PayPal payment
          const paypalResult = await createPayPalPayment(order);
          order.paymentInfo.transactionId = paypalResult.id;
          // PayPal payments might be pending until completed
          break;

        case 'cash_on_delivery':
          // No immediate payment processing needed
          order.paymentInfo.status = 'pending';
          break;
      }

      await order.save();
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

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(order, req.user);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order just because email failed
    }

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions (would be in separate files)
async function processStripePayment({ amount, currency, orderId, customerEmail }) {
  // Implement Stripe payment logic
}

async function processCardPayment({ amount, orderId, user }) {
  // Implement your card payment processing logic
  // This would be your custom payment processor
  return {
    success: true,
    transactionId: `card_${Date.now()}`,
  };
}

async function createPayPalPayment(order) {
  // Implement PayPal payment creation
}

function calculateShipping(method, subtotal) {
  // Implement shipping calculation logic
  const rates = {
    standard: subtotal > 50 ? 0 : 5.99,
    express: 12.99,
    overnight: 24.99,
  };
  return rates[method] || 0;
}

function calculateTax(subtotal, state) {
  // Implement tax calculation logic
  const taxRates = {
    'CA': 0.0725,
    'NY': 0.08875,
    // Add other states as needed
  };
  return subtotal * (taxRates[state] || 0);
}

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