const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const { auth, admin } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'e-shop',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto' },
      { format: 'auto' }
    ]
  }
});

// Configure multer with file size limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   POST /api/upload/single
// @desc    Upload a single image
// @access  Private (Admin only for product images)
router.post('/single', auth, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error uploading image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images
// @access  Private (Admin only for product images)
router.post('/multiple', auth, admin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const uploadedImages = req.files.map(file => ({
      imageUrl: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: {
        images: uploadedImages,
        count: req.files.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error uploading images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/profile
// @desc    Upload profile image
// @access  Private
router.post('/profile', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No profile image file provided'
      });
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error uploading profile image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete an image from Cloudinary
// @access  Private (Admin only)
router.delete('/:publicId', auth, admin, async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Delete image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully',
        data: {
          publicId,
          result: result.result
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/upload/transform
// @desc    Transform/resize an existing image
// @access  Private (Admin only)
router.post('/transform', auth, admin, async (req, res) => {
  try {
    const { publicId, width, height, crop = 'fill', quality = 'auto' } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Generate transformed image URL
    const transformedUrl = cloudinary.url(publicId, {
      width: width || 800,
      height: height || 600,
      crop,
      quality,
      format: 'auto'
    });

    res.json({
      success: true,
      message: 'Image transformation URL generated',
      data: {
        originalPublicId: publicId,
        transformedUrl,
        transformations: {
          width: width || 800,
          height: height || 600,
          crop,
          quality
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error transforming image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/upload/gallery
// @desc    Get uploaded images gallery (Admin only)
// @access  Private (Admin only)
router.get('/gallery', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, folder = 'e-shop' } = req.query;

    // Get images from Cloudinary
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by([['created_at', 'desc']])
      .max_results(parseInt(limit))
      .next_cursor(page > 1 ? req.query.cursor : undefined)
      .execute();

    const images = result.resources.map(resource => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      size: resource.bytes,
      createdAt: resource.created_at,
      folder: resource.folder
    }));

    res.json({
      success: true,
      data: {
        images,
        pagination: {
          currentPage: parseInt(page),
          hasMore: !!result.next_cursor,
          nextCursor: result.next_cursor,
          totalCount: result.total_count
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching gallery',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files.'
      });
    }
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (JPG, JPEG, PNG, WebP) are allowed.'
    });
  }

  next(err);
});

module.exports = router;
