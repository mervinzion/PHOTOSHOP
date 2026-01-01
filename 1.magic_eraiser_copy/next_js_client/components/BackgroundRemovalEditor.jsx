import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCcw, Wand2, Zap, HandMetal
} from 'lucide-react';

// Import the dedicated mobile UI component
import BackgroundRemovalEditor_mobile from './BackgroundRemovalEditor_mobile';

// Import components and utilities from the refactored file
import {
  StyleInjector,
  useDebounce,
  DesktopHeader,
  ModeToggleBar,
  CompletedImagesPanel,
  DesktopImageSlider,
  SettingsPanel,
  QueuePanel,
  ActionButtonsPanel,
  CurrentProcessingImage,
  hexToRgb,
  drawingUtils,
  ErrorMessage,
  showSuccessToast
} from './bgr_editor_u1';

const BackgroundRemovalEditor = ({ initialImage, onReset }) => {
    // IMPORTANT: All hooks must be called unconditionally at the top level
    
    // Detect mobile environment
    const [isMobile, setIsMobile] = useState(false);
    
    // UI state
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'canvas'
    const [sliderPosition, setSliderPosition] = useState(50);
    const [error, setError] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    
    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
    const [brushSize, setBrushSize] = useState(20);
    const [isSelectionInverted, setIsSelectionInverted] = useState(false);
    
    // Settings states
    const [detectionMode, setDetectionMode] = useState("manual"); // "manual" or "auto"
    const [backgroundType, setBackgroundType] = useState('transparent');
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const debouncedBackgroundColor = useDebounce(backgroundColor, 300);
    const [backgroundPrompt, setBackgroundPrompt] = useState('');
    const [inpaintingModel, setInpaintingModel] = useState('deliberate_v2');
    
    // Image processing state
    const [pendingImages, setPendingImages] = useState([]);
    const [completedImages, setCompletedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [points, setPoints] = useState([]);
    const [mask, setMask] = useState(null);
    const [activeDisplayImage, setActiveDisplayImage] = useState(null);
    const [currentImageBeingProcessed, setCurrentImageBeingProcessed] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    
    // BUG FIX: Add flags to prevent canvas flickering during remastering
    const [isRemastering, setIsRemastering] = useState(false);
    const [isChangingRemasteredColor, setIsChangingRemasteredColor] = useState(false);
    
    // Loading states
    const [loadingStates, setLoadingStates] = useState({
        maskGeneration: false,
        backgroundRemoval: false,
        autoDetection: false
    });
    
    // Refs
    const canvasRef = useRef(null);
    const drawingCanvasRef = useRef(null);
    const originalImageRef = useRef(null);
    const processedImageRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // BUG FIX: Add stable refs for image sources
    const originalImageRefStable = useRef(null);
    const processedImageRefStable = useRef(null);
    
    // Detect mobile on mount and resize
    useEffect(() => {
      const checkDeviceType = () => {
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || (window.innerWidth <= 768);
        
        setIsMobile(mobile);
        
        // Add mobile class to body if needed
        if (mobile) {
          document.body.classList.add('mobile-view');
        } else {
          document.body.classList.remove('mobile-view');
        }
      };
      
      checkDeviceType();
      window.addEventListener('resize', checkDeviceType);
      return () => {
        window.removeEventListener('resize', checkDeviceType);
        document.body.classList.remove('mobile-view');
      };
    }, []);
    
    // BUG FIX: Store stable references to images
    useEffect(() => {
      if (!activeDisplayImage) return;
      
      // Store stable references to image URLs
      originalImageRefStable.current = activeDisplayImage.original;
      if (activeDisplayImage.processed) {
        processedImageRefStable.current = activeDisplayImage.processed;
      }
    }, [activeDisplayImage]);
    
    // BUG FIX: Initialize queue when component loads - remove background settings from dependencies
    useEffect(() => {
        if (Array.isArray(initialImage) && initialImage.length > 0) {
            const formattedQueue = initialImage.map((img, index) => ({
                id: `img-${Date.now()}-${index}`,
                original: img,
                processed: null,
                isProcessing: false,
                backgroundType: backgroundType,
                backgroundColor: backgroundColor,
                backgroundPrompt: backgroundPrompt,
                inpaintingModel: inpaintingModel,
                points: [],
                mask: null
            }));
            setPendingImages(formattedQueue);
            
            // Set the first image as the one being processed
            setCurrentImageBeingProcessed(formattedQueue[0]);
        } else if (initialImage) {
            const singleImage = {
                id: `img-${Date.now()}-0`,
                original: initialImage,
                processed: null,
                isProcessing: false,
                backgroundType: backgroundType,
                backgroundColor: backgroundColor,
                backgroundPrompt: backgroundPrompt,
                inpaintingModel: inpaintingModel,
                points: [],
                mask: null
            };
            setPendingImages([singleImage]);
            
            // Set the single image as the one being processed
            setCurrentImageBeingProcessed(singleImage);
        }
    }, [initialImage]); // BUG FIX: Only depend on initialImage

    // BUG FIX: Handle debounced background color for remastered images
    useEffect(() => {
      if (!currentImageBeingProcessed || !currentImageBeingProcessed.isRemastered) return;
      
      // Only update remastered images after debounce
      const updatedImage = { ...currentImageBeingProcessed, backgroundColor: debouncedBackgroundColor };
      
      // Update pending images
      setPendingImages(prev => prev.map(img => 
        img.id === updatedImage.id ? updatedImage : img
      ));
      
      // Update current image
      setCurrentImageBeingProcessed(updatedImage);
      
    }, [debouncedBackgroundColor]);

    // Initialize drawing canvas when image dimensions change
    useEffect(() => {
        // BUG FIX: Skip this effect during remastering color changes
        if (isChangingRemasteredColor) return;
        
        if (drawingCanvasRef.current && imageDimensions.naturalWidth && imageDimensions.naturalHeight) {
            const canvas = drawingCanvasRef.current;
            canvas.width = imageDimensions.naturalWidth;
            canvas.height = imageDimensions.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Initialize overlay canvas if it exists
        if (overlayCanvasRef.current && imageDimensions.naturalWidth && imageDimensions.naturalHeight) {
            overlayCanvasRef.current.width = imageDimensions.naturalWidth;
            overlayCanvasRef.current.height = imageDimensions.naturalHeight;
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, imageDimensions.naturalWidth, imageDimensions.naturalHeight);
        }
    }, [imageDimensions.naturalWidth, imageDimensions.naturalHeight, isChangingRemasteredColor]);
    
    // BUG FIX: More stable image loading with remastering protection
    const loadImageSafely = (imageUrl, callback) => {
      if (!imageUrl) return;
      
      const img = new window.Image();
      img.crossOrigin = "Anonymous"; // Prevent CORS issues
      
      img.onload = () => {
        if (callback && typeof callback === 'function') {
          callback(img);
        }
      };
      
      img.onerror = (err) => {
        console.error("Error loading image:", err);
        // Try alternative loading method
        if (imageUrl.startsWith('blob:')) {
          fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
              const newUrl = URL.createObjectURL(blob);
              img.src = newUrl;
            })
            .catch(fetchErr => {
              console.error("Failed to reload image:", fetchErr);
            });
        }
      };
      
      img.src = imageUrl;
      return img;
    };
    
    // Load and cache images to ensure consistent size
    useEffect(() => {
        // BUG FIX: Skip effect during remastering or color changes
        if (isRemastering || isChangingRemasteredColor) return;
        
        // Use either the active display image or the current image being processed
        const imageToDisplay = activeDisplayImage || currentImageBeingProcessed;
        
        if (imageToDisplay) {
            // Reset dimensions before reloading to avoid stale state
            setImageDimensions({ width: 0, height: 0 });
            
            // BUG FIX: Use safe image loading
            const imgElement = new window.Image();
            imgElement.onload = () => {
                // Calculate the available space for the image
                const containerRect = containerRef.current ? containerRef.current.getBoundingClientRect() : { 
                    width: isMobile ? window.innerWidth : 800, 
                    height: isMobile ? window.innerHeight - 200 : 600 
                };
                
                // Different calculations based on device type
                let availableWidth, availableHeight;
                
                if (isMobile) {
                    // Mobile-specific calculations - account for UI elements
                    availableWidth = containerRect.width * 0.95; // 95% of container width
                    availableHeight = containerRect.height * 0.85; // 85% of container height, leaving space for controls
                } else {
                    // Desktop calculations
                    availableWidth = containerRect.width * 0.95; // 95% of container width
                    availableHeight = containerRect.height * 0.95; // 95% of container height
                }
                
                // Calculate dimensions to fit within available space while maintaining aspect ratio
                const aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
                let finalWidth, finalHeight;
                
                if (imgElement.naturalWidth > availableWidth || imgElement.naturalHeight > availableHeight) {
                    // Image is larger than available space, need to scale down
                    const widthRatio = availableWidth / imgElement.naturalWidth;
                    const heightRatio = availableHeight / imgElement.naturalHeight;
                    
                    // Use the smaller ratio to ensure image fits within bounds
                    const scaleFactor = Math.min(widthRatio, heightRatio);
                    
                    finalWidth = imgElement.naturalWidth * scaleFactor;
                    finalHeight = imgElement.naturalHeight * scaleFactor;
                } else {
                    if (isMobile) {
                        // On mobile, scale up smaller images slightly for better visibility
                        const scaleFactor = Math.min(availableWidth / imgElement.naturalWidth, availableHeight / imgElement.naturalHeight) * 0.9;
                        finalWidth = imgElement.naturalWidth * scaleFactor;
                        finalHeight = imgElement.naturalHeight * scaleFactor;
                    } else {
                        // On desktop, use natural dimensions for smaller images
                        finalWidth = imgElement.naturalWidth;
                        finalHeight = imgElement.naturalHeight;
                    }
                }
                
                setImageDimensions({
                    width: finalWidth,
                    height: finalHeight,
                    naturalWidth: imgElement.naturalWidth,
                    naturalHeight: imgElement.naturalHeight
                });
            };
            
            // BUG FIX: Use stable references for remastered images
            if (imageToDisplay.isRemastered && originalImageRefStable.current) {
                imgElement.src = originalImageRefStable.current;
            } else {
                imgElement.src = imageToDisplay.original;
            }
            
            // Handle window resize to recalculate available space
            const handleResize = () => {
                if (imgElement.complete) {
                    imgElement.onload();
                }
            };
            
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [activeDisplayImage, currentImageBeingProcessed, isMobile, isRemastering, isChangingRemasteredColor]);

    // Desktop: Mouse handlers for drawing
    const startDrawing = (event) => {
        if (isProcessing || detectionMode !== "manual" || !currentImageBeingProcessed) return;
        
        setIsDrawing(true);
        const { x, y } = getCanvasCoordinates(event);
        setLastPoint({ x, y });
        
        // Draw a point at the start
        const canvas = drawingCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawingUtils.drawPoint(ctx, x, y, brushSize);
        }
    };

    const draw = (event) => {
        if (!isDrawing) return;
        
        const { x, y } = getCanvasCoordinates(event);
        
        // Draw a line from last point to current point
        const canvas = drawingCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawingUtils.drawLine(ctx, lastPoint.x, lastPoint.y, x, y, brushSize);
        }
        
        setLastPoint({ x, y });
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        
        // If we've been drawing, convert the drawing to mask
        if (isDrawing && drawingCanvasRef.current) {
            // Update our mask from the drawing
            updateMaskFromDrawing();
        }
    };

    // Canvas coordinate helpers
    const getCanvasCoordinates = (event) => {
        if (!drawingCanvasRef.current) return { x: 0, y: 0 };
        
        const canvas = drawingCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    };

    const updateMaskFromDrawing = () => {
        if (!drawingCanvasRef.current) return;
        
        // Convert the drawing to a data URL
        const drawingDataURL = drawingCanvasRef.current.toDataURL();
        
        // Set the mask with the drawing
        setMask(drawingDataURL);
        
        // Update the overlay mask with the drawing
        if (overlayCanvasRef.current) {
            const imgElement = new window.Image();
            imgElement.onload = () => {
                const ctx = overlayCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#abf134';
                
                // Draw the mask
                ctx.drawImage(imgElement, 0, 0);
                ctx.globalCompositeOperation = 'source-in';
                ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                
                // Reset composite operation
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            };
            imgElement.src = drawingDataURL;
        }
    };

    const handleInvertSelection = () => {
        if (!drawingCanvasRef.current) return;
        
        // We need to invert the current drawing
        const canvas = drawingCanvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Get the current image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Create a new, inverted canvas of same dimensions
        const invertedCanvas = document.createElement('canvas');
        invertedCanvas.width = canvas.width;
        invertedCanvas.height = canvas.height;
        const invertedCtx = invertedCanvas.getContext('2d');
        
        // First, fill the inverted canvas with our highlight color (making everything selected)
        invertedCtx.fillStyle = '#abf134';
        invertedCtx.fillRect(0, 0, invertedCanvas.width, invertedCanvas.height);
        
        // Now "cut out" the areas that were originally drawn
        invertedCtx.globalCompositeOperation = 'destination-out';
        invertedCtx.drawImage(canvas, 0, 0);
        
        // Clear the original canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the inverted selection back to the original canvas
        ctx.drawImage(invertedCanvas, 0, 0);
        
        // Update mask state
        setIsSelectionInverted(prev => !prev);
        updateMaskFromDrawing();
        
        // If we're on mobile, provide haptic feedback
        if (isMobile && navigator.vibrate) {
            /* Haptics would be imported and used here */
        }
    };

    const clearDrawing = () => {
        if (drawingCanvasRef.current) {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
        setMask(null);
        setPoints([]);
        setIsSelectionInverted(false); // Reset the inversion state
    };

    const handleAutoDetect = async () => {
        if (!currentImageBeingProcessed) return;
        
        try {
            setLoadingStates(prev => ({ ...prev, autoDetection: true, maskGeneration: true }));
            setIsProcessing(true);
            setError(null);
            setPoints([]);
    
            // BUG FIX: Ensure source integrity for remastered images
            let imageData = currentImageBeingProcessed.original;
            if (currentImageBeingProcessed.isRemastered && originalImageRefStable.current) {
                // Use stable reference if available
                imageData = originalImageRefStable.current;
            }
    
            // Use currentImage directly - it's already a data URL from initialImage
            const response = await fetch('http://localhost:8000/api/auto-detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: imageData
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to auto-detect foreground');
            }
    
            const data = await response.json();
            setMask(data.mask);
            
            // Update current image being processed
            const updatedImage = { ...currentImageBeingProcessed, mask: data.mask };
            setCurrentImageBeingProcessed(updatedImage);
            
            // Update in the pending images array
            setPendingImages(prev => prev.map(img => 
                img.id === updatedImage.id ? updatedImage : img
            ));
    
            // Draw the overlay with the mask
            if (overlayCanvasRef.current) {
                const imgElement = new window.Image();
                imgElement.onload = () => {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#abf134';
                    ctx.drawImage(imgElement, 0, 0);
                    ctx.globalCompositeOperation = 'source-in';
                    ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                };
                imgElement.src = data.mask;
            }
        } catch (err) {
            console.error('Error auto-detecting:', err);
            setError(err.message);
        } finally {
            setLoadingStates(prev => ({ ...prev, autoDetection: false, maskGeneration: false }));
            setIsProcessing(false);
        }
    };

    const handleGenerateMask = async () => {
        if (detectionMode === 'auto') {
            await handleAutoDetect();
            return;
        }
        
        // For manual mode with drawing, we'll use the mask from the drawing
        if (!currentImageBeingProcessed) return;
        
        try {
            setLoadingStates(prev => ({ ...prev, maskGeneration: true }));
            setIsProcessing(true);
            setError(null);

            if (detectionMode === "manual" && drawingCanvasRef.current) {
                // For manual mode with drawing, we'll use the current drawing as our mask
                updateMaskFromDrawing();
                setLoadingStates(prev => ({ ...prev, maskGeneration: false }));
                setIsProcessing(false);
                return;
            }

            // If there's no mask yet and we need to generate one
            if (!mask) {
                setError("Please draw on the image to mark the subject you want to keep");
                setLoadingStates(prev => ({ ...prev, maskGeneration: false }));
                setIsProcessing(false);
                return;
            }
        } catch (err) {
            console.error('Error generating mask:', err);
            setError(err.message);
            setLoadingStates(prev => ({ ...prev, maskGeneration: false }));
            setIsProcessing(false);
        }
    };

    // BUG FIX: Helper function to ensure remastered source integrity
    const ensureRemasteredSourceIntegrity = async (imageData) => {
      if (!imageData.isRemastered) return imageData;
      
      try {
        // Verify the blob URL is still valid
        const response = await fetch(imageData.original);
        if (!response.ok) {
          throw new Error("Original image URL is no longer valid");
        }
        
        // Return the verified image data
        return imageData;
      } catch (err) {
        console.error("Source integrity check failed:", err);
        
        // If we have a stable reference, use it
        if (originalImageRefStable.current) {
          return {
            ...imageData,
            original: originalImageRefStable.current
          };
        }
        
        // Otherwise return unchanged
        return imageData;
      }
    };

    const handleRemoveBackground = async () => {
        if (!currentImageBeingProcessed || !mask) return;
    
        try {
            setLoadingStates(prev => ({ ...prev, backgroundRemoval: true }));
            setIsProcessing(true);
            setError(null);
            
            // BUG FIX: Ensure source integrity for remastered images
            if (currentImageBeingProcessed.isRemastered) {
              const verifiedImageData = await ensureRemasteredSourceIntegrity(currentImageBeingProcessed);
              if (verifiedImageData !== currentImageBeingProcessed) {
                // Update with verified data
                setCurrentImageBeingProcessed(verifiedImageData);
              }
            }
    
            // Create a proper FormData object
            const formData = new FormData();
            
            // Convert the data URL to a Blob
            const response = await fetch(currentImageBeingProcessed.original);
            const blob = await response.blob();
            formData.append('file', blob, 'image.png');
    
            // Upload the image
            const uploadResponse = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });
    
            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }
    
            const { image_id } = await uploadResponse.json();
    
            // Get the current settings either from the image or the global state
            const currentBackgroundType = currentImageBeingProcessed.backgroundType || backgroundType;
            const currentBackgroundColor = currentImageBeingProcessed.backgroundColor || backgroundColor;
            const currentBackgroundPrompt = currentImageBeingProcessed.backgroundPrompt || backgroundPrompt;
            const currentInpaintingModel = currentImageBeingProcessed.inpaintingModel || inpaintingModel;
            
            // Prepare the request body based on background type
            const requestBody = {
                image_id,
                mask_data: mask,
                background_type: currentBackgroundType,
            };
    
            // Add the appropriate background details based on type
            if (currentBackgroundType === 'color') {
                // Debug: Log the color being used
                console.log('Selected color (hex):', currentBackgroundColor);
                
                const rgbColor = hexToRgb(currentBackgroundColor);
                console.log('Converted RGB color:', rgbColor);
                
                // IMPORTANT: Convert RGB to BGR for OpenCV
                // OpenCV uses BGR color order, not RGB
                requestBody.background_color = [
                    rgbColor[2],  // B
                    rgbColor[1],  // G
                    rgbColor[0]   // R
                ];
                
                console.log('Sending BGR color to backend:', requestBody.background_color);
            } else if (currentBackgroundType === 'generative') {
                requestBody.prompt = currentBackgroundPrompt || "beautiful natural background";
                requestBody.inpainting_model = currentInpaintingModel;
            }
    
            console.log('Sending request with body:', JSON.stringify(requestBody));
    
            // Then process the image with the mask
            const processResponse = await fetch('http://localhost:8000/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
    
            if (!processResponse.ok) {
                const errorData = await processResponse.json().catch(() => ({}));
                console.error('Process error details:', errorData);
                throw new Error('Failed to process image');
            }
    
            const { result_id } = await processResponse.json();
    
            // Finally, get the result
            const resultResponse = await fetch(`http://localhost:8000/result/${result_id}`);
            if (!resultResponse.ok) {
                throw new Error('Failed to get result');
            }
    
            const resultBlob = await resultResponse.blob();
            const resultUrl = URL.createObjectURL(resultBlob);
            
            // Create the completed image object
            const completedImage = {
                id: currentImageBeingProcessed.id,
                original: currentImageBeingProcessed.original,
                processed: resultUrl,
                backgroundType: currentBackgroundType,
                backgroundColor: currentBackgroundColor,
                backgroundPrompt: currentBackgroundPrompt,
                inpaintingModel: currentInpaintingModel,
                detectionMode: detectionMode,
                mask: mask,
                timestamp: Date.now(),
                // BUG FIX: Preserve isRemastered flag if present
                isRemastered: currentImageBeingProcessed.isRemastered || false
            };
            
            // Add to completed images
            setCompletedImages(prev => [...prev, completedImage]);
            
            // Remove from pending queue
            const newPendingImages = pendingImages.filter(
                img => img.id !== currentImageBeingProcessed.id
            );
            setPendingImages(newPendingImages);
            
            // Set next image to process
            if (newPendingImages.length > 0) {
                setCurrentImageBeingProcessed(newPendingImages[0]);
            } else {
                setCurrentImageBeingProcessed(null);
            }
            
            // Set as active display image
            setActiveDisplayImage(completedImage);
            
            // Reset points and mask
            setPoints([]);
            setMask(null);
            if (overlayCanvasRef.current) {
                const ctx = overlayCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
            }
            if (drawingCanvasRef.current) {
                const ctx = drawingCanvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
            }
    
        } catch (err) {
            setError(err.message);
            console.error('Error removing background:', err);
        } finally {
            setLoadingStates(prev => ({ ...prev, backgroundRemoval: false }));
            setIsProcessing(false);
        }
    };
    
    // BUG FIX: Special handler for remastered image color changes
    const handleRemasteredColorChange = (newColor) => {
      if (!currentImageBeingProcessed || !currentImageBeingProcessed.isRemastered) {
        // If not a remastered image, use the normal flow
        handleUpdateBackgroundSettings('color', newColor);
        return;
      }

      // Signal that we're changing a remastered image color
      setIsChangingRemasteredColor(true);
      
      // Update the global color state
      setBackgroundColor(newColor);
      
      // Create a clone of the current image to avoid reference issues
      const updatedImage = { 
        ...currentImageBeingProcessed,
        backgroundColor: newColor 
      };
      
      // Update the pending images array without triggering a full refresh
      setPendingImages(prev => {
        return prev.map(img => img.id === updatedImage.id ? updatedImage : img);
      });
      
      // Update the current image reference
      setCurrentImageBeingProcessed(updatedImage);
      
      // Reset the changing flag after a short delay
      setTimeout(() => {
        setIsChangingRemasteredColor(false);
      }, 300);
    };
    
    // Handle update background settings
    const handleUpdateBackgroundSettings = (type, value) => {
        // BUG FIX: Special handling for remastered image color changes
        if (type === 'color' && currentImageBeingProcessed?.isRemastered) {
            handleRemasteredColorChange(value);
            return;
        }
        
        // Update global state
        if (type === 'type') {
            setBackgroundType(value);
        } else if (type === 'color') {
            setBackgroundColor(value);
        } else if (type === 'prompt') {
            setBackgroundPrompt(value);
        } else if (type === 'model') {
            setInpaintingModel(value);
        }
        
        // If there's a current image being processed, update its settings too
        if (currentImageBeingProcessed) {
            const updatedImage = { ...currentImageBeingProcessed };
            
            if (type === 'type') {
                updatedImage.backgroundType = value;
            } else if (type === 'color') {
                updatedImage.backgroundColor = value;
            } else if (type === 'prompt') {
                updatedImage.backgroundPrompt = value;
            } else if (type === 'model') {
                updatedImage.inpaintingModel = value;
            }
            
            setCurrentImageBeingProcessed(updatedImage);
            
            // Also update it in the pending images array
            setPendingImages(prev => prev.map(img => 
                img.id === updatedImage.id ? updatedImage : img
            ));
        }
    };
    
    // Toggle detection mode
    const handleToggleDetectionMode = (mode) => {
        setDetectionMode(mode);
        
        // Reset points and mask when switching modes
        setPoints([]);
        setMask(null);
        
        // Clear the drawing canvas
        clearDrawing();
    };
    
    // Select a completed image
    const handleSelectCompleted = (img) => {
        // Allow selection in both live and canvas modes
        setActiveDisplayImage(img);
        
        // Reset points and mask when selecting a different image
        setPoints([]);
        setMask(null);
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
        if (drawingCanvasRef.current) {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }
    };
    
    // Toggle view mode
    const toggleViewMode = () => {
        const newMode = viewMode === 'live' ? 'canvas' : 'live';
        setViewMode(newMode);
    };
    
    // Delete an image from completed images
    const handleDeleteImage = (imageId) => {
        // Remove the image from the completed images array
        const newCompletedImages = completedImages.filter(img => img.id !== imageId);
        setCompletedImages(newCompletedImages);
        
        // If the active image is the one being deleted, set a new active image
        if (activeDisplayImage && activeDisplayImage.id === imageId) {
            if (newCompletedImages.length > 0) {
                setActiveDisplayImage(newCompletedImages[0]);
            } else if (currentImageBeingProcessed) {
                setActiveDisplayImage(null);
            } else {
                setActiveDisplayImage(null);
            }
        }
    };
    
    // Download images (selected or all)
    const handleDownload = (option = 'selected') => {
        setShowDownloadMenu(false);
        
        if (option === 'selected') {
            if (!activeDisplayImage || !activeDisplayImage.processed) return;
            
            const link = document.createElement('a');
            link.href = activeDisplayImage.processed;
            link.download = `removed-bg-${Date.now()}.png`;
            link.click();
        } else if (option === 'all') {
            // Create a zip file with all images
            completedImages.forEach((img, index) => {
                if (img.processed) {
                    const link = document.createElement('a');
                    link.href = img.processed;
                    link.download = `removed-bg-${index+1}-${Date.now()}.png`;
                    // Small delay between downloads to avoid browser issues
                    setTimeout(() => {
                        link.click();
                    }, index * 100);
                }
            });
        }
    };
    
    // Handle reset mask
    const handleResetMask = () => {
        clearDrawing();
    };
    
    // Handle redo image - reprocess an image that's already been processed
    const handleRedoImage = () => {
        if (!activeDisplayImage) return;
        
        // Create a new pending image based on the active one
        const newPendingImage = {
            id: `img-${Date.now()}-redo`,
            original: activeDisplayImage.original,
            processed: null,
            isProcessing: false,
            backgroundType: activeDisplayImage.backgroundType || backgroundType,
            backgroundColor: activeDisplayImage.backgroundColor || backgroundColor,
            backgroundPrompt: activeDisplayImage.backgroundPrompt || backgroundPrompt,
            inpaintingModel: activeDisplayImage.inpaintingModel || inpaintingModel,
            points: [],
            mask: null
        };
        
        // Add to pending images
        setPendingImages(prev => [...prev, newPendingImage]);
        
        // If no image is currently being processed, set this as the current one
        if (!currentImageBeingProcessed) {
            setCurrentImageBeingProcessed(newPendingImage);
        }
        
        // Show success message using our utility
        showSuccessToast("Image added back to queue for reprocessing");
        
        // Switch to live mode to show the image is back in the queue
        setViewMode('live');
        setActiveDisplayImage(null);
    };

    // BUG FIX: Improved handleRemasterImage function with stability enhancements
    const handleRemasterImage = () => {
      if (!activeDisplayImage || !activeDisplayImage.processed) return;
      
      // BUG FIX: Set remastering flag to true
      setIsRemastering(true);
      
      // Create a new pending image based on the processed image (not the original)
      const newPendingImage = {
        id: `img-${Date.now()}-remaster`,
        original: activeDisplayImage.processed, // Use processed image as the new source
        processed: null,
        isProcessing: false,
        backgroundType: activeDisplayImage.backgroundType || backgroundType,
        backgroundColor: activeDisplayImage.backgroundColor || backgroundColor,
        backgroundPrompt: activeDisplayImage.backgroundPrompt || backgroundPrompt,
        inpaintingModel: activeDisplayImage.inpaintingModel || inpaintingModel,
        points: [],
        mask: null,
        isRemastered: true  // BUG FIX: Add flag indicating this is a remastered image
      };
      
      // Store stable reference for this remastered image
      originalImageRefStable.current = activeDisplayImage.processed;
      
      // Add to pending images
      setPendingImages(prev => [...prev, newPendingImage]);
      
      // If no image is currently being processed, set this as the current one
      if (!currentImageBeingProcessed) {
        setCurrentImageBeingProcessed(newPendingImage);
      }
      
      // Show success message using our utility
      showSuccessToast("Processed image added to queue for remastering");
      
      // Switch to live mode to show the image is back in the queue
      setViewMode('live');
      setActiveDisplayImage(null);
      
      // BUG FIX: Reset the remastering flag after a short delay
      setTimeout(() => {
        setIsRemastering(false);
      }, 500);
    };
    
    // Handle slider mouse down (desktop)
    const handleSliderMouseDown = (e) => {
        if (viewMode !== 'canvas') return;
        
        e.preventDefault();
        
        // Find the actual image element for more precise bounds
        const imageElement = processedImageRef.current;
        if (!imageElement) return;
        
        // Get the image's actual dimensions and position
        const imageRect = imageElement.getBoundingClientRect();
        
        // Check if click is within the image bounds (no tolerance)
        if (
            e.clientX < imageRect.left || 
            e.clientX > imageRect.right || 
            e.clientY < imageRect.top || 
            e.clientY > imageRect.bottom
        ) return;
        
        // Get initial position
        const initialX = e.clientX;
        const initialPosition = sliderPosition;
        
        // Define mouse move handler
        const handleMouseMove = (moveEvent) => {
            // Only respond to mouse moves if they're within the image horizontally
            if (moveEvent.clientX < imageRect.left || moveEvent.clientX > imageRect.right) return;
            
            // Calculate how far the mouse has moved as a percentage of image width
            const deltaX = moveEvent.clientX - initialX;
            const percentageDelta = (deltaX / imageRect.width) * 100;
            
            // Calculate new position, clamped between 0-100%
            const newPosition = Math.max(0, Math.min(100, initialPosition + percentageDelta));
            setSliderPosition(newPosition);
        };
        
        // Define mouse up handler to clean up
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        // Add event listeners for dragging
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Now use conditional rendering instead of early return
    if (isMobile) {
        return <BackgroundRemovalEditor_mobile initialImage={initialImage} onReset={onReset} />;
    }
    
    // Desktop Layout
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'white'
        }}>
            {/* Add the StyleInjector to ensure our styles are applied */}
            <StyleInjector />

            {/* Header */}
            <DesktopHeader 
              onReset={onReset}
              showDownloadMenu={showDownloadMenu}
              setShowDownloadMenu={setShowDownloadMenu}
              completedImages={completedImages}
              handleDownload={handleDownload}
              activeDisplayImage={activeDisplayImage}
            />
            
            {/* Main Layout */}
            <div style={{
                display: 'flex', 
                height: 'calc(100vh - 72px)'
            }}>
                {/* Left Panel - Completed Images */}
                <CompletedImagesPanel 
                  completedImages={completedImages}
                  activeDisplayImage={activeDisplayImage}
                  handleSelectCompleted={handleSelectCompleted}
                  handleDeleteImage={handleDeleteImage}
                />
                
                {/* Center Panel - Canvas */}
                <div style={{
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column'
                }}>
                    {/* Mode Toggle Bar */}
                    <ModeToggleBar 
                      viewMode={viewMode}
                      toggleViewMode={toggleViewMode}
                      showDownloadMenu={showDownloadMenu}
                      setShowDownloadMenu={setShowDownloadMenu}
                    />
                    
                    {/* Canvas Area */}
                    <div 
                        ref={containerRef}
                        style={{
                        flex: 1, 
                        backgroundColor: '#F3F4F6', 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        overflow: 'hidden'
                    }}>
                        {/* Use either activeDisplayImage or currentImageBeingProcessed */}
                        {(activeDisplayImage || currentImageBeingProcessed) ? (
                            <div 
                                ref={canvasRef}
                                style={{ 
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0.5rem',
                                    width: '100%',
                                    height: 'calc(100% - 16px)'
                                }}
                            >
                                {/* Image container - ensures both images have identical dimensions */}
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    width: '100%'
                                }}>
                                    <div style={{
                                        position: 'relative',
                                        maxWidth: '95%',
                                        maxHeight: '95%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <div style={{
                                            position: 'relative',
                                            width: imageDimensions.width > 0 ? `${imageDimensions.width}px` : 'auto',
                                            height: imageDimensions.height > 0 ? `${imageDimensions.height}px` : 'auto'
                                        }}>
                                            <canvas
                                                ref={drawingCanvasRef}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    zIndex: 25,
                                                    cursor: (detectionMode === 'manual' && currentImageBeingProcessed && !activeDisplayImage) ? 'crosshair' : 'default',
                                                    pointerEvents: (detectionMode === 'manual' && currentImageBeingProcessed && !activeDisplayImage) ? 'auto' : 'none'
                                                }}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={(e) => {
                                                    e.preventDefault();
                                                    startDrawing(e.touches[0]);
                                                }}
                                                onTouchMove={(e) => {
                                                    e.preventDefault();
                                                    draw(e.touches[0]);
                                                }}
                                                onTouchEnd={stopDrawing}
                                            />
                                            
                                            {/* BUG FIX: Use stable references when available for remastered images */}
                                            <img 
                                                ref={originalImageRef}
                                                src={(currentImageBeingProcessed?.isRemastered && originalImageRefStable.current) 
                                                    ? originalImageRefStable.current 
                                                    : (activeDisplayImage || currentImageBeingProcessed).original} 
                                                alt="Original" 
                                                style={{ 
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain',
                                                    pointerEvents: 'none',
                                                    zIndex: 10
                                                }}
                                            />
                                            
                                            {/* Points for manual selection - only show points if we're in manual mode and working on an image */}
                                            {detectionMode === "manual" && points.map((point, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: 'absolute',
                                                        width: '0.75rem',
                                                        height: '0.75rem',
                                                        backgroundColor: '#ef4444',
                                                        borderRadius: '9999px',
                                                        transform: 'translate(-50%, -50%)',
                                                        left: `${(point.x / imageDimensions.naturalWidth) * 100}%`,
                                                        top: `${(point.y / imageDimensions.naturalHeight) * 100}%`,
                                                        zIndex: 30
                                                    }}
                                                />
                                            ))}
                                            
                                            {/* Canvas overlay for mask preview */}
                                            <canvas
                                                ref={overlayCanvasRef}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    pointerEvents: 'none',
                                                    zIndex: 20
                                                }}
                                            />
                                            
                                            {/* BUG FIX: Improved processed image handling with stable references */}
                                            {activeDisplayImage && (activeDisplayImage.processed || processedImageRefStable.current) && (
                                                <div 
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        overflow: 'hidden',
                                                        clipPath: viewMode === 'canvas' 
                                                            ? `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                                                            : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                                                        pointerEvents: 'none',
                                                        zIndex: viewMode === 'canvas' ? 20 : 15
                                                    }}
                                                >
                                                    <img 
                                                        ref={processedImageRef}
                                                        src={activeDisplayImage.isRemastered && processedImageRefStable.current 
                                                            ? processedImageRefStable.current 
                                                            : activeDisplayImage.processed} 
                                                        alt="Processed" 
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'contain'
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            
                                            {/* Slider elements - only in canvas mode with processed image */}
                                            {viewMode === 'canvas' && activeDisplayImage && activeDisplayImage.processed && (
                                                <DesktopImageSlider 
                                                  sliderPosition={sliderPosition}
                                                  handleSliderMouseDown={handleSliderMouseDown}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                color: '#6B7280'
                            }}>
                                {pendingImages.length > 0 
                                    ? 'Select an image to process' 
                                    : 'No images available'}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Right Panel - Controls */}
                <div style={{
                    width: '16rem',
                    borderLeft: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Current Processing Image */}
                    {currentImageBeingProcessed && (
                        <CurrentProcessingImage currentImageBeingProcessed={currentImageBeingProcessed} />
                    )}
                    
                    {/* Settings Panel */}
                    <SettingsPanel 
                      currentImageBeingProcessed={currentImageBeingProcessed}
                      detectionMode={detectionMode}
                      handleToggleDetectionMode={handleToggleDetectionMode}
                      brushSize={brushSize}
                      setBrushSize={setBrushSize}
                      backgroundType={backgroundType}
                      backgroundColor={backgroundColor}
                      backgroundPrompt={backgroundPrompt}
                      inpaintingModel={inpaintingModel}
                      handleUpdateBackgroundSettings={handleUpdateBackgroundSettings}
                      isSelectionInverted={isSelectionInverted}
                    />
                    
                    {/* Queue Panel */}
                    <QueuePanel pendingImages={pendingImages} />
                    
                    {/* Action buttons */}
                    <ActionButtonsPanel 
                      currentImageBeingProcessed={currentImageBeingProcessed}
                      activeDisplayImage={activeDisplayImage}
                      isProcessing={isProcessing}
                      handleGenerateMask={handleGenerateMask}
                      handleRemoveBackground={handleRemoveBackground}
                      handleInvertSelection={handleInvertSelection}
                      handleResetMask={handleResetMask}
                      handleRedoImage={handleRedoImage}
                      handleRemasterImage={handleRemasterImage}
                      mask={mask}
                      detectionMode={detectionMode}
                      backgroundType={backgroundType}
                      backgroundPrompt={backgroundPrompt}
                      isSelectionInverted={isSelectionInverted}
                      points={points}
                      viewMode={viewMode}
                    />
                </div>
            </div>

            {/* Error Message Component */}
            {error && (
                <ErrorMessage 
                    error={error}
                    onDismiss={() => setError(null)}
                />
            )}
        </div>
    );
};

export default BackgroundRemovalEditor;