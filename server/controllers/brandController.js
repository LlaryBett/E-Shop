import Brand from '../models/Brand.js';
import Category from '../models/Category.js';

// @desc    Create a new brand
// @route   POST /api/brands
// @access  Private/Admin
export const createBrand = async (req, res) => {
  try {
    const { name, category, description, logo } = req.body;

    const existing = await Brand.findOne({ name: name.trim(), category });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Brand already exists in this category' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const brand = await Brand.create({
      name: name.trim(),
      category,
      description,
      logo,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get brand by ID
// @route   GET /api/brands/:id
// @access  Public
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).populate('category', 'name');

    if (!brand || !brand.isActive) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Update a brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
export const updateBrand = async (req, res) => {
  try {
    const { name, category, description, logo } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand || !brand.isActive) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    // Prevent duplicate brand name in same category
    const duplicate = await Brand.findOne({ name: name.trim(), category, _id: { $ne: brand._id } });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'Another brand with the same name exists in this category' });
    }

    if (name) brand.name = name.trim();
    if (category) brand.category = category;
    if (description) brand.description = description;
    if (logo) brand.logo = logo;

    const updated = await brand.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Soft delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand || !brand.isActive) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    brand.isActive = false;
    await brand.save();

    res.status(200).json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
