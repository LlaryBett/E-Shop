import { uploadToCloudinary } from '../utils/cloudinary.js';
import User from '../models/User.js'; // <-- import your User model

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private/Admin
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    const folder = req.body.folder || 'general';
    const result = await uploadToCloudinary(req.file.buffer, folder);

    // If this is a profile image upload, update the user's avatar in DB
    if (folder === 'profile' && req.user) {
      await User.findByIdAndUpdate(
        req.user._id,
        { avatar: result.secure_url },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      image: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private/Admin
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image',
      });
    }

    const folder = req.body.folder || 'general';
    
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, folder)
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map(result => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    res.status(200).json({
      success: true,
      images,
    });
  } catch (error) {
    next(error);
  }
};