import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Plus, AlertCircle, Save, Image, Video } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const LeafletManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBanners();
      // Ensure we have an array of banners
      setBanners(Array.isArray(response.data) ? response.data : 
                (response.data?.banners || []));
    } catch (error) {
      console.error('Error loading banners:', error);
      toast.error('Failed to load banners');
      setBanners([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file selection
    if (files.length === 0) return;
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      if (!isValidType) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`File too large (max 10MB): ${file.name}`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('banners', file);
      });

      const response = await adminService.uploadBanners(formData);
      // Ensure we're working with arrays
      const newBanners = Array.isArray(response.data) ? response.data : 
                        (response.data?.banners || []);
      
      setBanners(prev => [...(Array.isArray(prev) ? prev : []), ...newBanners]);
      toast.success(`Uploaded ${validFiles.length} banner(s) successfully`);
      
      // Reset the file input
      e.target.value = '';
    } catch (error) {
      console.error('Error uploading banners:', error);
      toast.error('Failed to upload banners');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }
    
    try {
      setDeletingId(bannerId);
      await adminService.deleteBanner(bannerId);
      setBanners(banners.filter(banner => banner._id !== bannerId));
      toast.success('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper function to determine file type
  const getFileType = (url) => {
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
      return 'video';
    }
    return 'image';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banner Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage homepage banners and promotional materials
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Supported formats: Images (JPG, PNG, etc.) and Videos (MP4, WebM)
          </p>
        </div>
        
        <label className="cursor-pointer flex-shrink-0">
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <div className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          } text-white`}>
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add Banner</span>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Banner Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {banners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => {
                const fileType = getFileType(banner.url);
                return (
                  <div key={banner._id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <div className="w-full aspect-[16/9] flex items-center justify-center overflow-hidden">
                      {fileType === 'video' ? (
                        <video
                          src={banner.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={banner.url}
                          alt="Banner"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/500x281?text=Image+Not+Found';
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="absolute top-2 right-2">
                      <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs flex items-center">
                        {fileType === 'video' ? (
                          <Video className="h-3 w-3 mr-1" />
                        ) : (
                          <Image className="h-3 w-3 mr-1" />
                        )}
                        {fileType}
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleDelete(banner._id)}
                        disabled={deletingId === banner._id}
                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
                      >
                        {deletingId === banner._id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <Upload className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium mb-2">No banners uploaded yet</p>
              <p className="text-sm">Click "Add Banner" to upload your first banner</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeafletManagement;