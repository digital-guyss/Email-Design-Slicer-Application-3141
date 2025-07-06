import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiImage, FiAlertCircle } = FiIcons;

const FileUpload = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, or GIF)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    return null;
  };

  const handleFileSelect = useCallback((file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onFileUpload(file);
  }, [onFileUpload]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Upload Your Image
        </h2>
        <p className="text-secondary-600">
          Drag and drop your image file or click to browse
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-primary-500 bg-primary-50 scale-105' 
            : 'border-secondary-300 bg-white hover:border-primary-400 hover:bg-primary-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.gif"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <motion.div
            animate={{ 
              scale: isDragOver ? 1.1 : 1,
              rotate: isDragOver ? 10 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <SafeIcon 
              icon={FiUpload} 
              className="text-5xl text-primary-500 mx-auto" 
            />
          </motion.div>
          
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              {isDragOver ? 'Drop your image here' : 'Choose an image file'}
            </h3>
            <p className="text-secondary-600 mb-4">
              Supports JPG, PNG, and GIF files (up to 50MB)
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <SafeIcon icon={FiImage} className="text-lg" />
              <span>Browse Files</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
        >
          <SafeIcon icon={FiAlertCircle} className="text-red-500" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;