import mongoose from 'mongoose';

const notificationEventSchema = new mongoose.Schema({
  eventKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  defaultTitle: {
    type: String,
    required: true
  },
  defaultMessage: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'promotion', 'wishlist', 'system'],
    required: true
  },
  icon: {
    type: String,
    default: '🔔'
  },
  color: {
    type: String,
    default: 'blue'
  },
  actionText: {
    type: String
  },
  actionLinkTemplate: {
    type: String // e.g. "/orders/{{orderId}}"
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('NotificationEvent', notificationEventSchema);

// To check if templates (NotificationEvent documents) already exist, you can run:
//
// import NotificationEvent from './NotificationEvent.js';
// NotificationEvent.find().then(console.log);
//
// Or use MongoDB Compass or the mongo shell to view the NotificationEvent collection.
//
// If you have not inserted any documents yet, the collection will be empty.
// You need to seed it with event templates for your notification system to work.
//
// Example seed (run once in your backend):
// NotificationEvent.create([
//   {
//     eventKey: 'order_confirmed',
//     description: 'Order confirmed',
//     defaultTitle: 'Order Confirmed',
//     defaultMessage: 'Your order #{{orderNumber}} has been confirmed.',
//     type: 'order',
//     icon: '✅',
//     color: 'green',
//     actionText: 'View Order',
//     actionLinkTemplate: '/order/{{orderId}}',
//     priority: 'high'
//   },
//   {
//     eventKey: 'price_drop',
//     description: 'Wishlist price drop',
//     defaultTitle: 'Price Drop Alert',
//     defaultMessage: '{{productName}} in your wishlist is now {{discount}}% off!',
//     type: 'wishlist',
//     icon: '💰',
//     color: 'green',
//     actionText: 'Buy Now',
//     actionLinkTemplate: '/product/{{productId}}',
//     priority: 'medium'
//   },
//   {
//     eventKey: 'product_created',
//     description: 'Triggered when a new product is added',
//     defaultTitle: 'New Product Added',
//     defaultMessage: 'Product "{{title}}" has been added to the catalog.',
//     type: 'promotion',
//     icon: '🆕',
//     color: 'blue',
//     actionText: 'View Product',
//     actionLinkTemplate: '/product/{{productId}}',
//     priority: 'medium',
//     enabled: true
//   },
//   {
//     eventKey: 'product_discount',
//     description: 'Triggered when a product gets a new discount',
//     defaultTitle: 'Price Drop Alert',
//     defaultMessage: '{{productName}} is now {{discount}}% off!',
//     type: 'wishlist',
//     icon: '💰',
//     color: 'green',
//     actionText: 'Buy Now',
//     actionLinkTemplate: '/product/{{productId}}',
//     priority: 'high',
//     enabled: true
//   },
//   {
//     eventKey: 'product_back_in_stock',
//     description: 'Triggered when a product is back in stock',
//     defaultTitle: 'Back in Stock',
//     defaultMessage: '{{productName}} is back in stock! Get it before it runs out again.',
//     type: 'wishlist',
//     icon: '📦',
//     color: 'green',
//     actionText: 'Buy Now',
//     actionLinkTemplate: '/product/{{productId}}',
//     priority: 'medium',
//     enabled: true
//   }
//   // ...add more templates as needed
// ]);
