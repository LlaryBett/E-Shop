import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Plus, AlertCircle, Save, Image, Video } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const LeafletManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isActiveValues, setIsActiveValues] = useState([]);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBanners();
      const bannerData = response?.data || [];
      // Sort banners by position
      setBanners(bannerData.sort((a, b) => a.position - b.position));
    } catch (error) {
      console.error('Error loading banners:', error);
      toast.error('Failed to load banners');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
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

    setSelectedFiles(validFiles);
    
    // Initialize positions and isActive arrays for each file
    const initialPositions = validFiles.map((_, index) => index);
    const initialIsActive = validFiles.map(() => true);
    
    setPositions(initialPositions);
    setIsActiveValues(initialIsActive);
  };

  const handlePositionChange = (index, value) => {
    const newPositions = [...positions];
    newPositions[index] = parseInt(value) || 0;
    setPositions(newPositions);
  };

  const handleIsActiveChange = (index, value) => {
    const newIsActiveValues = [...isActiveValues];
    newIsActiveValues[index] = value;
    setIsActiveValues(newIsActiveValues);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('banners', file);
      });
      
      // Add positions and isActive values as JSON strings
      if (positions.length > 0) {
        formData.append('positions', JSON.stringify(positions));
      }
      
      if (isActiveValues.length > 0) {
        formData.append('isActive', JSON.stringify(isActiveValues));
      }

      const response = await adminService.uploadBanners(formData);
      const newBanners = response?.data || [];
      
      setBanners(prev => {
        const existing = Array.isArray(prev) ? prev : [];
        return [...existing, ...newBanners].sort((a, b) => a.position - b.position);
      });
      toast.success(`Uploaded ${selectedFiles.length} banner(s) successfully`);
      
      // Reset form
      setSelectedFiles([]);
      setPositions([]);
      setIsActiveValues([]);
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
      </div>

      {/* Upload Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Files
            </label>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to select files or drag and drop
                </span>
              </div>
            </label>
          </div>

          {/* Selected Files Configuration */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configure Selected Files
              </h3>
              <div className="space-y-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* File Info */}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                        </p>
                      </div>
                      
                      {/* Position Input */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Position
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={positions[index] || 0}
                          onChange={(e) => handlePositionChange(index, e.target.value)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      
                      {/* Active Toggle */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Active
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActiveValues[index] || false}
                            onChange={(e) => handleIsActiveChange(index, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Upload Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    uploading || selectedFiles.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Upload {selectedFiles.length} file(s)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
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
                    
                    {/* File Type Badge */}
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
                    
                    {/* Position Badge */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-blue-600 bg-opacity-90 text-white px-2 py-1 rounded-md text-xs">
                        Pos: {banner.position}
                      </div>
                    </div>
                    
                    {/* Active Status Badge */}
                    <div className="absolute bottom-2 left-2">
                      <div className={`px-2 py-1 rounded-md text-xs ${
                        banner.isActive 
                          ? 'bg-green-600 bg-opacity-90 text-white' 
                          : 'bg-red-600 bg-opacity-90 text-white'
                      }`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    {/* Delete Button Overlay */}
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
              <p className="text-sm">Select files above to upload your first banner</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeafletManagement;