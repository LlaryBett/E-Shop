const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create a payment intent for Stripe
// @access  Private
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { orderId, currency = 'usd' } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId).populate('user', 'email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only pay for your own orders.'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency,
      metadata: {
        orderId: order._id.toString(),
        userId: order.user._id.toString(),
        orderNumber: order.orderNumber
      },
      receipt_email: order.user.email,
      description: `Payment for order ${order.orderNumber}`
    });

    // Update order with payment intent ID
    order.paymentDetails = {
      ...order.paymentDetails,
      transactionId: paymentIntent.id,
      paymentGateway: 'stripe'
    };
    await order.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: order.total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating payment intent',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update order status
// @access  Private
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID and Order ID are required'
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not succeeded yet'
      });
    }

    // Find and update the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update order payment status
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentDetails = {
      ...order.paymentDetails,
      transactionId: paymentIntentId,
      paymentGateway: 'stripe',
      paymentDate: new Date(),
      paymentAmount: paymentIntent.amount / 100
    };

    // Add to status history
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment confirmed via Stripe'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error confirming payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public (Stripe webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      try {
        // Find the order using metadata
        const order = await Order.findById(paymentIntent.metadata.orderId);
        
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.status = 'confirmed';
          order.paymentDetails = {
            ...order.paymentDetails,
            transactionId: paymentIntent.id,
            paymentGateway: 'stripe',
            paymentDate: new Date(),
            paymentAmount: paymentIntent.amount / 100
          };

          order.statusHistory.push({
            status: 'confirmed',
            timestamp: new Date(),
            note: 'Payment confirmed via Stripe webhook'
          });

          await order.save();
          console.log('Order payment confirmed via webhook:', order.orderNumber);
        }
      } catch (error) {
        console.error('Error handling payment_intent.succeeded webhook:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      try {
        const order = await Order.findById(failedPayment.metadata.orderId);
        
        if (order) {
          order.paymentStatus = 'failed';
          order.statusHistory.push({
            status: 'payment_failed',
            timestamp: new Date(),
            note: 'Payment failed via Stripe webhook'
          });

          await order.save();
          console.log('Order payment failed via webhook:', order.orderNumber);
        }
      } catch (error) {
        console.error('Error handling payment_intent.payment_failed webhook:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// @route   POST /api/payments/refund
// @desc    Process a refund
// @access  Private (Admin only)
router.post('/refund', auth, async (req, res) => {
  try {
    const { orderId, amount, reason = 'Requested by customer' } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is not paid, cannot process refund'
      });
    }

    // Check if payment method supports refunds
    if (order.paymentMethod !== 'stripe' && order.paymentMethod !== 'credit_card') {
      return res.status(400).json({
        success: false,
        message: 'Refunds not supported for this payment method'
      });
    }

    const refundAmount = amount || order.total;

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentDetails.transactionId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        refundReason: reason
      }
    });

    // Update order
    order.paymentStatus = refundAmount >= order.total ? 'refunded' : 'partially_refunded';
    order.status = 'refunded';
    order.refundDetails = {
      amount: refundAmount,
      reason,
      processedDate: new Date(),
      refundId: refund.id
    };

    order.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      note: `Refund processed: $${refundAmount}. Reason: ${reason}`,
      updatedBy: req.user._id
    });

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: item.quantity,
          sales: -item.quantity
        }
      });
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund: {
          id: refund.id,
          amount: refundAmount,
          status: refund.status,
          reason
        },
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          status: order.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error processing refund',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/payments/methods
// @desc    Get available payment methods
// @access  Public
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    data: {
      methods: [
        {
          id: 'credit_card',
          name: 'Credit Card',
          description: 'Pay with Visa, Mastercard, or American Express',
          enabled: true,
          fees: 'No additional fees'
        },
        {
          id: 'debit_card',
          name: 'Debit Card',
          description: 'Pay directly from your bank account',
          enabled: true,
          fees: 'No additional fees'
        },
        {
          id: 'paypal',
          name: 'PayPal',
          description: 'Pay with your PayPal account',
          enabled: false,
          fees: 'No additional fees'
        },
        {
          id: 'stripe',
          name: 'Stripe',
          description: 'Secure payment processing',
          enabled: true,
          fees: 'No additional fees'
        },
        {
          id: 'cash_on_delivery',
          name: 'Cash on Delivery',
          description: 'Pay when you receive your order',
          enabled: true,
          fees: 'Additional $5 handling fee'
        }
      ]
    }
  });
});

module.exports = router;
