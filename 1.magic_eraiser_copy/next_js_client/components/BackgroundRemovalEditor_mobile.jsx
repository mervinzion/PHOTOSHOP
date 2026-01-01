import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, RotateCcw, Wand2, Zap, HandMetal, 
  Download, Sliders, RotateCw, X
} from 'lucide-react';

// Import components from the utility file
import { 
  StyleInjector, 
  Haptics, 
  MobileToast,
  MobileActionSheet,
  MobileResultsPreview,
  InverseSelectionButton,
  CompareSlider,
  hexToRgb,
  drawingUtils
} from './bgr_mobile_u1.jsx';

const BackgroundRemovalEditor_mobile = ({ initialImage, onReset }) => {
    // Add the StyleInjector at the top level to ensure styles are applied
    
    // UI state
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showResultsPreview, setShowResultsPreview] = useState(false);
    const [isSelectionInverted, setIsSelectionInverted] = useState(false);
    
    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
    const [brushSize, setBrushSize] = useState(20);
    
    // Touch state for canvas interactions
    const [isGestureZooming, setIsGestureZooming] = useState(false);
    const [initialTouchDistance, setInitialTouchDistance] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [initialPanPosition, setInitialPanPosition] = useState({ x: 0, y: 0 });
    const [lastTap, setLastTap] = useState(0);
    
    // Settings states
    const [detectionMode, setDetectionMode] = useState("manual"); // "manual" or "auto"
    const [backgroundType, setBackgroundType] = useState('transparent');
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [backgroundPrompt, setBackgroundPrompt] = useState('');
    const [inpaintingModel, setInpaintingModel] = useState('deliberate_v2');
    
    // Image processing state
    const [currentImage, setCurrentImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mask, setMask] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [processingQueue, setProcessingQueue] = useState([]);
    
    // Reference to be able to reliably use URLs
    const imageUrlRefStable = useRef({ original: null, processed: null });
    
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
    const overlayCanvasRef = useRef(null);
    const containerRef = useRef(null);
    
    // Initialize image when component loads
    useEffect(() => {
        if (initialImage) {
            setCurrentImage(initialImage);
            imageUrlRefStable.current.original = initialImage;
        }
    }, [initialImage]);

    // Initialize drawing canvas when image dimensions change
    useEffect(() => {
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
    }, [imageDimensions.naturalWidth, imageDimensions.naturalHeight]);

    // Handle touch events for drawing, zooming, and panning
    const handleTouchStart = (event) => {
        if (isProcessing || detectionMode !== "manual" || !currentImage) return;
        
        // Detect double-tap to reset zoom
        const now = Date.now();
        const timeSinceLastTap = now - lastTap;
        const doubleTapDelay = 300; // milliseconds
        
        if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
            // Double-tap detected - reset zoom
            setZoomLevel(1);
            setPanPosition({ x: 0, y: 0 });
            Haptics.impact('light');
            setLastTap(0);
            return;
        }
        
        setLastTap(now);
        
        if (event.touches.length === 2) {
            // Two finger touch - prepare for zoom
            event.preventDefault();
            setIsGestureZooming(true);
            
            // Calculate initial distance between fingers
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            setInitialTouchDistance(distance);
            
            // Haptic feedback
            Haptics.impact('light');
        } 
        else if (event.touches.length === 1) {
            // Single touch - prepare for drawing or panning
            if (zoomLevel > 1) {
                // When zoomed in, prioritize panning
                setInitialPanPosition({
                    x: event.touches[0].clientX - panPosition.x,
                    y: event.touches[0].clientY - panPosition.y
                });
            } else {
                // Start drawing
                setIsDrawing(true);
                const { x, y } = getCanvasCoordinates(event.touches[0]);
                setLastPoint({ x, y });
                
                // Draw a point at the start
                const canvas = drawingCanvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    drawingUtils.drawPoint(ctx, x, y, brushSize);
                    
                    // Haptic feedback for drawing start
                    Haptics.impact('light');
                }
            }
        }
    };

    const handleTouchMove = (event) => {
        if (event.touches.length === 2 && isGestureZooming) {
            // Handle pinch zoom
            event.preventDefault();
            
            // Calculate new distance between fingers
            const dx = event.touches[0].clientX - event.touches[1].clientX;
            const dy = event.touches[0].clientY - event.touches[1].clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate zoom factor
            const scaleFactor = newDistance / initialTouchDistance;
            const newZoomLevel = Math.max(1, Math.min(3, zoomLevel * scaleFactor));
            
            setZoomLevel(newZoomLevel);
            setInitialTouchDistance(newDistance);
        }
        else if (event.touches.length === 1) {
            if (zoomLevel > 1 && !isDrawing) {
                // Handle panning when zoomed in
                event.preventDefault();
                const newPanX = event.touches[0].clientX - initialPanPosition.x;
                const newPanY = event.touches[0].clientY - initialPanPosition.y;
                
                // Apply constraints to prevent over-panning
                const maxPanX = (imageDimensions.width * (zoomLevel - 1)) / 2;
                const maxPanY = (imageDimensions.height * (zoomLevel - 1)) / 2;
                
                setPanPosition({
                    x: Math.max(-maxPanX, Math.min(maxPanX, newPanX)),
                    y: Math.max(-maxPanY, Math.min(maxPanY, newPanY))
                });
            } 
            else if (isDrawing) {
                // Handle drawing
                event.preventDefault();
                
                const { x, y } = getCanvasCoordinates(event.touches[0]);
                
                // Draw a line from last point to current point
                const canvas = drawingCanvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    drawingUtils.drawLine(ctx, lastPoint.x, lastPoint.y, x, y, brushSize);
                }
                
                setLastPoint({ x, y });
            }
        }
    };

    const handleTouchEnd = () => {
        if (isGestureZooming) {
            setIsGestureZooming(false);
            Haptics.impact('light');
        }
        
        if (isDrawing) {
            setIsDrawing(false);
            
            // If we've been drawing, convert the drawing to mask
            if (drawingCanvasRef.current) {
                // Update our mask from the drawing canvas
                updateMaskFromDrawing();
                Haptics.notification('success');
            }
        }
    };

    // Utility function to get canvas coordinates from touch
    const getCanvasCoordinates = (touch) => {
        if (!drawingCanvasRef.current) return { x: 0, y: 0 };
        
        const canvas = drawingCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Apply zoom and pan calculations
        let x = (touch.clientX - rect.left) * scaleX;
        let y = (touch.clientY - rect.top) * scaleY;
        
        // Adjust for zoom and pan
        x = (x - panPosition.x) / zoomLevel;
        y = (y - panPosition.y) / zoomLevel;
        
        return { x, y };
    };

    const updateMaskFromDrawing = () => {
        if (!drawingCanvasRef.current) return;
        
        // Convert the drawing to a data URL
        const drawingDataURL = drawingCanvasRef.current.toDataURL();
        
        // Set the mask with the drawing
        setMask(drawingDataURL);
        
        // Update the overlay mask with the drawing
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
            img.src = drawingDataURL;
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
        // Reset zoom and pan
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
        
        // Haptic feedback
        Haptics.impact('medium');
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
        
        // Haptic feedback
        Haptics.notification('success');
        
        // Show toast notification
        setToast({
            message: isSelectionInverted ? 
                "Selection mode: Keep the subject" : 
                "Selection mode: Remove the subject",
            type: "info"
        });
    };

    const handleAutoDetect = async () => {
        if (!currentImage) return;
        
        try {
            setLoadingStates(prev => ({ ...prev, autoDetection: true, maskGeneration: true }));
            setIsProcessing(true);
            setError(null);
            setToast({ message: "Auto-detecting subject...", type: "info" });
    
            // Use currentImage directly - it's already a data URL from initialImage
            const response = await fetch('http://localhost:8000/api/auto-detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: currentImage
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to auto-detect foreground');
            }
    
            const data = await response.json();
            setMask(data.mask);
    
            // Draw the overlay with the mask
            if (overlayCanvasRef.current) {
                const img = new Image();
                img.onload = () => {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#abf134';
                    ctx.drawImage(img, 0, 0);
                    ctx.globalCompositeOperation = 'source-in';
                    ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                };
                img.src = data.mask;
            }
            
            // Haptic feedback for success
            Haptics.notification('success');
            setToast({ message: "Subject detected successfully!", type: "success" });
        } catch (err) {
            console.error('Error auto-detecting:', err);
            setError(err.message);
            setToast({ message: `Auto-detection failed: ${err.message}`, type: "error" });
            Haptics.notification('error');
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
        if (!currentImage) return;
        
        try {
            setLoadingStates(prev => ({ ...prev, maskGeneration: true }));
            setIsProcessing(true);
            setError(null);

            if (detectionMode === "manual" && drawingCanvasRef.current) {
                // For manual mode with drawing, we'll use the current drawing as our mask
                updateMaskFromDrawing();
                setLoadingStates(prev => ({ ...prev, maskGeneration: false }));
                setIsProcessing(false);
                setToast({ 
                    message: isSelectionInverted ? 
                        "Mask generated: Areas selected will be removed" : 
                        "Mask generated: Subject selected will be kept",
                    type: "success" 
                });
                Haptics.notification('success');
                return;
            }

            // If there's no mask yet and we need to generate one
            if (!mask) {
                setError("Please draw on the image to mark the subject you want to keep");
                setToast({ message: "Please draw on the image to mark the subject", type: "error" });
                setLoadingStates(prev => ({ ...prev, maskGeneration: false }));
                setIsProcessing(false);
                Haptics.notification('error');
                return;
            }
        } catch (err) {
            console.error('Error generating mask:', err);
            setError(err.message);
            setToast({ message: `Mask generation failed: ${err.message}`, type: "error" });
            setLoadingStates(prev => ({ ...prev, maskGeneration: false }));
            setIsProcessing(false);
            Haptics.notification('error');
        }
    };

    const handleRemoveBackground = async () => {
        if (!currentImage || !mask) return;
    
        try {
            setLoadingStates(prev => ({ ...prev, backgroundRemoval: true }));
            setIsProcessing(true);
            setError(null);
            setToast({ message: "Processing image...", type: "info" });
    
            // Create a proper FormData object
            const formData = new FormData();
            
            // Convert the data URL to a Blob
            const response = await fetch(currentImage);
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
    
            // Prepare the request body based on background type
            const requestBody = {
                image_id,
                mask_data: mask,
                background_type: backgroundType,
            };
    
            // Add the appropriate background details based on type
            if (backgroundType === 'color') {
                const rgbColor = hexToRgb(backgroundColor);
                
                // IMPORTANT: Convert RGB to BGR for OpenCV
                // OpenCV uses BGR color order, not RGB
                requestBody.background_color = [
                    rgbColor[2],  // B
                    rgbColor[1],  // G
                    rgbColor[0]   // R
                ];
            } else if (backgroundType === 'generative') {
                requestBody.prompt = backgroundPrompt || "beautiful natural background";
                requestBody.inpainting_model = inpaintingModel;
            }
    
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
            
            // Save the processed image
            setProcessedImage(resultUrl);
            
            // Store stable references to the URLs
            imageUrlRefStable.current = {
                original: currentImage,
                processed: resultUrl
            };
            
            // Show results preview
            setShowResultsPreview(true);
            
            // Success feedback
            Haptics.notification('success');
            
            // Reset the mask
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
            setToast({ message: `Processing failed: ${err.message}`, type: "error" });
            console.error('Error removing background:', err);
            Haptics.notification('error');
        } finally {
            setLoadingStates(prev => ({ ...prev, backgroundRemoval: false }));
            setIsProcessing(false);
        }
    };
    
    const handleDownloadImage = () => {
        if (!processedImage) return;
        
        const link = document.createElement('a');
        link.href = processedImage;
        link.download = `removed-bg-${Date.now()}.png`;
        link.click();
        
        setToast({ message: "Image downloaded successfully!", type: "success" });
        Haptics.notification('success');
    };
    
    const handleRedoImage = () => {
        // Simply reset to original state but keep the original image
        setMask(null);
        setProcessedImage(null);
        setIsSelectionInverted(false);
        
        // Clear any canvas drawings
        if (drawingCanvasRef.current) {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
        
        // Reset zoom and pan
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
        
        // Close results preview
        setShowResultsPreview(false);
        
        // Show toast
        setToast({ message: "Ready to reprocess the original image", type: "info" });
    };
    
    const handleRemasterImage = () => {
        if (!processedImage) return;
        
        // Use the processed image as the new current image
        setCurrentImage(processedImage);
        
        // Update our stable reference
        imageUrlRefStable.current.original = processedImage;
        
        // Reset mask and drawing
        setMask(null);
        setProcessedImage(null);
        setIsSelectionInverted(false);
        
        // Clear canvas drawings
        if (drawingCanvasRef.current) {
            const ctx = drawingCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
        }
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
        
        // Reset zoom and pan
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
        
        // Close results preview
        setShowResultsPreview(false);
        
        // Show toast
        setToast({ message: "Ready to remaster the processed image", type: "info" });
    };

    // Load and cache images to ensure consistent size
    useEffect(() => {
        if (currentImage) {
            // Reset dimensions before reloading to avoid stale state
            setImageDimensions({ width: 0, height: 0 });
            
            // Load original image to get dimensions
            const img = new Image();
            img.onload = () => {
                // Calculate the available space for the image
                const containerRect = containerRef.current ? containerRef.current.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight - 200 };
                
                // Mobile-specific calculations - account for UI elements
                const availableWidth = containerRect.width * 0.95; // 95% of container width
                const availableHeight = containerRect.height * 0.85; // 85% of container height, leaving space for controls
                
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
                    // Image is smaller than available space, scale up slightly on mobile for better visibility
                    const scaleFactor = Math.min(availableWidth / img.naturalWidth, availableHeight / img.naturalHeight) * 0.9;
                    finalWidth = img.naturalWidth * scaleFactor;
                    finalHeight = img.naturalHeight * scaleFactor;
                }
                
                setImageDimensions({
                    width: finalWidth,
                    height: finalHeight,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                });
                
                // Reset zoom and pan when loading new image
                setZoomLevel(1);
                setPanPosition({ x: 0, y: 0 });
            };
            img.src = currentImage;
            
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
    }, [currentImage]);

    // Toggle detection mode
    const handleToggleDetectionMode = (mode) => {
        setDetectionMode(mode);
        
        // Reset mask when switching modes
        setMask(null);
        
        // Clear the drawing canvas
        clearDrawing();
        
        // Reset invert selection flag
        setIsSelectionInverted(false);
        
        // Haptic feedback
        Haptics.impact('medium');
    };
    
    // Reset masks and drawings
    const handleResetMask = () => {
        clearDrawing();
        
        // Reset invert selection flag
        setIsSelectionInverted(false);
    };

    // Main render
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Add the StyleInjector to ensure our styles are applied */}
            <StyleInjector />

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid #E5E7EB',
                backgroundColor: 'white',
                zIndex: 10
            }}>
                <button 
                    onClick={onReset}
                    style={{
                        color: '#4B5563',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '0.5rem',
                        marginRight: '0.5rem'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                
                <h1 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#000000',
                    flex: 1
                }}>Background Removal</h1>

                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        color: '#4B5563',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '0.5rem'
                    }}
                >
                    <Sliders size={18} />
                </button>
            </div>
            
            {/* Canvas Area */}
            <div 
                ref={containerRef}
                style={{
                    position: 'relative',
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    touchAction: 'none'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {currentImage ? (
                    <div 
                        ref={canvasRef}
                        style={{ 
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%'
                        }}
                    >
                        {/* Image container with transform for zoom and pan */}
                        <div style={{
                            position: 'relative',
                            width: imageDimensions.width > 0 ? `${imageDimensions.width}px` : 'auto',
                            height: imageDimensions.height > 0 ? `${imageDimensions.height}px` : 'auto',
                            transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                            transformOrigin: 'center center'
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
                                    cursor: (detectionMode === 'manual') ? 'crosshair' : 'default',
                                    pointerEvents: (detectionMode === 'manual' && !isProcessing) ? 'auto' : 'none'
                                }}
                            />
                            
                            <img 
                                ref={originalImageRef}
                                src={currentImage} 
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
                        </div>
                    </div>
                ) : (
                    <div style={{
                        color: '#6B7280',
                        fontSize: '0.875rem',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        No image available
                    </div>
                )}
            </div>
            
            {/* Settings Panel - only shown when settings button is clicked */}
            {showSettings && (
                <div style={{
                    borderTop: '1px solid #E5E7EB',
                    backgroundColor: 'white',
                    padding: '1rem',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <h2 style={{
                            fontSize: '1.125rem',
                            fontWeight: 500,
                            textAlign: 'center'
                        }}>Settings</h2>
                        <button
                            onClick={() => setShowSettings(false)}
                            style={{
                                color: '#4B5563',
                                backgroundColor: 'transparent',
                                border: 'none',
                                padding: '0.5rem'
                            }}
                        >
                            Done
                        </button>
                    </div>
                
                {/* Detection Mode Selection */}
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#000000',
                        marginBottom: '0.5rem',
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
                                padding: '0.75rem 0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #E5E7EB',
                                backgroundColor: detectionMode === "manual" ? '#abf134' : 'white',
                                color: detectionMode === "manual" ? '#000000' : '#4B5563',
                                fontWeight: 500
                            }}
                        >
                            <HandMetal size={18} />
                            Manual
                        </button>
                        <button
                            onClick={() => handleToggleDetectionMode("auto")}
                            style={{
                                flex: 1,
                                padding: '0.75rem 0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                borderRadius: '0.375rem',
                                border: '1px solid #E5E7EB',
                                backgroundColor: detectionMode === "auto" ? '#abf134' : 'white',
                                color: detectionMode === "auto" ? '#000000' : '#4B5563',
                                fontWeight: 500
                            }}
                        >
                            <Zap size={18} />
                            Auto
                        </button>
                    </div>
                </div>
                
                {/* Inverse Selection Button - Only shown for manual mode */}
                {detectionMode === "manual" && (
                    <div style={{ marginBottom: '1rem' }}>
                        <InverseSelectionButton 
                            isInverted={isSelectionInverted}
                            onToggle={handleInvertSelection}
                        />
                    </div>
                )}
                
                {/* Brush Size Control - Only shown for manual mode */}
                {detectionMode === "manual" && (
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#000000',
                            marginBottom: '0.25rem',
                        }}>
                            Brush Size: {brushSize}
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="50"
                            value={brushSize}
                            onChange={(e) => {
                                setBrushSize(parseInt(e.target.value));
                                if (Math.abs(parseInt(e.target.value) - brushSize) > 5) {
                                    Haptics.impact('light');
                                }
                            }}
                            style={{
                                width: '100%',
                                height: '2rem'
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
                
{/* Background Type */}
<div style={{ marginBottom: '1rem' }}>
    <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#000000',
        marginBottom: '0.5rem',
    }}>
        Background Type
    </label>
    <div style={{
        display: 'flex',
        borderRadius: '0.375rem',
        overflow: 'hidden',
        border: '1px solid #E5E7EB'
    }}>
        <button
            onClick={() => setBackgroundType('transparent')}
            style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                backgroundColor: backgroundType === 'transparent' ? '#abf134' : 'white',
                color: backgroundType === 'transparent' ? '#000000' : '#4B5563',
                fontWeight: 500,
                border: 'none',
                borderRight: '1px solid #E5E7EB'
            }}
        >
            Transparent
        </button>
        <button
            onClick={() => setBackgroundType('color')}
            style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                backgroundColor: backgroundType === 'color' ? '#abf134' : 'white',
                color: backgroundType === 'color' ? '#000000' : '#4B5563',
                fontWeight: 500,
                border: 'none',
                borderRight: '1px solid #E5E7EB'
            }}
        >
            Color
        </button>
        <button
            onClick={() => setBackgroundType('generative')}
            style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                backgroundColor: backgroundType === 'generative' ? '#abf134' : 'white',
                color: backgroundType === 'generative' ? '#000000' : '#4B5563',
                fontWeight: 500,
                border: 'none'
            }}
        >
            AI Gen
        </button>
    </div>
</div>

{/* Move the Color Palette here */}
{backgroundType === 'color' && (
    <div style={{ marginBottom: '1rem' }}>
        <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '0.5rem',
        }}>
            Background Color
        </label>
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem' 
        }}>
            <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    padding: 0
                }}
            />
            <span style={{
                fontSize: '0.875rem',
                color: '#4B5563'
            }}>
                {backgroundColor}
            </span>
        </div>
    </div>
)}

{/* AI Generation Options (only shown for generative type) */}
{backgroundType === 'generative' && (
    <div style={{ marginBottom: '1rem' }}>
        <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '0.5rem',
        }}>
            Background Prompt
        </label>
        <textarea
            value={backgroundPrompt}
            onChange={(e) => setBackgroundPrompt(e.target.value)}
            placeholder="Describe the background you want..."
            style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #E5E7EB',
                fontSize: '1rem',
                minHeight: '5rem',
                resize: 'vertical'
            }}
        />
    </div>
)}
                
                {/* Instructions */}
                <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#EBF5FF',
                    borderRadius: '0.375rem',
                    marginBottom: '1rem'
                }}>
                    <p style={{
                        fontSize: '0.875rem',
                        color: '#1E40AF',
                        fontWeight: 500,
                    }}>
                        {detectionMode === "manual" 
                            ? isSelectionInverted
                                ? "Inverted mode: Paint areas you want to REMOVE. The rest will be kept."
                                : "Draw on the image to mark the subject you want to keep. Double-tap to reset zoom, pinch to zoom in/out."
                            : "Auto-detection will automatically identify the main subject in your image."}
                    </p>
                </div>
                
                {/* We've moved the action buttons to always be visible at the bottom */}
            </div>
            )}
            
            {/* Action Buttons (always visible) */}
            <div style={{
                borderTop: '1px solid #E5E7EB',
                backgroundColor: 'white',
                padding: '1rem',
                display: 'flex',
                gap: '0.5rem'
            }}>
                {/* Reset Mask Button - Only when mask exists */}
                {mask && detectionMode === "manual" && (
                    <button 
                        onClick={handleResetMask}
                        style={{
                            padding: '0.875rem',
                            backgroundColor: '#F3F4F6',
                            color: '#374151',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            border: 'none',
                            width: '3.5rem'
                        }}
                    >
                        <RotateCcw size={20} />
                    </button>
                )}
                
                {/* Generate Mask Button */}
                <button
                    onClick={handleGenerateMask}
                    disabled={isProcessing}
                    style={{
                        flex: 1,
                        padding: '0.875rem',
                        backgroundColor: isProcessing ? '#F3F4F6' : '#abf134',
                        color: isProcessing ? '#9CA3AF' : '#000000',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {isProcessing ? 'Processing...' : 'Generate Mask'}
                </button>
                
                {/* Process Button */}
                <button
                    onClick={handleRemoveBackground}
                    disabled={
                        isProcessing || 
                        !mask || 
                        (backgroundType === 'generative' && !backgroundPrompt)
                    }
                    style={{
                        flex: 1,
                        padding: '0.875rem',
                        backgroundColor: !mask || 
                            isProcessing ||
                            (backgroundType === 'generative' && !backgroundPrompt)
                            ? '#F3F4F6' 
                            : '#abf134',
                        color: !mask || 
                            isProcessing ||
                            (backgroundType === 'generative' && !backgroundPrompt)
                            ? '#9CA3AF' 
                            : '#000000',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    Remove Background
                </button>
            </div>
            
            {/* Results Preview Modal */}
            <MobileActionSheet 
                isOpen={showResultsPreview} 
                onClose={() => setShowResultsPreview(false)}
            >
                <MobileResultsPreview
                    processedImage={processedImage}
                    originalImage={currentImage}
                    onReprocess={handleRedoImage}
                    onRemaster={handleRemasterImage}
                    onDownload={handleDownloadImage}
                    onClose={() => setShowResultsPreview(false)}
                />
            </MobileActionSheet>
            
            {/* Toast Notifications */}
            {toast && (
                <MobileToast 
                    message={toast.message} 
                    type={toast.type} 
                    onDismiss={() => setToast(null)}
                />
            )}
            
            {/* Error Message */}
            {error && !toast && (
                <MobileToast 
                    message={error} 
                    type="error" 
                    onDismiss={() => setError(null)}
                />
            )}
        </div>
    );
};

export default BackgroundRemovalEditor_mobile;