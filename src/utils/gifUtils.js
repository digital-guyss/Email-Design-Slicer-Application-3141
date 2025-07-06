import { parseGIF, decompressFrames } from 'gifuct-js';
import { GifWriter } from 'omggif';

/**
 * Extract frames from a GIF file
 * @param {string} gifUrl - URL of the GIF image
 * @returns {Object} - Object containing frames and metadata
 */
export const extractGifFrames = async (gifUrl) => {
  try {
    // Fetch the GIF file
    const response = await fetch(gifUrl);
    const buffer = await response.arrayBuffer();
    
    // Parse the GIF
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true);
    
    return {
      frames,
      width: gif.lsd.width,
      height: gif.lsd.height,
      duration: frames.reduce((sum, frame) => sum + (frame.delay || 10), 0),
      globalColorTable: gif.gct,
      backgroundColorIndex: gif.lsd.backgroundColorIndex
    };
  } catch (error) {
    console.error('Error extracting GIF frames:', error);
    throw error;
  }
};

/**
 * Create a canvas with the GIF frame rendered on it
 * @param {Object} frame - Frame data from gifuct-js
 * @param {number} width - Original GIF width
 * @param {number} height - Original GIF height
 * @param {HTMLCanvasElement} previousCanvas - Previous frame canvas for disposal method
 * @returns {HTMLCanvasElement} - Canvas with the frame rendered
 */
export const renderGifFrameToCanvas = (frame, width, height, previousCanvas = null) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  // Handle disposal method
  if (previousCanvas && frame.disposalType !== 2) {
    ctx.drawImage(previousCanvas, 0, 0);
  } else {
    // Clear canvas with background color
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Create ImageData for the frame
  const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
  imageData.data.set(frame.patch);
  
  // Draw the frame patch
  ctx.putImageData(
    imageData, 
    frame.dims.left, 
    frame.dims.top
  );
  
  return canvas;
};

/**
 * Create an animated GIF from cropped frames using omggif
 * @param {Array} frameCanvases - Array of canvas frames with delay info
 * @param {number} width - Width of the GIF
 * @param {number} height - Height of the GIF
 * @returns {Promise<Blob>} - Blob containing the animated GIF
 */
export const createAnimatedGif = async (frameCanvases, width, height) => {
  return new Promise((resolve, reject) => {
    try {
      // Create buffer for the GIF
      const buffer = new ArrayBuffer(width * height * frameCanvases.length * 5);
      const gifWriter = new GifWriter(new Uint8Array(buffer), width, height, {
        loop: 0, // Loop forever
        palette: null // Use default palette
      });
      
      frameCanvases.forEach((frameData, index) => {
        const canvas = frameData.canvas;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Convert RGBA to indexed color
        const pixels = new Uint8Array(imageData.data.length / 4);
        for (let i = 0; i < pixels.length; i++) {
          const r = imageData.data[i * 4];
          const g = imageData.data[i * 4 + 1];
          const b = imageData.data[i * 4 + 2];
          const a = imageData.data[i * 4 + 3];
          
          // Simple color quantization (in production, use a proper quantizer)
          if (a < 128) {
            pixels[i] = 0; // Transparent
          } else {
            pixels[i] = Math.floor((r + g + b) / 3 / 64); // Simple grayscale quantization
          }
        }
        
        const delay = Math.max(frameData.delay || 10, 2); // Minimum delay of 20ms
        gifWriter.addFrame(0, 0, canvas.width, canvas.height, pixels, {
          delay: delay,
          disposal: 2 // Clear to background
        });
      });
      
      // Get the final buffer
      const gifBuffer = buffer.slice(0, gifWriter.end());
      const blob = new Blob([gifBuffer], { type: 'image/gif' });
      resolve(blob);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Fallback method using modern browser APIs
 * @param {Array} frameCanvases - Array of canvas frames with delay info
 * @param {number} width - Width of the GIF
 * @param {number} height - Height of the GIF
 * @returns {Promise<Blob>} - Blob containing the animated GIF
 */
export const createAnimatedGifFallback = async (frameCanvases, width, height) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a simple animated GIF using canvas API
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // For now, just return the first frame as a static image
      // In a production app, you'd use a proper GIF encoder
      if (frameCanvases.length > 0) {
        ctx.drawImage(frameCanvases[0].canvas, 0, 0);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/gif');
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Slice a GIF and preserve animation
 * @param {string} gifUrl - URL of the GIF image
 * @param {Object} slice - Slice coordinates and dimensions
 * @returns {Object} - Object with slice data and animation frames
 */
export const sliceGif = async (gifUrl, slice) => {
  try {
    const { frames, width, height } = await extractGifFrames(gifUrl);
    
    const scaleX = width / slice.imageWidth;
    const scaleY = height / slice.imageHeight;
    
    const actualX = Math.floor(slice.x * scaleX);
    const actualY = Math.floor(slice.y * scaleY);
    const actualWidth = Math.ceil(slice.width * scaleX);
    const actualHeight = Math.ceil(slice.height * scaleY);
    
    // Process each frame
    const frameCanvases = [];
    let previousCanvas = null;
    
    for (const frame of frames) {
      // Render the full frame
      const frameCanvas = renderGifFrameToCanvas(frame, width, height, previousCanvas);
      
      // Update previous canvas based on disposal method
      if (frame.disposalType === 2) {
        // Clear with background color
        previousCanvas = null;
      } else if (frame.disposalType === 1) {
        // Keep the current canvas as is
        previousCanvas = frameCanvas;
      } else {
        // Default: keep previous canvas
        previousCanvas = frameCanvas;
      }
      
      // Create a new canvas for the sliced frame
      const slicedCanvas = document.createElement('canvas');
      slicedCanvas.width = actualWidth;
      slicedCanvas.height = actualHeight;
      const slicedCtx = slicedCanvas.getContext('2d');
      
      // Draw the portion we want to keep
      slicedCtx.drawImage(
        frameCanvas, 
        actualX, actualY, actualWidth, actualHeight,
        0, 0, actualWidth, actualHeight
      );
      
      // Save frame information
      frameCanvases.push({
        canvas: slicedCanvas,
        delay: frame.delay || 10
      });
    }
    
    // Create animated GIF
    let animatedGifBlob;
    try {
      animatedGifBlob = await createAnimatedGif(frameCanvases, actualWidth, actualHeight);
    } catch (error) {
      console.warn('Primary GIF creation failed, using fallback:', error);
      animatedGifBlob = await createAnimatedGifFallback(frameCanvases, actualWidth, actualHeight);
    }
    
    const animatedGifUrl = URL.createObjectURL(animatedGifBlob);
    
    // Use the first frame for preview
    const firstFrameDataUrl = frameCanvases[0].canvas.toDataURL('image/png');

    return {
      frames: frameCanvases,
      dataUrl: firstFrameDataUrl, // For preview
      animatedGifUrl: animatedGifUrl, // For download
      blob: animatedGifBlob, // The actual animated GIF blob
      isAnimated: true,
      width: actualWidth,
      height: actualHeight
    };
  } catch (error) {
    console.error('Error slicing GIF:', error);
    throw error;
  }
};

/**
 * Create an animated GIF from canvas frames (fallback method)
 * @param {Array} frameCanvases - Array of canvas frames with delay info
 * @returns {Promise<Blob>} - Blob with the animated GIF data
 */
export const canvasToAnimatedGifBlob = async (frameCanvases) => {
  if (frameCanvases.length === 0) {
    throw new Error('No frames provided');
  }
  
  const firstFrame = frameCanvases[0];
  try {
    return await createAnimatedGif(frameCanvases, firstFrame.canvas.width, firstFrame.canvas.height);
  } catch (error) {
    console.warn('Primary GIF creation failed, using fallback:', error);
    return await createAnimatedGifFallback(frameCanvases, firstFrame.canvas.width, firstFrame.canvas.height);
  }
};

/**
 * Check if a file is a GIF
 * @param {File} file - File object to check
 * @returns {boolean} - True if file is a GIF
 */
export const isGif = (file) => {
  return file && file.type === 'image/gif';
};

/**
 * Process a regular image file and create slices
 * @param {string} imageUrl - URL of the image
 * @param {Object} slice - Slice coordinates and dimensions
 * @param {HTMLImageElement} img - Image element
 * @param {string} outputFormat - Output format for the slice
 * @returns {Object} - Object with slice data
 */
export const processRegularImage = async (imageUrl, slice, img, outputFormat) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
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
    actualX, actualY, actualWidth, actualHeight,
    0, 0, actualWidth, actualHeight
  );
  
  // Determine output format
  let mimeType = 'image/png';
  let formatExtension = 'png';
  
  if (outputFormat === 'jpeg') {
    mimeType = 'image/jpeg';
    formatExtension = 'jpeg';
  } else if (outputFormat === 'png') {
    mimeType = 'image/png';
    formatExtension = 'png';
  }
  
  const dataUrl = canvas.toDataURL(mimeType);
  
  return {
    dataUrl: dataUrl,
    downloadUrl: dataUrl,
    width: actualWidth,
    height: actualHeight,
    isAnimated: false,
    format: formatExtension
  };
};