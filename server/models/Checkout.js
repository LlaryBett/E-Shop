import mongoose from 'mongoose';

const CheckoutSchema = new mongoose.Schema({
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      variant: { type: String }
    }
  ],
  shippingAddress: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  shippingMethod: { type: String, required: true }, // e.g. standard, express
  paymentMethod: { type: String, required: true },  // e.g. card, cod
  couponCode: { type: String },
  discount: { type: Number, default: 0 }, // Applied discount amount
  subtotal: { type: Number, required: true }, // Total of product prices before any fees
  shipping: { type: Number, required: true }, // Fetched from FeesAndRates
  tax: { type: Number, required: true }, // Calculated based on subtotal + taxTiers
  paymentFee: { type: Number, required: true }, // Optional, pulled from FeesAndRates
  total: { type: Number, required: true }, // subtotal - discount + shipping + tax + paymentFee
  resolvedLocation: { type: String, required: true }, // For audit and historical pricing consistency
  createdAt: { type: Date, default: Date.now }
});

const Checkout = mongoose.model('Checkout', CheckoutSchema);

export default Checkout;
