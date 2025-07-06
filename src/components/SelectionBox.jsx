import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiX, FiMove } = FiIcons;

const SelectionBox = ({ slice, onUpdate, onDelete, snapToGrid, imageDimensions }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  const handleMouseDown = useCallback((e, action, handle = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.closest('.absolute').getBoundingClientRect();
    const parent = e.currentTarget.closest('.absolute').parentElement.getBoundingClientRect();
    
    setDragStart({
      x: e.clientX - parent.left,
      y: e.clientY - parent.top,
      sliceX: slice.x,
      sliceY: slice.y,
      sliceWidth: slice.width,
      sliceHeight: slice.height
    });
    
    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle);
    }
  }, [slice]);

  const handleMouseMove = useCallback((e) => {
    if (!dragStart) return;
    
    const parent = e.currentTarget.closest('.absolute').parentElement.getBoundingClientRect();
    const currentX = e.clientX - parent.left;
    const currentY = e.clientY - parent.top;
    
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
      }
      
      // Ensure minimum size and bounds
      if (newWidth < 20) newWidth = 20;
      if (newHeight < 20) newHeight = 20;
      if (newX + newWidth > imageDimensions.width) newWidth = imageDimensions.width - newX;
      if (newY + newHeight > imageDimensions.height) newHeight = imageDimensions.height - newY;
      
      onUpdate(slice.id, { x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragStart, slice, snapToGrid, imageDimensions, onUpdate, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setDragStart(null);
    setResizeHandle(null);
  }, []);

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute border-2 border-primary-500 bg-primary-100 bg-opacity-20 group"
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
        onClick={() => onDelete(slice.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <SafeIcon icon={FiX} className="text-xs" />
      </button>
      
      {/* Resize Handles */}
      {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map(handle => (
        <div
          key={handle}
          className={`
            absolute w-2 h-2 bg-primary-600 border border-white opacity-0 group-hover:opacity-100 transition-opacity
            ${handle.includes('n') ? '-top-1' : handle.includes('s') ? '-bottom-1' : 'top-1/2 -translate-y-1/2'}
            ${handle.includes('w') ? '-left-1' : handle.includes('e') ? '-right-1' : 'left-1/2 -translate-x-1/2'}
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