const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"E-Shop" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to E-Shop!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to E-Shop, ${userName}!</h1>
          <p>Thank you for joining our community. We're excited to have you on board!</p>
          <p>You can now:</p>
          <ul>
            <li>Browse thousands of products</li>
            <li>Add items to your wishlist</li>
            <li>Track your orders</li>
            <li>Enjoy exclusive member discounts</li>
          </ul>
          <a href="${process.env.CLIENT_URL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Start Shopping
          </a>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Happy shopping!</p>
          <p>The E-Shop Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', userEmail);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  try {
    const transporter = createTransporter();

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.productImage}" alt="${item.productTitle}" style="width: 50px; height: 50px; object-fit: cover;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productTitle}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"E-Shop" <${process.env.EMAIL_USER}>`,
      to: order.shippingAddress.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Order Confirmation</h1>
          <p>Hi ${order.shippingAddress.firstName},</p>
          <p>Thank you for your order! Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>
          
          <h2>Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Image</th>
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: left;">Qty</th>
                <th style="padding: 10px; text-align: left;">Price</th>
                <th style="padding: 10px; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
            <table style="width: 100%;">
              <tr><td>Subtotal:</td><td style="text-align: right;">$${order.subtotal.toFixed(2)}</td></tr>
              <tr><td>Shipping:</td><td style="text-align: right;">$${order.shipping.toFixed(2)}</td></tr>
              <tr><td>Tax:</td><td style="text-align: right;">$${order.tax.toFixed(2)}</td></tr>
              ${order.discount > 0 ? `<tr><td>Discount:</td><td style="text-align: right;">-$${order.discount.toFixed(2)}</td></tr>` : ''}
              <tr style="font-weight: bold; border-top: 1px solid #ddd;">
                <td>Total:</td><td style="text-align: right;">$${order.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <h2>Shipping Address</h2>
          <p>
            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.address}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
            ${order.shippingAddress.country}
          </p>

          <p>We'll send you tracking information once your order ships.</p>
          <p>Thank you for shopping with us!</p>
          <p>The E-Shop Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent for order:', order.orderNumber);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

// Send shipping notification email
const sendShippingNotificationEmail = async (order) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"E-Shop" <${process.env.EMAIL_USER}>`,
      to: order.shippingAddress.email,
      subject: `Your Order Has Shipped - ${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Your Order Has Shipped!</h1>
          <p>Hi ${order.shippingAddress.firstName},</p>
          <p>Great news! Your order <strong>${order.orderNumber}</strong> has been shipped and is on its way to you.</p>
          
          ${order.trackingNumber ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-radius: 6px;">
              <h3>Tracking Information</h3>
              <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
              ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ''}
            </div>
          ` : ''}

          <p>You can track your package using the tracking number above or by logging into your account.</p>
          
          <a href="${process.env.CLIENT_URL}/orders/${order._id}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Track Your Order
          </a>
          
          <p>Thank you for your business!</p>
          <p>The E-Shop Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Shipping notification email sent for order:', order.orderNumber);
  } catch (error) {
    console.error('Error sending shipping notification email:', error);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"E-Shop" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>You have requested to reset your password for your E-Shop account.</p>
          <p>Click the button below to reset your password:</p>
          
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <p>The E-Shop Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
  sendPasswordResetEmail
};
