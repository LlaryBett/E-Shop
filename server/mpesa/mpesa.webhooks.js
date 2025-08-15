import { Transaction } from '../models/Transaction.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { validateIPN } from './mpesa.utils.js';
import { PendingOrder } from '../models/PendingOrder.js';
import NotificationService from '../middleware/NotificationService.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { sendEmail } from '../utils/sendEmail.js';

/**
 * STK Callback Handler (for Lipa Na M-Pesa Online)
 */
export const handleSTKCallback = async (req, res) => {
  try {
    // Log the raw request for debugging
    console.log('💰 Raw M-Pesa Callback Data:', {
      body: req.body,
      headers: req.headers
    });

    const callbackData = req.body;
    const result = callbackData.Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = result;

    console.log('🔍 Processing M-Pesa callback:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    });

    // Find pending order first
    const pendingOrder = await PendingOrder.findOne({
      merchantRequestID: MerchantRequestID,
      status: 'pending'
    });

    if (!pendingOrder) {
      console.error('❌ No pending order found for:', MerchantRequestID);
      return res.status(200).send(); // Still return 200 to M-Pesa
    }

    // Handle payment failure immediately
    if (ResultCode !== 0) {
      console.error('❌ Payment failed:', ResultDesc);
      
      // Update pending order status
      await PendingOrder.findByIdAndUpdate(pendingOrder._id, {
        status: 'failed',
        failureReason: ResultDesc
      });

      // Notify user about payment failure
      const user = await User.findById(pendingOrder.userId);
      if (user) {
        try {
          // Send notification
          await NotificationService.sendOrderNotification(pendingOrder.userId, {
            status: 'payment_failed',
            reason: ResultDesc,
            orderReference: MerchantRequestID
          });

          // Send email notification
          await sendEmail({
            email: user.email,
            subject: 'Payment Failed',
            message: `Your payment for order reference ${MerchantRequestID} failed. Reason: ${ResultDesc}. Please try again.`,
            greeting: 'Hello',
            name: user.name,
            showContactSupport: true
          });
          
          console.log('✅ Payment failure notification sent to user:', user.email);
        } catch (notificationError) {
          console.error('❌ Failed to send failure notification:', notificationError);
        }
      }

      // Always return 200 to M-Pesa
      return res.status(200).json({
        success: false,
        message: ResultDesc
      });
    }

    console.log('✅ Found pending order:', pendingOrder._id);

    // Extract payment metadata
    const metadata = result.CallbackMetadata?.Item?.reduce((acc, item) => {
      acc[item.Name] = item.Value;
      return acc;
    }, {});

    console.log('📦 Payment metadata:', metadata);

    let order;
    try {
      // Create order
      console.log('📝 Creating order from pending data...');
      order = new Order({
        user: pendingOrder.userId,
        items: pendingOrder.items,
        shippingAddress: pendingOrder.shippingAddress,
        billingAddress: pendingOrder.billingAddress,
        status: 'processing',
        paymentInfo: {
          method: 'mpesa',
          status: 'paid',
          phoneNumber: pendingOrder.phoneNumber,
          merchantRequestID: MerchantRequestID,
          checkoutRequestID: CheckoutRequestID,
          mpesaReceiptNumber: metadata?.MpesaReceiptNumber,
          paidAt: new Date()
        },
        pricing: pendingOrder.pricing,
        appliedCoupon: pendingOrder.appliedCoupon,
        shippingInfo: pendingOrder.shippingInfo,
      });

      await order.save();
      console.log('✅ Order created:', order._id);

      // Update stock
      console.log('📊 Updating product stock...');
      for (const item of pendingOrder.productsToUpdate) {
        const product = await Product.findById(item.product);
        if (product) {
          console.log(`Reducing stock for ${product._id} by ${item.quantity}`);
          product.stock -= item.quantity;
          await product.save();
        }
      }

      // Update coupon usage if coupon was applied
      if (pendingOrder.appliedCoupon && pendingOrder.appliedCoupon._id) {
        try {
          await Coupon.findByIdAndUpdate(pendingOrder.appliedCoupon._id, {
            $inc: { usedCount: 1 }
          });
          console.log('✅ Coupon usage updated');
        } catch (couponError) {
          console.error('❌ Failed to update coupon usage:', couponError);
        }
      }

      // Send success notifications and email
      console.log('📧 Sending success notifications...');
      const user = await User.findById(order.user);
      
      if (user) {
        try {
          // Send order confirmation notification
          await NotificationService.sendOrderNotification(order.user, {
            status: 'order_confirmed',
            orderNumber: order.orderNumber,
            orderId: order._id
          });
          console.log('✅ Order confirmation notification sent');

          // Send order confirmation email
          await sendOrderConfirmationEmail(order, user);
          console.log('✅ Order confirmation email sent to:', user.email);
        } catch (notificationError) {
          console.error('❌ Failed to send success notifications:', notificationError);
        }
      }

      // Mark pending order as processed
      await PendingOrder.findByIdAndUpdate(pendingOrder._id, {
        status: 'processed',
        processedAt: new Date()
      });

      console.log('🎉 Order process completed successfully');
    } catch (orderError) {
      console.error('❌ Error processing order:', orderError);
      
      // If order creation failed, mark pending order as failed
      await PendingOrder.findByIdAndUpdate(pendingOrder._id, {
        status: 'failed',
        failureReason: 'Order processing failed'
      });
      
      // Still return 200 to M-Pesa but log the error
      return res.status(200).send();
    }

    res.status(200).send();
  } catch (error) {
    console.error('💥 Critical error in STK callback:', error);
    // Always respond with 200 to M-Pesa even if we have internal errors
    res.status(200).send();
  }
};

/**
 * Helper function to send order confirmation email
 */
const sendOrderConfirmationEmail = async (order, user) => {
  const itemsList = order.items.map(item => 
    `- ${item.title} x${item.quantity} (Ksh ${item.price.toFixed(2)} each)`
  ).join('\n');

  const message = `
Thank you for your order! Your order #${order.orderNumber} has been confirmed and is being processed.

Order Details:
${itemsList}

Subtotal: Ksh ${order.pricing.subtotal.toFixed(2)}
${order.pricing.discount > 0 ? `Discount: -Ksh ${order.pricing.discount.toFixed(2)}` : ''}
Shipping: Ksh ${order.pricing.shipping.toFixed(2)}
Tax: Ksh ${order.pricing.tax.toFixed(2)}
Total: Ksh ${order.pricing.total.toFixed(2)}

M-Pesa Receipt: ${order.paymentInfo.mpesaReceiptNumber}

We'll send you another email when your order ships.

Thank you for shopping with us!
  `;

 await sendEmail({
  email: user.email,
  subject: `Order Confirmation - ${order.orderNumber}`,
  message,
  greeting: 'Dear',
  name: user.name,
  actionUrl: `${process.env.CLIENT_URL}/orders`,
  actionText: 'View Your Orders',
  showContactSupport: true,
  footerText: 'This is a confirmation of your recent order.'
});

};

/**
 * B2C Payment Result Handler
 */
export const handleB2CCallback = async (req, res) => {
  try {
    const result = req.body.Result;
    console.log('B2C Callback Received:', result);

    // 1. Find transaction by M-Pesa reference
    const transaction = await Transaction.findOne({
      mpesaReference: result.TransactionID,
      transactionType: 'B2C'
    });

    if (!transaction) {
      console.error('B2C Transaction not found:', result.TransactionID);
      return res.status(404).send();
    }

    // 2. Update status
    const newStatus = result.ResultCode === 0 ? 'completed' : 'failed';
    await transaction.updateStatus(newStatus, {
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc,
      callbackMetadata: result
    });

    console.log(`B2C payment ${newStatus} for ${result.ReceiverParty}`);

    res.status(200).send();
  } catch (error) {
    console.error('B2C Callback Error:', error);
    res.status(500).json({ 
      error: 'Failed to process B2C callback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * C2B Validation Handler
 */
export const handleC2BValidation = async (req, res) => {
  try {
    const payload = req.body;
    console.log('C2B Validation Request:', payload);

    // 1. Validate transaction (add your business logic)
    const isValid = await validateC2BPayment(payload);
    
    // 2. Log the validation attempt
    await Transaction.create({
      transactionType: 'C2B',
      phoneNumber: payload.MSISDN,
      amount: payload.TransAmount,
      reference: payload.BillRefNumber,
      status: isValid ? 'completed' : 'failed',
      callbackMetadata: payload
    });

    // 3. Respond to M-Pesa
    res.json({
      ResultCode: isValid ? 0 : 1,
      ResultDesc: isValid ? 'Accepted' : 'Invalid transaction'
    });

  } catch (error) {
    console.error('C2B Validation Error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: 'Internal validation error'
    });
  }
};

// Helper function (customize with your business logic)
async function validateC2BPayment(payload) {
  // Implement your validation logic:
  // - Check if phone number is whitelisted
  // - Verify amount matches expected value
  // - Validate BillRefNumber format
  return true; // Default accept all for demo
}

export default {
  handleSTKCallback,
  handleB2CCallback,
  handleC2BValidation
};