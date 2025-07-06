import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/FileUpload';
import ImageEditor from './components/ImageEditor';
import SliceResults from './components/SliceResults';
import Header from './components/Header';

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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const results = [];
      
      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        const scaleX = img.naturalWidth / slice.imageWidth;
        const scaleY = img.naturalHeight / slice.imageHeight;
        
        const actualX = slice.x * scaleX;
        const actualY = slice.y * scaleY;
        const actualWidth = slice.width * scaleX;
        const actualHeight = slice.height * scaleY;
        
        canvas.width = actualWidth;
        canvas.height = actualHeight;
        
        ctx.drawImage(
          img,
          actualX,
          actualY,
          actualWidth,
          actualHeight,
          0,
          0,
          actualWidth,
          actualHeight
        );
        
        const sliceDataUrl = canvas.toDataURL(uploadedFile.type);
        results.push({
          id: i + 1,
          name: `slice-${i + 1}`,
          dataUrl: sliceDataUrl,
          width: actualWidth,
          height: actualHeight
        });
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