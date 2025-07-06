import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import JSZip from 'jszip';

const { 
  FiDownload, 
  FiPackage, 
  FiImage, 
  FiCheck, 
  FiFilm, 
  FiFileImage,
  FiInfo
} = FiIcons;

const SliceResults = ({ slices, fileName }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedItems, setDownloadedItems] = useState(new Set());
  const [animatedPreviews, setAnimatedPreviews] = useState({});
  const animationRefs = useRef({});

  // Setup animated GIF previews
  useEffect(() => {
    // Clear existing animated previews
    Object.values(animationRefs.current).forEach(clearInterval);
    animationRefs.current = {};
    
    // For each animated slice, set up animation preview
    slices.forEach(slice => {
      if (slice.isAnimated && slice.frames && slice.frames.length > 1) {
        let currentFrameIndex = 0;
        
        // Set up animation interval
        const intervalId = setInterval(() => {
          const frameCanvas = slice.frames[currentFrameIndex]?.canvas;
          const previewImg = document.getElementById(`preview-${slice.id}`);
          
          if (previewImg && frameCanvas) {
            previewImg.src = frameCanvas.toDataURL('image/png');
          }
          
          // Move to next frame with proper timing
          const currentFrame = slice.frames[currentFrameIndex];
          const delay = currentFrame ? currentFrame.delay : 10;
          
          setTimeout(() => {
            currentFrameIndex = (currentFrameIndex + 1) % slice.frames.length;
          }, delay * 10); // Convert to milliseconds
        }, 100);
        
        animationRefs.current[slice.id] = intervalId;
      }
    });
    
    // Clean up intervals on unmount or when slices change
    return () => {
      Object.values(animationRefs.current).forEach(clearInterval);
    };
  }, [slices]);

  const downloadSingleSlice = async (slice) => {
    try {
      const link = document.createElement('a');
      
      if (slice.blob && slice.isAnimated) {
        // For animated GIFs, use the blob directly
        const url = URL.createObjectURL(slice.blob);
        link.href = url;
        link.download = `${slice.name}.${slice.format || getFileExtension(fileName)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      } else {
        // For static images, use the data URL
        link.href = slice.downloadUrl || slice.dataUrl;
        link.download = `${slice.name}.${slice.format || getFileExtension(fileName)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setDownloadedItems(prev => new Set([...prev, slice.id]));
      setTimeout(() => {
        setDownloadedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(slice.id);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Error downloading slice:', error);
    }
  };

  const downloadAllSlices = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      for (const slice of slices) {
        const extension = slice.format || getFileExtension(fileName);
        
        if (slice.blob && slice.isAnimated) {
          // For animated GIFs, use the blob directly
          zip.file(`${slice.name}.${extension}`, slice.blob);
        } else {
          // For static images, fetch the data URL
          const url = slice.downloadUrl || slice.dataUrl;
          const response = await fetch(url);
          const blob = await response.blob();
          zip.file(`${slice.name}.${extension}`, blob);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${getFileNameWithoutExtension(fileName)}-slices.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const getFileNameWithoutExtension = (filename) => {
    return filename.split('.').slice(0, -1).join('.');
  };

  const formatFileSize = (slice) => {
    // If we have a blob object, use its size
    if (slice.blob) {
      const bytes = slice.blob.size;
      if (bytes < 1024) return `${bytes.toFixed(0)} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    
    // If not, estimate from data URL
    const dataUrl = slice.dataUrl;
    if (!dataUrl) return '0 B';
    
    const base64 = dataUrl.split(',')[1];
    if (!base64) return '0 B';
    
    const bytes = (base64.length * 3) / 4;
    if (bytes < 1024) return `${bytes.toFixed(0)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-6 border-b border-secondary-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-secondary-900">
              Generated Slices
            </h3>
            <p className="text-secondary-600 mt-1">
              {slices.length} slice{slices.length !== 1 ? 's' : ''} ready for download
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadAllSlices}
            disabled={isDownloading}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
              ${isDownloading 
                ? 'bg-secondary-200 text-secondary-500 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
              }
            `}
          >
            <SafeIcon 
              icon={isDownloading ? FiPackage : FiDownload} 
              className={`text-lg ${isDownloading ? 'animate-bounce' : ''}`} 
            />
            <span>
              {isDownloading ? 'Creating ZIP...' : 'Download All as ZIP'}
            </span>
          </motion.button>
        </div>
      </div>

      <div className="p-6">
        {/* GIF Animation Notice */}
        {slices.some(slice => slice.isAnimated) && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start space-x-3">
            <SafeIcon icon={FiInfo} className="text-lg text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-800 mb-1">GIF Animation Preserved</h4>
              <p className="text-sm text-purple-700">
                Animated GIF slices have been processed with gif.js library to maintain full animation with original timing and quality.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {slices.map((slice, index) => (
            <motion.div
              key={slice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-secondary-50 rounded-lg overflow-hidden border border-secondary-200 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-white p-2 relative">
                <img
                  id={`preview-${slice.id}`}
                  src={slice.dataUrl}
                  alt={slice.name}
                  className="w-full h-full object-contain rounded"
                />
                
                {/* Format badge */}
                <div className="absolute top-3 right-3 bg-secondary-800 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                  <SafeIcon icon={slice.isAnimated ? FiFilm : FiFileImage} className="text-xs" />
                  <span>{slice.format.toUpperCase()}</span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon 
                    icon={slice.isAnimated ? FiFilm : FiImage} 
                    className={slice.isAnimated ? "text-purple-600" : "text-primary-600"} 
                  />
                  <h4 className="font-medium text-secondary-900">
                    {slice.name}
                  </h4>
                </div>
                
                <div className="text-sm text-secondary-600 mb-3 space-y-1">
                  <div>{Math.round(slice.width)}×{Math.round(slice.height)}px</div>
                  <div>{formatFileSize(slice)}</div>
                  {slice.isAnimated && (
                    <div className="text-purple-600 flex items-center space-x-1">
                      <SafeIcon icon={FiFilm} className="text-xs" />
                      <span>Animated ({slice.frames?.length || 0} frames)</span>
                    </div>
                  )}
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => downloadSingleSlice(slice)}
                  className={`
                    w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
                    ${downloadedItems.has(slice.id)
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200 border border-primary-200'
                    }
                  `}
                >
                  <SafeIcon 
                    icon={downloadedItems.has(slice.id) ? FiCheck : FiDownload} 
                    className="text-sm" 
                  />
                  <span>
                    {downloadedItems.has(slice.id) ? 'Downloaded!' : 'Download'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SliceResults;