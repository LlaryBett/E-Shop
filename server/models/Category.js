import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  icon: {
    type: String,
    default: 'Package',
    trim: true
  },
  isNavItem: {
    type: Boolean,
    default: false
  },
  navPosition: {
    type: Number,
    min: 0,
    max: 20,
    default: 0
  },
  navIcon: {
    type: String,
    default: 'Package'
  },
  image: {
    type: new mongoose.Schema({
      url: { 
        type: String, 
        trim: true, 
        default: '' 
      },
      publicId: { 
        type: String, 
        trim: true, 
        default: '' 
      }
    }, { _id: false }),
    default: () => ({ url: '', publicId: '' }),
  },
  // REMOVED: parent (no longer needed)
  // REMOVED: subcategories (as ObjectId refs)
  // NEW: Nested subcategories structure
  subcategories: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Subcategory name too long']
    },
    items: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Item name too long']
      },
      slug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  menuConfig: {
    type: new mongoose.Schema({
      displayInMegaMenu: {
        type: Boolean,
        default: false
      },
      columnPosition: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
      }
    }, { _id: false }),
    default: () => ({
      displayInMegaMenu: false,
      columnPosition: 1
    })
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  seoKeywords: [{
    type: String,
    trim: true,
    maxlength: [50, 'SEO keyword too long']
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Slug generation middleware (unchanged)
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ 
      slug: slug, 
      _id: { $ne: this._id } 
    })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Simplified deletion hook (no parent/subcategory cleanup needed)
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  next(); // No-op since we're not managing references anymore
});

// Virtual fields (updated where needed)
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
  match: { isActive: true }
});

categorySchema.virtual('totalProductCount').get(function() {
  return this.productCount || 0;
});

categorySchema.virtual('megaMenuData').get(function() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    imageUrl: this.image?.url || '',
    productCount: this.productCount || 0,
    // Now pulls items from nested subcategories
    featuredItems: this.subcategories?.flatMap(sub => sub.items) || [],
    displayInMegaMenu: this.menuConfig?.displayInMegaMenu || false,
    columnPosition: this.menuConfig?.columnPosition || 1
  };
});

// Simplified breadcrumbs (no parent hierarchy)
categorySchema.virtual('breadcrumbs').get(function() {
  return [{
    name: this.name,
    slug: this.slug,
    _id: this._id
  }];
});

// Updated static methods
categorySchema.statics.getCategoryTree = async function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 });
};

categorySchema.statics.getMegaMenuCategories = async function() {
  return this.find({
    isActive: true,
    'menuConfig.displayInMegaMenu': true
  }).sort({ 'menuConfig.columnPosition': 1, sortOrder: 1, name: 1 });
};

// Indexes (updated)
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ 'menuConfig.displayInMegaMenu': 1 });
categorySchema.index({ 'menuConfig.columnPosition': 1 });

export default mongoose.model('Category', categorySchema);