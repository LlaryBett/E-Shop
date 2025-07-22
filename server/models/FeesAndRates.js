import mongoose from 'mongoose';

const feesAndRatesSchema = new mongoose.Schema({
  freeShippingMin: { type: Number, required: true },
  flatShippingFee: { type: Number, required: true },
  defaultTaxRate: { type: Number, required: true }
}, { timestamps: true });

const FeesAndRates = mongoose.model('FeesAndRates', feesAndRatesSchema);

export default FeesAndRates;
