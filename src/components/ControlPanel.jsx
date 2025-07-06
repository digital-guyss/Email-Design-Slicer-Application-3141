import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUpload, FiTrash2, FiScissors, FiGrid, FiGridOff, FiLoader } = FiIcons;

const ControlPanel = ({
  snapMode,
  setSnapMode,
  onReupload,
  onClearSlices,
  onSliceIt,
  isProcessing,
  slicesCount
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-4 z-10 bg-white rounded-xl shadow-lg border border-secondary-200 p-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSnapMode(!snapMode)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
              ${snapMode 
                ? 'bg-primary-600 text-white shadow-lg' 
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }
            `}
          >
            <SafeIcon icon={snapMode ? FiGrid : FiGridOff} className="text-lg" />
            <span>Snap Mode</span>
          </button>
          
          <div className="text-sm text-secondary-600">
            {slicesCount} slice{slicesCount !== 1 ? 's' : ''} selected
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReupload}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg font-medium hover:bg-secondary-200 transition-colors"
          >
            <SafeIcon icon={FiUpload} className="text-lg" />
            <span>Reupload Image</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClearSlices}
            disabled={slicesCount === 0}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${slicesCount === 0 
                ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
              }
            `}
          >
            <SafeIcon icon={FiTrash2} className="text-lg" />
            <span>Clear All Slices</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: slicesCount > 0 ? 1.05 : 1 }}
            whileTap={{ scale: slicesCount > 0 ? 0.95 : 1 }}
            onClick={onSliceIt}
            disabled={slicesCount === 0 || isProcessing}
            className={`
              flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all
              ${slicesCount === 0 || isProcessing
                ? 'bg-secondary-200 text-secondary-500 cursor-not-allowed' 
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
              }
            `}
          >
            <SafeIcon 
              icon={isProcessing ? FiLoader : FiScissors} 
              className={`text-lg ${isProcessing ? 'animate-spin' : ''}`} 
            />
            <span>
              {isProcessing ? 'Processing...' : 'Slice It!'}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ControlPanel;