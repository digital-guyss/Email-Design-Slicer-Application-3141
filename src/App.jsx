import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import ImageEditor from './components/ImageEditor';
import SliceResults from './components/SliceResults';
import Header from './components/Header';
import { isGif, sliceGif, processRegularImage } from './utils/gifUtils';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [slices, setSlices] = useState([]);
  const [generatedSlices, setGeneratedSlices] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapMode, setSnapMode] = useState(true);
  const sliceResultsRef = useRef(null);

  const handleFileUpload = useCallback((file) => {
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setSlices([]);
    setGeneratedSlices([]);
  }, []);

  const handleReupload = useCallback(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setUploadedFile(null);
    setImageUrl(null);
    setSlices([]);
    setGeneratedSlices([]);
  }, [imageUrl]);

  const handleClearSlices = useCallback(() => {
    setSlices([]);
    setGeneratedSlices([]);
  }, []);

  const handleSliceIt = useCallback(async () => {
    if (!uploadedFile || slices.length === 0) return;

    setIsProcessing(true);
    
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const results = [];
      const isGifFile = isGif(uploadedFile);
      
      // Process each slice
      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        let sliceData;
        
        // Handle GIF slicing if needed
        if (isGifFile && (slice.outputFormat === 'gif' || slice.outputFormat === 'original')) {
          try {
            console.log('Processing GIF slice:', i + 1);
            
            // Use special GIF processing for animation preservation
            const gifResult = await sliceGif(imageUrl, {
              ...slice,
              x: slice.x,
              y: slice.y,
              width: slice.width,
              height: slice.height,
              imageWidth: slice.imageWidth,
              imageHeight: slice.imageHeight,
            });
            
            sliceData = {
              id: i + 1,
              name: `slice-${i + 1}`,
              dataUrl: gifResult.dataUrl, // For preview
              downloadUrl: gifResult.animatedGifUrl, // For download
              width: gifResult.width,
              height: gifResult.height,
              isAnimated: true,
              format: 'gif',
              frames: gifResult.frames,
              blob: gifResult.blob // The actual animated GIF blob
            };
            
            console.log('GIF slice processed successfully:', sliceData);
          } catch (error) {
            console.error('Error processing GIF slice, falling back to static image:', error);
            
            // Fall back to regular image processing
            const regularResult = await processRegularImage(imageUrl, slice, img, 'png');
            sliceData = {
              id: i + 1,
              name: `slice-${i + 1}`,
              ...regularResult
            };
          }
        } else {
          // Regular image processing (non-GIF or GIF converted to static)
          const outputFormat = slice.outputFormat === 'original' ? 'png' : slice.outputFormat;
          const regularResult = await processRegularImage(imageUrl, slice, img, outputFormat);
          
          sliceData = {
            id: i + 1,
            name: `slice-${i + 1}`,
            ...regularResult
          };
        }
        
        results.push(sliceData);
      }
      
      setGeneratedSlices(results);
      
      // Smooth scroll to results
      setTimeout(() => {
        sliceResultsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
      
    } catch (error) {
      console.error('Error processing slices:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, slices, imageUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!uploadedFile ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FileUpload onFileUpload={handleFileUpload} />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <ImageEditor
                imageUrl={imageUrl}
                uploadedFile={uploadedFile}
                slices={slices}
                setSlices={setSlices}
                snapMode={snapMode}
                setSnapMode={setSnapMode}
                onReupload={handleReupload}
                onClearSlices={handleClearSlices}
                onSliceIt={handleSliceIt}
                isProcessing={isProcessing}
              />
              
              {generatedSlices.length > 0 && (
                <div ref={sliceResultsRef}>
                  <SliceResults 
                    slices={generatedSlices}
                    fileName={uploadedFile.name}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;