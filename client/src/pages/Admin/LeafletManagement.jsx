import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Plus, Image, Video, X, Settings } from 'lucide-react';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const LeafletManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // New states for batch upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileConfigs, setFileConfigs] = useState([]); // Store position and isActive for each file

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await adminService.getBanners();
      setBanners(
        Array.isArray(response.data)
          ? response.data
          : response.data?.banners || []
      );
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

    const validFiles = files.filter((file) => {
      const isValidType =
        file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
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

    // Add new files to existing selection
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Generate configs for new files
    const newConfigs = validFiles.map((_, index) => ({
      position: banners.length + selectedFiles.length + index,
      isActive: true
    }));

    setFileConfigs(prev => [...prev, ...newConfigs]);
    e.target.value = ''; // Reset file input
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newConfigs = fileConfigs.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFileConfigs(newConfigs);
  };

  const updateFileConfig = (index, field, value) => {
    const newConfigs = [...fileConfigs];
    newConfigs[index] = {
      ...newConfigs[index],
      [field]: field === 'position' ? parseInt(value) || 0 : value
    };
    setFileConfigs(newConfigs);
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      // Add all files
      selectedFiles.forEach((file) => {
        formData.append('banners', file);
      });

      // Extract positions and isActive values
      const positions = fileConfigs.map(config => config.position);
      const isActiveValues = fileConfigs.map(config => config.isActive);

      // Add metadata
      formData.append('positions', JSON.stringify(positions));
      formData.append('isActive', JSON.stringify(isActiveValues));

      // Debug logging
      console.log('🚀 Frontend Debug - Batch Upload:');
      console.log('📁 Files:', selectedFiles.map(f => f.name));
      console.log('📊 Positions:', positions);
      console.log('✅ IsActive:', isActiveValues);
      console.log('📦 FormData entries:');
      
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, value.name, `(${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      const response = await adminService.uploadBanners(formData);
      console.log('✅ Backend Response:', response);
      
      const newBanners = Array.isArray(response.data)
        ? response.data
        : response.data?.banners || [];

      setBanners((prev) => [...(Array.isArray(prev) ? prev : []), ...newBanners]);
      toast.success(`Uploaded ${selectedFiles.length} banner(s) successfully`);

      // Reset selection
      setSelectedFiles([]);
      setFileConfigs([]);
    } catch (error) {
      console.error('❌ Error uploading banners:', error);
      toast.error('Failed to upload banners');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      setDeletingId(bannerId);
      await adminService.deleteBanner(bannerId);
      setBanners(banners.filter((banner) => banner._id !== bannerId));
      toast.success('Banner deleted successfully');
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    } finally {
      setDeletingId(null);
    }
  };

  const getFileType = (url) => {
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
      return 'video';
    }
    return 'image';
  };

  const getFileTypeFromFile = (file) => {
    return file.type.startsWith('video/') ? 'video' : 'image';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Banner Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage homepage banners and promotional materials
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Supported formats: Images (JPG, PNG, etc.) and Videos (MP4, WebM)
          </p>
        </div>
      </div>

      {/* File Selection Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Upload New Banners
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Current banners: <strong>{banners.length}</strong>
            </div>
          </div>

          {/* File Selection Button */}
          <label className="cursor-pointer block">
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <div className="w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Banner Files
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Click here or drag and drop multiple files
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Max 10MB per file • Images & Videos supported
              </p>
            </div>
          </label>

          {/* Selected Files Configuration */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900 dark:text-white flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Selected Files ({selectedFiles.length})
                </h4>
                <button
                  onClick={() => {
                    setSelectedFiles([]);
                    setFileConfigs([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-start gap-4">
                      {/* File Preview */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          {getFileTypeFromFile(file) === 'video' ? (
                            <Video className="h-6 w-6 text-gray-500" />
                          ) : (
                            <Image className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* File Info & Controls */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>{getFileTypeFromFile(file)}</span>
                              <span>{file.type}</span>
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFile(index)}
                            className="ml-4 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Configuration Controls */}
                        <div className="flex items-center space-x-4 mt-3">
                          {/* Position Input */}
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              Position:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={fileConfigs[index]?.position || 0}
                              onChange={(e) => updateFileConfig(index, 'position', e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>

                          {/* Active Toggle */}
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              Active:
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fileConfigs[index]?.isActive || false}
                                onChange={(e) => updateFileConfig(index, 'isActive', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={handleBatchUpload}
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
                      <span>Uploading {selectedFiles.length} file(s)...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Upload {selectedFiles.length} Banner(s)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing Banners Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {banners.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Current Banners ({banners.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner, index) => {
                  const fileType = getFileType(banner.url);
                  return (
                    <div
                      key={banner._id}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                    >
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
                              e.target.src =
                                'https://via.placeholder.com/500x281?text=Image+Not+Found';
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
                          Pos: {banner.position !== undefined ? banner.position : index}
                        </div>
                      </div>

                      {/* Active Status Badge */}
                      {banner.isActive !== undefined && (
                        <div className="absolute bottom-2 left-2">
                          <div className={`px-2 py-1 rounded-md text-xs ${
                            banner.isActive 
                              ? 'bg-green-600 bg-opacity-90 text-white' 
                              : 'bg-red-600 bg-opacity-90 text-white'
                          }`}>
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      )}

                      {/* Delete Button */}
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
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <Upload className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium mb-2">No banners uploaded yet</p>
              <p className="text-sm">Select files above to upload your first banners</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeafletManagement;