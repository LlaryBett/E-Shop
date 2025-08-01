import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  variant: {
    type: String,
    default: null,
  },
}, { _id: true }); // Allow item-level _id for updates/removals

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  },
  items: [cartItemSchema],
}, {
  timestamps: true,
});

export default mongoose.model('Cart', cartSchema);
