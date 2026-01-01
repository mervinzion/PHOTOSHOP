import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Pipette } from 'lucide-react';
import ColorChangerMobile from './ColorChangerMobile';

// Main component with built-in responsive handling
const ColorChangerEditor = ({ initialImage, onReset }) => {
    // Detect if the device is mobile - this needs to be defined before any conditional returns
    const [isMobile, setIsMobile] = useState(false);
    
    // UI state
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'canvas'
    const [sliderPosition, setSliderPosition] = useState(50);
    const [error, setError] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isQueueExpanded, setIsQueueExpanded] = useState(false);
    const [isCompletedExpanded, setIsCompletedExpanded] = useState(true); // New state for completed images panel
    
    // Color changer state
    const [sourceColor, setSourceColor] = useState('#ff0000');
    const [targetColor, setTargetColor] = useState('#0000ff');
    const [tolerance, setTolerance] = useState(30);
    const [isPickingColor, setIsPickingColor] = useState(false);
    
    // Image processing state
    const [pendingImages, setPendingImages] = useState([]);
    const [completedImages, setCompletedImages] = useState([]); // Renamed: This is now the completed images section
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeDisplayImage, setActiveDisplayImage] = useState(null);
    const [currentImageBeingProcessed, setCurrentImageBeingProcessed] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    
    // Track intermediate changes/history for the current working image
    const [changeHistory, setChangeHistory] = useState([]);
    const [currentChangeIndex, setCurrentChangeIndex] = useState(-1);
    
    // Check if the device is mobile based on screen width - this needs to happen AFTER all state declarations
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Common breakpoint for mobile devices
        };
        
        // Check on initial load
        checkMobile();
        
        // Add event listener for window resize
        window.addEventListener('resize', checkMobile);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);
    
    // Use refs for values that shouldn't trigger re-renders
    const colorValuesRef = useRef({
        sourceColor,
        targetColor,
        tolerance
    });
    
    // Keep the ref in sync with state
    useEffect(() => {
        colorValuesRef.current = {
            sourceColor,
            targetColor,
            tolerance
        };
    }, [sourceColor, targetColor, tolerance]);
    
    // Refs
    const canvasRef = useRef(null);
    const originalCanvasRef = useRef(null);
    const processedCanvasRef = useRef(null);
    
    // Initialize queue when component loads
    useEffect(() => {
        if (Array.isArray(initialImage) && initialImage.length > 0) {
            const formattedQueue = initialImage.map((img, index) => ({
                id: `img-${Date.now()}-${index}`,
                original: img,
                processed: null,
                isProcessing: false,
                tolerance: tolerance,
                sourceColor: sourceColor,
                targetColor: targetColor
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
                tolerance: tolerance,
                sourceColor: sourceColor,
                targetColor: targetColor
            };
            setPendingImages([singleImage]);
            
            // Set the single image as the one being processed
            setCurrentImageBeingProcessed(singleImage);
        }
    }, [initialImage, sourceColor, targetColor, tolerance]);  // Include all dependencies

    // Load and cache images to ensure consistent size
    useEffect(() => {
        // Use either the active display image or the current image being processed
        const imageToDisplay = activeDisplayImage || currentImageBeingProcessed;
        
        if (!imageToDisplay) {
            console.log("⚠️ No image to display in useEffect");
            return;
        }
        
        // Reset dimensions before reloading to avoid stale state
        setImageDimensions({ width: 0, height: 0 });
        
        // Create a stable ID for the image to track when it actually changes
        const imageId = imageToDisplay.id;
        const imageSrc = imageToDisplay.original;
        
        console.log("🔄 Loading image in useEffect:", imageId);
        
        // Load original image to get dimensions
        const img = new Image();
        
        img.onload = () => {
            // Verify the image is still relevant (avoid stale updates)
            if ((activeDisplayImage?.id !== imageId && currentImageBeingProcessed?.id !== imageId)) {
                console.log("⚠️ Image no longer relevant:", imageId);
                return;
            }
            
            console.log("✅ Image loaded in useEffect, natural dimensions:", img.naturalWidth, "x", img.naturalHeight);
            
            // Calculate the available space for the image
            const containerRect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : { width: 800, height: 600 };
            const availableWidth = containerRect.width * 0.95; // 95% of container width
            const availableHeight = containerRect.height * 0.95; // 95% of container height
            
            console.log("📏 Available space:", availableWidth, "x", availableHeight);
            
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
            
            console.log("📏 Final display dimensions:", finalWidth, "x", finalHeight);
            
            setImageDimensions({
                width: finalWidth,
                height: finalHeight,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            });
            
            // Draw the image on original canvas
            if (originalCanvasRef.current) {
                const canvas = originalCanvasRef.current;
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                console.log("✅ Image drawn on original canvas in useEffect");
            }
        };
        
        img.onerror = (err) => {
            console.error("❌ Error loading image in useEffect:", err);
            setError("Failed to load image");
        };
        
        img.src = imageSrc;
        
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
    // CRITICAL: Only depend on STABLE identifiers that actually indicate a new image
    }, [activeDisplayImage?.id, currentImageBeingProcessed?.id]);

    // Utility functions for color conversions - memoized to prevent recreating on render
    const colorUtils = useMemo(() => {
        return {
            rgbToHex: (r, g, b) => {
                return '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
            },
            
            hexToRgb: (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            },
            
            colorDistance: (color1, color2) => {
                return Math.sqrt(
                    Math.pow(color1.r - color2.r, 2) +
                    Math.pow(color1.g - color2.g, 2) +
                    Math.pow(color1.b - color2.b, 2)
                );
            },
            
            // Add a new function to validate hex color codes
            isValidHexColor: (color) => {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
            }
        };
    }, []);

    // Pick color from canvas - memoized to prevent recreation on render
    const handlePickColor = useCallback((e) => {
        if (!isPickingColor || !originalCanvasRef.current) return;
        
        const canvas = originalCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Calculate the scaling factor between the displayed canvas and the actual canvas size
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Calculate the actual coordinates on the canvas
        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);
        
        // Ensure the coordinates are within the canvas bounds
        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const ctx = canvas.getContext('2d');
            const pixelData = ctx.getImageData(x, y, 1, 1).data;
            
            const hexColor = colorUtils.rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
            setSourceColor(hexColor);
            
            // Update the reference values directly
            colorValuesRef.current.sourceColor = hexColor;
            
            // Update the current image being processed without triggering complete re-renders
            if (currentImageBeingProcessed) {
                // Update property directly without creating new object
                currentImageBeingProcessed.sourceColor = hexColor;
                
                // Force a UI update without replacing the object identity
                setCurrentImageBeingProcessed(prev => ({...prev}));
                
                // Batch update to pending images
                requestAnimationFrame(() => {
                    setPendingImages(prev => 
                        prev.map(img => 
                            img.id === currentImageBeingProcessed.id 
                                ? {...img, sourceColor: hexColor} 
                                : img
                        )
                    );
                });
            }
            
            setIsPickingColor(false);
        }
    }, [isPickingColor, colorUtils, currentImageBeingProcessed]);

    // Process the current image - with support for appending changes
    const handleProcessImage = useCallback(() => {
        if (!currentImageBeingProcessed || !originalCanvasRef.current) return;
        
        setIsProcessing(true);
        setError(null);
        
        // Use setTimeout to ensure UI updates before heavy processing
        setTimeout(() => {
            try {
                // Determine which canvas to use as source
                // If we have change history and are not at the beginning,
                // use the processed canvas with the latest changes
                const useProcessedAsSource = changeHistory.length > 0 && currentChangeIndex >= 0;
                
                const sourceCanvas = useProcessedAsSource ? processedCanvasRef.current : originalCanvasRef.current;
                const ctx = sourceCanvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
                const data = imageData.data;
                
                const sourceRgb = colorUtils.hexToRgb(currentImageBeingProcessed.sourceColor || sourceColor);
                const targetRgb = colorUtils.hexToRgb(currentImageBeingProcessed.targetColor || targetColor);
                const currentTolerance = currentImageBeingProcessed.tolerance || tolerance;
                
                if (!sourceRgb || !targetRgb) {
                    throw new Error('Invalid color format');
                }
                
                for (let i = 0; i < data.length; i += 4) {
                    const pixelColor = {
                        r: data[i],
                        g: data[i + 1],
                        b: data[i + 2]
                    };
                    
                    const distance = colorUtils.colorDistance(pixelColor, sourceRgb);
                    
                    if (distance < currentTolerance) {
                        // Calculate how close the match is as a percentage
                        const factor = 1 - (distance / currentTolerance);
                        
                        // Blend between original color and target color based on match factor
                        data[i] = pixelColor.r + factor * (targetRgb.r - pixelColor.r);
                        data[i + 1] = pixelColor.g + factor * (targetRgb.g - pixelColor.g);
                        data[i + 2] = pixelColor.b + factor * (targetRgb.b - pixelColor.b);
                        // Alpha channel remains unchanged
                    }
                }
                
                // Display the processed image
                const processedCanvas = processedCanvasRef.current;
                if (processedCanvas) {
                    const processedCtx = processedCanvas.getContext('2d');
                    processedCanvas.width = sourceCanvas.width;
                    processedCanvas.height = sourceCanvas.height;
                    processedCtx.putImageData(imageData, 0, 0);
                    
                    // Create a data URL from the canvas
                    const processedDataUrl = processedCanvas.toDataURL('image/png');
                    
                    // Create a temporary image object with the latest changes
                    const processedImage = {
                        id: `${currentImageBeingProcessed.id}-change-${Date.now()}`,
                        original: currentImageBeingProcessed.original,
                        processed: processedDataUrl,
                        sourceColor: currentImageBeingProcessed.sourceColor || sourceColor,
                        targetColor: currentImageBeingProcessed.targetColor || targetColor,
                        tolerance: currentImageBeingProcessed.tolerance || tolerance,
                        timestamp: Date.now()
                    };
                    
                    // Set as active display image
                    setActiveDisplayImage(processedImage);
                    setIsProcessing(false);
                }
            } catch (err) {
                setError(err.message);
                console.error('Error processing image:', err);
                setIsProcessing(false);
            }
        }, 0);
    }, [currentImageBeingProcessed, sourceColor, targetColor, tolerance, colorUtils, changeHistory, currentChangeIndex]);
    
    // Debounced update tolerance - memoize function
    const handleUpdateTolerance = useCallback((newTolerance) => {
        setTolerance(newTolerance);
        
        // Update ref directly
        colorValuesRef.current.tolerance = newTolerance;
        
        // If there's a current image being processed, update its tolerance
        if (currentImageBeingProcessed) {
            // Update property directly without creating new object
            currentImageBeingProcessed.tolerance = newTolerance;
            
            // Batch update to pending images
            requestAnimationFrame(() => {
                // Update in pending images array in next frame
                setPendingImages(prev => 
                    prev.map(img => 
                        img.id === currentImageBeingProcessed.id 
                            ? {...img, tolerance: newTolerance} 
                            : img
                    )
                );
            });
        }
    }, [currentImageBeingProcessed]);
    
    // Enhanced validate and sanitize hex color - memoize function
    const validateHexColor = useCallback((input) => {
        // Ensure it starts with #
        let value = input;
        if (!value.startsWith('#')) {
            value = '#' + value;
        }
        
        // Remove any non-hex characters
        value = value.replace(/[^#A-Fa-f0-9]/g, '');
        
        // Limit to 7 characters (# + 6 hex digits)
        if (value.length > 7) {
            value = value.slice(0, 7);
        }
        
        return value;
    }, []);

    // *** IMPORTANT: Define handleUpdateTargetColor BEFORE handleTargetColorChange ***
    // Improved target color handler - updates display value and processes valid colors
    const handleUpdateTargetColor = useCallback((newColor) => {
        // Always update the display value
        setTargetColor(newColor);
        
        // Only update processing values if it's a valid color
        if (colorUtils.isValidHexColor(newColor)) {
            // Update ref directly
            colorValuesRef.current.targetColor = newColor;
            
            // If there's a current image being processed, update its target color
            if (currentImageBeingProcessed) {
                // Update property directly without creating new object
                currentImageBeingProcessed.targetColor = newColor;
                
                // Batch update to pending images
                requestAnimationFrame(() => {
                    // Update in pending images array in next frame
                    setPendingImages(prev => 
                        prev.map(img => 
                            img.id === currentImageBeingProcessed.id 
                                ? {...img, targetColor: newColor} 
                                : img
                        )
                    );
                });
            }
        }
    }, [currentImageBeingProcessed, colorUtils]);
    
    // Fixed target color change handler - allows typing while maintaining validation
    // This function MUST be defined AFTER handleUpdateTargetColor
    const handleTargetColorChange = useCallback((e) => {
        const rawInput = e.target.value;
        
        // If user is deleting the # at the beginning, don't block them
        if (rawInput === '') {
            handleUpdateTargetColor('#000000'); // Default to black when empty
            return;
        }
        
        // Don't auto-prepend # when user is typing
        let sanitizedInput = rawInput;
        
        // Only remove invalid characters
        sanitizedInput = sanitizedInput.replace(/[^#A-Fa-f0-9]/g, '');
        
        // Ensure we don't exceed 7 chars
        if (sanitizedInput.length > 7) {
            sanitizedInput = sanitizedInput.slice(0, 7);
        }
        
        // Always update the input value to show what user is typing
        handleUpdateTargetColor(sanitizedInput);
        
        // Only apply color if valid (for actual color processing)
        if (!colorUtils.isValidHexColor(sanitizedInput) && currentImageBeingProcessed) {
            // Keep processing color as the last valid color
            // but allow the input field to show what user is typing
        }
    }, [colorUtils, currentImageBeingProcessed, handleUpdateTargetColor]);
    
    // Handle append button click
    const handleAppendChange = useCallback(() => {
        if (!activeDisplayImage || !activeDisplayImage.processed) {
            setError("Please process an image before appending changes");
            return;
        }
        
        // Create a change record with the current color settings
        const change = {
            id: `change-${Date.now()}`,
            imageDataUrl: activeDisplayImage.processed,
            sourceColor: currentImageBeingProcessed.sourceColor || sourceColor,
            targetColor: currentImageBeingProcessed.targetColor || targetColor, 
            tolerance: currentImageBeingProcessed.tolerance || tolerance,
            timestamp: Date.now()
        };
        
        // Add the change to history and update the index
        setChangeHistory(prevHistory => {
            // If we're not at the latest change, trim the history
            const updatedHistory = prevHistory.slice(0, currentChangeIndex + 1);
            return [...updatedHistory, change];
        });
        
        setCurrentChangeIndex(prevIndex => prevIndex + 1);
        
        // We need to update the current image being processed to use the new
        // processed image as the starting point for the next color change
        if (currentImageBeingProcessed) {
            // Get the processed image from the processed canvas
            const processedCanvas = processedCanvasRef.current;
            if (processedCanvas) {
                // Create a new base image for further processing
                const processedDataUrl = processedCanvas.toDataURL('image/png');
                
                // Update the original canvas with the processed result
                const img = new Image();
                img.onload = () => {
                    if (originalCanvasRef.current) {
                        const canvas = originalCanvasRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                };
                img.src = processedDataUrl;
            }
        }
        
        // Show confirmation message
        setError({ type: 'success', message: 'Change appended successfully!' });
        
        // Clear error after 2 seconds if it's a success message
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [activeDisplayImage, currentImageBeingProcessed, sourceColor, targetColor, tolerance, currentChangeIndex]);
    
    // Select a completed image - memoize function
    const handleSelectCompleted = useCallback((img) => {
        setActiveDisplayImage(img);
    }, []);
    
    // Toggle view mode - memoize function
    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'live' ? 'canvas' : 'live');
    }, []);
    
    // NEW: Toggle completed images panel expansion
    const toggleCompletedExpansion = useCallback(() => {
        setIsCompletedExpanded(prev => !prev);
    }, []);
    
    const handleRedoImage = useCallback((imageId) => {
        console.log('⚙️ handleRedoImage triggered for image:', imageId);
        
        // Find the image in completedImages
        const imageToRedo = completedImages.find(img => img.id === imageId);
        
        if (!imageToRedo) {
            console.error('❌ Image not found in completedImages:', imageId);
            return;
        }
        
        console.log('🔍 Found image to redo:', imageToRedo);
        
        // Create a new image object for the pending queue with a guaranteed unique ID
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 9);
        const redoImage = {
            ...imageToRedo,
            id: `redo-${timestamp}-${randomString}`, // New unique ID
            processed: null, // Reset processed state
            isProcessing: false,
            timestamp: timestamp
        };
        
        console.log('🆕 Created redoImage object:', redoImage);
        
        // Force view mode to 'live' to ensure proper display
        setViewMode('live');
        
        // Reset change history for new edits
        setChangeHistory([]);
        setCurrentChangeIndex(-1);
        
        // Remove from completed images first
        setCompletedImages(prev => {
            console.log('📤 Removing image from completedImages');
            return prev.filter(img => img.id !== imageId);
        });
        
        // Add to pending images
        setPendingImages(prev => {
            console.log('📥 Adding image to pendingImages at position 0');
            return [redoImage, ...prev];
        });
        
        // Force clearing the canvas first
        if (originalCanvasRef.current) {
            const canvas = originalCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (processedCanvasRef.current) {
            const canvas = processedCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Important: Clear activeDisplayImage first to force re-render
        setActiveDisplayImage(null);
        
        // Wait a moment to ensure all state updates have processed
        setTimeout(() => {
            // Then set the currentImageBeingProcessed
            setCurrentImageBeingProcessed(redoImage);
            
            // And then set the activeDisplayImage
            setTimeout(() => {
                setActiveDisplayImage(redoImage);
                
                // Pre-load the image to ensure proper dimensions
                const preloadImg = new Image();
                preloadImg.onload = () => {
                    console.log('✅ Image preloaded, dimensions:', preloadImg.width, 'x', preloadImg.height);
                    
                    // Force drawing to canvas after image is loaded
                    if (originalCanvasRef.current) {
                        const canvas = originalCanvasRef.current;
                        canvas.width = preloadImg.naturalWidth;
                        canvas.height = preloadImg.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(preloadImg, 0, 0);
                        
                        // Ensure dimensions are updated
                        setImageDimensions({
                            width: preloadImg.naturalWidth,
                            height: preloadImg.naturalHeight,
                            naturalWidth: preloadImg.naturalWidth,
                            naturalHeight: preloadImg.naturalHeight
                        });
                        
                        console.log('✅ Image drawn to canvas in handleRedoImage');
                    }
                };
                preloadImg.src = redoImage.original;
            }, 50);
        }, 50);
        
        // Success message
        setError({ type: 'success', message: 'Image ready for processing!' });
        
        // Clear success message after 2 seconds
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [completedImages]);
    
    // Download images - memoize function
    const handleDownload = useCallback((option = 'selected') => {
        setShowDownloadMenu(false);
        
        if (option === 'selected') {
            if (!activeDisplayImage || !activeDisplayImage.processed) return;
            
            const link = document.createElement('a');
            link.href = activeDisplayImage.processed;
            link.download = `colored-${Date.now()}.png`;
            link.click();
        } else if (option === 'all') {
            // Create a zip file with all images
            completedImages.forEach((img, index) => {
                if (img.processed) {
                    const link = document.createElement('a');
                    link.href = img.processed;
                    link.download = `colored-${index+1}-${Date.now()}.png`;
                    // Small delay between downloads to avoid browser issues
                    setTimeout(() => {
                        link.click();
                    }, index * 100);
                }
            });
        }
    }, [activeDisplayImage, completedImages]);
    
    // Toggle the queue expansion state - memoize function
    const toggleQueueExpansion = useCallback(() => {
        setIsQueueExpanded(prev => !prev);
    }, []);

    // Handle slider mouse down - memoize function
    const handleSliderMouseDown = useCallback((e) => {
        if (viewMode !== 'canvas') return;
        
        e.preventDefault();
        
        // Find the actual image element for more precise bounds
        const imageContainer = canvasRef.current;
        if (!imageContainer) return;
        
        // Get the container's actual dimensions and position
        const containerRect = imageContainer.getBoundingClientRect();
        
        // Check if click is within the container bounds
        if (
            e.clientX < containerRect.left || 
            e.clientX > containerRect.right || 
            e.clientY < containerRect.top || 
            e.clientY > containerRect.bottom
        ) return;
        
        // Get initial position
        const initialX = e.clientX;
        const containerWidth = containerRect.width;
        const initialPosition = sliderPosition;
        
        // Define mouse move handler
        const handleMouseMove = (moveEvent) => {
            // Calculate how far the mouse has moved as a percentage of container width
            const deltaX = moveEvent.clientX - initialX;
            const percentageDelta = (deltaX / containerWidth) * 100;
            
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
    }, [viewMode, sliderPosition]);

    // Reset to handle change history
    const handleReset = useCallback(() => {
        console.log('⚡ RESET INITIATED ⚡');
        
        // Debug state BEFORE reset
        console.log('🔍 BEFORE RESET:');
        console.log('currentImageBeingProcessed:', currentImageBeingProcessed);
        console.log('activeDisplayImage:', activeDisplayImage);
        console.log('changeHistory:', changeHistory);
        
        // Clear change history
        setChangeHistory([]);
        setCurrentChangeIndex(-1);
        
        // Force view mode to live to ensure we're not in split-view mode
        setViewMode('live');
        
        // CRITICAL FIX: We need to use either currentImageBeingProcessed OR activeDisplayImage
        // since the display could be showing either one
        const imageToReset = currentImageBeingProcessed || activeDisplayImage;
        
        if (imageToReset) {
            console.log('🔄 Resetting image:', imageToReset.id);
            
            // Generate a new unique ID
            const newUniqueId = `reset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Create a fresh reset image object with processed=null
            const resetImage = {
                ...imageToReset,
                id: newUniqueId,
                processed: null  // This is critical - we must clear the processed property
            };
            
            console.log('📝 Created resetImage:', resetImage);
            
            // Clear active display image FIRST (this is key)
            setActiveDisplayImage(null);
            
            // Set currentImageBeingProcessed to the reset image
            setCurrentImageBeingProcessed(resetImage);
            
            // After a small delay, set the activeDisplayImage to force a refresh
            setTimeout(() => {
                setActiveDisplayImage(resetImage);
                console.log('🔄 Set activeDisplayImage to resetImage');
            }, 50);
            
            // Update pending images if needed
            if (imageToReset.id) {
                setPendingImages(prev => {
                    // First remove the existing image if it exists
                    const filtered = prev.filter(img => img.id !== imageToReset.id);
                    // Then add the reset image at the beginning
                    return [resetImage, ...filtered];
                });
            }
            
            // IMPORTANT: Force clear both canvases regardless of refs
            if (processedCanvasRef.current) {
                const processedCanvas = processedCanvasRef.current;
                const processedCtx = processedCanvas.getContext('2d');
                processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
                console.log('🧹 Cleared processed canvas');
            }
            
            // Redraw original canvas with the original image
            if (originalCanvasRef.current) {
                const canvas = originalCanvasRef.current;
                const ctx = canvas.getContext('2d');
                
                // Clear the canvas first
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                console.log('🧹 Cleared original canvas');
                
                // Load the original image
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);
                    console.log('✅ Drew original image on canvas', img.src.substring(0, 30) + '...');
                };
                img.onerror = (err) => {
                    console.error('❌ Error loading image:', err);
                    setError("Failed to load original image");
                };
                
                // Make sure we're using the original image source
                img.src = imageToReset.original;
                console.log('🔄 Loading original image:', img.src.substring(0, 30) + '...');
            }
        } else {
            console.warn('⚠️ No image available to reset!');
        }
        
        // Clear any error messages
        setError(null);
        
        // Debug after reset
        setTimeout(() => {
            console.log('🔍 AFTER RESET:');
            console.log('currentImageBeingProcessed:', currentImageBeingProcessed);
            console.log('activeDisplayImage:', activeDisplayImage);
            console.log('originalCanvasRef exists:', !!originalCanvasRef.current);
            console.log('processedCanvasRef exists:', !!processedCanvasRef.current);
            console.log('changeHistory:', changeHistory);
        }, 500);
        
    }, [currentImageBeingProcessed, activeDisplayImage, changeHistory]);

    // Handle Done button click - add the current image with all appended changes to completed images
    // Then automatically pull the next image from the queue
    const handleDone = useCallback(() => {
        if (!activeDisplayImage || !activeDisplayImage.processed) {
            setError("Please process an image before marking it as done");
            return;
        }
        
        // Create a final image that includes all the appended changes
        const finalImage = {
            id: `final-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            original: currentImageBeingProcessed.original,
            processed: activeDisplayImage.processed,
            sourceColor: currentImageBeingProcessed.sourceColor || sourceColor,
            targetColor: currentImageBeingProcessed.targetColor || targetColor,
            tolerance: currentImageBeingProcessed.tolerance || tolerance,
            timestamp: Date.now(),
            changesCount: changeHistory.length + 1 // Include the current change
        };
        
        // Add to completed images
        setCompletedImages(prev => [...prev, finalImage]);
        
        // Reset the change history for the next round of edits
        setChangeHistory([]);
        setCurrentChangeIndex(-1);
        
        // Get the current image ID to remove it from the pending queue
        const currentImageId = currentImageBeingProcessed?.id;
        
        // Update pending images queue - remove the current image
        setPendingImages(prev => {
            // Filter out the current image
            const updatedQueue = prev.filter(img => img.id !== currentImageId);
            return updatedQueue;
        });
        
        // Clear canvases
        if (originalCanvasRef.current && processedCanvasRef.current) {
            const processedCanvas = processedCanvasRef.current;
            const processedCtx = processedCanvas.getContext('2d');
            processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
            
            const originalCanvas = originalCanvasRef.current;
            const originalCtx = originalCanvas.getContext('2d');
            originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        }
        
        // After removing the current image from the queue, check if there are more images
        // and set the next one as the current image being processed
        setTimeout(() => {
            setPendingImages(prevPendingImages => {
                if (prevPendingImages.length > 0) {
                    // Get the next image from the queue
                    const nextImage = prevPendingImages[0];
                    
                    // Set it as the current image being processed
                    setCurrentImageBeingProcessed(nextImage);
                    setActiveDisplayImage(nextImage);
                    
                    // Load the next original image onto the canvas
                    if (originalCanvasRef.current) {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = originalCanvasRef.current;
                            if (canvas) {
                                const ctx = canvas.getContext('2d');
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                canvas.width = img.naturalWidth;
                                canvas.height = img.naturalHeight;
                                ctx.drawImage(img, 0, 0);
                            }
                        };
                        img.src = nextImage.original;
                    }
                    
                    setError({ type: 'success', message: 'Image saved! Next image loaded.' });
                } else {
                    // No more images in the queue
                    setCurrentImageBeingProcessed(null);
                    setActiveDisplayImage(null);
                    setError({ type: 'success', message: 'Image saved! Queue empty.' });
                }
                return prevPendingImages;
            });
        }, 100); // Small delay to ensure state updates happen in sequence
        
        // Clear success message after 2 seconds
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [activeDisplayImage, currentImageBeingProcessed, sourceColor, targetColor, tolerance, changeHistory]);

    // Display number of stacked changes
    const getChangeCountLabel = useCallback(() => {
        if (changeHistory.length === 0) {
            return null;
        }
        
        return `${changeHistory.length + 1} change${changeHistory.length > 0 ? 's' : ''} stacked`;
    }, [changeHistory]);

    // Now conditionally render based on isMobile state at the RETURN statement
    if (isMobile) {
        return <ColorChangerMobile 
            initialImage={initialImage} 
            onReset={onReset} 
        />;
    }

    // Desktop UI rendering
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'white'
        }}>
            {/* Header */}
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
                >
                    <span>←</span> Back
                </button>
                
                <h1 style={{
                    fontSize: '1.5rem',
                    lineHeight: '2rem',
                    fontWeight: 500,
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>Color Changer</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ position: 'relative' }}>
                        <button
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
                        >
                            <span>↓</span> Download
                        </button>
                        
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
                height: 'calc(100vh - 72px - 80px)', // Adjusted to account for bottom toolbar
                overflow: 'hidden'
            }}>
                {/* Left Panel - Now has two distinct sections: History and Completed Images */}
                <div style={{
                    width: '16rem',
                    borderRight: '1px solid #E5E7EB',
                    overflowY: 'auto',
                    padding: '1rem',
                    maxHeight: 'calc(100vh - 72px - 80px)', // Adjusted for bottom toolbar
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* SECTION 1: HISTORY panel shows the current working image with changes */}
                    <div style={{
                        marginBottom: '1rem',
                        flex: '0 0 auto'
                    }}>
                        <h2 style={{
                            textTransform: 'uppercase',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#000000',
                            marginBottom: '0.75rem',
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}>HISTORY</h2>
                        
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.75rem' 
                        }}>
                            {changeHistory.length > 0 ? (
                                <div style={{
                                    color: '#000000',
                                    fontSize: '0.875rem',
                                    padding: '0.5rem',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                    backgroundColor: '#F9FAFB',
                                    borderRadius: '0.25rem',
                                    border: '1px solid #E5E7EB'
                                }}>
                                    {changeHistory.length} change{changeHistory.length !== 1 ? 's' : ''} in current edit
                                </div>
                            ) : (
                                <div style={{
                                    color: '#6B7280',
                                    fontSize: '0.875rem',
                                    textAlign: 'center',
                                    padding: '1rem 0',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                    No changes yet
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* SECTION 2: COMPLETED IMAGES section with toggle */}
                    <div style={{
                        marginBottom: '1rem',
                        flex: '1 1 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        borderTop: '1px solid #E5E7EB',
                        paddingTop: '1rem'
                    }}>
                        {/* Completed Images Header with Toggle Button */}
                        <div 
                            style={{
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                            onClick={toggleCompletedExpansion}
                        >
                            <h2 style={{
                                textTransform: 'uppercase',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#000000',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}>
                                COMPLETED IMAGES ({completedImages.length})
                            </h2>
                            <span>{isCompletedExpanded ? '▲' : '▼'}</span>
                        </div>
                        
                        {/* Completed Images Content */}
                        {isCompletedExpanded && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                                overflowY: 'auto',
                                flex: '1 1 auto'
                            }}>
                                {completedImages.map(img => (
                                    <div 
                                        key={img.id} 
                                        style={{
                                            border: activeDisplayImage && activeDisplayImage.id === img.id 
                                                ? '1px solid #abf134' 
                                                : '1px solid #E5E7EB',
                                            borderRadius: '0.25rem',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}
                                    >
                                        <div 
                                            style={{ 
                                                position: 'relative',
                                                height: '120px',
                                                width: '100%',
                                                cursor: 'pointer'
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
                                            
                                            {/* Show changes count badge if image has multiple changes */}
                                            {img.changesCount > 1 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '0.25rem',
                                                    left: '0.25rem',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                    color: 'white',
                                                    fontSize: '0.625rem',
                                                    padding: '0.125rem 0.375rem',
                                                    borderRadius: '9999px',
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                                }}>
                                                    {img.changesCount} changes
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* NEW: Redo button - replaces the delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRedoImage(img.id);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '0.25rem',
                                                right: '0.25rem',
                                                backgroundColor: 'rgba(31, 41, 55, 0.6)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.625rem',
                                                fontWeight: 500
                                            }}
                                            title="Move back to queue for processing"
                                        >
                                            Redo
                                        </button>
                                    </div>
                                ))}
                                
                                {completedImages.length === 0 && (
                                    <div style={{
                                        color: '#6B7280',
                                        fontSize: '0.875rem',
                                        textAlign: 'center',
                                        padding: '2rem 0',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                        No completed images yet
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* SECTION 3: REMAINING QUEUE section with toggle */}
                    <div style={{
                        flex: '0 0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        borderTop: '1px solid #E5E7EB',
                        paddingTop: '1rem'
                    }}>
                        {/* Queue Header with Toggle Button */}
                        <div 
                            style={{
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                            onClick={toggleQueueExpansion}
                        >
                            <h2 style={{
                                textTransform: 'uppercase',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#000000',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                REMAINING QUEUE ({pendingImages.length})
                            </h2>
                            <span>{isQueueExpanded ? '▲' : '▼'}</span>
                        </div>
                        
                        {/* Queue Content - Only show when expanded */}
                        {isQueueExpanded && (
                            <div style={{
                                maxHeight: '200px',
                                overflowY: 'auto'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    {pendingImages.map((img, index) => (
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
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {pendingImages.length === 0 && (
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
                </div>
                
                {/* Center Panel - Canvas */}
                <div style={{
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column'
                }}>
                    {/* Mode Toggle Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 1rem',
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: '#F9FAFB'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
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
                                {viewMode === 'live' ? 'Live Mode' : 'Canvas Mode'}
                            </button>
                        </div>
                        
                        <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {viewMode === 'live' 
                                ? 'Select image from completed images' 
                                : 'Use slider to compare before & after'}
                            
                            {/* Show stacked changes count */}
                            {getChangeCountLabel() && (
                                <div style={{
                                    backgroundColor: '#E5E7EB',
                                    color: '#374151',
                                    fontSize: '0.75rem',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '9999px',
                                    fontWeight: 500
                                }}>
                                    {getChangeCountLabel()}
                                </div>
                            )}
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
                                            height: imageDimensions.height > 0 ? `${imageDimensions.height}px` : 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {/* Original Canvas - hidden for processing */}
                                            <canvas
                                                ref={originalCanvasRef}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    zIndex: 15,
                                                    cursor: isPickingColor ? 'crosshair' : 'default',
                                                    opacity: activeDisplayImage ? 0 : 1,
                                                    objectFit: 'contain'
                                                }}
                                                onClick={handlePickColor}
                                            />
                                            
                                            {/* Processed Canvas - hidden initially */}
                                            <canvas
                                                ref={processedCanvasRef}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    zIndex: 10,
                                                    display: 'none',
                                                    objectFit: 'contain'
                                                }}
                                            />
                                            
                                            {/* Fallback display for original image */}
                                            {!activeDisplayImage && currentImageBeingProcessed && (
                                                <img 
                                                    src={currentImageBeingProcessed.original} 
                                                    alt="Original" 
                                                    style={{ 
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain',
                                                        pointerEvents: 'none',
                                                        zIndex: isPickingColor ? 5 : 10
                                                    }}
                                                />
                                            )}
                                            
                                            {/* Display processed images */}
                                            {activeDisplayImage && (
                                                <>
                                                    {/* Original Image */}
                                                    <img 
                                                        src={activeDisplayImage.original} 
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
                                                    
                                                    {/* Processed Image with clip mask for slider - only shown if viewing a processed image */}
                                                    {activeDisplayImage.processed && (
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
                                                                zIndex: 20
                                                            }}
                                                        >
                                                            <img 
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
                                                    {viewMode === 'canvas' && activeDisplayImage.processed && (
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
                                                </>
                                            )}
                                            
                                            {/* Color picking indicator */}
                                            {isPickingColor && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                    color: 'white',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.25rem',
                                                    zIndex: 50
                                                }}>
                                                    Click on the image to select a color
                                                </div>
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
            </div>
            
            {/* Bottom Toolbar - Controls */}
            <div style={{
                borderTop: '1px solid #E5E7EB',
                height: '80px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'white'
            }}>
                {/* Color Selection Controls */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flex: 1
                }}>
                    {/* Source Color */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.25rem'
                    }}>
                        <label style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#4B5563'
                        }}>
                            Source Color
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '2rem',
                                height: '2rem',
                                backgroundColor: currentImageBeingProcessed?.sourceColor || sourceColor,
                                borderRadius: '0.25rem',
                                border: '1px solid #D1D5DB'
                            }}></div>
                            <input
                                type="text"
                                value={currentImageBeingProcessed?.sourceColor || sourceColor}
                                readOnly
                                style={{
                                    width: '5rem',
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#000000',
                                    backgroundColor: '#F3F4F6',
                                    cursor: 'not-allowed'
                                }}
                            />
                            <button
                                onClick={() => setIsPickingColor(!isPickingColor)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '0.25rem',
                                    backgroundColor: isPickingColor ? '#abf134' : '#F3F4F6',
                                    border: '1px solid #D1D5DB',
                                    cursor: 'pointer'
                                }}
                                title="Pick color from image"
                            >
                                <Pipette className="h-4 w-4" color={isPickingColor ? "#000000" : "#4B5563"} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Target Color - With hex validation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#4B5563'
                        }}>
                            Target Color
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="color"
                                value={currentImageBeingProcessed?.targetColor || targetColor}
                                onChange={(e) => handleUpdateTargetColor(e.target.value)}
                                style={{
                                    width: '2rem',
                                    height: '2rem',
                                    padding: 0,
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer'
                                }}
                            />
                            <input
                                type="text"
                                value={currentImageBeingProcessed?.targetColor || targetColor}
                                onChange={handleTargetColorChange}
                                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                maxLength={7}
                                style={{
                                    width: '5rem',
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #D1D5DB',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#000000'
                                }}
                            />
                        </div>
                    </div>
                    
                    {/* Color Tolerance */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '12rem' }}>
                        <label style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#4B5563'
                        }}>
                            Color Tolerance: {currentImageBeingProcessed?.tolerance || tolerance}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={currentImageBeingProcessed?.tolerance || tolerance}
                            onChange={(e) => handleUpdateTolerance(parseInt(e.target.value))}
                            style={{
                                width: '100%'
                            }}
                        />
                    </div>
                </div>
                
                {/* Action buttons */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                }}>
                    <button
                        onClick={handleReset}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.25rem',
                            border: '1px solid #D1D5DB',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            color: '#4B5563',
                            fontSize: '0.875rem'
                        }}
                    >
                        <span style={{ fontSize: '0.875rem' }}>↺</span>
                        Reset
                    </button>
                    
                    {/* Append Button */}
                    <button
                        onClick={handleAppendChange}
                        disabled={!activeDisplayImage || !activeDisplayImage.processed}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: !activeDisplayImage || !activeDisplayImage.processed ? '#F3F4F6' : '#fee440',
                            color: !activeDisplayImage || !activeDisplayImage.processed ? '#9CA3AF' : '#000000',
                            borderRadius: '0.25rem',
                            fontWeight: 500,
                            cursor: !activeDisplayImage || !activeDisplayImage.processed ? 'not-allowed' : 'pointer',
                            border: 'none',
                            fontSize: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        <span style={{ fontSize: '0.875rem' }}>+</span>
                        Append
                    </button>
                    
                    {/* Done Button */}
                    <button
                        onClick={handleDone}
                        disabled={!activeDisplayImage || !activeDisplayImage.processed}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: !activeDisplayImage || !activeDisplayImage.processed ? '#F3F4F6' : '#4338ca',
                            color: !activeDisplayImage || !activeDisplayImage.processed ? '#9CA3AF' : 'white',
                            borderRadius: '0.25rem',
                            fontWeight: 500,
                            cursor: !activeDisplayImage || !activeDisplayImage.processed ? 'not-allowed' : 'pointer',
                            border: 'none',
                            fontSize: '0.875rem'
                        }}
                    >
                        Done
                    </button>
                    
                    <button
                        onClick={handleProcessImage}
                        disabled={isProcessing || !currentImageBeingProcessed}
                        style={{
                            padding: '0.5rem 1.5rem',
                            backgroundColor: !currentImageBeingProcessed ? '#F3F4F6' : '#abf134',
                            color: !currentImageBeingProcessed ? '#9CA3AF' : '#000000',
                            borderRadius: '0.25rem',
                            fontWeight: 500,
                            cursor: !currentImageBeingProcessed ? 'not-allowed' : 'pointer',
                            border: 'none',
                            fontSize: '0.875rem'
                        }}
                    >
                        {isProcessing ? 'Processing...' : 'Process Image'}
                    </button>
                </div>
            </div>
            
            {/* Error Message */}
            {error && (
                <div style={{
                    position: 'fixed',
                    bottom: '1rem',
                    right: '1rem',
                    backgroundColor: error.type === 'success' ? '#DEF7EC' : '#FEE2E2',
                    border: `1px solid ${error.type === 'success' ? '#10B981' : '#F87171'}`,
                    color: error.type === 'success' ? '#046C4E' : '#B91C1C',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.25rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: '16rem'
                }}>
                    {error.message || error}
                    <button 
                        style={{
                            marginLeft: '0.75rem',
                            color: error.type === 'success' ? '#046C4E' : '#B91C1C',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem'
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

export default ColorChangerEditor;