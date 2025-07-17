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
