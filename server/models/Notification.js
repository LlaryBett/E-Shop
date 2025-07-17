import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['order', 'promotion', 'wishlist', 'system'],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  icon: {
    type: String,
    default: '📋'
  },
  color: {
    type: String,
    enum: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'],
    default: 'blue'
  },
  actionText: {
    type: String,
    maxlength: 100
  },
  actionLink: {
    type: String,
    maxlength: 500
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });

// Virtual for timestamp (to match frontend)
notificationSchema.virtual('timestamp').get(function() {
  return this.createdAt;
});

// Transform output to match frontend expectations
notificationSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    ret.timestamp = ret.createdAt;
    delete ret._id;
    delete ret.__v;
    delete ret.userId;
    return ret;
  }
});

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, updatedAt: new Date() }
  );
};

notificationSchema.statics.clearAll = function(userId) {
  return this.deleteMany({ userId });
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

export default mongoose.model('Notification', notificationSchema);