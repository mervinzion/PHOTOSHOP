// PowerPaintEditor_s2.jsx - Canvas operations, drawing functions and image processing
import React from 'react';

// ===================================
// Canvas and Drawing Operations
// ===================================

// Initialize canvas with image
export const initializeCanvas = (img, containerRef, canvasRef, maskCanvasRef, panelsHidden) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!container || !canvas || !maskCanvas) return;

    // Get actual container dimensions
    const containerRect = container.getBoundingClientRect();
    
    // Calculate available space, accounting for panels
    const containerWidth = containerRect.width - (panelsHidden ? 40 : 460); 
    const containerHeight = containerRect.height - 120;

    // Calculate scale to fit image
    const scale = Math.min(
        containerWidth / img.width,
        containerHeight / img.height
    ) * (panelsHidden ? 0.98 : 0.95);

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Set canvas dimensions
    [canvas, maskCanvas].forEach(c => {
        c.style.width = `${scaledWidth}px`;
        c.style.height = `${scaledHeight}px`;
        c.width = img.width;
        c.height = img.height;

        const ctx = c.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        c.style.maxWidth = '100%';
        c.style.margin = '0 auto';
    });

    // Draw initial image
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, img.width, img.height);

    return context;
};

// Handle canvas resize
export const resizeCanvas = (imageSrc, containerRef, canvasRef, maskCanvasRef, panelsHidden) => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const img = new Image();
    img.onload = () => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;

        if (!container || !canvas || !maskCanvas) return;

        // Get container dimensions
        const containerRect = container.getBoundingClientRect();
        
        // Calculate available space
        const containerWidth = containerRect.width - (panelsHidden ? 80 : 480);
        const containerHeight = containerRect.height - 180;

        // Calculate scale
        const scale = Math.min(
            containerWidth / img.width,
            containerHeight / img.height
        ) * (panelsHidden ? 0.90 : 0.85);

        // Set canvas dimensions
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        [canvas, maskCanvas].forEach(c => {
            c.style.width = `${scaledWidth}px`;
            c.style.height = `${scaledHeight}px`;
        });
    };
    img.src = imageSrc;
};

// Drawing Operations
export const startDrawing = (event, isCanvasLocked, isZoomed, zoomDrawMode, isDrawing, 
    mode, maskContextRef, maskCanvasRef, zoomLevel, panPosition, lastPoint, hasDrawnRef, setIsDrawing) => {
    
    if (isCanvasLocked) return;
    if (isZoomed && !zoomDrawMode) return;
    if (isDrawing) return;
    
    let nativeEvent;
    if (event.type === 'touchstart') {
        nativeEvent = event.touches[0];
        event.preventDefault();
    } else {
        nativeEvent = event;
        if (nativeEvent.button !== 0) return;
    }
    
    if (mode === 'original') return;
    if (!maskContextRef.current) return;
    
    const { x, y } = getCanvasCoordinates(nativeEvent.clientX, nativeEvent.clientY, maskCanvasRef, zoomLevel, panPosition);
    lastPoint.current = { x, y };
    
    // Draw a point
    maskContextRef.current.beginPath();
    maskContextRef.current.arc(x, y, event.brushSize || 20, 0, Math.PI * 2);
    maskContextRef.current.fillStyle = 'rgba(255, 0, 0, 0.2)';
    maskContextRef.current.fill();
    
    hasDrawnRef.current = true;
    setIsDrawing(true);
};

export const draw = (event, isCanvasLocked, isZoomed, zoomDrawMode, isDrawing, 
    mode, maskContextRef, maskCanvasRef, zoomLevel, panPosition, lastPoint, hasDrawnRef) => {
    
    if (isCanvasLocked) return;
    if (isZoomed && !zoomDrawMode) return;
    if (!isDrawing || !maskContextRef.current) return;
    if (mode === 'original') return;
    
    let nativeEvent;
    if (event.type === 'touchmove') {
        nativeEvent = event.touches[0];
        event.preventDefault();
    } else {
        nativeEvent = event;
    }

    const { x, y } = getCanvasCoordinates(nativeEvent.clientX, nativeEvent.clientY, maskCanvasRef, zoomLevel, panPosition);
    
    // Draw a line segment
    maskContextRef.current.beginPath();
    maskContextRef.current.moveTo(lastPoint.current.x, lastPoint.current.y);
    maskContextRef.current.lineTo(x, y);
    maskContextRef.current.lineWidth = (event.brushSize || 20) * 2;
    maskContextRef.current.strokeStyle = 'rgba(255, 0, 0, 0.2)';
    maskContextRef.current.stroke();
    
    hasDrawnRef.current = true;
    lastPoint.current = { x, y };
};

export const stopDrawing = (isCanvasLocked, isZoomed, zoomDrawMode, isDrawing, 
    mode, maskContextRef, maskCanvasRef, hasDrawnRef, setIsDrawing) => {
    
    if (isCanvasLocked) return;
    if (isZoomed && !zoomDrawMode) return;
    if (isDrawing) {
        setIsDrawing(false);
    } else {
        return;
    }
    
    if (mode === 'original' || !maskContextRef.current) return;
    
    // We want to keep track that the user has drawn something, but not process it yet
    const maskData = maskContextRef.current.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    let hasContent = false;
    for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i] > 0) { 
            hasContent = true;
            break;
        }
    }
    
    if (!hasContent) return;
    hasDrawnRef.current = true;
};

// Get canvas coordinates from client coordinates
export const getCanvasCoordinates = (clientX, clientY, maskCanvasRef, zoomLevel, panPosition) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Adjust for zoom and pan if needed
    const zoomFactor = zoomLevel > 0 ? 1 + (zoomLevel * 0.1) : 1;
    
    // Calculate the display coordinates (with zoom and pan)
    const displayX = (clientX - rect.left) * zoomFactor + (panPosition ? panPosition.x * zoomFactor : 0);
    const displayY = (clientY - rect.top) * zoomFactor + (panPosition ? panPosition.y * zoomFactor : 0);
    
    // Convert to canvas coordinates
    const x = displayX * scaleX;
    const y = displayY * scaleY;
    
    return { x, y };
};

// Load image to canvas
export const loadImageToCanvas = (imageSrc, contextRef, canvasRef, maskContextRef, index, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem) => {
    const img = new Image();
    img.onload = () => {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        contextRef.current.drawImage(img, 0, 0);
        maskContextRef.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (index !== undefined) {
            setHistoryIndex(index);
            setCurrentHistoryItem(history[index]);
            if (history[index] && !history[index].isOriginal) {
                setLastNonOriginalItem(history[index]);
            }
        }
    };
    img.src = imageSrc;
};

// Backup and restore mask canvas
export const backupMaskCanvas = (maskCanvasRef, maskContextRef) => {
    if (!maskCanvasRef.current) return;
    
    return maskContextRef.current.getImageData(
        0, 0, 
        maskCanvasRef.current.width, 
        maskCanvasRef.current.height
    );
};

export const restoreMaskCanvas = (maskContextRef, backupData) => {
    if (!maskContextRef.current || !backupData) return;
    
    maskContextRef.current.putImageData(
        backupData,
        0, 0
    );
};

// Check if brush is disabled
export const isBrushDisabled = (mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) => {
    return mode === 'original' || mode === 'sam' || isLoading || isCanvasLocked || (isZoomed && !zoomDrawMode);
};

// ===================================
// Zoom and Pan Operations
// ===================================

// Zoom controls
export const handleZoomIn = (zoomLevel, setZoomLevel, MAX_ZOOM_LEVEL, setShowZoomControls, setIsZoomed) => {
    const newLevel = Math.min(zoomLevel + 1, MAX_ZOOM_LEVEL);
    setZoomLevel(newLevel);
    
    if (newLevel > 0 && zoomLevel === 0) {
        setShowZoomControls(true);
    }
    
    if (!setIsZoomed._isZoomed) {
        setIsZoomed(true);
    }
    
    return newLevel;
};

export const handleZoomOut = (zoomLevel, setZoomLevel, setPanPosition) => {
    const newLevel = Math.max(zoomLevel - 1, 0);
    setZoomLevel(newLevel);
    
    if (newLevel === 0) {
        setPanPosition({ x: 0, y: 0 });
    }
    
    return newLevel;
};

export const getZoomPercentage = (level) => {
    return 100 + (level * 10);
};

export const resetZoom = (setZoomLevel, setPanPosition) => {
    setZoomLevel(0);
    setPanPosition({ x: 0, y: 0 });
};

export const exitZoomMode = (setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls) => {
    setZoomLevel(0);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
    setZoomDrawMode(false);
    setShowZoomControls(false);
};

// Pan operations
export const startPanning = (event, isZoomed, zoomDrawMode, isDrawing, setIsPanning, setLastPanPos) => {
    if (!isZoomed || zoomDrawMode || isDrawing) return;

    let nativeEvent;
    if (event.type === 'touchstart') {
        nativeEvent = event.touches[0];
        event.preventDefault();
    } else {
        nativeEvent = event;
        if (nativeEvent.button !== 0) return;
    }

    setIsPanning(true);
    setLastPanPos({
        x: nativeEvent.clientX,
        y: nativeEvent.clientY
    });
};

export const handlePanning = (event, isPanning, isZoomed, lastPanPos, canvasRef, zoomLevel, setPanPosition, setLastPanPos) => {
    if (!isPanning || !isZoomed) return;

    let nativeEvent;
    if (event.type === 'touchmove') {
        nativeEvent = event.touches[0];
        event.preventDefault();
    } else {
        nativeEvent = event;
    }

    const deltaX = nativeEvent.clientX - lastPanPos.x;
    const deltaY = nativeEvent.clientY - lastPanPos.y;

    setLastPanPos({
        x: nativeEvent.clientX,
        y: nativeEvent.clientY
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const zoomFactor = 1 + (zoomLevel * 0.1);

    const maxPanX = (rect.width * (zoomFactor - 1)) / (2 * zoomFactor);
    const maxPanY = (rect.height * (zoomFactor - 1)) / (2 * zoomFactor);

    setPanPosition(prev => {
        const newX = Math.max(-maxPanX, Math.min(maxPanX, prev.x - deltaX / zoomFactor));
        const newY = Math.max(-maxPanY, Math.min(maxPanY, prev.y - deltaY / zoomFactor));
        return { x: newX, y: newY };
    });
};

export const stopPanning = (setIsPanning) => {
    setIsPanning(false);
};

// ===================================
// Image Processing Functions
// ===================================

// SAM (Segment Anything Model) functions
export const handleSamClick = (nativeEvent, maskCanvasRef, maskContextRef, setSamPoints) => {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (nativeEvent.clientX - rect.left) * scaleX / canvas.width;
    const y = (nativeEvent.clientY - rect.top) * scaleY / canvas.height;

    setSamPoints(prev => [...prev, { x, y }]);

    const ctx = maskContextRef.current;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x * canvas.width, y * canvas.height, 5, 0, 2 * Math.PI);
    ctx.fill();
};

export const generateSamMask = async (samPoints, canvasRef, maskCanvasRef, maskContextRef, setIsLoading) => {
    if (samPoints.length === 0) return;

    try {
        setIsLoading(true);
        const imageDataUrl = canvasRef.current.toDataURL('image/png');

        const response = await fetch('http://localhost:8000/api/sam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                points: samPoints,
                image: imageDataUrl
            })
        });

        if (!response.ok) throw new Error('SAM API call failed');

        const data = await response.json();

        const img = new Image();
        img.onload = () => {
            maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
            maskContextRef.current.drawImage(img, 0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        };
        img.src = `data:image/png;base64,${data.mask}`;

        return true;
    } catch (error) {
        console.error('Error generating SAM mask:', error);
        return false;
    } finally {
        setIsLoading(false);
    }
};

// Inpainting function
export const handleInpaint = async (
    prompt, negativePrompt, modelType, steps, guidanceScale, seed,
    canvasRef, maskCanvasRef, maskContextRef, maskBackupRef,
    contextRef, historyIndex, history, setHistory, setHistoryIndex,
    setCurrentHistoryItem, setLastNonOriginalItem, historyPageIndex,
    setHistoryPageIndex, TABS_PER_PAGE, hasDrawnRef, historyContainerRef,
    scrollTabIntoView, setIsLoading, backupMaskCanvas, restoreMaskCanvas
) => {
    if (!prompt) {
        alert("Please enter a prompt before generating.");
        return;
    }
    
    // Check if there's any content in the mask
    const maskData = maskContextRef.current.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    let hasContent = false;
    for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i] > 0) { 
            hasContent = true;
            break;
        }
    }
    
    if (!hasContent) {
        alert("Please paint an area to modify before generating.");
        return;
    }

    try {
        maskBackupRef.current = backupMaskCanvas(maskCanvasRef, maskContextRef);
        setIsLoading(true);
        const imageDataUrl = canvasRef.current.toDataURL('image/png');
        const maskDataUrl = maskCanvasRef.current.toDataURL('image/png');

        // Create request payload with explicit type conversion
        const payload = {
            model_type: modelType,
            prompt,
            negative_prompt: negativePrompt,
            steps: parseInt(steps), // Ensure it's an integer
            guidance_scale: parseFloat(guidanceScale), // Ensure it's a float
            seed,
            image: imageDataUrl,
            mask: maskDataUrl
        };

        console.log('Sending inpaint request with steps:', payload.steps);

        const response = await fetch('http://localhost:8000/api/inpaint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Inpainting failed: ${errorText}`);
        }

        const data = await response.json();

        const img = new Image();
        img.onload = () => {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            contextRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);

            // Create history item with the processed image
            const newHistoryItem = {
                id: Date.now(),
                processedImage: `data:image/png;base64,${data.processed_image}`,
                isOriginal: false
            };

            // If we have history after the current point, remove it
            if (historyIndex < history.length - 1) {
                setHistory(prev => prev.slice(0, historyIndex + 1));
            }

            // Add the new item and update the index
            setHistory(prev => [...prev, newHistoryItem]);
            setHistoryIndex(prev => prev + 1);
            setCurrentHistoryItem(newHistoryItem);
            setLastNonOriginalItem(newHistoryItem);

            // Update page index for pagination
            const nonOriginalItems = [...history, newHistoryItem].filter(item => !item.isOriginal);
            const newItemIndex = nonOriginalItems.length - 1;
            setHistoryPageIndex(Math.floor(newItemIndex / TABS_PER_PAGE));

            // Clear the mask after successful inpainting
            maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
            
            // Reset drawn state
            hasDrawnRef.current = false;
            
            // Scroll the new tab into view
            setTimeout(() => {
                scrollTabIntoView(historyContainerRef, newHistoryItem.id);
            }, 100);
        };
        img.src = `data:image/png;base64,${data.processed_image}`;

        return true;
    } catch (error) {
        console.error('Error during inpainting:', error);
        alert(`Error: ${error.message}`);
        // Restore the mask canvas if there's an error
        restoreMaskCanvas(maskContextRef, maskBackupRef.current);
        return false;
    } finally {
        setIsLoading(false);
    }
};

// ===================================
// Image Management Functions
// ===================================

// Download functions
export const downloadCurrentImage = (canvasRef) => {
    const currentCanvasState = canvasRef.current.toDataURL('image/png');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.download = `powerpaint-${timestamp}.png`;
    link.href = currentCanvasState;
    link.click();
};

export const handleBulkDownload = async (processedImages, setIsLoading) => {
    if (processedImages.length === 0) return;
    
    try {
        setIsLoading(true);
        processedImages.forEach((img, index) => {
            const link = document.createElement('a');
            link.download = `processed-image-${index}.png`;
            link.href = img.processedImage;
            link.click();
            setTimeout(() => {}, 200);
        });
    } catch (error) {
        console.error('Error downloading images:', error);
    } finally {
        setIsLoading(false);
    }
};

// Image navigation 
export const navigateImages = (direction, currentImageIndex, pendingImages, setCurrentImageIndex, 
    setHistory, setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef) => {
    
    if (pendingImages.length <= 1) return;
    
    let newIndex;
    if (direction === 'next') {
        newIndex = (currentImageIndex + 1) % pendingImages.length;
    } else {
        newIndex = (currentImageIndex - 1 + pendingImages.length) % pendingImages.length;
    }
    
    setCurrentImageIndex(newIndex);
    
    const initialHistoryItem = {
        id: 'original',
        processedImage: pendingImages[newIndex],
        isOriginal: true
    };
    setHistory([initialHistoryItem]);
    setCurrentHistoryItem(initialHistoryItem);
    setHistoryIndex(0);
    
    if (mode === 'original') {
        setMode('brush');
        if (maskCanvasRef.current) {
            maskCanvasRef.current.style.display = 'block';
        }
    }
    
    return newIndex;
};

// Approve and recover image functions
export const handleApproveImage = (pendingImages, isLoading, currentHistoryItem, 
    setProcessedImages, currentImageIndex, setPendingImages, setCurrentImageIndex, 
    setHistory, setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef) => {
    
    if (pendingImages.length === 0 || isLoading) return;
    
    const currentProcessedImage = currentHistoryItem && !currentHistoryItem.isOriginal 
        ? currentHistoryItem.processedImage 
        : pendingImages[currentImageIndex];
        
    setProcessedImages(prev => [...prev, {
        originalImage: pendingImages[currentImageIndex],
        processedImage: currentProcessedImage,
        timestamp: Date.now()
    }]);
    
    const newPendingImages = [...pendingImages];
    newPendingImages.splice(currentImageIndex, 1);
    setPendingImages(newPendingImages);
    
    if (currentImageIndex >= newPendingImages.length) {
        setCurrentImageIndex(Math.max(0, newPendingImages.length - 1));
    }
    
    if (newPendingImages.length > 0) {
        const initialHistoryItem = {
            id: 'original',
            processedImage: newPendingImages[Math.min(currentImageIndex, newPendingImages.length - 1)],
            isOriginal: true
        };
        setHistory([initialHistoryItem]);
        setCurrentHistoryItem(initialHistoryItem);
        setHistoryIndex(0);
        
        if (mode === 'original') {
            setMode('brush');
            if (maskCanvasRef.current) {
                maskCanvasRef.current.style.display = 'block';
            }
        }
    }
};

export const handleRecoverImage = (imageIndex, processedImages, isLoading, 
    setPendingImages, setProcessedImages, pendingImages, setCurrentImageIndex, 
    setHistory, setCurrentHistoryItem, setHistoryIndex, mode, setMode, 
    maskCanvasRef, activePanel, setLeftPanelActiveIndex) => {
    
    if (processedImages.length === 0 || isLoading) return;
    
    // Get the image to recover
    const imageToRecover = processedImages[imageIndex];
    
    // Add the original image back to pending images
    setPendingImages(prev => [...prev, imageToRecover.originalImage]);
    
    // Remove from processed images
    const newProcessedImages = [...processedImages];
    newProcessedImages.splice(imageIndex, 1);
    setProcessedImages(newProcessedImages);
    
    // If we just recovered the only processed image, switch to the new pending image
    if (newProcessedImages.length === 0 && pendingImages.length === 0) {
        // Reset to newly added image
        setCurrentImageIndex(0);
        
        // Reset history for the new image
        const initialHistoryItem = {
            id: 'original',
            processedImage: imageToRecover.originalImage,
            isOriginal: true
        };
        setHistory([initialHistoryItem]);
        setCurrentHistoryItem(initialHistoryItem);
        setHistoryIndex(0);
        
        // Exit original view if active
        if (mode === 'original') {
            setMode('brush');
            if (maskCanvasRef.current) {
                maskCanvasRef.current.style.display = 'block';
            }
        }
    }
    
    // Update left panel active index if needed
    if (activePanel === 'left') {
        if (imageIndex >= newProcessedImages.length) {
            setLeftPanelActiveIndex(Math.max(0, newProcessedImages.length - 1));
        }
    }
};

// View mode toggle
export const toggleOriginalView = (mode, setMode, maskCanvasRef, 
    pendingImages, currentImageIndex, history, setHistoryIndex, 
    setCurrentHistoryItem, loadImageToCanvas) => {
    
    if (mode === 'brush') {
        setMode('original');
        maskCanvasRef.current.style.display = 'none';
        loadImageToCanvas(
            pendingImages[currentImageIndex]
        );
    } else {
        setMode('brush');
        maskCanvasRef.current.style.display = 'block';
        
        const nonOriginalItems = history.filter(item => !item.isOriginal);
        
        if (nonOriginalItems.length > 0) {
            const lastEditedItem = nonOriginalItems[nonOriginalItems.length - 1];
            const lastEditIndex = history.findIndex(item => item.id === lastEditedItem.id);
            
            setHistoryIndex(lastEditIndex);
            setCurrentHistoryItem(lastEditedItem);
            loadImageToCanvas(
                lastEditedItem.processedImage,
                lastEditIndex
            );
            
            return lastEditIndex;
        }
    }
};

// ===================================
// Utils
// ===================================

// Scroll tab into view
export const scrollTabIntoView = (historyContainerRef, tabId) => {
    if (!historyContainerRef.current) return;
    
    // Find the tab element by its id
    const tabElement = historyContainerRef.current.querySelector(`[data-tab-id="${tabId}"]`);
    if (!tabElement) return;
    
    const container = historyContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const tabRect = tabElement.getBoundingClientRect();
    
    // Check if tab is outside visible area (left or right)
    const isTabOutsideLeft = tabRect.left < containerRect.left;
    const isTabOutsideRight = tabRect.right > containerRect.right;
    
    if (isTabOutsideLeft || isTabOutsideRight) {
        // Calculate scroll position to center the tab
        const targetScrollLeft = isTabOutsideLeft 
            ? container.scrollLeft - (containerRect.left - tabRect.left) - (containerRect.width / 2 - tabRect.width / 2)
            : container.scrollLeft + (tabRect.right - containerRect.right) + (containerRect.width / 2 - tabRect.width / 2);
        
        // Scroll with animation
        animateScroll(container, targetScrollLeft);
    }
};

// Animate scroll
export const animateScroll = (element, targetScrollLeft) => {
    const startScrollLeft = element.scrollLeft;
    const distance = targetScrollLeft - startScrollLeft;
    const duration = 300; // ms - shortened for more responsive feel
    const startTime = performance.now();
    
    // Animate with easing for smooth motion
    const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Ease out cubic function for smooth deceleration
        const easeOutCubic = (t) => {
            return 1 - Math.pow(1 - t, 3);
        };
        
        const computedProgress = easeOutCubic(progress);
        element.scrollLeft = startScrollLeft + distance * computedProgress;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
};

// Create custom styles for the app
export const createCustomStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      
      .zoom-controls {
        position: absolute;
        bottom: 85px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 40;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        user-select: none;
        width: 200px;
      }
      
      .pan-handle {
        cursor: grab;
      }
      .pan-handle:active {
        cursor: grabbing;
      }
      
      .zoom-transition {
        transition: transform 0.2s ease-out;
      }
  
      .fade-in {
        animation: fadeIn 0.2s ease-in-out;
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
  
      .slide-up {
        animation: slideUp 0.3s ease-out;
      }
      @keyframes slideUp {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      
      .focus-ring:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }
      
      .panel-active {
        outline: 2px solid #3b82f6;
        z-index: 10;
      }
      
      /* Add backdrop blur support */
      .backdrop-blur-sm {
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
      }
      
      .backdrop-blur-md {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      
      .backdrop-blur-lg {
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      
      /* Improved range input styling */
      input[type=range] {
        -webkit-appearance: none;
        height: 6px;
        border-radius: 5px;
        background: #e2e8f0;
        outline: none;
      }
      
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
      }
      
      input[type=range]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
      }
      
      .glass-panel {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .glass-control {
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
      }
      
      .glass-button {
        background: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s ease;
      }
      
      .glass-button:hover {
        background: rgba(255, 255, 255, 0.7);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }
    `;
    return style;
};

// Check if drawing is possible
export const canDrawOnCanvas = (mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) => {
    return mode !== 'original' && mode !== 'sam' && !isLoading && !isCanvasLocked && (!isZoomed || zoomDrawMode);
};

// Toggle fit to screen mode
export const toggleFitScreen = (setPanelsHidden, setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode) => {
    setPanelsHidden(prev => !prev);
    setZoomLevel(0);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
    setZoomDrawMode(false);
};

// Constants
export const MAX_ZOOM_LEVEL = 40;
export const TABS_PER_PAGE = 4;