import mongoose from 'mongoose';

const taxRateSchema = new mongoose.Schema({
  min: {
    type: Number,
    required: true,
    min: 0
  },
  max: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return value > this.min;
      },
      message: 'Max must be greater than min.'
    }
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 1  // For example, 0.01 for 1%, 0.03 for 3%
  }
}, { timestamps: true });

const TaxRate = mongoose.model('TaxRate', taxRateSchema);

export default TaxRate;
