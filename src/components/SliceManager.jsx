import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiMenu, 
  FiX, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiEyeOff,
  FiImage,
  FiSettings,
  FiMaximize,
  FiMove
} = FiIcons;

const SliceManager = ({ 
  slices, 
  setSlices, 
  imageDimensions, 
  selectedSliceId, 
  setSelectedSliceId, 
  isGifFile
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Update slice property with validation
  const updateSliceProperty = (id, property, value) => {
    setSlices(prev => prev.map(slice => {
      if (slice.id !== id) return slice;
      
      const updatedSlice = { ...slice };
      
      // Handle numeric properties with validation
      if (['x', 'y', 'width', 'height'].includes(property)) {
        const numValue = parseInt(value, 10);
        
        // Skip invalid values
        if (isNaN(numValue)) return slice;
        
        // Apply constraints based on property
        if (property === 'x') {
          updatedSlice.x = Math.max(0, Math.min(numValue, imageDimensions.width - slice.width));
        } else if (property === 'y') {
          updatedSlice.y = Math.max(0, Math.min(numValue, imageDimensions.height - slice.height));
        } else if (property === 'width') {
          updatedSlice.width = Math.max(20, Math.min(numValue, imageDimensions.width - slice.x));
        } else if (property === 'height') {
          updatedSlice.height = Math.max(20, Math.min(numValue, imageDimensions.height - slice.y));
        }
      } else {
        // For non-numeric properties like outputFormat
        updatedSlice[property] = value;
      }
      
      return updatedSlice;
    }));
  };

  const handleDeleteSlice = (id) => {
    setSlices(prev => prev.filter(slice => slice.id !== id));
    if (selectedSliceId === id) {
      setSelectedSliceId(null);
    }
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const toggleSliceVisibility = (id) => {
    setSlices(prev => prev.map(slice => 
      slice.id === id ? { ...slice, isHidden: !slice.isHidden } : slice
    ));
  };

  const handleSliceClick = (id) => {
    setSelectedSliceId(id);
    setEditingId(id);
  };

  const toggleManager = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleManager}
        className="fixed right-4 top-20 z-20 bg-primary-600 text-white p-3 rounded-full shadow-lg"
        title={isOpen ? "Close slice manager" : "Open slice manager"}
      >
        <SafeIcon icon={isOpen ? FiX : FiMenu} className="text-lg" />
      </motion.button>
      
      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-10 overflow-y-auto border-l border-secondary-200"
          >
            <div className="p-5 border-b border-secondary-200 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-secondary-900 flex items-center">
                <SafeIcon icon={FiSettings} className="mr-2 text-primary-600" />
                Slice Manager
              </h2>
              <p className="text-sm text-secondary-600 mt-1">
                {slices.length} slice{slices.length !== 1 ? 's' : ''} created
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              {slices.length === 0 ? (
                <div className="text-center py-8 text-secondary-500">
                  <SafeIcon icon={FiMaximize} className="text-4xl mx-auto mb-2 text-secondary-300" />
                  <p>No slices created yet.</p>
                  <p className="text-sm mt-1">Draw rectangles on the image to create slices.</p>
                </div>
              ) : (
                slices.map((slice, index) => (
                  <motion.div
                    key={slice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      border rounded-lg overflow-hidden
                      ${selectedSliceId === slice.id 
                        ? 'border-primary-500 shadow-md' 
                        : 'border-secondary-200 hover:border-primary-300'
                      }
                      ${slice.isHidden ? 'opacity-60' : ''}
                    `}
                  >
                    <div 
                      className={`
                        p-3 flex justify-between items-center cursor-pointer
                        ${selectedSliceId === slice.id ? 'bg-primary-50' : 'bg-secondary-50'}
                      `}
                      onClick={() => handleSliceClick(slice.id)}
                    >
                      <div className="flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full mr-2">
                          {index + 1}
                        </div>
                        <span className="font-medium">Slice {index + 1}</span>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSliceVisibility(slice.id);
                          }}
                          className="p-1.5 text-secondary-600 hover:text-secondary-900 rounded hover:bg-secondary-100"
                          title={slice.isHidden ? 'Show slice' : 'Hide slice'}
                        >
                          <SafeIcon icon={slice.isHidden ? FiEyeOff : FiEye} className="text-sm" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlice(slice.id);
                          }}
                          className="p-1.5 text-red-600 hover:text-red-700 rounded hover:bg-red-50"
                          title="Delete slice"
                        >
                          <SafeIcon icon={FiTrash2} className="text-sm" />
                        </button>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {editingId === slice.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 space-y-3 bg-white border-t border-secondary-100">
                            {/* Position and Size Fields */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-secondary-700 mb-1">X Position</label>
                                <input
                                  type="number"
                                  value={slice.x}
                                  onChange={(e) => updateSliceProperty(slice.id, 'x', e.target.value)}
                                  className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-secondary-700 mb-1">Y Position</label>
                                <input
                                  type="number"
                                  value={slice.y}
                                  onChange={(e) => updateSliceProperty(slice.id, 'y', e.target.value)}
                                  className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-secondary-700 mb-1">Width</label>
                                <input
                                  type="number"
                                  value={slice.width}
                                  onChange={(e) => updateSliceProperty(slice.id, 'width', e.target.value)}
                                  className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-secondary-700 mb-1">Height</label>
                                <input
                                  type="number"
                                  value={slice.height}
                                  onChange={(e) => updateSliceProperty(slice.id, 'height', e.target.value)}
                                  className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                              </div>
                            </div>
                            
                            {/* Output Format Selection */}
                            <div>
                              <label className="block text-xs font-medium text-secondary-700 mb-1">Output Format</label>
                              <select
                                value={slice.outputFormat || 'original'}
                                onChange={(e) => updateSliceProperty(slice.id, 'outputFormat', e.target.value)}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="original">Original Format</option>
                                <option value="png">PNG</option>
                                <option value="jpeg">JPEG</option>
                                {isGifFile && (
                                  <option value="gif">GIF (preserve animation)</option>
                                )}
                              </select>
                              {isGifFile && slice.outputFormat === 'gif' && (
                                <div className="mt-1 text-xs text-primary-600">
                                  Animation will be preserved with original timing
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
              
              {slices.length > 0 && (
                <div className="text-xs text-secondary-500 mt-4 p-3 bg-secondary-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <SafeIcon icon={FiMove} className="mr-1 text-secondary-500" />
                    <span className="font-medium">Tip: Edit slices visually</span>
                  </div>
                  <p>You can also drag slices to move them and use the handles to resize them directly on the image.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SliceManager;