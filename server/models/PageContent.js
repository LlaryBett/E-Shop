const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  pageKey: {
    type: String,
    required: true,
    unique: true,
    enum: ['about', 'privacy', 'terms', 'shipping', 'returns']
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  sections: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for pageKey
pageContentSchema.index({ pageKey: 1 });

module.exports = mongoose.model('PageContent', pageContentSchema);
