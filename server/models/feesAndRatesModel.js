import mongoose from 'mongoose';

const TaxTierSchema = new mongoose.Schema({
  min: { type: Number, required: true },
  max: { type: Number }, // Optional max means open-ended
  rate: { type: Number, required: true } // as decimal e.g. 0.05
}, { _id: false });

const PaymentFeeSchema = new mongoose.Schema({
  method: { type: String, required: true },
  fee: { type: Number, required: true }
}, { _id: false });

const ShippingMethodFeeSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['standard', 'express', 'overnight'],
    required: true
  },
  fee: { type: Number, required: true }
}, { _id: false });

const FeesAndRatesSchema = new mongoose.Schema({
  location: { type: String, required: true, unique: true },

  // Instead of a single shippingFee, store per-method shipping fees
  shippingFees: [ShippingMethodFeeSchema],

  taxTiers: [TaxTierSchema],
  paymentFees: [PaymentFeeSchema]
});

const FeesAndRates = mongoose.model('FeesAndRates', FeesAndRatesSchema);

export default FeesAndRates;
