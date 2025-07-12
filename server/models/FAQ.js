const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'orders',
      'shipping',
      'returns',
      'payments',
      'account',
      'products',
      'technical'
    ],
    default: 'general'
  },
  order: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  helpful: {
    yes: {
      type: Number,
      default: 0
    },
    no: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ status: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

// Virtual for helpful percentage
faqSchema.virtual('helpfulPercentage').get(function() {
  const total = this.helpful.yes + this.helpful.no;
  if (total === 0) return 0;
  return Math.round((this.helpful.yes / total) * 100);
});

module.exports = mongoose.model('FAQ', faqSchema);
