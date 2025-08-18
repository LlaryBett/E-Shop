import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide product title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative'],
  },
  salePrice: {
    type: Number,
    min: [0, 'Sale price cannot be negative'],
    validate: {
      validator: function (value) {
        return !value || value < this.price;
      },
      message: 'Sale price must be less than regular price',
    },
  },
  images: [{
    url: {
      type: String,
      required: [true, 'Please provide image URL'],
      trim: true,
    }
  }],
  
  // ✅ FIXED: Proper 3-level hierarchy structure
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category'],
  },
  subcategory: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide subcategory ID'],
    },
    name: {
      type: String,
      required: [true, 'Please provide subcategory name'],
      trim: true,
    }
  },
  item: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide item ID'],
    },
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Please provide item slug'],
      trim: true,
      lowercase: true,
      index: true, // ✅ For fast URL routing and queries
    }
  },
  
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Please select a brand'],
  },
  sku: {
    type: String,
    unique: true,
    required: [true, 'Please provide SKU'],
    trim: true,
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  variants: [{
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    price: Number,
    stock: Number,
    sku: String,
  }],
  specifications: {
    type: Map,
    of: String,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  trending: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sections: [{
    type: String,
    enum: ['featured', 'trending', 'picks', 'check-this-out'],
    lowercase: true,
    trim: true
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ✅ UPDATED: Indexes for optimized querying with proper hierarchy
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ 'subcategory._id': 1 });
productSchema.index({ 'item._id': 1 });
productSchema.index({ 'item.slug': 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featured: 1 });
productSchema.index({ trending: 1 });
productSchema.index({ sections: 1 });

// ✅ UPDATED: Compound indexes for common hierarchy queries
productSchema.index({ category: 1, 'subcategory._id': 1 });
productSchema.index({ category: 1, 'subcategory._id': 1, 'item._id': 1 });
productSchema.index({ category: 1, 'item.slug': 1 });
productSchema.index({ category: 1, isActive: 1 });

// Virtual fields
productSchema.virtual('currentPrice').get(function () {
  return this.salePrice || this.price;
});

productSchema.virtual('discountPercentage').get(function () {
  if (this.salePrice && this.price > this.salePrice) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.lowStockThreshold) return 'low-stock';
  return 'in-stock';
});

// ✅ ADDED: Virtual for full category path
productSchema.virtual('categoryPath').get(function () {
  return `${this.category.name} > ${this.subcategory.name} > ${this.item.name}`;
});

// Pre-save middleware to auto-generate SKU if missing
productSchema.pre('save', function (next) {
  if (!this.sku) {
    this.sku = `${this.brand.toUpperCase()}-${Date.now()}`;
  }
  next();
});

export default mongoose.model('Product', productSchema);