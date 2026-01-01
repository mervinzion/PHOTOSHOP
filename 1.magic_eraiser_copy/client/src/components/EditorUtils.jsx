// Constants
export const TABS_PER_PAGE = 4;
export const MAX_ZOOM_LEVEL = 40;

// Utility Functions
export const getZoomPercentage = (zoomLevel) => {
  return 100 + (zoomLevel * 10);
};

// Canvas Drawing Functions
export const drawPoint = (ctx, x, y, brushSize) => {
  if (!ctx) return;
  
  // Use maximum opacity for the mask
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  
  // Draw a filled circle
  ctx.beginPath();
  ctx.arc(x, y, brushSize, 0, Math.PI * 2);
  ctx.fill();
};

export const drawLine = (ctx, x1, y1, x2, y2, brushSize) => {
  if (!ctx) return;
  
  // Special technique to prevent overlay buildup
  // Draw only what isn't already marked
  ctx.globalCompositeOperation = 'destination-out';
  
  // Draw a line as a series of points
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const steps = Math.max(Math.floor(dist / 5), 1); // One point every ~5 pixels
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    
    // Draw through the existing mask
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Switch back to normal drawing mode
  ctx.globalCompositeOperation = 'source-over';
  
  // Now draw the actual red color (will only affect the newly cleared areas)
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  }
};

// Canvas manipulation functions
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

// Scrolling utilities
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

// Apple-like smooth scroll animation with spring physics
export const animateScroll = (element, targetScrollLeft) => {
  const startScrollLeft = element.scrollLeft;
  const distance = targetScrollLeft - startScrollLeft;
  const duration = 500; // ms
  const startTime = performance.now();
  
  // Animate with spring physics for that Apple-like feel
  const animate = (currentTime) => {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Elastic easing function (mimics Apple's spring physics)
    // Based on cubic bezier with slight overshoot and bounce back
    const easeOutElastic = (t) => {
      const p = 0.3; // Elasticity factor
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    };
    
    const computedProgress = easeOutElastic(progress);
    element.scrollLeft = startScrollLeft + distance * computedProgress;
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

// Get actual canvas coordinates accounting for zoom and pan
export const getCanvasCoordinates = (clientX, clientY, maskCanvasRef, zoomLevel, panPosition) => {
  const canvas = maskCanvasRef.current;
  if (!canvas) return { x: 0, y: 0 };
  
  // Get the bounding rectangle - this INCLUDES all transformations already applied
  const rect = canvas.getBoundingClientRect();
  
  // Calculate the scale between displayed size and actual canvas size
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  // Calculate position within the transformed canvas element
  const displayX = clientX - rect.left;
  const displayY = clientY - rect.top;
  
  // Convert to actual canvas coordinates using the direct approach
  // Since getBoundingClientRect already includes the transform effects,
  // we just need to scale to the actual canvas dimensions
  const x = displayX * scaleX;
  const y = displayY * scaleY;
  
  return { x, y };
};

// Create custom CSS styles
export const createCustomStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .hide-scrollbar {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
    
    /* Add styles for the zoom controls */
    .zoom-controls {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 40;
      display: flex;
      flex-direction: column;
      padding: 4px;
      user-select: none;
    }
    
    /* Add styles for the pan handle indicator */
    .pan-handle {
      cursor: grab;
    }
    .pan-handle:active {
      cursor: grabbing;
    }
    
    /* Add transition for smooth zooming */
    .zoom-transition {
      transition: transform 0.2s ease-out;
    }
    
    /* CSS-based tooltip styles */
    .tooltip-container {
      position: relative;
      display: inline-flex;
    }
    
    .tooltip-text {
      visibility: hidden;
      background-color: #333;
      color: white;
      text-align: center;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      white-space: nowrap;
      position: absolute;
      z-index: 50;
      opacity: 0;
      transition: opacity 0.2s;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .tooltip-container:hover .tooltip-text,
    .tooltip-container:focus-within .tooltip-text {
      visibility: visible;
      opacity: 1;
    }
    
    .tooltip-top .tooltip-text {
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 8px;
    }
    
    .tooltip-bottom .tooltip-text {
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 8px;
    }
    
    .tooltip-left .tooltip-text {
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-right: 8px;
    }
    
    .tooltip-right .tooltip-text {
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      margin-left: 8px;
    }
    
    .tooltip-top .tooltip-text::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: #333 transparent transparent transparent;
    }
    
    .tooltip-bottom .tooltip-text::after {
      content: "";
      position: absolute;
      bottom: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent #333 transparent;
    }
    
    .tooltip-left .tooltip-text::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 100%;
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent transparent #333;
    }
    
    .tooltip-right .tooltip-text::after {
      content: "";
      position: absolute;
      top: 50%;
      right: 100%;
      margin-top: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent #333 transparent transparent;
    }
  `;
  return style;
};

// Event Handlers and Helper Functions
export const isBrushDisabled = (mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) => {
  return mode === 'original' || isLoading || isCanvasLocked || (isZoomed && !zoomDrawMode);
};

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

export const handleBulkDownload = (processedImages, setShowBulkDownloadConfirmation, setIsLoading) => {
  if (processedImages.length === 0) return;
  setShowBulkDownloadConfirmation(false);
  
  const downloadZip = async () => {
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
      console.error('Error creating zip file:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  downloadZip();
};

export const handleApproveImage = (
  pendingImages, isLoading, currentHistoryItem, currentImageIndex,
  setProcessedImages, setPendingImages, setCurrentImageIndex, setHistory, 
  setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
) => {
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

export const navigateImages = (
  direction, pendingImages, currentImageIndex, setCurrentImageIndex,
  setHistory, setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
) => {
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
};

export const toggleOriginalView = (
  mode, setMode, maskCanvasRef, pendingImages, currentImageIndex,
  loadImageToCanvas, history, setHistoryIndex, setCurrentHistoryItem, setHistoryPageIndex
) => {
  if (mode === 'brush') {
    setMode('original');
    maskCanvasRef.current.style.display = 'none';
    loadImageToCanvas(pendingImages[currentImageIndex]);
  } else {
    setMode('brush');
    maskCanvasRef.current.style.display = 'block';
    
    const nonOriginalItems = history.filter(item => !item.isOriginal);
    
    if (nonOriginalItems.length > 0) {
      const lastEditedItem = nonOriginalItems[nonOriginalItems.length - 1];
      const lastEditIndex = history.findIndex(item => item.id === lastEditedItem.id);
      
      setHistoryIndex(lastEditIndex);
      setCurrentHistoryItem(lastEditedItem);
      loadImageToCanvas(lastEditedItem.processedImage);
      
      const lastEditedItemIndex = nonOriginalItems.length - 1;
      setHistoryPageIndex(Math.floor(lastEditedItemIndex / TABS_PER_PAGE));
    } else {
      setMode('original');
      maskCanvasRef.current.style.display = 'none';
    }
  }
};

// Zoom and Pan Functions
export const exitZoomMode = (setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls) => {
  setZoomLevel(0);
  setPanPosition({ x: 0, y: 0 });
  setIsZoomed(false);
  setZoomDrawMode(false);
  setShowZoomControls(false);
};

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

export const handlePanning = (event, isPanning, isZoomed, lastPanPos, setLastPanPos, canvasRef, zoomLevel, setPanPosition) => {
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

export const handleZoomIn = (setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls) => {
  setZoomLevel(prev => {
    const newLevel = Math.min(prev + 1, MAX_ZOOM_LEVEL);
    if (newLevel > 0 && prev === 0) {
      setShowZoomControls(true);
    }
    return newLevel;
  });
  if (!isZoomed) {
    setIsZoomed(true);
  }
};

export const handleZoomOut = (setZoomLevel, setPanPosition) => {
  setZoomLevel(prev => {
    const newLevel = Math.max(prev - 1, 0);
    if (newLevel === 0) {
      setPanPosition({ x: 0, y: 0 });
    }
    return newLevel;
  });
};

export const handleResetZoom = (setZoomLevel, setPanPosition) => {
  setZoomLevel(0);
  setPanPosition({ x: 0, y: 0 });
};

export const fitImageToScreen = (setPanelsHidden, setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, pendingImages, currentImageIndex, contextRef, canvasRef, maskContextRef, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem) => {
  setPanelsHidden(prev => !prev);
  setZoomLevel(0);
  setPanPosition({ x: 0, y: 0 });
  setIsZoomed(false);
  setZoomDrawMode(false);
  
  const currentImg = pendingImages[currentImageIndex];
  loadImageToCanvas(
    currentImg, contextRef, canvasRef, maskContextRef, undefined,
    setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
  );
};

// Download-related Functions
export const handleDownload = (setShowDownloadDialog) => {
  setShowDownloadDialog(true);
};

export const downloadCurrentImage = (canvasRef, setShowDownloadDialog) => {
  const currentCanvasState = canvasRef.current.toDataURL('image/png');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const link = document.createElement('a');
  link.download = `inpainted-image-${timestamp}.png`;
  link.href = currentCanvasState;
  link.click();
  setShowDownloadDialog(false);
};

export const downloadAllImages = (processedImages, setShowDownloadDialog, setIsLoading) => {
  if (processedImages.length === 0) {
    alert('No processed images to download');
    setShowDownloadDialog(false);
    return;
  }
  
  handleBulkDownload(processedImages, setShowDownloadDialog, setIsLoading);
};