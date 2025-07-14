import { sendEmail } from './sendEmail.js';

// Send order confirmation notification
export const sendOrderConfirmation = async (order, user) => {
  const subject = `Order Confirmation - ${order.orderNumber}`;
  const message = `
    Dear ${user.name},
    
    Thank you for your order! Your order #${order.orderNumber} has been confirmed.
    
    Order Details:
    - Order Number: ${order.orderNumber}
    - Total: $${order.pricing.total.toFixed(2)}
    - Items: ${order.items.length}
    
    We'll send you another email when your order ships.
    
    Best regards,
    E-Shop Team
  `;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

// Send order status update notification
export const sendOrderStatusUpdate = async (order, user) => {
  const subject = `Order Update - ${order.orderNumber}`;
  let message = `
    Dear ${user.name},
    
    Your order #${order.orderNumber} status has been updated to: ${order.status.toUpperCase()}
  `;

  switch (order.status) {
    case 'processing':
      message += `
        
        Your order is now being processed and will ship soon.
      `;
      break;
    case 'shipped':
      message += `
        
        Your order has been shipped!
        ${order.shippingInfo.trackingNumber ? `Tracking Number: ${order.shippingInfo.trackingNumber}` : ''}
        
        You can expect delivery within ${order.shippingInfo.method === 'overnight' ? '1 business day' : 
          order.shippingInfo.method === 'express' ? '2-3 business days' : '5-7 business days'}.
      `;
      break;
    case 'delivered':
      message += `
        
        Your order has been delivered! We hope you enjoy your purchase.
        
        Please consider leaving a review for the items you purchased.
      `;
      break;
    case 'cancelled':
      message += `
        
        Your order has been cancelled. If you didn't request this cancellation, please contact our support team.
        
        Any charges will be refunded within 3-5 business days.
      `;
      break;
  }

  message += `
    
    Best regards,
    E-Shop Team
  `;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

// Send low stock alert to admin
export const sendLowStockAlert = async (product) => {
  const subject = `Low Stock Alert - ${product.title}`;
  const message = `
    Low Stock Alert!
    
    Product: ${product.title}
    SKU: ${product.sku}
    Current Stock: ${product.stock}
    Low Stock Threshold: ${product.lowStockThreshold}
    
    Please restock this item soon.
    
    E-Shop System
  `;

  // Send to admin email
  await sendEmail({
    email: process.env.ADMIN_EMAIL,
    subject,
    message,
  });
};

// Send welcome email to new users
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to E-Shop!';
  const message = `
    Dear ${user.name},
    
    Welcome to E-Shop! We're excited to have you as part of our community.
    
    Here's what you can do with your account:
    - Browse thousands of products
    - Save items to your wishlist
    - Track your orders
    - Manage your profile and addresses
    
    Start shopping now and enjoy free shipping on orders over $50!
    
    Best regards,
    E-Shop Team
  `;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

// Send password reset notification
export const sendPasswordResetNotification = async (user) => {
  const subject = 'Password Reset Successful';
  const message = `
    Dear ${user.name},
    
    Your password has been successfully reset.
    
    If you didn't make this change, please contact our support team immediately.
    
    Best regards,
    E-Shop Team
  `;

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

// Send newsletter
export const sendNewsletter = async (subscribers, subject, content) => {
  const promises = subscribers.map(subscriber => 
    sendEmail({
      email: subscriber.email,
      subject,
      message: content,
    })
  );

  await Promise.all(promises);
};