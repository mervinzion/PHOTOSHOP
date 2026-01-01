import React, { useState, useRef, useEffect } from 'react';
import { Download, ArrowLeft, RotateCcw, Zap, HandMetal, Settings, Info, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';

// Import mobile version
import BlurEditor_mobile from './blur_mobile';

// Wrapper component that decides whether to show mobile or desktop version
const BlurEditorWrapper = ({ initialImage, onReset }) => {
    // Detect mobile environment
    const [isMobile, setIsMobile] = useState(false);
    
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
    
    // Render either mobile or desktop version based on device detection
    return isMobile 
        ? <BlurEditor_mobile initialImage={initialImage} onReset={onReset} />
        : <BlurEditorDesktop initialImage={initialImage} onReset={onReset} />;
};

// Style Injector Component to ensure our styles aren't overridden
const StyleInjector = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #app-title,
      #mode-label,
      #blur-strength-label,
      #completed-images-title,
      #no-images-text,
      #download-button,
      #mode-toggle-button,
      #instruction-text,
      #processing-title,
      #settings-title,
      #queue-title,
      .section-title {
        font-weight: 500 !important;
        color: #000000 !important;
      }
      
      #mode-toggle-button *,
      #download-button * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      /* Mobile-specific styles */
      body.mobile-view {
        overscroll-behavior: none;
        touch-action: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  return null;
};

// Desktop version of the editor
const BlurEditorDesktop = ({ initialImage, onReset }) => {
    // Add the StyleInjector at the top level to ensure styles are applied
    
    // UI state
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'canvas'
    const [sliderPosition, setSliderPosition] = useState(50);
    const [error, setError] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isQueueExpanded, setIsQueueExpanded] = useState(false); // New state for queue expansion
    
    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
    const [brushSize, setBrushSize] = useState(20);
    const [isSelectionInverted, setIsSelectionInverted] = useState(false); // NEW: Inverse selection state
    
    // Settings states
    const [blurStrength, setBlurStrength] = useState(45);
    const [useIndividualSettings, setUseIndividualSettings] = useState(false);
    const [individualBlurStrengths, setIndividualBlurStrengths] = useState([]);
    const [detectionMode, setDetectionMode] = useState("manual"); // "manual" or "auto"
    
    // Image processing state
    const [pendingImages, setPendingImages] = useState([]);
    const [completedImages, setCompletedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [points, setPoints] = useState([]);
    const [mask, setMask] = useState(null);
    const [activeDisplayImage, setActiveDisplayImage] = useState(null);
    const [currentImageBeingProcessed, setCurrentImageBeingProcessed] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [overlayMask, setOverlayMask] = useState(null);
    
    // Refs
    const canvasRef = useRef(null);
    const drawingCanvasRef = useRef(null);
    const originalImageRef = useRef(null);
    const processedImageRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    
    // Initialize queue when component loads
    useEffect(() => {
        if (Array.isArray(initialImage) && initialImage.length > 0) {
            const formattedQueue = initialImage.map((img, index) => ({
                id: `img-${Date.now()}-${index}`,
                original: img,
                processed: null,
                isProcessing: false,
                blurStrength: blurStrength,
                points: [],
                mask: null
            }));
            setPendingImages(formattedQueue);
            // Initialize individual strengths with default values
            setIndividualBlurStrengths(formattedQueue.map(() => blurStrength));
            
            // Set the first image as the one being processed
            setCurrentImageBeingProcessed(formattedQueue[0]);
        } else if (initialImage) {
            const singleImage = {
                id: `img-${Date.now()}-0`,
                original: initialImage,
                processed: null,
                isProcessing: false,
                blurStrength: blurStrength,
                points: [],
                mask: null
            };
            setPendingImages([singleImage]);
            setIndividualBlurStrengths([blurStrength]);
            
            // Set the single image as the one being processed
            setCurrentImageBeingProcessed(singleImage);
        }
    }, [initialImage, blurStrength]);

    // Initialize drawing canvas when image dimensions change
    useEffect(() => {
        if (drawingCanvasRef.current && imageDimensions.naturalWidth && imageDimensions.naturalHeight) {
            const canvas = drawingCanvasRef.current;
            canvas.width = imageDimensions.naturalWidth;
            canvas.height = imageDimensions.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [imageDimensions.naturalWidth, imageDimensions.naturalHeight]);

    // Drawing functions
    const startDrawing = (event) => {
        if (isProcessing || detectionMode !== "manual" || !currentImageBeingProcessed) return;
        
        setIsDrawing(true);
        const { x, y } = getCanvasCoordinates(event);
        setLastPoint({ x, y });
        
        // Draw a point at the start
        const canvas = drawingCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawPoint(ctx, x, y, brushSize);
        }
    };

    const draw = (event) => {
        if (!isDrawing) return;
        
        const { x, y } = getCanvasCoordinates(event);
        
        // Draw a line from last point to current point
        const canvas = drawingCanvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawLine(ctx, lastPoint.x, lastPoint.y, x, y, brushSize);
        }
        
        setLastPoint({ x, y });
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        
        // If we've been drawing, convert the drawing to mask
        if (isDrawing && drawingCanvasRef.current) {
            // Update our mask from the drawing canvas
            updateMaskFromDrawing();
        }
    };

    // Drawing utility functions
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

    const drawPoint = (ctx, x, y, size) => {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#abf134';
        ctx.fill();
        ctx.closePath();
    };

    const drawLine = (ctx, startX, startY, endX, endY, size) => {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#abf134';
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.closePath();
    };

    const updateMaskFromDrawing = () => {
        if (!drawingCanvasRef.current) return;
        
        // Convert the drawing to a data URL
        const drawingDataURL = drawingCanvasRef.current.toDataURL();
        
        // Update the overlay mask with the drawing
        setOverlayMask(drawingDataURL);
        
        // Now we'll use the drawing as our mask
        setMask(drawingDataURL);
    };

    const clearDrawing = () => {
        if (drawingCanvasRef.current) {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }
        setMask(null);
        setOverlayMask(null);
        setPoints([]);
        setIsSelectionInverted(false); // Reset inversion state when clearing
    };

    // NEW: Handle invert selection
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
    };

    const handleGenerateMask = async () => {
        if (!currentImageBeingProcessed) return;
        
        try {
            setIsProcessing(true);
            setError(null);

            if (detectionMode === "manual" && drawingCanvasRef.current) {
                // For manual mode with drawing, we'll use the current drawing as our mask
                updateMaskFromDrawing();
                setIsProcessing(false);
                return;
            }

            // For auto mode, use the API
            if (detectionMode === "auto") {
                const response = await fetch('http://localhost:8000/api/auto-detect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image_data: currentImageBeingProcessed.original
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to generate mask (${detectionMode} mode)`);
                }

                const data = await response.json();
                setMask(data.mask);

                // Draw the overlay with the final mask
                if (overlayCanvasRef.current) {
                    const img = new Image();
                    img.onload = () => {
                        const ctx = overlayCanvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                        ctx.globalAlpha = 0.3;
                        ctx.fillStyle = '#abf134';
                        
                        // Draw the mask
                        ctx.drawImage(img, 0, 0);
                        ctx.globalCompositeOperation = 'source-in';
                        ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                        
                        // Reset composite operation
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.globalAlpha = 1;
                    };
                    img.src = data.mask;
                }
            }
        } catch (err) {
            setError(err.message);
            console.error('Error generating mask:', err);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // Process the current image - this combines generate mask and apply blur for auto mode
    const handleProcessImage = async () => {
        if (!currentImageBeingProcessed) return;
        
        try {
            setIsProcessing(true);
            setError(null);
            
            // For auto mode, do everything in one step
            if (detectionMode === "auto") {
                const response = await fetch('http://localhost:8000/api/auto-blur', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image_data: currentImageBeingProcessed.original,
                        blur_strength: currentImageBeingProcessed.blurStrength || blurStrength
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Auto blur failed');
                }
                
                const data = await response.json();
                
                // Create the completed image object
                const completedImage = {
                    id: currentImageBeingProcessed.id,
                    original: currentImageBeingProcessed.original,
                    processed: data.blurred_image,
                    blurStrength: currentImageBeingProcessed.blurStrength || blurStrength,
                    detectionMode: detectionMode,
                    mask: data.mask,
                    timestamp: Date.now()
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
                setOverlayMask(null);
                if (overlayCanvasRef.current) {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                }
                
            } else if (mask) {
                // For manual mode with mask already generated, apply the blur
                const response = await fetch('http://localhost:8000/api/apply-blur', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image_data: currentImageBeingProcessed.original,
                        mask: mask,
                        blur_strength: currentImageBeingProcessed.blurStrength || blurStrength,
                        invert_mask: isSelectionInverted // Add inversion flag to API call
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to apply blur');
                }
                
                const data = await response.json();
                
                // Create completed image
                const completedImage = {
                    id: currentImageBeingProcessed.id,
                    original: currentImageBeingProcessed.original,
                    processed: data.blurred_image,
                    blurStrength: currentImageBeingProcessed.blurStrength || blurStrength,
                    detectionMode: detectionMode,
                    mask: mask,
                    isSelectionInverted: isSelectionInverted, // Store inversion state with the image
                    timestamp: Date.now()
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
                setOverlayMask(null);
                setIsSelectionInverted(false); // Reset inversion state
                if (overlayCanvasRef.current) {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                }
            } else {
                // For manual mode without mask, tell user to generate mask first
                setError("Please generate a mask by adding points on the image and clicking 'Generate Mask' first");
            }
        } catch (err) {
            setError(err.message);
            console.error('Error processing image:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Load and cache images to ensure consistent size
    useEffect(() => {
        // Use either the active display image or the current image being processed
        const imageToDisplay = activeDisplayImage || currentImageBeingProcessed;
        
        if (imageToDisplay) {
            // Reset dimensions before reloading to avoid stale state
            setImageDimensions({ width: 0, height: 0 });
            
            // Load original image to get dimensions
            const img = new Image();
            img.onload = () => {
                // Calculate the available space for the image
                const containerRect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : { width: 800, height: 600 };
                const availableWidth = containerRect.width * 0.95; // 95% of container width
                const availableHeight = containerRect.height * 0.95; // 95% of container height
                
                // Calculate dimensions to fit within available space while maintaining aspect ratio
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                let finalWidth, finalHeight;
                
                if (img.naturalWidth > availableWidth || img.naturalHeight > availableHeight) {
                    // Image is larger than available space, need to scale down
                    const widthRatio = availableWidth / img.naturalWidth;
                    const heightRatio = availableHeight / img.naturalHeight;
                    
                    // Use the smaller ratio to ensure image fits within bounds
                    const scaleFactor = Math.min(widthRatio, heightRatio);
                    
                    finalWidth = img.naturalWidth * scaleFactor;
                    finalHeight = img.naturalHeight * scaleFactor;
                } else {
                    // Image is smaller than available space, use natural dimensions
                    finalWidth = img.naturalWidth;
                    finalHeight = img.naturalHeight;
                }
                
                setImageDimensions({
                    width: finalWidth,
                    height: finalHeight,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                });
                
                // Initialize overlay canvas if it exists
                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.width = img.naturalWidth;
                    overlayCanvasRef.current.height = img.naturalHeight;
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
                }
            };
            img.src = imageToDisplay.original;
            
            // Handle window resize to recalculate available space
            const handleResize = () => {
                if (img.complete) {
                    img.onload();
                }
            };
            
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [activeDisplayImage, currentImageBeingProcessed]);

    // Update blur strength for current image
    const handleUpdateBlurStrength = (newStrength) => {
        setBlurStrength(newStrength);
        
        // If there's a current image being processed, update its blur strength
        if (currentImageBeingProcessed) {
            const updatedImage = { ...currentImageBeingProcessed, blurStrength: newStrength };
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
        setOverlayMask(null);
        setIsSelectionInverted(false); // Reset inversion state
        
        // Clear the drawing canvas
        clearDrawing();
    };
    
    // Select a completed image - Now works in both modes
    const handleSelectCompleted = (img) => {
        // Allow selection in both live and canvas modes
        setActiveDisplayImage(img);
        
        // Reset points and mask when selecting a different image
        setPoints([]);
        setMask(null);
        setOverlayMask(null);
        setIsSelectionInverted(false); // Reset inversion state
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
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
            link.download = `blurred-${Date.now()}.png`;
            link.click();
        } else if (option === 'all') {
            // Create a zip file with all images
            completedImages.forEach((img, index) => {
                if (img.processed) {
                    const link = document.createElement('a');
                    link.href = img.processed;
                    link.download = `blurred-${index+1}-${Date.now()}.png`;
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

    // Toggle the queue expansion state
    const toggleQueueExpansion = () => {
        setIsQueueExpanded(prev => !prev);
    };

    // NEW: Handle redo image - reprocess an image that's already been processed
    const handleRedoImage = () => {
        if (!activeDisplayImage) return;
        
        // Create a new pending image based on the active one
        const newPendingImage = {
            id: `img-${Date.now()}-redo`,
            original: activeDisplayImage.original,
            processed: null,
            isProcessing: false,
            blurStrength: activeDisplayImage.blurStrength || blurStrength,
            points: [],
            mask: null
        };
        
        // Add to pending images
        setPendingImages(prev => [...prev, newPendingImage]);
        
        // If no image is currently being processed, set this as the current one
        if (!currentImageBeingProcessed) {
            setCurrentImageBeingProcessed(newPendingImage);
        }
        
        // Show success message
        setError('Image added back to queue for reprocessing');
        setTimeout(() => setError(null), 3000);
        
        // Switch to live mode to show the image is back in the queue
        setViewMode('live');
        setActiveDisplayImage(null);
    };

    // NEW: Handle remaster image - use the processed image as a new source
    const handleRemasterImage = () => {
        if (!activeDisplayImage || !activeDisplayImage.processed) return;
        
        // Create a new pending image based on the processed image (not the original)
        const newPendingImage = {
            id: `img-${Date.now()}-remaster`,
            original: activeDisplayImage.processed, // Use processed image as the new source
            processed: null,
            isProcessing: false,
            blurStrength: activeDisplayImage.blurStrength || blurStrength,
            points: [],
            mask: null,
            isRemastered: true // Flag indicating this is a remastered image
        };
        
        // Add to pending images
        setPendingImages(prev => [...prev, newPendingImage]);
        
        // If no image is currently being processed, set this as the current one
        if (!currentImageBeingProcessed) {
            setCurrentImageBeingProcessed(newPendingImage);
        }
        
        // Show success message
        setError('Processed image added to queue for remastering');
        setTimeout(() => setError(null), 3000);
        
        // Switch to live mode to show the image is back in the queue
        setViewMode('live');
        setActiveDisplayImage(null);
    };

    // Handle slider mouse down
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

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'white'
        }}>
            {/* Add the StyleInjector to ensure our styles are applied */}
            <StyleInjector />

            {/* Header with Direct HTML */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderBottom: '1px solid #E5E7EB'
            }}>
                <button 
                    onClick={onReset}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        color: '#4B5563',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                    Back
                </button>
                
                {/* Title with direct HTML */}
                <h1 id="app-title" style={{
                    fontSize: '1.5rem',
                    lineHeight: '2rem',
                    fontWeight: 500,
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>Background Blur</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Download button with direct HTML */}
                    <div style={{ position: 'relative' }}>
                        <button
                            id="download-button"
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            disabled={completedImages.length === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                color: '#4B5563',
                                borderRadius: '0.25rem',
                                cursor: completedImages.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: completedImages.length === 0 ? 0.5 : 1,
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                            onMouseOver={(e) => {
                                if (completedImages.length > 0) {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <Download style={{ width: '1rem', height: '1rem' }} />
                            Download
                        </button>
                        
                        {/* Download dropdown menu */}
                        {showDownloadMenu && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                marginTop: '0.5rem',
                                width: '12rem',
                                backgroundColor: 'white',
                                borderRadius: '0.375rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                zIndex: 50
                            }}>
                                <div style={{ padding: '0.25rem 0' }}>
                                    <button
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            color: '#374151',
                                            cursor: !activeDisplayImage || !activeDisplayImage.processed ? 'not-allowed' : 'pointer',
                                            opacity: !activeDisplayImage || !activeDisplayImage.processed ? 0.5 : 1
                                        }}
                                        onClick={() => handleDownload('selected')}
                                        disabled={!activeDisplayImage || !activeDisplayImage.processed}
                                        onMouseOver={(e) => {
                                            if (activeDisplayImage && activeDisplayImage.processed) {
                                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        Download Selected
                                    </button>
                                    <button
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleDownload('all')}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Download All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Main Layout */}
            <div style={{
                display: 'flex', 
                height: 'calc(100vh - 72px)',
                overflow: 'hidden' // Prevent overall scrolling
            }}>
                {/* Left Panel - Completed Images with Direct HTML */}
                <div style={{
                    width: '16rem',
                    borderRight: '1px solid #E5E7EB',
                    overflowY: 'auto',
                    padding: '1rem',
                    maxHeight: 'calc(100vh - 72px)' // Ensure it doesn't overflow
                }}>
                    {/* Title with direct HTML */}
                    <h2 id="completed-images-title" style={{
                        textTransform: 'uppercase',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#000000',
                        marginBottom: '0.75rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>COMPLETED IMAGES</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {completedImages.map(img => (
                            <div 
                                key={img.id} 
                                style={{
                                    border: activeDisplayImage && activeDisplayImage.id === img.id 
                                        ? '1px solid #abf134' 
                                        : '1px solid #E5E7EB',
                                    borderRadius: '0.25rem',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    boxShadow: activeDisplayImage && activeDisplayImage.id === img.id 
                                        ? '0 0 0 2px rgba(171, 241, 52, 0.2)' 
                                        : 'none'
                                }}
                                onMouseOver={(e) => {
                                    if (!(activeDisplayImage && activeDisplayImage.id === img.id)) {
                                        e.currentTarget.style.borderColor = '#D1D5DB';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!(activeDisplayImage && activeDisplayImage.id === img.id)) {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }
                                }}
                            >
                                <div 
                                    style={{ 
                                        position: 'relative',
                                        height: '120px',
                                        width: '100%'
                                    }}
                                    onClick={() => handleSelectCompleted(img)}
                                >
                                    <img 
                                        src={img.processed || img.original} 
                                        alt="Completed" 
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    {/* Display blur strength badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.25rem',
                                        left: '0.25rem',
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        padding: '0 0.375rem',
                                        borderRadius: '0.125rem'
                                    }}>
                                        {img.blurStrength}
                                    </div>
                                </div>
                                {/* Delete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteImage(img.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '0.25rem',
                                        right: '0.25rem',
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        borderRadius: '9999px',
                                        backgroundColor: 'rgba(31, 41, 55, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        cursor: 'pointer',
                                        opacity: 0,
                                        transition: 'opacity 0.2s, background-color 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.opacity = 1;
                                        e.currentTarget.style.backgroundColor = '#DC2626';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.opacity = 0;
                                        e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.6)';
                                    }}
                                >
                                    <span style={{ fontSize: '0.75rem' }}>×</span>
                                </button>
                            </div>
                        ))}
                        
                        {completedImages.length === 0 && (
                            <div id="no-images-text" style={{
                                color: '#000000',
                                fontSize: '0.875rem',
                                textAlign: 'center',
                                padding: '2rem 0',
                                fontWeight: 500,
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}>
                                No processed images yet
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Center Panel - Canvas */}
                <div style={{
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column'
                }}>
                    {/* Mode Toggle Bar with Direct HTML */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 1rem',
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: '#F9FAFB'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Mode toggle button with direct HTML */}
                            <button
                                id="mode-toggle-button"
                                onClick={toggleViewMode}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    color: '#000000',
                                    fontWeight: 500,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}
                            >
                                {viewMode === 'live' ? (
                                    <>
                                        <ToggleLeft style={{ height: '1rem', width: '1rem' }} />
                                        Live Mode
                                    </>
                                ) : (
                                    <>
                                        <ToggleRight style={{ height: '1rem', width: '1rem' }} />
                                        Canvas Mode
                                    </>
                                )}
                            </button>
                        </div>
                        
                        <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#6B7280' 
                        }}>
                            {viewMode === 'live' 
                                ? 'Select image from completed images' 
                                : 'Use slider to compare before & after'}
                        </div>
                        
                        {/* Close dropdown when clicking outside */}
                        {showDownloadMenu && (
                            <div 
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 40
                                }}
                                onClick={() => setShowDownloadMenu(false)}
                            ></div>
                        )}
                    </div>
                    
                    {/* Canvas Area */}
                    <div style={{
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
                                            
                                            <img 
                                                ref={originalImageRef}
                                                src={(activeDisplayImage || currentImageBeingProcessed).original} 
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
                                                        left: `${(point.left / imageDimensions.naturalWidth) * 100}%`,
                                                        top: `${(point.top / imageDimensions.naturalHeight) * 100}%`,
                                                        zIndex: 30,
                                                        display: 'none' // Hide old points visualization
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
                                            
                                            {/* Processed Image with clip mask for slider - only shown if viewing a processed image */}
                                            {activeDisplayImage && activeDisplayImage.processed && (
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
                                                        src={activeDisplayImage.processed} 
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
                                                <>
                                                    {/* Slider Line */}
                                                    <div 
                                                        style={{ 
                                                            position: 'absolute',
                                                            width: '0.125rem',
                                                            backgroundColor: 'white',
                                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                                            left: `${sliderPosition}%`,
                                                            pointerEvents: 'none',
                                                            top: 0,
                                                            height: '100%',
                                                            zIndex: 30
                                                        }}
                                                    />
                                                    
                                                    {/* Slider Handle - this is what user interacts with */}
                                                    <div 
                                                        style={{ 
                                                            position: 'absolute',
                                                            left: `${sliderPosition}%`,
                                                            width: '20px',
                                                            transform: 'translateX(-10px)',
                                                            pointerEvents: 'auto',
                                                            top: 0,
                                                            height: '100%',
                                                            zIndex: 40,
                                                            cursor: 'ew-resize'
                                                        }}
                                                        onMouseDown={handleSliderMouseDown}
                                                    >
                                                        {/* Sleek minimal slider handle */}
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '50%',
                                                            left: '50%',
                                                            transform: 'translate(-50%, -50%)',
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            backgroundColor: 'white',
                                                            borderRadius: '9999px',
                                                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                                            border: '1px solid #D1D5DB',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <div style={{
                                                                width: '0.125rem',
                                                                height: '0.75rem',
                                                                backgroundColor: '#9CA3AF',
                                                                borderRadius: '9999px'
                                                            }}></div>
                                                        </div>
                                                    </div>
                                                </>
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
                
                {/* Right Panel - Controls with Direct HTML */}
                <div style={{
                    width: '16rem',
                    borderLeft: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 72px)', // Changed from maxHeight to height for consistency
                    overflow: 'hidden' // Hide overflow for the container
                }}>
                    {/* Create a scrollable container for all content */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto', // Make entire panel scrollable
                        height: '100%'
                    }}>
                        {/* Current Processing Image Title */}
                        {currentImageBeingProcessed && (
                            <div style={{
                                padding: '1rem',
                                borderBottom: '1px solid #E5E7EB',
                                backgroundColor: '#FAFAFA',
                                flexShrink: 0 // Prevent shrinking
                            }}>
                                <h2 id="processing-title" className="section-title" style={{
                                    textTransform: 'uppercase',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#000000',
                                    marginBottom: '0.75rem',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>CURRENTLY PROCESSING</h2>
                                
                                <div style={{
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '0.25rem',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'relative',
                                        height: '100px',
                                        width: '100%'
                                    }}>
                                        <img
                                            src={currentImageBeingProcessed.original}
                                            alt="Current image"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Settings Panel */}
                        <div style={{
                            padding: '1rem',
                            borderBottom: '1px solid #E5E7EB',
                            flexShrink: 0, // Prevent this section from shrinking
                            minHeight: 'auto' // Let it take its natural height
                        }}>
                            <h2 id="settings-title" className="section-title" style={{
                                textTransform: 'uppercase',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#000000',
                                marginBottom: '0.75rem',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}>SETTINGS</h2>
                            
                            {/* Detection Mode Selection */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#000000',
                                    marginBottom: '0.5rem',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                    Detection Mode
                                </label>
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '0.5rem' 
                                }}>
                                    <button
                                        onClick={() => handleToggleDetectionMode("manual")}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            borderRadius: '0.25rem',
                                            border: '1px solid #E5E7EB',
                                            backgroundColor: detectionMode === "manual" ? '#abf134' : 'white',
                                            color: detectionMode === "manual" ? '#000000' : '#4B5563',
                                            fontWeight: 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <HandMetal style={{ width: '1rem', height: '1rem' }} />
                                        Manual
                                    </button>
                                    <button
                                        onClick={() => handleToggleDetectionMode("auto")}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            borderRadius: '0.25rem',
                                            border: '1px solid #E5E7EB',
                                            backgroundColor: detectionMode === "auto" ? '#abf134' : 'white',
                                            color: detectionMode === "auto" ? '#000000' : '#4B5563',
                                            fontWeight: 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Zap style={{ width: '1rem', height: '1rem' }} />
                                        Auto
                                    </button>
                                </div>
                            </div>
                            
                            {/* NEW: Invert Selection Button - Only shown for manual mode */}
                            {detectionMode === "manual" && currentImageBeingProcessed && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <button
                                        onClick={handleInvertSelection}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            color: '#4B5563',
                                            backgroundColor: isSelectionInverted ? '#EDF2F7' : 'transparent',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            marginBottom: '0.5rem'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = isSelectionInverted ? '#E2E8F0' : '#F9FAFB'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = isSelectionInverted ? '#EDF2F7' : 'transparent'}
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                        >
                                            <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0" />
                                            <path d="M12 2a10 10 0 0 1 8 8" />
                                            <path d="M12 2v10l-8-8" />
                                        </svg>
                                        {isSelectionInverted ? 'Selection Inverted' : 'Inverse Selection'}
                                    </button>
                                </div>
                            )}
                            
                            {/* Brush Size Control - Only show if needed */}
                            {detectionMode === "manual" && currentImageBeingProcessed && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#000000',
                                        marginBottom: '0.25rem',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                        Brush Size: {brushSize}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                        style={{
                                            width: '100%'
                                        }}
                                    />
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        fontSize: '0.75rem', 
                                        color: '#6B7280',
                                        marginTop: '0.25rem'
                                    }}>
                                        <span>Small</span>
                                        <span>Medium</span>
                                        <span>Large</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Blur Strength */}
                            {currentImageBeingProcessed && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <label id="blur-strength-label" style={{
                                        display: 'block',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#000000',
                                        marginBottom: '0.25rem',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                        Blur Strength: {currentImageBeingProcessed.blurStrength || blurStrength}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="99"
                                        step="2"
                                        value={currentImageBeingProcessed.blurStrength || blurStrength}
                                        onChange={(e) => handleUpdateBlurStrength(parseInt(e.target.value))}
                                        style={{
                                            width: '100%'
                                        }}
                                    />
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        fontSize: '0.75rem', 
                                        color: '#6B7280',
                                        marginTop: '0.25rem'
                                    }}>
                                        <span>Low</span>
                                        <span>Medium</span>
                                        <span>High</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Instructions based on detection mode */}
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: '#EBF5FF',
                                borderRadius: '0.25rem'
                            }}>
                                <p id="instruction-text" style={{
                                    fontSize: '0.875rem',
                                    color: '#1E40AF',
                                    fontWeight: 500,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                    {detectionMode === "manual" 
                                        ? isSelectionInverted
                                            ? "Inverted mode: Paint areas you want to BLUR. The rest will be in focus."
                                            : "Draw on the image to select the subject you want to keep in focus. The background will be blurred."
                                        : "Auto-detection will automatically identify the main subject in your image."}
                                </p>
                            </div>
                        </div>
                        
                        {/* Queue Panel with Toggle Header - ALWAYS VISIBLE */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flexShrink: 0, // Prevent shrinking to ensure visibility
                            borderBottom: '1px solid #E5E7EB'
                        }}>
                            {/* Queue Header with Toggle Button - ALWAYS VISIBLE */}
                            <div 
                                style={{
                                    padding: '1rem',
                                    paddingBottom: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    backgroundColor: isQueueExpanded ? '#F9FAFB' : 'transparent'
                                }}
                                onClick={toggleQueueExpansion}
                            >
                                <h2 id="queue-title" className="section-title" style={{
                                    textTransform: 'uppercase',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#000000',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    REMAINING QUEUE ({pendingImages.length > 0 ? pendingImages.length - 1 : 0})
                                </h2>
                                {isQueueExpanded ? (
                                    <ChevronUp size={16} color="#4B5563" />
                                ) : (
                                    <ChevronDown size={16} color="#4B5563" />
                                )}
                            </div>
                            
                            {/* Queue Content - Only show when expanded */}
                            {isQueueExpanded && (
                                <div style={{
                                    padding: '0.5rem 1rem 1rem',
                                    maxHeight: '200px', // Set a maximum height
                                    overflowY: 'auto' // Add scrolling when content exceeds max height
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}>
                                        {pendingImages.slice(1).map((img, index) => (
                                            <div 
                                                key={img.id}
                                                style={{
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '0.25rem',
                                                    overflow: 'hidden',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ 
                                                    position: 'relative',
                                                    height: '120px',
                                                    width: '100%'
                                                }}>
                                                    <img 
                                                        src={img.original} 
                                                        alt={`Queue ${index + 1}`} 
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    {/* Display blur strength badge */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '0.25rem',
                                                        left: '0.25rem',
                                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                        color: 'white',
                                                        fontSize: '0.75rem',
                                                        padding: '0 0.375rem',
                                                        borderRadius: '0.125rem'
                                                    }}>
                                                        {img.blurStrength}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {(pendingImages.length <= 1) && (
                                            <div style={{
                                                color: '#9CA3AF',
                                                fontSize: '0.875rem',
                                                textAlign: 'center',
                                                padding: '2rem 0'
                                            }}>
                                                No more images in queue
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Empty flex spacer to push the action buttons to the bottom */}
                        <div style={{ flex: 1 }} />

                        {/* NEW: REDO and REMASTER buttons when viewing a completed image in canvas mode */}
                        {activeDisplayImage && viewMode === 'canvas' && (
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '0.75rem', 
                                padding: '1rem',
                                backgroundColor: '#F9FAFB',
                                borderRadius: '0.25rem',
                                margin: '1rem'
                            }}>
                                <h3 style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#000000',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                    Not satisfied or want to enhance further?
                                </h3>
                                
                                {/* Reprocess button (uses original image) */}
                                <div>
                                    <button
                                        onClick={handleRedoImage}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#abf134',
                                            color: '#000000',
                                            borderRadius: '0.25rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#9ed830';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = '#abf134';
                                        }}
                                    >
                                        <RotateCcw style={{ width: '1rem', height: '1rem' }} />
                                        Reprocess (Original)
                                    </button>
                                    
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: '#6B7280',
                                        marginTop: '0.25rem',
                                        textAlign: 'center'
                                    }}>
                                        Start over with the original image
                                    </p>
                                </div>
                                
                                {/* Remaster button (uses processed image) */}
                                <div>
                                    <button
                                        onClick={handleRemasterImage}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#E0F2FE',
                                            color: '#0369A1',
                                            borderRadius: '0.25rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#BAE6FD';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = '#E0F2FE';
                                        }}
                                    >
                                        <RotateCw style={{ width: '1rem', height: '1rem' }} />
                                        Remaster (Processed)
                                    </button>
                                    
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: '#6B7280',
                                        marginTop: '0.25rem',
                                        textAlign: 'center'
                                    }}>
                                        Continue with the already processed image
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Action buttons - Fixed at bottom */}
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid #E5E7EB',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        backgroundColor: 'white',
                        flexShrink: 0 // Prevent shrinking
                    }}>
                        {currentImageBeingProcessed && !activeDisplayImage && (
                            <>
                                {detectionMode === "manual" && (
                                    <>
                                        <button
                                            onClick={handleGenerateMask}
                                            disabled={isProcessing}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#abf134',
                                                color: '#000000',
                                                borderRadius: '0.25rem',
                                                fontWeight: 500,
                                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                                border: 'none'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.backgroundColor = '#9ed830';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.backgroundColor = '#abf134';
                                            }}
                                        >
                                            {isProcessing ? 'Processing...' : 'Generate Mask'}
                                        </button>
                                        
                                        <button
                                            onClick={handleProcessImage}
                                            disabled={isProcessing || !mask}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 1rem',
                                                backgroundColor: !mask ? '#F3F4F6' : '#abf134',
                                                color: !mask ? '#9CA3AF' : '#000000',
                                                borderRadius: '0.25rem',
                                                fontWeight: 500,
                                                cursor: !mask ? 'not-allowed' : 'pointer',
                                                border: 'none'
                                            }}
                                            onMouseOver={(e) => {
                                                if (mask) {
                                                    e.currentTarget.style.backgroundColor = '#9ed830';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (mask) {
                                                    e.currentTarget.style.backgroundColor = '#abf134';
                                                }
                                            }}
                                        >
                                            {isProcessing ? 'Processing...' : isSelectionInverted ? 'Blur Selection' : 'Blur Background'}
                                        </button>
                                        
                                        <button
                                            onClick={handleResetMask}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                color: '#4B5563',
                                                backgroundColor: 'transparent',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <RotateCcw style={{ width: '1rem', height: '1rem' }} />
                                            Clear Drawing
                                        </button>
                                    </>
                                )}
                                
                                {detectionMode === "auto" && (
                                    <button
                                        onClick={handleProcessImage}
                                        disabled={isProcessing}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#abf134',
                                            color: '#000000',
                                            borderRadius: '0.25rem',
                                            fontWeight: 500,
                                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseOver={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#9ed830')}
                                        onMouseOut={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = '#abf134')}
                                    >
                                        {isProcessing ? 'Processing...' : 'Process With Auto-Detection'}
                                        <Zap style={{ width: '1rem', height: '1rem' }} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'fixed',
                    bottom: '1rem',
                    right: '1rem',
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #F87171',
                    color: '#B91C1C',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.25rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                    {error}
                    <button 
                        style={{
                            marginLeft: '0.75rem',
                            color: '#B91C1C'
                        }}
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

// Export the wrapper component as the default
export default BlurEditorWrapper;