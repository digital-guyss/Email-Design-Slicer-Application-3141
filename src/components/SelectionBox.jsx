import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiMove } = FiIcons;

const SelectionBox = ({ 
  slice, 
  onUpdate, 
  onDelete, 
  onSelect,
  snapToGrid, 
  imageDimensions,
  isSelected
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  const handleMouseDown = useCallback((e, action, handle = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select this slice when interacting with it
    if (!isSelected) {
      onSelect(slice.id, e);
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest('.relative').getBoundingClientRect();
    
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      sliceX: slice.x,
      sliceY: slice.y,
      sliceWidth: slice.width,
      sliceHeight: slice.height,
      parentLeft: parent.left,
      parentTop: parent.top
    });
    
    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle);
    }
  }, [slice, isSelected, onSelect]);

  const handleGlobalMouseMove = useCallback((e) => {
    if (!dragStart) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    if (isDragging) {
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      
      const newX = snapToGrid(Math.max(0, Math.min(
        imageDimensions.width - slice.width,
        dragStart.sliceX + deltaX
      )));
      const newY = snapToGrid(Math.max(0, Math.min(
        imageDimensions.height - slice.height,
        dragStart.sliceY + deltaY
      )));
      
      onUpdate(slice.id, { x: newX, y: newY });
    } else if (isResizing) {
      let newX = slice.x;
      let newY = slice.y;
      let newWidth = slice.width;
      let newHeight = slice.height;
      
      const deltaX = currentX - dragStart.x;
      const deltaY = currentY - dragStart.y;
      
      switch (resizeHandle) {
        case 'nw':
          newX = snapToGrid(Math.max(0, dragStart.sliceX + deltaX));
          newY = snapToGrid(Math.max(0, dragStart.sliceY + deltaY));
          newWidth = snapToGrid(dragStart.sliceWidth - deltaX);
          newHeight = snapToGrid(dragStart.sliceHeight - deltaY);
          break;
        case 'ne':
          newY = snapToGrid(Math.max(0, dragStart.sliceY + deltaY));
          newWidth = snapToGrid(dragStart.sliceWidth + deltaX);
          newHeight = snapToGrid(dragStart.sliceHeight - deltaY);
          break;
        case 'sw':
          newX = snapToGrid(Math.max(0, dragStart.sliceX + deltaX));
          newWidth = snapToGrid(dragStart.sliceWidth - deltaX);
          newHeight = snapToGrid(dragStart.sliceHeight + deltaY);
          break;
        case 'se':
          newWidth = snapToGrid(dragStart.sliceWidth + deltaX);
          newHeight = snapToGrid(dragStart.sliceHeight + deltaY);
          break;
        case 'n':
          newY = snapToGrid(Math.max(0, dragStart.sliceY + deltaY));
          newHeight = snapToGrid(dragStart.sliceHeight - deltaY);
          break;
        case 's':
          newHeight = snapToGrid(dragStart.sliceHeight + deltaY);
          break;
        case 'w':
          newX = snapToGrid(Math.max(0, dragStart.sliceX + deltaX));
          newWidth = snapToGrid(dragStart.sliceWidth - deltaX);
          break;
        case 'e':
          newWidth = snapToGrid(dragStart.sliceWidth + deltaX);
          break;
        default:
          break;
      }
      
      // Ensure minimum size and bounds
      if (newWidth < 20) newWidth = 20;
      if (newHeight < 20) newHeight = 20;
      if (newX + newWidth > imageDimensions.width) newWidth = imageDimensions.width - newX;
      if (newY + newHeight > imageDimensions.height) newHeight = imageDimensions.height - newY;
      
      onUpdate(slice.id, { x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, slice, snapToGrid, imageDimensions, onUpdate, resizeHandle]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, handleGlobalMouseMove, handleGlobalMouseUp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={(e) => onSelect(slice.id, e)}
      className={`
        absolute border-2 group
        ${isSelected 
          ? 'border-primary-500 bg-primary-100 bg-opacity-30 z-10' 
          : 'border-primary-400 bg-primary-50 bg-opacity-20'
        }
      `}
      style={{
        left: slice.x,
        top: slice.y,
        width: slice.width,
        height: slice.height,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Drag Handle */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <div className="bg-primary-600 text-white p-1 rounded shadow-lg">
          <SafeIcon icon={FiMove} className="text-sm" />
        </div>
      </div>
      
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(slice.id);
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <SafeIcon icon={FiX} className="text-xs" />
      </button>
      
      {/* Slice Info - Only show when selected */}
      {isSelected && (
        <div className="absolute -bottom-8 left-0 right-0 bg-primary-600 text-white text-xs py-1 px-2 rounded">
          {slice.width}×{slice.height}
        </div>
      )}
      
      {/* Resize Handles */}
      {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map(handle => (
        <div
          key={handle}
          className={`
            absolute w-3 h-3 bg-white border-2 border-primary-500 
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} 
            transition-opacity
            ${handle.includes('n') ? '-top-1.5' : handle.includes('s') ? '-bottom-1.5' : 'top-1/2 -translate-y-1/2'}
            ${handle.includes('w') ? '-left-1.5' : handle.includes('e') ? '-right-1.5' : 'left-1/2 -translate-x-1/2'}
            ${handle === 'nw' || handle === 'se' ? 'cursor-nw-resize' : 
              handle === 'ne' || handle === 'sw' ? 'cursor-ne-resize' :
              handle === 'n' || handle === 's' ? 'cursor-n-resize' : 'cursor-w-resize'}
          `}
          onMouseDown={(e) => handleMouseDown(e, 'resize', handle)}
        />
      ))}
    </motion.div>
  );
};

export default SelectionBox;