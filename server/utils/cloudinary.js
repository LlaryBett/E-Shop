import { config } from 'dotenv';
config();

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary (supports both images and videos)
export const uploadToCloudinary = async (buffer, originalname, folder = 'general') => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on file extension or MIME type
    const fileExtension = originalname.split('.').pop().toLowerCase();
    const isVideo = ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(fileExtension);
    const resourceType = isVideo ? 'video' : 'image';
    
    const uploadOptions = {
      folder: `eshop/${folder}`,
      resource_type: resourceType,
    };

    // Add transformations based on resource type
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ];
    } else {
      // Video optimization options
      uploadOptions.transformation = [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ];
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Delete file from Cloudinary (supports both images and videos)
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Generate optimized image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
  });
};

// Generate optimized video URL
export const getOptimizedVideoUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 600,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  return cloudinary.url(publicId, {
    resource_type: 'video',
    width,
    height,
    crop,
    quality,
    fetch_format: format,
  });
};

// Check if a Cloudinary URL is a video
export const isCloudinaryVideo = (url) => {
  return url.includes('/video/upload/') || 
         url.includes('.mp4') || 
         url.includes('.mov') || 
         url.includes('.webm');
};

// Extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|png|gif|jpeg|mp4|mov|webm)/i);
  return matches ? matches[1] : null;
};