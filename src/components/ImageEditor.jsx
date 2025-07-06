import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import SelectionBox from './SelectionBox';
import ControlPanel from './ControlPanel';

const { FiGrid, FiGridOff } = FiIcons;

const ImageEditor = ({
  imageUrl,
  uploadedFile,
  slices,
  setSlices,
  snapMode,
  setSnapMode,
  onReupload,
  onClearSlices,
  onSliceIt,
  isProcessing
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const autoScrollRef = useRef(null);

  const GRID_SIZE = 20;
  const SCROLL_SPEED = 5;
  const SCROLL_THRESHOLD = 50;

  const snapToGrid = useCallback((value) => {
    if (!snapMode) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }, [snapMode]);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      const { clientWidth, clientHeight } = imageRef.current;
      
      setImageDimensions({ 
        width: clientWidth, 
        height: clientHeight,
        naturalWidth,
        naturalHeight
      });
      setImageLoaded(true);
    }
  }, []);

  const startAutoScroll = useCallback((direction) => {
    if (isAutoScrolling) return;
    
    setIsAutoScrolling(true);
    
    const scroll = () => {
      if (containerRef.current) {
        const currentScrollTop = containerRef.current.scrollTop;
        const newScrollTop = currentScrollTop + (direction * SCROLL_SPEED);
        containerRef.current.scrollTop = newScrollTop;
        
        if (isAutoScrolling) {
          autoScrollRef.current = requestAnimationFrame(scroll);
        }
      }
    };
    
    autoScrollRef.current = requestAnimationFrame(scroll);
  }, [isAutoScrolling]);

  const stopAutoScroll = useCallback(() => {
    setIsAutoScrolling(false);
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
    }
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target !== imageRef.current) return;
    
    e.preventDefault();
    const rect = imageRef.current.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);
    
    setDragStart({ x, y });
    setIsSelecting(true);
    setCurrentSelection({ x, y, width: 0, height: 0 });
  }, [snapToGrid]);

  const handleMouseMove = useCallback((e) => {
    if (!isSelecting || !dragStart) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Auto-scroll logic
    const mouseY = e.clientY - containerRect.top;
    if (mouseY < SCROLL_THRESHOLD) {
      startAutoScroll(-1);
    } else if (mouseY > containerRect.height - SCROLL_THRESHOLD) {
      startAutoScroll(1);
    } else {
      stopAutoScroll();
    }
    
    const currentX = snapToGrid(e.clientX - rect.left);
    const currentY = snapToGrid(e.clientY - rect.top);
    
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);
    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    
    setCurrentSelection({ x, y, width, height });
  }, [isSelecting, dragStart, snapToGrid, startAutoScroll, stopAutoScroll]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !currentSelection) return;
    
    stopAutoScroll();
    
    if (currentSelection.width > 10 && currentSelection.height > 10) {
      const newSlice = {
        id: Date.now(),
        x: currentSelection.x,
        y: currentSelection.y,
        width: currentSelection.width,
        height: currentSelection.height,
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height
      };
      
      setSlices(prev => [...prev, newSlice]);
    }
    
    setIsSelecting(false);
    setCurrentSelection(null);
    setDragStart(null);
  }, [isSelecting, currentSelection, imageDimensions, setSlices, stopAutoScroll]);

  const updateSlice = useCallback((id, updates) => {
    setSlices(prev => prev.map(slice => 
      slice.id === id ? { ...slice, ...updates } : slice
    ));
  }, [setSlices]);

  const deleteSlice = useCallback((id) => {
    setSlices(prev => prev.filter(slice => slice.id !== id));
  }, [setSlices]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    
    if (isSelecting) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <ControlPanel
        snapMode={snapMode}
        setSnapMode={setSnapMode}
        onReupload={onReupload}
        onClearSlices={onClearSlices}
        onSliceIt={onSliceIt}
        isProcessing={isProcessing}
        slicesCount={slices.length}
      />

      {/* Image Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900">
              Image Preview & Selection
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600">
                {slices.length} slice{slices.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSnapMode(!snapMode)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${snapMode 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }
                `}
                title={snapMode ? 'Disable snap mode' : 'Enable snap mode'}
              >
                <SafeIcon 
                  icon={snapMode ? FiGrid : FiGridOff} 
                  className="text-lg" 
                />
              </button>
            </div>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="relative max-h-[70vh] overflow-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="relative inline-block">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Uploaded image"
              className="max-w-full h-auto block"
              onLoad={handleImageLoad}
              onMouseDown={handleMouseDown}
              style={{ cursor: 'crosshair' }}
            />
            
            {/* Grid Overlay */}
            {snapMode && imageLoaded && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
                  `,
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
                }}
              />
            )}
            
            {/* Selection Boxes */}
            {imageLoaded && slices.map(slice => (
              <SelectionBox
                key={slice.id}
                slice={slice}
                onUpdate={updateSlice}
                onDelete={deleteSlice}
                snapToGrid={snapToGrid}
                imageDimensions={imageDimensions}
              />
            ))}
            
            {/* Current Selection */}
            {isSelecting && currentSelection && (
              <div
                className="absolute border-2 border-primary-500 bg-primary-100 bg-opacity-30 pointer-events-none"
                style={{
                  left: currentSelection.x,
                  top: currentSelection.y,
                  width: currentSelection.width,
                  height: currentSelection.height
                }}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ImageEditor;