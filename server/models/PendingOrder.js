import mongoose from 'mongoose';

const pendingOrderSchema = new mongoose.Schema({
  merchantRequestID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  checkoutRequestID: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  billingAddress: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Kenya' }
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
  appliedCoupon: {
    code: String,
    type: String,
    amount: Number,
    minAmount: Number,
    _id: mongoose.Schema.Types.ObjectId
  },
  shippingInfo: {
    method: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingMethod' },
    cost: Number,
    estimatedDelivery: Date
  },
  productsToUpdate: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number
  }],
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: v => /^(\+?254|0)[17]\d{8}$/.test(v),
      message: 'Invalid M-Pesa phone number'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'expired', 'processed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Auto-expire pending orders after 10 minutes
pendingOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export const PendingOrder = mongoose.model('PendingOrder', pendingOrderSchema);
