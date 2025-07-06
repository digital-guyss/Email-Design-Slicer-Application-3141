import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import JSZip from 'jszip';

const { FiDownload, FiPackage, FiImage, FiCheck } = FiIcons;

const SliceResults = ({ slices, fileName }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedItems, setDownloadedItems] = useState(new Set());

  const downloadSingleSlice = async (slice) => {
    try {
      const link = document.createElement('a');
      link.href = slice.dataUrl;
      link.download = `${slice.name}.${getFileExtension(fileName)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
      const extension = getFileExtension(fileName);
      
      for (const slice of slices) {
        const response = await fetch(slice.dataUrl);
        const blob = await response.blob();
        zip.file(`${slice.name}.${extension}`, blob);
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

  const formatFileSize = (dataUrl) => {
    const base64 = dataUrl.split(',')[1];
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {slices.map((slice, index) => (
            <motion.div
              key={slice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-secondary-50 rounded-lg overflow-hidden border border-secondary-200 hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-white p-2">
                <img
                  src={slice.dataUrl}
                  alt={slice.name}
                  className="w-full h-full object-contain rounded"
                />
              </div>
              
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiImage} className="text-primary-600" />
                  <h4 className="font-medium text-secondary-900">
                    {slice.name}
                  </h4>
                </div>
                
                <div className="text-sm text-secondary-600 mb-3 space-y-1">
                  <div>{slice.width}×{slice.height}px</div>
                  <div>{formatFileSize(slice.dataUrl)}</div>
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