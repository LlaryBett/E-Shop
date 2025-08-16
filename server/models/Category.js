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
  image: {
    type: new mongoose.Schema({
      url: { type: String, trim: true, default: '' },
      publicId: { type: String, trim: true, default: '' }
    }, { _id: false }),
    default: () => ({ url: '', publicId: '' }),
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  // Menu configuration for mega menu support
  menuConfig: {
    type: new mongoose.Schema({
      featuredItems: [{
        name: { 
          type: String, 
          required: true, 
          trim: true,
          maxlength: [100, 'Featured item name too long']
        },
        slug: { 
          type: String, 
          required: true, 
          lowercase: true,
          trim: true
        }
      }],
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
      featuredItems: [],
      displayInMegaMenu: false,
      columnPosition: 1
    })
  },
  // SEO fields
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

// ✅ Generate slug from name with better slug generation
categorySchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    // Ensure slug uniqueness
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists (excluding current document)
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

// ✅ Pre-remove middleware to clean up references
categorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove this category from parent's subcategories array
    if (this.parent) {
      await this.constructor.findByIdAndUpdate(
        this.parent,
        { $pull: { subcategories: this._id } }
      );
    }
    
    // Update all subcategories to remove parent reference
    await this.constructor.updateMany(
      { parent: this._id },
      { $unset: { parent: 1 } }
    );
    
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Virtual to count number of products in a category
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
  match: { isActive: true } // Only count active products
});

// ✅ Virtual for total product count including subcategories
categorySchema.virtual('totalProductCount').get(function() {
  // This would need to be populated or calculated separately
  // as virtuals can't perform complex aggregations
  return this.productCount || 0;
});

// ✅ Virtual for mega menu data transformation
categorySchema.virtual('megaMenuData').get(function() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    imageUrl: this.image?.url || '',
    productCount: this.productCount || 0,
    featuredItems: this.menuConfig?.featuredItems || [],
    displayInMegaMenu: this.menuConfig?.displayInMegaMenu || false,
    columnPosition: this.menuConfig?.columnPosition || 1
  };
});

// ✅ Virtual for breadcrumb navigation
categorySchema.virtual('breadcrumbs').get(function() {
  // This would need to be populated with parent data
  const crumbs = [];
  let current = this;
  
  while (current && current.parent) {
    crumbs.unshift({
      name: current.parent.name,
      slug: current.parent.slug,
      _id: current.parent._id
    });
    current = current.parent;
  }
  
  crumbs.push({
    name: this.name,
    slug: this.slug,
    _id: this._id
  });
  
  return crumbs;
});

// ✅ Instance method to get full category path
categorySchema.methods.getFullPath = async function() {
  const path = [];
  let current = this;
  
  while (current) {
    path.unshift({
      name: current.name,
      slug: current.slug,
      _id: current._id
    });
    
    if (current.parent) {
      current = await this.constructor.findById(current.parent);
    } else {
      current = null;
    }
  }
  
  return path;
};

// ✅ Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  return this.find({ parent: null, isActive: true })
    .populate({
      path: 'subcategories',
      match: { isActive: true },
      populate: {
        path: 'subcategories',
        match: { isActive: true }
      }
    })
    .sort({ sortOrder: 1, name: 1 });
};

// ✅ Static method to get mega menu categories
categorySchema.statics.getMegaMenuCategories = async function() {
  return this.find({
    isActive: true,
    'menuConfig.displayInMegaMenu': true
  })
  .populate({
    path: 'subcategories',
    match: { isActive: true },
    select: 'name slug image menuConfig'
  })
  .sort({ 'menuConfig.columnPosition': 1, sortOrder: 1, name: 1 });
};

// ✅ Indexes for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ 'menuConfig.displayInMegaMenu': 1 });
categorySchema.index({ 'menuConfig.columnPosition': 1 });

// Compound indexes for common queries
categorySchema.index({ isActive: 1, parent: 1 });
categorySchema.index({ isActive: 1, 'menuConfig.displayInMegaMenu': 1 });

export default mongoose.model('Category', categorySchema);