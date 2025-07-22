import mongoose from 'mongoose';

const shippingMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },             // Display name
  description: { type: String, default: '' },          // Optional description
  cost: { type: Number, required: true },              // Cost in KES
  estimatedDays: { type: Number, default: 3 },         // Estimated delivery time
  isActive: { type: Boolean, default: true },          // Whether it's selectable
  minFree: { type: Number, default: 0 }                // Optional: free if total > minFree
}, { timestamps: true });

const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);

export default ShippingMethod;
