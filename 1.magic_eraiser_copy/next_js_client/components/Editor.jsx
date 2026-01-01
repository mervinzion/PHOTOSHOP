"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Download, CheckCircle, Share2, X, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ZoomIn,
  Lock, Unlock, Eye, Undo, Redo, Plus, Minus, MessageSquare, Menu
} from 'lucide-react';

// Import components from EditorComponents.jsx
import {
  Tooltip,
  LeftPanel,
  RightPanel,
  BrushSizeIndicator,
  ZoomControls,
  HistoryPanel
} from './EditorComponents';

// Import components from EditorDialogs.jsx
import {
  ContextMenu,
  InstructionsModal,
  FeedbackDialog,
  DeleteConfirmationDialog,
  ProcessingOverlay,
  DownloadDialog,
  BulkDownloadConfirmation
} from './EditorDialogs';

// Import mobile-specific components and utilities
import {
  MobileEditor,
  isMobileDevice
} from './EditorMobile';

// Import utilities from EditorUtils.jsx
import {
  // Constants
  TABS_PER_PAGE,
  MAX_ZOOM_LEVEL,

  // Utility functions
  getZoomPercentage,
  drawPoint,
  drawLine,
  backupMaskCanvas,
  restoreMaskCanvas,
  scrollTabIntoView,
  animateScroll,
  getCanvasCoordinates,
  createCustomStyles,

  // Canvas and image manipulation functions
  isBrushDisabled,
  loadImageToCanvas,
  handleBulkDownload,
  handleApproveImage,
  toggleOriginalView,

  // Zoom and pan functions
  exitZoomMode,
  startPanning,
  handlePanning,
  stopPanning,
  handleZoomIn,
  handleZoomOut,
  handleResetZoom,
  fitImageToScreen,

  // Download functions
  handleDownload,
  downloadCurrentImage,
  downloadAllImages
} from './EditorUtils';

const Editor = ({ initialImage, onReset }) => {
  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentHistoryItem, setCurrentHistoryItem] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyMinimized, setHistoryMinimized] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tabToDelete, setTabToDelete] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isDraggingContextMenu, setIsDraggingContextMenu] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showBrushSizeIndicator, setShowBrushSizeIndicator] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [historyPageIndex, setHistoryPageIndex] = useState(0);
  const [lastNonOriginalItem, setLastNonOriginalItem] = useState(null);

  // State for zoom functionality
  const [zoomLevel, setZoomLevel] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [zoomDrawMode, setZoomDrawMode] = useState(false);

  // States for the left and right panels
  const [pendingImages, setPendingImages] = useState([]);
  const [processedImages, setProcessedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBulkDownloadConfirmation, setShowBulkDownloadConfirmation] = useState(false);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);

  // State for panels visibility
  const [panelsHidden, setPanelsHidden] = useState(false);

  // State for download dialog
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);

  // State for panel navigation
  const [activePanel, setActivePanel] = useState(null); // 'left', 'right', or null
  const [leftPanelActiveIndex, setLeftPanelActiveIndex] = useState(0); // Index in processed images

  // State for auto/manual mode
  const [isAutoMode, setIsAutoMode] = useState(true); // Default is auto mode (current behavior)

  // State to track pending changes
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const maskContextRef = useRef(null);
  const maskBackupRef = useRef(null);
  const contextMenuRef = useRef(null);
  const brushIndicatorTimeoutRef = useRef(null);
  const hasDrawnRef = useRef(false);
  const historyContainerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const lastPoint = useRef({ x: 0, y: 0 });

  // Function to recover processed images
  const handleRecoverImage = (imageIndex) => {
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

    // Provide haptic feedback on mobile devices if available
    if (isMobile && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100); // Short vibration
    }
  };

  // Initialize with the pending images
  useEffect(() => {
    if (initialImage) {
      // Check if initialImage is an array (from bulk import)
      if (Array.isArray(initialImage)) {
        console.log("Initializing with multiple images:", initialImage.length);
        setPendingImages(initialImage);
      } else {
        // Single image case
        console.log("Initializing with single image");
        setPendingImages([initialImage]);
      }
      setCurrentImageIndex(0);

      // Initialize right panel as active if we have pending images
      setActivePanel('right');
    }
  }, [initialImage]);

  // Append custom CSS for hiding scrollbar but allowing scrolling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = createCustomStyles(isMobile);
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, [isMobile]);

  useEffect(() => {
    const handleMaskComplete = (e) => {
      // Process the mask
      stopDrawing();
    };

    document.addEventListener('maskDrawingComplete', handleMaskComplete);
    return () => {
      document.removeEventListener('maskDrawingComplete', handleMaskComplete);
    };
  }, []);

  // Check if device is mobile and apply device-specific optimizations
  useEffect(() => {
    const checkDeviceType = () => {
      if (typeof window !== 'undefined') {
        // Check if device is mobile using the imported function
        const mobile = isMobileDevice();
        setIsMobile(mobile);

        // Apply mobile-specific settings or desktop defaults
        if (mobile) {
          // Mobile defaults
          setBrushSize(prev => Math.max(15, prev)); // Slightly larger brush for touch
          setHistoryMinimized(true);
          setLeftPanelExpanded(false);
          setRightPanelExpanded(false);
        } else {
          // Desktop specific defaults
          setShowHistory(false);
        }
      }
    };

    checkDeviceType();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkDeviceType);
      return () => {
        window.removeEventListener('resize', checkDeviceType);
      };
    }
  }, []);

  // Reset pan position when zoom level changes to 0
  useEffect(() => {
    if (zoomLevel === 0) { setPanPosition({ x: 0, y: 0 }); }
  }, [zoomLevel]);

  // Canvas sizing logic with panel visibility awareness
  useEffect(() => {
    if (!pendingImages[currentImageIndex] || !containerRef.current) return;

    const img = new Image();
    img.onload = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      if (!container || !canvas || !maskCanvas) return;

      // Get actual container dimensions using getBoundingClientRect
      const containerRect = container.getBoundingClientRect();

      // Calculate available space, accounting for panels, toolbars, and margins
      // For mobile, account for the bottom bar
      const containerWidth = containerRect.width - (isMobile ? 20 : panelsHidden ? 40 : 400);
      const containerHeight = containerRect.height - (isMobile ? 170 : 100);

      // Calculate scale to fit image while maintaining aspect ratio
      const scale = Math.min(containerWidth / img.width, containerHeight / img.height) * (isMobile ? 0.85 : panelsHidden ? 0.98 : 0.95);

      // Calculate dimensions that maintain aspect ratio
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Set both canvas dimensions
      [canvas, maskCanvas].forEach(c => {
        c.style.width = `${scaledWidth}px`;
        c.style.height = `${scaledHeight}px`;
        c.width = img.width;
        c.height = img.height;

        const ctx = c.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      });

      // Draw initial image
      const context = canvas.getContext('2d');
      context.drawImage(img, 0, 0, img.width, img.height);

      // Explicitly reset all zoom and transform states
      setZoomLevel(0);
      setPanPosition({ x: 0, y: 0 });
      setIsZoomed(false);
      setZoomDrawMode(false);

      contextRef.current = context;
      maskContextRef.current = maskCanvas.getContext('2d');

      // Make sure mask canvas starts completely transparent
      maskContextRef.current.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

      // Initialize history with original image
      const initialHistoryItem = {
        id: 'original',
        processedImage: pendingImages[currentImageIndex],
        isOriginal: true
      };
      setHistory([initialHistoryItem]);
      setCurrentHistoryItem(initialHistoryItem);
      setHistoryIndex(0);
    };
    img.src = pendingImages[currentImageIndex];
  }, [pendingImages, currentImageIndex, isMobile, panelsHidden]);

  // Add useEffect for context menu management
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (isMobile) return;
      e.preventDefault();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    };

    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };

    const handleMouseMove = (e) => {
      if (isDraggingContextMenu) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const constrainedX = Math.min(Math.max(0, newX), window.innerWidth - 270);
        const constrainedY = Math.min(Math.max(0, newY), window.innerHeight - 400);
        setContextMenuPosition({ x: constrainedX, y: constrainedY });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingContextMenu(false);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile, isDraggingContextMenu, dragOffset]);

  // Toggle canvas lock function
  const toggleCanvasLock = () => {
    console.log('Toggling canvas lock, current state:', isCanvasLocked);
    setIsCanvasLocked(prev => {
      const newState = !prev;
      console.log(`Canvas is now ${newState ? 'locked' : 'unlocked'}`);
      return newState;
    });

    // Provide haptic feedback on mobile devices if available
    if (isMobile && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Short vibration
    }
  };

  // Toggle auto/manual mode function
  const toggleAutoMode = () => {
    setIsAutoMode(prev => {
      const newValue = !prev;

      // If switching to auto mode and we have pending changes, process them
      if (newValue && hasPendingChanges) {
        processCurrentMask();
      }

      // Provide haptic feedback on mobile devices if available
      if (isMobile && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50); // Short vibration
      }

      return newValue;
    });
  };

  // Function to show the brush size preview and hide it after some time
  const showBrushSizePreview = (size) => {
    setShowBrushSizeIndicator(true);
    if (brushIndicatorTimeoutRef.current) { clearTimeout(brushIndicatorTimeoutRef.current); }
    brushIndicatorTimeoutRef.current = setTimeout(() => { setShowBrushSizeIndicator(false); }, 1000);
  };

  const increaseBrushSize = () => {
    setBrushSize(prev => {
      const newSize = Math.min(prev + 5, 50);
      showBrushSizePreview(newSize);
      return newSize;
    });
  };

  const decreaseBrushSize = () => {
    setBrushSize(prev => {
      const newSize = Math.max(prev - 5, 1);
      showBrushSizePreview(newSize);
      return newSize;
    });
  };

  const handleBrushSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setBrushSize(newSize);
    showBrushSizePreview(newSize);
  };

  // Support for both mouse and touch events
  const startDrawing = (event) => {
    // Early return if canvas is locked
    if (isCanvasLocked) {
      console.log('Canvas is locked - drawing disabled');
      return;
    }

    if (isZoomed && !zoomDrawMode) return;
    if (isDrawing) return;

    let nativeEvent;
    if (event.type === 'touchstart') {
      nativeEvent = event.touches[0];
      event.preventDefault();
    } else {
      nativeEvent = event;
      if (nativeEvent.button !== 0) return; // Only handle left mouse button
    }

    if (mode === 'original') return;
    if (!maskContextRef.current) return;

    const { x, y } = getCanvasCoordinates(nativeEvent.clientX, nativeEvent.clientY, maskCanvasRef, zoomLevel, panPosition);
    lastPoint.current = { x, y };
    drawPoint(maskContextRef.current, x, y, brushSize);
    hasDrawnRef.current = true;
    setIsDrawing(true);
  };

  const draw = (event) => {
    // Early return if canvas is locked
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
    drawLine(maskContextRef.current, lastPoint.current.x, lastPoint.current.y, x, y, brushSize);

    hasDrawnRef.current = true;
    // Set state to show we have pending changes (for manual mode)
    if (!isAutoMode && !hasPendingChanges) {
      setHasPendingChanges(true);
    }

    lastPoint.current = { x, y };
  };

  const stopDrawing = async (event) => {
    if (isCanvasLocked) return;
    if (isZoomed && !zoomDrawMode) return;

    if (isDrawing) {
      setIsDrawing(false);
    } else {
      return;
    }

    if (mode === 'original' || !maskContextRef.current) return;
    if (!hasDrawnRef.current) return;

    const maskData = maskContextRef.current.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

    let hasContent = false;
    for (let i = 0; i < maskData.data.length; i += 4) {
      if (maskData.data[i] > 0) {
        hasContent = true;
        break;
      }
    }

    if (!hasContent) {
      setHasPendingChanges(false);
      hasDrawnRef.current = false;
      return;
    }

    // If in auto mode, process immediately; otherwise keep pending changes flag
    if (isAutoMode) {
      setHasPendingChanges(false);
      processCurrentMask();
    } else {
      console.log('Auto mode is off - waiting for manual processing trigger');
      // Keep hasDrawnRef.current true so we know there are unprocessed changes
      setHasPendingChanges(true);
    }
  };

  // Separate function for processing the mask (extracted from stopDrawing)
  const processCurrentMask = async () => {
    if (!hasDrawnRef.current || !maskContextRef.current) return;

    hasDrawnRef.current = false;
    setHasPendingChanges(false);

    try {
      maskBackupRef.current = backupMaskCanvas(maskCanvasRef, maskContextRef);
      setIsLoading(true);

      // Convert canvas to blob
      const imageBlob = await new Promise(resolve => {
        canvasRef.current.toBlob(resolve, 'image/png');
      });

      // For the backend, we need to convert the transparent red to white
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskCanvasRef.current.width;
      tempCanvas.height = maskCanvasRef.current.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(maskCanvasRef.current, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixelData = imageData.data;

      // Convert red pixels to white (for the API)
      for (let i = 0; i < pixelData.length; i += 4) {
        if (pixelData[i] > 0) {
          pixelData[i] = 255;
          pixelData[i + 1] = 255;
          pixelData[i + 2] = 255;
          pixelData[i + 3] = 255;
        }
      }

      tempCtx.putImageData(imageData, 0, 0);

      const maskBlob = await new Promise(resolve => {
        tempCanvas.toBlob(resolve, 'image/png');
      });

      // Create form data
      const formData = new FormData();
      formData.append('image', new File([imageBlob], 'image.png', { type: 'image/png' }));
      formData.append('mask', new File([maskBlob], 'mask.png', { type: 'image/png' }));

      // Send to backend - Adjust for Next.js environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/inpaint`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Server returned error:', response.status);
        throw new Error('Inpainting failed');
      }

      const responseData = await response.json();

      // Create a new image from the processed result
      const img = new Image();
      img.onload = () => {
        // Draw the processed image
        contextRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Create history item with the processed image
        const newHistoryItem = {
          id: Date.now(),
          processedImage: `data:image/png;base64,${responseData.processed_image}`,
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
        setLastNonOriginalItem(newHistoryItem); // Update the last non-original item

        // Update page index for pagination (show the new item)
        const nonOriginalItems = [...history, newHistoryItem].filter(item => !item.isOriginal);
        const newItemIndex = nonOriginalItems.length - 1;
        setHistoryPageIndex(Math.floor(newItemIndex / TABS_PER_PAGE));

        // Clear the mask after successful inpainting
        maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

        // Clear the backup
        maskBackupRef.current = null;

        // Provide haptic feedback on mobile devices if available
        if (isMobile && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([30, 30, 30]); // Triple short vibration pattern
        }
      };
      img.src = `data:image/png;base64,${responseData.processed_image}`;

    } catch (error) {
      console.error('Error during inpainting:', error);
      // Restore the mask canvas if there's an error
      restoreMaskCanvas(maskContextRef, maskBackupRef.current);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to manually trigger processing
  const manualProcess = () => {
    if (!isAutoMode && hasPendingChanges) {
      processCurrentMask();
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentHistoryItem(history[newIndex]);
      loadImageToCanvas(
        history[newIndex].processedImage, contextRef, canvasRef, maskContextRef,
        newIndex, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
      );

      if (mode === 'original') {
        setMode('brush');
        maskCanvasRef.current.style.display = 'block';
      }

      const nonOriginalItems = history.filter(item => !item.isOriginal);
      const currentNonOriginalIndex = nonOriginalItems.findIndex(item => item.id === history[newIndex].id);

      if (currentNonOriginalIndex >= 0) {
        setHistoryPageIndex(Math.floor(currentNonOriginalIndex / TABS_PER_PAGE));
      }

      if (!history[newIndex].isOriginal) {
        setLastNonOriginalItem(history[newIndex]);
      }

      // Provide haptic feedback on mobile devices if available
      if (isMobile && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50); // Short vibration
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentHistoryItem(history[newIndex]);
      loadImageToCanvas(
        history[newIndex].processedImage, contextRef, canvasRef, maskContextRef,
        newIndex, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
      );

      if (mode === 'original') {
        setMode('brush');
        maskCanvasRef.current.style.display = 'block';
      }

      const nonOriginalItems = history.filter(item => !item.isOriginal);
      const currentNonOriginalIndex = nonOriginalItems.findIndex(item => item.id === history[newIndex].id);

      if (currentNonOriginalIndex >= 0) {
        setHistoryPageIndex(Math.floor(currentNonOriginalIndex / TABS_PER_PAGE));
      }

      if (!history[newIndex].isOriginal) {
        setLastNonOriginalItem(history[newIndex]);
      }

      // Provide haptic feedback on mobile devices if available
      if (isMobile && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50); // Short vibration
      }
    }
  };

  // Handle tab deletion
  const handleDeleteTab = (tabId) => {
    if (!showHistory) {
      setShowHistory(true);
      setHistoryMinimized(false);
      return; // Don't delete on first try, just show panel
    }

    setTabToDelete(tabId);
    setShowDeleteConfirmation(true);
  };

  // Handle confirmation of deletion
  const handleConfirmDelete = () => {
    if (!tabToDelete) return;

    const tabIndex = history.findIndex(item => item.id === tabToDelete);
    if (tabIndex === -1 || history[tabIndex].isOriginal) {
      setShowDeleteConfirmation(false);
      setTabToDelete(null);
      return;
    }

    const newHistory = history.filter(item => item.id !== tabToDelete);

    let newHistoryIndex = historyIndex;
    if (tabIndex < historyIndex) {
      newHistoryIndex--;
    } else if (tabIndex === historyIndex) {
      newHistoryIndex = Math.max(0, historyIndex - 1);
    }

    setHistory(newHistory);
    setHistoryIndex(newHistoryIndex);
    setCurrentHistoryItem(newHistory[newHistoryIndex]);

    if (tabToDelete === lastNonOriginalItem?.id) {
      const newLastNonOriginal = newHistory.slice().reverse().find(item => !item.isOriginal);
      setLastNonOriginalItem(newLastNonOriginal || null);
    }

    if (mode === 'original') {
      loadImageToCanvas(
        pendingImages[currentImageIndex], contextRef, canvasRef, maskContextRef,
        undefined, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
      );
    } else {
      loadImageToCanvas(
        newHistory[newHistoryIndex].processedImage, contextRef, canvasRef, maskContextRef,
        newHistoryIndex, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
      );
    }

    const nonOriginalItems = newHistory.filter(item => !item.isOriginal);
    const currentItemIndex = nonOriginalItems.findIndex(item => item.id === newHistory[newHistoryIndex].id);

    if (currentItemIndex >= 0) {
      setHistoryPageIndex(Math.floor(currentItemIndex / TABS_PER_PAGE));
    } else if (nonOriginalItems.length === 0) {
      setHistoryPageIndex(0);
    } else {
      const totalPages = Math.ceil(nonOriginalItems.length / TABS_PER_PAGE);
      if (historyPageIndex >= totalPages) {
        setHistoryPageIndex(totalPages - 1);
      }
    }

    setShowDeleteConfirmation(false);
    setTabToDelete(null);

    // Provide haptic feedback on mobile devices if available
    if (isMobile && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Delete pattern
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (brushIndicatorTimeoutRef.current) {
        clearTimeout(brushIndicatorTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts handler - Enhanced version
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip shortcuts on mobile or if user is typing in an input field or delete confirmation is open
      if (isMobile || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || showDeleteConfirmation) {
        // Allow only Enter/Escape in confirmation dialog
        if (showDeleteConfirmation) {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirmDelete();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setShowDeleteConfirmation(false);
            setTabToDelete(null);
          }
        }
        return;
      }

      // Handle key combinations
      const isCtrlPressed = e.ctrlKey || e.metaKey;
      const isShiftPressed = e.shiftKey;

      // Undo: Ctrl/Cmd + Z
      if (isCtrlPressed && e.key.toLowerCase() === 'z' && !isShiftPressed) {
        e.preventDefault();
        console.log("Executing Undo with Ctrl+Z");
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((isCtrlPressed && e.key.toLowerCase() === 'y') ||
        (isCtrlPressed && isShiftPressed && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        console.log("Executing Redo with Ctrl+Y or Ctrl+Shift+Z");
        handleRedo();
        return;
      }

      // Approve image with Y key
      if (e.key.toLowerCase() === 'y' && !isLoading && pendingImages.length > 0) {
        e.preventDefault();
        console.log("Approving image with Y key");
        handleApproveImage(
          pendingImages, isLoading, currentHistoryItem, currentImageIndex,
          setProcessedImages, setPendingImages, setCurrentImageIndex, setHistory,
          setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
        );
        return;
      }

      // Toggle history: H
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        console.log("Toggling history panel with H key");
        if (!showHistory) {
          setShowHistory(true);
          setHistoryMinimized(false);
        } else {
          setShowHistory(false);
        }
        return;
      }

      // Toggle canvas lock: L
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        console.log("Toggling canvas lock with L key");
        toggleCanvasLock();
        return;
      }

      // Toggle original view: O
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        console.log("Toggling original view with O key, current mode:", mode);

        // Make sure to pass the right function for loading images
        toggleOriginalView(
          mode, setMode, maskCanvasRef, pendingImages, currentImageIndex,
          (imageSrc, index) => loadImageToCanvas(
            imageSrc, contextRef, canvasRef, maskContextRef, index,
            setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
          ),
          history, setHistoryIndex, setCurrentHistoryItem, setHistoryPageIndex
        );
        return;
      }

      // Toggle instructions: I
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        console.log("Toggling instructions with I key");
        setShowInstructions(prev => !prev);
        return;
      }

      // Toggle zoom controls / zoom mode: Z
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        console.log("Toggle zoom with Z key");

        if (isZoomed) {
          // If already zoomed and Z is pressed without Shift, toggle draw/pan mode
          setZoomDrawMode(prev => !prev);

          // Show a brief notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg z-[100]';
          notification.innerText = !zoomDrawMode ? 'Draw Mode' : 'Pan Mode';
          document.body.appendChild(notification);

          // Remove notification after 1.5 seconds
          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 1500);
        } else if (!isZoomed) {
          // If not zoomed, enter zoom mode and show controls
          handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls);
        } else if (isZoomed && isShiftPressed) {
          // If zoomed and shift key is pressed, exit zoom mode
          exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls);
        }
        return;
      }

      // Download: D
      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        console.log("Opening download dialog with D key");
        handleDownload(setShowDownloadDialog);
        return;
      }

      // Increase brush size: Plus or Equals key with Shift
      // Fix: Check for both + and = which is Shift+= on most keyboards
      if (isShiftPressed && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        console.log("Increasing brush size with Shift++");
        increaseBrushSize();
        return;
      }

      // Decrease brush size: Minus key with Shift
      // Fix: Check for both - and _ which is Shift+- on most keyboards
      if (isShiftPressed && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        console.log("Decreasing brush size with Shift+-");
        decreaseBrushSize();
        return;
      }

      // Previous image: Left Arrow
      if (e.key === 'ArrowLeft' && pendingImages.length > 1) {
        e.preventDefault();
        console.log("Navigating to previous image with Left Arrow");
        const newIndex = (currentImageIndex - 1 + pendingImages.length) % pendingImages.length;
        setCurrentImageIndex(newIndex);
        // Reset history for the new image
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
        return;
      }

      // Next image: Right Arrow
      if (e.key === 'ArrowRight' && pendingImages.length > 1) {
        e.preventDefault();
        console.log("Navigating to next image with Right Arrow");
        const newIndex = (currentImageIndex + 1) % pendingImages.length;
        setCurrentImageIndex(newIndex);
        // Reset history for the new image
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
        return;
      }

      // Delete current tab: X
      if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        console.log("Attempting to delete tab with X key");
        if (currentHistoryItem && !currentHistoryItem.isOriginal) {
          handleDeleteTab(currentHistoryItem.id);
        }
        return;
      }

      // Fit image to screen or show panels: F
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        console.log("Toggling fit screen/panels with F key");
        fitImageToScreen(
          setPanelsHidden, setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode,
          pendingImages, currentImageIndex, contextRef, canvasRef, maskCanvasRef,
          setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
        );
        return;
      }

      // Toggle shortcuts menu with S key
      if (e.key.toLowerCase() === 's' && !isLoading) {
        e.preventDefault();
        console.log("Toggling shortcuts menu with S key");
        setShowContextMenu(prev => !prev);
        if (!showContextMenu) {
          // Position in center if toggled with keyboard
          setContextMenuPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          });
        }
        return;
      }

      // Add escape key to exit zoom mode
      if (e.key === 'Escape') {
        if (isZoomed) {
          e.preventDefault();
          console.log("Exiting zoom mode with Escape key");
          exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls);
          return;
        }
        // Also close context menu, history panel, etc. if open
        if (showContextMenu) {
          e.preventDefault();
          setShowContextMenu(false);
          return;
        }
        if (showHistory) {
          e.preventDefault();
          setShowHistory(false);
          return;
        }
        if (showInstructions) {
          e.preventDefault();
          setShowInstructions(false);
          return;
        }
      }

      // Toggle auto/manual mode: M
      if (e.key.toLowerCase() === 'm' && !isLoading) {
        e.preventDefault();
        console.log("Toggling auto/manual mode with M key");
        toggleAutoMode();
        return;
      }

      // Process mask manually: P (when in manual mode)
      if (e.key.toLowerCase() === 'p' && !isAutoMode && hasPendingChanges && !isLoading) {
        e.preventDefault();
        console.log("Manual processing with P key");
        manualProcess();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [
    // Include all state dependencies that are used in the event handler
    zoomDrawMode, isZoomed, showZoomControls, showDeleteConfirmation, isMobile,
    pendingImages, currentImageIndex, history, currentHistoryItem, mode,
    historyIndex, historyPageIndex, showHistory, isCanvasLocked, showContextMenu,
    showInstructions, isLoading, isAutoMode, hasPendingChanges
  ]);

  // Add mouse wheel support for brush size or zoom depending on mode
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        if (isZoomed && !zoomDrawMode) {
          // In zoom mode but not in draw mode - control zoom level
          if (e.deltaY < 0) {
            // Scrolling up - zoom in
            handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls);
          } else {
            // Scrolling down - zoom out
            handleZoomOut(setZoomLevel, setPanPosition);
          }
        } else {
          // Either in normal mode OR in zoom+draw mode - adjust brush size
          if (e.deltaY < 0) {
            // Scrolling up - increase brush size
            increaseBrushSize();
          } else {
            // Scrolling down - decrease brush size
            decreaseBrushSize();
          }
        }
      }
    };

    const canvas = maskCanvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, [brushSize, isZoomed, zoomLevel, zoomDrawMode]);

  // If mobile, render the mobile-optimized editor
  if (isMobile) {
    return (
      <MobileEditor
        initialImage={pendingImages[currentImageIndex]}
        onReset={onReset}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        mode={mode}
        setMode={setMode}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        isCanvasLocked={isCanvasLocked}
        setIsCanvasLocked={setIsCanvasLocked}
        processMask={stopDrawing}
        history={history}
        setHistory={setHistory}
        historyIndex={historyIndex}
        setHistoryIndex={setHistoryIndex}
        currentHistoryItem={currentHistoryItem}
        setCurrentHistoryItem={setCurrentHistoryItem}
        pendingImages={pendingImages}
        setPendingImages={setPendingImages}
        processedImages={processedImages}
        setProcessedImages={setProcessedImages}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        canvasRef={canvasRef}
        maskCanvasRef={maskCanvasRef}
        contextRef={contextRef}
        maskContextRef={maskContextRef}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        toggleOriginalView={() => toggleOriginalView(
          mode, setMode, maskCanvasRef, pendingImages, currentImageIndex,
          (imageSrc, index) => loadImageToCanvas(
            imageSrc, contextRef, canvasRef, maskContextRef, index,
            setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
          ),
          history, setHistoryIndex, setCurrentHistoryItem, setHistoryPageIndex
        )}
        toggleCanvasLock={toggleCanvasLock}
        handleApproveImage={() => handleApproveImage(
          pendingImages, isLoading, currentHistoryItem, currentImageIndex,
          setProcessedImages, setPendingImages, setCurrentImageIndex, setHistory,
          setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
        )}
        startDrawing={startDrawing}
        draw={draw}
        stopDrawing={stopDrawing}
        showBrushSizePreview={showBrushSizePreview}
        handleBrushSizeChange={handleBrushSizeChange}
        increaseBrushSize={increaseBrushSize}
        decreaseBrushSize={decreaseBrushSize}
        isAutoMode={isAutoMode}
        toggleAutoMode={toggleAutoMode}
        manualProcess={manualProcess}
      />
    );
  }

  // Desktop UI
  return (
    <div className="fixed inset-0 bg-gray-100 flex" ref={containerRef}>
      {/* Left Panel - Processed Images */}
      <LeftPanel
        isMobile={isMobile}
        leftPanelExpanded={leftPanelExpanded}
        setLeftPanelExpanded={setLeftPanelExpanded}
        processedImages={processedImages}
        setShowBulkDownloadConfirmation={setShowBulkDownloadConfirmation}
        panelsHidden={panelsHidden}
        handleRecoverImage={handleRecoverImage}
        activePanel={activePanel}
        leftPanelActiveIndex={leftPanelActiveIndex}
        setActivePanel={setActivePanel}
      />

      {/* Main content area with canvas */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top navbar */}
        <div className="bg-white shadow-sm py-3 px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Tooltip text="Back to Upload" preferredPosition="bottom">
              <button onClick={onReset} className="text-gray-700 hover:text-gray-900 flex items-center text-sm">
                <ChevronLeft className="w-4 h-4 mr-1" />Back
              </button>
            </Tooltip>
            <h1 className="text-base font-medium text-gray-900">Image Editor</h1>

            {pendingImages.length > 0 && (
              <div className="text-sm text-gray-600 ml-4">
                Image {currentImageIndex + 1} of {pendingImages.length}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tooltip text="Report a bug or provide feedback" preferredPosition="bottom">
              <button className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100" onClick={() => setShowFeedbackDialog(true)}>
                <MessageSquare className="w-4 h-4" />
              </button>
            </Tooltip>

            <div className="flex items-center gap-2">
              <Tooltip text="Toggle Canvas Lock (L)" preferredPosition="bottom">
                <button onClick={toggleCanvasLock} className={`p-1.5 rounded-full ${isCanvasLocked ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                  {isCanvasLocked ? (<Lock className="w-4 h-4 text-gray-700" />) : (<Unlock className="w-4 h-4 text-gray-700" />)}
                </button>
              </Tooltip>

              <Tooltip text="Toggle History Panel (H)" preferredPosition="bottom">
                <button onClick={() => {
                  if (!showHistory) {
                    setShowHistory(true);
                    setHistoryMinimized(false);
                  } else {
                    setShowHistory(false);
                  }
                }} className={`p-1.5 rounded-full ${showHistory ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                  <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </Tooltip>

              <Tooltip text="Toggle Zoom Controls (Z)" preferredPosition="bottom">
                <button onClick={() => {
                  if (isZoomed) {
                    exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls);
                  } else {
                    handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls);
                  }
                }} className={`p-1.5 rounded-full ${isZoomed ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
              </Tooltip>

              <Tooltip text="Show Instructions (I)" preferredPosition="bottom">
                <button onClick={() => setShowInstructions(!showInstructions)} className={`p-1.5 rounded-full ${showInstructions ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                  <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Feedback/Bug Report Dialog */}
        {showFeedbackDialog && (<FeedbackDialog setShowFeedbackDialog={setShowFeedbackDialog} />)}

        {/* Canvas Container - Optimized for maximum space usage */}
        <div
          className={`flex-1 flex items-center justify-center relative p-2 pb-16 ${panelsHidden ? 'px-8' : ''}`}
        >
          <div
            className={`relative overflow-hidden mb-4 ${panelsHidden ? 'max-w-full transition-all duration-300' : ''}`}
            style={{ border: "none", outline: "none" }}
            ref={canvasContainerRef}
            onMouseDown={(event) => startPanning(event, isZoomed, zoomDrawMode, isDrawing, setIsPanning, setLastPanPos)}
            onMouseMove={(event) => handlePanning(event, isPanning, isZoomed, lastPanPos, setLastPanPos, canvasRef, zoomLevel, setPanPosition)}
            onMouseUp={() => stopPanning(setIsPanning)}
            onMouseLeave={() => stopPanning(setIsPanning)}
          >
            {/* Canvas wrapper with zoom/pan transformations */}
            <div
              className={`${isPanning ? 'pan-handle' : ''} ${isZoomed && !isPanning ? 'zoom-transition' : ''}`}
              style={{
                transform: isZoomed ?
                  `scale(${1 + (zoomLevel * 0.1)}) translate(${-panPosition.x}px, ${-panPosition.y}px)` :
                  'scale(1) translate(0px, 0px)', // Explicit default to avoid transform residue
                transformOrigin: 'center'
              }}
            >
              <canvas ref={canvasRef} className="rounded-lg shadow-md" style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", display: "block" }} />
              <canvas
                ref={maskCanvasRef}
                className="absolute top-0 left-0 rounded-lg"
                onMouseDown={(!isZoomed || zoomDrawMode) ? startDrawing : undefined}
                onMouseMove={(!isZoomed || zoomDrawMode) ? draw : undefined}
                onMouseUp={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                onMouseLeave={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                onTouchStart={(!isZoomed || zoomDrawMode) ? startDrawing : undefined}
                onTouchMove={(!isZoomed || zoomDrawMode) ? draw : undefined}
                onTouchEnd={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                onTouchCancel={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  cursor: isCanvasLocked ? 'not-allowed' :
                    (isZoomed && isPanning) ? 'grabbing' :
                    (isZoomed && !zoomDrawMode) ? 'grab' :
                    (isZoomed && zoomDrawMode) ? 'crosshair' :
                    mode === 'brush' ? 'crosshair' : 'not-allowed',
                  boxShadow: "none",
                  display: "block",
                  pointerEvents: isLoading ? 'none' : 'auto'
                }}
              />
            </div>

            {/* Canvas Lock Overlay */}
            {isCanvasLocked && (
              <div className="absolute inset-0 bg-transparent flex items-center justify-center rounded-lg pointer-events-none">
                {/* Only this message box will be visible with semi-transparent background */}
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  <span>Canvas Locked (Press L to unlock)</span>
                </div>
              </div>
            )}

            {/* Zoom mode overlays - Show different messages based on mode */}
            {isZoomed && !isPanning && !zoomDrawMode && (
              <div className="absolute top-0 left-0 right-0 m-auto w-fit mt-2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2 pointer-events-none">
                <span>Pan Mode (Z to switch to Draw Mode)</span>
              </div>
            )}

            {/* Draw mode indicator */}
            {isZoomed && !isPanning && zoomDrawMode && (
              <div className="absolute top-0 left-0 right-0 m-auto w-fit mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg pointer-events-none">
                <span>Draw Mode (Z to switch to Pan Mode)</span>
              </div>
            )}

            {/* Panning indicator */}
            {isZoomed && isPanning && (
              <div className="absolute top-0 left-0 right-0 m-auto w-fit mt-2 bg-gray-800 text-white px-4 py-2 rounded-lg pointer-events-none">
                <span>Panning...</span>
              </div>
            )}

            {/* Zoom controls */}
            {showZoomControls && (
              <ZoomControls
                zoomLevel={zoomLevel}
                MAX_ZOOM_LEVEL={MAX_ZOOM_LEVEL}
                getZoomPercentage={getZoomPercentage}
                handleZoomIn={() => handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls)}
                handleZoomOut={() => handleZoomOut(setZoomLevel, setPanPosition)}
                handleResetZoom={() => handleResetZoom(setZoomLevel, setPanPosition)}
                isPanning={isPanning}
                zoomDrawMode={zoomDrawMode}
                setZoomDrawMode={setZoomDrawMode}
                setShowZoomControls={setShowZoomControls}
                exitZoomMode={() => exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls)}
                isMobile={isMobile}
              />
            )}

            {/* Toggle zoom controls button - appears when zoom controls are hidden */}
            {isZoomed && !showZoomControls && (
              <button
                onClick={() => setShowZoomControls(true)}
                className="absolute bottom-5 right-5 bg-white rounded-full p-2 shadow-md z-30 hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37a1.724 1.724 0 002.572 1.065c.426 1.756 2.924 1.756 3.35 0a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31-2.37-2.37a1.724 1.724 0 00-2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Brush size indicator */}
          {showBrushSizeIndicator && mode === 'brush' && !isLoading && (isZoomed ? zoomDrawMode : true) && (
            <BrushSizeIndicator brushSize={brushSize} isMobile={false} />
          )}

          {/* Right-click Context Menu */}
          {showContextMenu && (
            <ContextMenu
              contextMenuRef={contextMenuRef}
              contextMenuPosition={contextMenuPosition}
              isDraggingContextMenu={isDraggingContextMenu}
              setDragOffset={setDragOffset}
              setIsDraggingContextMenu={setIsDraggingContextMenu}
              setShowContextMenu={setShowContextMenu}
            />
          )}

          {/* Processing overlay */}
          {isLoading && <ProcessingOverlay isMobile={isMobile} />}

          {/* Instructions modal */}
          {showInstructions && (
            <InstructionsModal
              isMobile={isMobile}
              setShowInstructions={setShowInstructions}
            />
          )}

          {/* History panel */}
          {showHistory && (
            <HistoryPanel
              isMobile={isMobile}
              historyMinimized={historyMinimized}
              setHistoryMinimized={setHistoryMinimized}
              setShowHistory={setShowHistory}
              history={history}
              mode={mode}
              historyPageIndex={historyPageIndex}
              TABS_PER_PAGE={TABS_PER_PAGE}
              currentHistoryItem={currentHistoryItem}
              setMode={setMode}
              maskCanvasRef={maskCanvasRef}
              setHistoryIndex={setHistoryIndex}
              setCurrentHistoryItem={setCurrentHistoryItem}
              setLastNonOriginalItem={setLastNonOriginalItem}
              loadImageToCanvas={(imageSrc, index) => loadImageToCanvas(
                imageSrc, contextRef, canvasRef, maskContextRef, index,
                setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
              )}
              initialImage={pendingImages[currentImageIndex]}
              handlePrevHistoryPage={() => {
                if (historyPageIndex > 0) {
                  setHistoryPageIndex(historyPageIndex - 1);
                }
              }}
              handleNextHistoryPage={() => {
                const nonOriginalItems = history.filter(item => !item.isOriginal);
                const totalPages = Math.ceil(nonOriginalItems.length / TABS_PER_PAGE);

                if (historyPageIndex < totalPages - 1) {
                  setHistoryPageIndex(historyPageIndex + 1);
                }
              }}
              handleDeleteTab={handleDeleteTab}
              historyContainerRef={historyContainerRef}
            />
          )}

          {/* Confirmation Dialog for Deleting Tabs */}
          {showDeleteConfirmation && (
            <DeleteConfirmationDialog
              isMobile={isMobile}
              setShowDeleteConfirmation={setShowDeleteConfirmation}
              setTabToDelete={setTabToDelete}
              handleConfirmDelete={handleConfirmDelete}
            />
          )}

          {/* Download Options Dialog */}
          {showDownloadDialog && (
            <DownloadDialog
              showDownloadDialog={showDownloadDialog}
              setShowDownloadDialog={setShowDownloadDialog}
              canvasRef={canvasRef}
              processedImages={processedImages}
              setIsLoading={setIsLoading}
              isMobile={isMobile}
            />
          )}

          {/* Bulk Download Confirmation Dialog */}
          {showBulkDownloadConfirmation && (
            <BulkDownloadConfirmation
              processedImages={processedImages}
              setShowBulkDownloadConfirmation={setShowBulkDownloadConfirmation}
              handleBulkDownload={() => handleBulkDownload(processedImages, setShowBulkDownloadConfirmation, setIsLoading)}
              isMobile={isMobile}
            />
          )}
        </div>

        {/* Bottom toolbar with improved visibility */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md px-4 py-2 z-50 border-t border-gray-200">
          {/* Desktop toolbar */}
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Tooltip text="Undo (Ctrl/Cmd+Z)" preferredPosition="top">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0 || mode === 'original' || isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    historyIndex <= 0 || mode === 'original' || isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <Undo className="w-4 h-4" />Undo
                </button>
              </Tooltip>

              <Tooltip text="Redo (Ctrl/Cmd+Y)" preferredPosition="top">
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1 || mode === 'original' || isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    historyIndex >= history.length - 1 || mode === 'original' || isLoading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <Redo className="w-4 h-4" />Redo
                </button>
              </Tooltip>

              {/* Add navigation controls here - NEW */}
              {pendingImages.length > 1 && (
                <div className="flex items-center ml-2 bg-white border border-gray-200 rounded-md px-1">
                  <Tooltip text="Previous Image (←)" preferredPosition="top">
                    <button
                      onClick={() => {
                        const newIndex = (currentImageIndex - 1 + pendingImages.length) % pendingImages.length;
                        setCurrentImageIndex(newIndex);
                        // Reset history for the new image
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
                      }}
                      className="p-1.5 rounded text-gray-700 hover:bg-gray-100">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  <div className="flex items-center px-2 py-1">
                    {pendingImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 mx-1 rounded-full cursor-pointer ${idx === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                        onClick={() => {
                          setCurrentImageIndex(idx);
                          const initialHistoryItem = {
                            id: 'original',
                            processedImage: pendingImages[idx],
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
                        }}
                      ></div>
                    ))}
                  </div>

                  <Tooltip text="Next Image (→)" preferredPosition="top">
                    <button
                      onClick={() => {
                        const newIndex = (currentImageIndex + 1) % pendingImages.length;
                        setCurrentImageIndex(newIndex);
                        // Reset history for the new image
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
                      }}
                      className="p-1.5 rounded text-gray-700 hover:bg-gray-100">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-md">
              <Tooltip text="Decrease Brush Size (-)" preferredPosition="top">
                <button
                  onClick={decreaseBrushSize}
                  disabled={brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                  className={`p-1 rounded ${brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Minus className="w-4 h-4" />
                </button>
              </Tooltip>
              <div className={`flex items-center gap-1.5 ${isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'opacity-50' : ''}`}>
                <span className="text-sm text-gray-700">Brush</span>
                <input
                  type="range" min="1" max="50" value={brushSize} onChange={handleBrushSizeChange}
                  className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                />
                <span className="text-sm text-gray-700 w-6 text-center">{brushSize}</span>
              </div>
              <Tooltip text="Increase Brush Size (+)" preferredPosition="top">
                <button
                  onClick={increaseBrushSize}
                  disabled={brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                  className={`p-1 rounded ${brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Plus className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Approve button */}
            {pendingImages.length > 0 && (
              <Tooltip text="Approve Image (Y)" preferredPosition="top">
                <button
                  onClick={() => handleApproveImage(
                    pendingImages, isLoading, currentHistoryItem, currentImageIndex,
                    setProcessedImages, setPendingImages, setCurrentImageIndex, setHistory,
                    setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
                  )}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                  }`}>
                  <CheckCircle className="w-4 h-4" />Approve
                </button>
              </Tooltip>
            )}

            <div className="flex items-center gap-3">
              {/* Fit button */}
              <Tooltip text={panelsHidden ? "Show Panels (F)" : "Fit Image to Screen (F)"} preferredPosition="top">
                <button
                  onClick={() => fitImageToScreen(
                    setPanelsHidden, setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode,
                    pendingImages, currentImageIndex, contextRef, canvasRef, maskCanvasRef,
                    setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
                  )}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                    panelsHidden ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  {panelsHidden ? 'Show Panels' : 'Fit Screen'}
                </button>
              </Tooltip>

              <Tooltip text="Zoom Controls (Z)" preferredPosition="top">
                <button
                  onClick={() => {
                    if (isZoomed) {
                      exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls);
                    } else {
                      handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls);
                    }
                  }}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                    zoomLevel > 0 ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <ZoomIn className="w-4 h-4" />
                  {zoomLevel > 0 ? `${getZoomPercentage(zoomLevel)}%` : 'Zoom'}
                </button>
              </Tooltip>

              <Tooltip text="Toggle Original View (O)" preferredPosition="top">
                <button
                  onClick={() => toggleOriginalView(
                    mode, setMode, maskCanvasRef, pendingImages, currentImageIndex,
                    (imageSrc, index) => loadImageToCanvas(
                      imageSrc, contextRef, canvasRef, maskContextRef, index,
                      setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
                    ),
                    history, setHistoryIndex, setCurrentHistoryItem, setHistoryPageIndex
                  )}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                    mode === 'original' ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <Eye className="w-4 h-4" />
                  {mode === 'original' ? 'Exit View' : 'Original'}
                </button>
              </Tooltip>

              <Tooltip text="Toggle Canvas Lock (L)" preferredPosition="top">
                <button
                  onClick={toggleCanvasLock}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                    isCanvasLocked ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}>
                  {isCanvasLocked ? (<Lock className="w-4 h-4" />) : (<Unlock className="w-4 h-4" />)}
                  {isCanvasLocked ? 'Unlock' : 'Lock'}
                </button>
              </Tooltip>

              <Tooltip text="Download (D)" preferredPosition="top">
                <button
                  onClick={() => handleDownload(setShowDownloadDialog)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                    isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}>
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </Tooltip>

              {/* Add Auto/Manual mode toggle and Process button */}
              <div className="flex items-center gap-2">
                <Tooltip text={`${isAutoMode ? 'Turn off' : 'Turn on'} auto processing`} preferredPosition="top">
                  <button
                    onClick={toggleAutoMode}
                    disabled={isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                      isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isAutoMode
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'  // Highlighted when auto is on
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={isAutoMode
                          ? "M5 13l4 4L19 7" // Checkmark icon when auto is on
                          : "M9 9l6 6m0-6l-6 6"} // X icon when auto is off
                      />
                    </svg>
                    {isAutoMode ? 'Auto' : 'Manual'}
                  </button>
                </Tooltip>

                {/* Show Process button only when auto mode is off */}
                {!isAutoMode && hasPendingChanges && (
                  <Tooltip text="Process current drawing" preferredPosition="top">
                    <button
                      onClick={manualProcess}
                      disabled={isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) || !hasPendingChanges}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                        isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) || !hasPendingChanges
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Process
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Pending Images */}
      <RightPanel
        isMobile={isMobile}
        rightPanelExpanded={rightPanelExpanded}
        setRightPanelExpanded={setRightPanelExpanded}
        pendingImages={pendingImages}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        setHistory={setHistory}
        setCurrentHistoryItem={setCurrentHistoryItem}
        setHistoryIndex={setHistoryIndex}
        mode={mode}
        setMode={setMode}
        maskCanvasRef={maskCanvasRef}
        panelsHidden={panelsHidden}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
      />
    </div>
  );
};

export default Editor;
