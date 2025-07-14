import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Associated category is required'],
  },
  description: {
    type: String,
    maxlength: [1000, 'Description too long'],
    trim: true,
  },
  logo: {
    type: String, // URL to the brand image/logo
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

brandSchema.index({ name: 1, category: 1 }, { unique: true }); // prevent same brand name in same category

export default mongoose.model('Brand', brandSchema);
