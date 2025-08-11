import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    default: function () {
      // Generate order number if not present
      return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    variant: String,
    sku: String,
  }],
  shippingAddress: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      validate: {
        // Accepts 2547XXXXXXXX or 2541XXXXXXXX or +2547XXXXXXXX or +2541XXXXXXXX or 07XXXXXXXX or 01XXXXXXXX
        validator: v => /^(\+?254|0)[17]\d{8}$/.test(v),
        message: 'Invalid Kenyan phone number'
      }
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: 'Kenya'
    },
  },
  paymentInfo: {
    method: {
      type: String,
      enum: ['mpesa'],
      default: 'mpesa',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    mpesaReference: String,
    merchantRequestID: String,
    checkoutRequestID: String,
    phoneNumber: {
      type: String,
      validate: {
        // Accepts 2547XXXXXXXX or 2541XXXXXXXX or +2547XXXXXXXX or +2541XXXXXXXX or 07XXXXXXXX or 01XXXXXXXX
        validator: v => /^(\+?254|0)[17]\d{8}$/.test(v),
        message: 'Invalid M-Pesa phone number'
      }
    },
    paidAt: Date,
    resultCode: Number,
    resultDesc: String
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  statusHistory: [{
    status: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: String,
  }],
}, {
  timestamps: true
});

// Status history tracking
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
      note: this.status === 'paid' ? 'M-Pesa payment confirmed' : ''
    });
  }
  next();
});

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'paymentInfo.checkoutRequestID': 1 });
orderSchema.index({ 'paymentInfo.merchantRequestID': 1 });
orderSchema.index({ 'paymentInfo.mpesaReference': 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);