import React, { useState, useRef, useEffect } from 'react';
import { Download, CheckCircle, Share2, X, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ZoomIn,
         Lock, Unlock, Eye, Undo, Redo, Plus, Minus, MessageSquare, Menu } from 'lucide-react';

// Import components from EditorComponents.jsx
import {
  Tooltip,
  LeftPanel,
  RightPanel,
  ContextMenu,
  InstructionsModal,
  FeedbackDialog,
  DeleteConfirmationDialog,
  ZoomControls,
  HistoryPanel,
  MobileMenu,
  BrushSizeIndicator,
  ProcessingOverlay,
  DownloadDialog,
  BulkDownloadConfirmation
} from './EditorComponents';

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
  navigateImages,
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
    const style = createCustomStyles();
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setShowHistory(false); // All screen sizes start with history hidden
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => { window.removeEventListener('resize', checkMobile); };
  }, []);

  // Reset pan position when zoom level changes to 0
  useEffect(() => {
    if (zoomLevel === 0) { setPanPosition({ x: 0, y: 0 }); } // Only reset pan position, but stay in zoom mode
  }, [zoomLevel]);

  // MODIFIED: Improved canvas sizing logic with panel visibility awareness
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
      const containerWidth = containerRect.width - (isMobile ? 20 : panelsHidden ? 40 : 400); 
      const containerHeight = containerRect.height - (isMobile ? 120 : 100);

      // Calculate scale to fit image while maintaining aspect ratio
      const scale = Math.min(containerWidth / img.width, containerHeight / img.height) * (isMobile ? 0.9 : panelsHidden ? 0.98 : 0.95); 

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

  // Handle window resize to adjust canvas size
  useEffect(() => {
    const handleResize = () => {
      if (!pendingImages[currentImageIndex] || !containerRef.current || !canvasRef.current) return;
      
      const img = new Image();
      img.onload = () => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;

        if (!container || !canvas || !maskCanvas) return;

        // Get actual container dimensions
        const containerRect = container.getBoundingClientRect();
        
        // Calculate available space more accurately, accounting for panel visibility
        const containerWidth = containerRect.width - (isMobile ? 40 : panelsHidden ? 80 : 440);
        // Increased vertical spacing by reducing the available height
        const containerHeight = containerRect.height - (isMobile ? 200 : 180);

        // Calculate scale to fit image while maintaining aspect ratio
        const scale = Math.min(containerWidth / img.width, containerHeight / img.height) * (isMobile ? 0.75 : panelsHidden ? 0.90 : 0.85);

        // Calculate dimensions that maintain aspect ratio
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Set both canvas dimensions
        [canvas, maskCanvas].forEach(c => {
          c.style.width = `${scaledWidth}px`;
          c.style.height = `${scaledHeight}px`;
        });
        
        // Reset zoom when resizing window
        setZoomLevel(0);
        setPanPosition({ x: 0, y: 0 });
        setIsZoomed(false);
      };
      img.src = pendingImages[currentImageIndex];
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pendingImages, currentImageIndex, isMobile, panelsHidden]);

  // Update history page index when adding new items
  useEffect(() => {
    if (history.length > 0) {
      // Calculate the page index where the current history item should appear
      const nonOriginalItems = history.filter(item => !item.isOriginal);
      const currentItemIndex = nonOriginalItems.findIndex(item => currentHistoryItem && item.id === currentHistoryItem.id);
      
      if (currentItemIndex >= 0) {
        setHistoryPageIndex(Math.floor(currentItemIndex / TABS_PER_PAGE));
      }
    }
  }, [history, currentHistoryItem]);

  // Toggle canvas lock function
  const toggleCanvasLock = () => setIsCanvasLocked(prev => !prev);

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
    drawPoint(maskContextRef.current, x, y, brushSize);
    hasDrawnRef.current = true;
    setIsDrawing(true);
  };

  const draw = (event) => {
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
    
    if (!hasContent) return;
    hasDrawnRef.current = false;

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

      // Send to backend
      const response = await fetch('http://localhost:8000/api/inpaint', {
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

  // Handle right-click context menu and dragging
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

    const handleMouseUp = () => { setIsDraggingContextMenu(false); };

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

  // Add keyboard shortcut support
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
      
      // New shortcut: Y to approve the current image and move it to processed
      if (e.key.toLowerCase() === 'y' && !isLoading) {
        e.preventDefault();
        handleApproveImage(
          pendingImages, isLoading, currentHistoryItem, currentImageIndex,
          setProcessedImages, setPendingImages, setCurrentImageIndex, setHistory, 
          setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
        );
      }

      // Arrow key up/down navigation - new feature
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Skip if panels are hidden (fullscreen mode) or if user is typing
        if (panelsHidden || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }

        e.preventDefault();
        const isUp = e.key === 'ArrowUp';
        
        // If no panel is active yet, activate the left panel if it has items, otherwise the right panel
        if (!activePanel) {
          if (processedImages.length > 0) {
            setActivePanel('left');
          } else if (pendingImages.length > 0) {
            setActivePanel('right');
          }
          return;
        }
        
        // Handle up/down navigation within the active panel
        if (activePanel === 'left' && leftPanelExpanded) {
          if (processedImages.length > 0) {
            if (isUp) {
              // Move up in left panel (processed images)
              setLeftPanelActiveIndex(prev => (prev > 0 ? prev - 1 : processedImages.length - 1));
            } else {
              // Move down in left panel
              setLeftPanelActiveIndex(prev => (prev < processedImages.length - 1 ? prev + 1 : 0));
            }
          }
        } else if (activePanel === 'right' && rightPanelExpanded) {
          if (pendingImages.length > 0) {
            if (isUp) {
              // Move up in right panel (pending images)
              setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : pendingImages.length - 1));
            } else {
              // Move down in right panel
              setCurrentImageIndex(prev => (prev < pendingImages.length - 1 ? prev + 1 : 0));
            }
            
            // Update history for the new image
            const initialHistoryItem = {
              id: 'original',
              processedImage: pendingImages[currentImageIndex],
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
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Only proceed if not in fullscreen mode
        if (panelsHidden) {
          return;
        }
        
        const isLeft = e.key === 'ArrowLeft';
        
        // If we have a focused panel, try to switch between panels first
        if (activePanel) {
          if (isLeft && activePanel === 'right' && leftPanelExpanded && processedImages.length > 0) {
            // Switch from right panel to left panel
            e.preventDefault();
            setActivePanel('left');
            return;
          } else if (!isLeft && activePanel === 'left' && rightPanelExpanded && pendingImages.length > 0) {
            // Switch from left panel to right panel
            e.preventDefault();
            setActivePanel('right');
            return;
          }
        }
        
        // If no panel switch happened, handle the existing image navigation within the right panel
        // (this keeps the existing left/right arrow functionality for navigating images when in the right panel)
        if (!e.defaultPrevented && pendingImages.length > 1 && !isLoading && 
            (activePanel === 'right' || !activePanel)) {
          e.preventDefault();
          navigateImages(
            isLeft ? 'prev' : 'next',
            pendingImages, currentImageIndex, setCurrentImageIndex, setHistory,
            setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
          );
        }
      }

      // Check for Ctrl/Cmd + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Check for Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y (Redo)
      if ((e.ctrlKey || e.metaKey) && ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Toggle history panel with H key
      if (e.key === 'h') {
        e.preventDefault();
        if (!showHistory) {
          setShowHistory(true);
          setHistoryMinimized(false); // Always show tabs when opening with H
        } else {
          setShowHistory(false);
        }
      }
      // Toggle canvas lock with L key
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleCanvasLock();
      }
      // Adjust brush size with + or - keys (with Shift key)
      if ((e.key === '+' || e.key === '=') && e.shiftKey) {
        e.preventDefault();
        increaseBrushSize();
      }
      if ((e.key === '-' || e.key === '_') && e.shiftKey) {
        e.preventDefault();
        decreaseBrushSize();
      }

      // Toggle zoom controls with Z key
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        
        if (isZoomed && !e.shiftKey) {
          // If already zoomed and Z is pressed without Shift, toggle draw/pan mode
          setZoomDrawMode(prev => {
            const newDrawMode = !prev;
            setShowZoomControls(!newDrawMode); // Hide controls in draw mode
            return newDrawMode;
          });
        } else if (!isZoomed) {
          // If not zoomed, enter zoom mode and show controls
          handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls);
        } else if (isZoomed && e.shiftKey) {
          // If zoomed and shift key is pressed, exit zoom mode
          exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls);
        }
      }

      // MODIFIED: Toggle fit mode with F key
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        fitImageToScreen(
          setPanelsHidden, setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode,
          pendingImages, currentImageIndex, contextRef, canvasRef, maskContextRef,
          setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
        );
      }

      // Navigate tabs with T and Shift+T
      if (e.key.toLowerCase() === 't' && !isLoading && history.length > 0) {
        e.preventDefault();
        if (!showHistory) {
          setShowHistory(true);
          setHistoryMinimized(false);
          return; // Don't navigate on first press, just show panel
        }
        
        const navigableTabs = history.filter(item => !item.isOriginal);
        if (navigableTabs.length === 0) return;
        
        let newIndex;
        if (e.shiftKey) {
          // Navigate backward
          const currentIdx = navigableTabs.findIndex(item => currentHistoryItem && item.id === currentHistoryItem.id);
          newIndex = currentIdx <= 0 ? navigableTabs.length - 1 : currentIdx - 1;
        } else {
          // Navigate forward
          const currentIdx = navigableTabs.findIndex(item => currentHistoryItem && item.id === currentHistoryItem.id);
          newIndex = currentIdx === -1 || currentIdx === navigableTabs.length - 1 ? 0 : currentIdx + 1;
        }
        
        const historyTabIndex = history.findIndex(item => item.id === navigableTabs[newIndex].id);
        setHistoryIndex(historyTabIndex);
        setCurrentHistoryItem(history[historyTabIndex]);
        loadImageToCanvas(
          history[historyTabIndex].processedImage, contextRef, canvasRef, maskContextRef,
          historyTabIndex, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
        );
        
        setHistoryPageIndex(Math.floor(newIndex / TABS_PER_PAGE));
        
        if (mode === 'original') {
          setMode('brush');
          maskCanvasRef.current.style.display = 'block';
        }
      }

      // Delete current tab with X key
      if (e.key.toLowerCase() === 'x' && !isLoading && currentHistoryItem && !currentHistoryItem.isOriginal) {
        e.preventDefault();
        if (!showHistory) {
          setShowHistory(true);
          setHistoryMinimized(false);
          return; // Don't delete on first press, just show panel
        }
        
        setTabToDelete(currentHistoryItem.id);
        setShowDeleteConfirmation(true);
      }

      // Toggle original view with O key
      if (e.key.toLowerCase() === 'o' && !isLoading) {
        e.preventDefault();
        toggleOriginalView(
          mode, setMode, maskCanvasRef, pendingImages, currentImageIndex,
          (imageSrc, index) => loadImageToCanvas(
            imageSrc, contextRef, canvasRef, maskContextRef, index,
            setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
          ),
          history, setHistoryIndex, setCurrentHistoryItem, setHistoryPageIndex
        );
      }
      // Show instructions with I key
      if (e.key.toLowerCase() === 'i' && !isLoading) {
        e.preventDefault();
        setShowInstructions(prev => !prev);
      }
      // Download with D key
      if (e.key.toLowerCase() === 'd' && !isLoading) {
        e.preventDefault();
        handleDownload(setShowDownloadDialog);
      }
      // Toggle shortcuts menu with S key
      if (e.key.toLowerCase() === 's' && !isLoading) {
        e.preventDefault();
        setShowContextMenu(prev => !prev);
        if (!showContextMenu) {
          // Position in center if toggled with keyboard
          setContextMenuPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [
    history, historyIndex, brushSize, mode, isLoading, currentHistoryItem, 
    showDeleteConfirmation, tabToDelete, showContextMenu, isMobile, showHistory, 
    zoomLevel, showZoomControls, isZoomed, processedImages, pendingImages, currentImageIndex,
    panelsHidden, activePanel, leftPanelActiveIndex, leftPanelExpanded, rightPanelExpanded
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
    }
  };

  // Navigate to previous page of history tabs
  const handlePrevHistoryPage = () => {
    if (historyPageIndex > 0) {
      setHistoryPageIndex(historyPageIndex - 1);
    }
  };

  // Navigate to next page of history tabs
  const handleNextHistoryPage = () => {
    const nonOriginalItems = history.filter(item => !item.isOriginal);
    const totalPages = Math.ceil(nonOriginalItems.length / TABS_PER_PAGE);

    if (historyPageIndex < totalPages - 1) {
      setHistoryPageIndex(historyPageIndex + 1);
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
  };

  useEffect(() => {
    return () => {
      const canvas = maskCanvasRef.current;
      if (canvas) {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', stopDrawing);
        canvas.removeEventListener('mouseleave', stopDrawing);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
        canvas.removeEventListener('touchend', stopDrawing);
        canvas.removeEventListener('touchcancel', stopDrawing);
      }
      
      if (brushIndicatorTimeoutRef.current) {
        clearTimeout(brushIndicatorTimeoutRef.current);
      }
    };
  }, []);

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
    
    {!isMobile && (
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
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
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
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
          </button>
        </Tooltip>
      </div>
    )}
    
    {isMobile && (
      <div className="flex items-center gap-2">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100">
          <Menu className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>
</div>
        
        {/* Feedback/Bug Report Dialog */}
        {showFeedbackDialog && (<FeedbackDialog setShowFeedbackDialog={setShowFeedbackDialog} />)}
        
        {/* Mobile menu dropdown */}
        {isMobile && isMobileMenuOpen && (
          <MobileMenu
            toggleCanvasLock={toggleCanvasLock}
            isCanvasLocked={isCanvasLocked}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            setHistoryMinimized={setHistoryMinimized}
            showZoomControls={showZoomControls}
            setShowZoomControls={setShowZoomControls}
            showInstructions={showInstructions}
            setShowInstructions={setShowInstructions}
            handleDownload={() => handleDownload(setShowDownloadDialog)}
            toggleOriginalView={() => toggleOriginalView(
              mode, setMode, maskCanvasRef, pendingImages, currentImageIndex,
              (imageSrc, index) => loadImageToCanvas(
                imageSrc, contextRef, canvasRef, maskContextRef, index,
                setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
              ),
              history, setHistoryIndex, setCurrentHistoryItem, setHistoryPageIndex
            )}
            mode={mode}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            isLoading={isLoading}
          />
        )}
        
        {/* Canvas Container - Optimized for maximum space usage */}
        <div className={`flex-1 flex items-center justify-center relative p-2 pb-16 ${panelsHidden ? 'px-8' : ''}`}>
          <div className={`relative overflow-hidden mb-4 ${panelsHidden ? 'max-w-full transition-all duration-300' : ''}`} 
            style={{ border: "none", outline: "none" }}
            ref={canvasContainerRef}
            onMouseDown={(event) => startPanning(event, isZoomed, zoomDrawMode, isDrawing, setIsPanning, setLastPanPos)}
            onMouseMove={(event) => handlePanning(event, isPanning, isZoomed, lastPanPos, setLastPanPos, canvasRef, zoomLevel, setPanPosition)}
            onMouseUp={() => stopPanning(setIsPanning)}
            onMouseLeave={() => stopPanning(setIsPanning)}
            onTouchStart={(event) => startPanning(event, isZoomed, zoomDrawMode, isDrawing, setIsPanning, setLastPanPos)}
            onTouchMove={(event) => handlePanning(event, isPanning, isZoomed, lastPanPos, setLastPanPos, canvasRef, zoomLevel, setPanPosition)}
            onTouchEnd={() => stopPanning(setIsPanning)}
            onTouchCancel={() => stopPanning(setIsPanning)}>
            {/* Canvas wrapper with zoom/pan transformations */}
            <div className={`${isPanning ? 'pan-handle' : ''} ${isZoomed && !isPanning ? 'zoom-transition' : ''}`}
              style={{
                transform: isZoomed ? 
                  `scale(${1 + (zoomLevel * 0.1)}) translate(${-panPosition.x}px, ${-panPosition.y}px)` : 
                  'scale(1) translate(0px, 0px)', // Explicit default to avoid transform residue
                transformOrigin: 'center'
              }}>
              <canvas ref={canvasRef} className="rounded-lg shadow-md" style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", display: "block" }} />
              <canvas
                ref={maskCanvasRef} className="absolute top-0 left-0 rounded-lg"
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
                          mode === 'brush' ? 'crosshair' : 'not-allowed', 
                  boxShadow: "none", display: "block", pointerEvents: isLoading ? 'none' : 'auto'
                }}
              />
            </div>
            
            {/* Canvas Lock Overlay */}
            {isCanvasLocked && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg pointer-events-none">
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  <span>Canvas Locked (Press L to unlock)</span>
                </div>
              </div>
            )}
            
            {/* Zoom mode overlay */}
            {isZoomed && !isPanning && !zoomDrawMode && (
              <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-lg pointer-events-none">
                <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <span>Zoom Mode (Click and drag to pan)</span>
                </div>
              </div>
            )}
            
            {/* Zoom draw mode overlay - briefly show when toggling */}
            {isZoomed && zoomDrawMode && !isPanning && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg pointer-events-none transition-opacity duration-300 fade-out">
                <span>Draw Mode Active (Press Z to toggle pan/draw)</span>
              </div>
            )}
            
            {/* Zoom controls */}
            {showZoomControls && (
              <ZoomControls
                zoomLevel={zoomLevel} MAX_ZOOM_LEVEL={MAX_ZOOM_LEVEL} getZoomPercentage={getZoomPercentage}
                handleZoomIn={() => handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls)}
                handleZoomOut={() => handleZoomOut(setZoomLevel, setPanPosition)}
                handleResetZoom={() => handleResetZoom(setZoomLevel, setPanPosition)}
                isPanning={isPanning} zoomDrawMode={zoomDrawMode} setZoomDrawMode={setZoomDrawMode}
                setShowZoomControls={setShowZoomControls}
                exitZoomMode={() => exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls)}
              />
            )}
          </div>
        
          {/* Brush size indicator - show in normal mode or zoom draw mode */}
          {showBrushSizeIndicator && mode === 'brush' && !isLoading && (isZoomed ? zoomDrawMode : true) && (
            <BrushSizeIndicator brushSize={brushSize} />
          )}
        
         {/* Right-click Context Menu - only on desktop */}
         {showContextMenu && !isMobile && (
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
          {isLoading && <ProcessingOverlay />}
        
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
              handlePrevHistoryPage={handlePrevHistoryPage}
              handleNextHistoryPage={handleNextHistoryPage}
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
            />
          )}
          
          {/* Bulk Download Confirmation Dialog */}
          {showBulkDownloadConfirmation && (
            <BulkDownloadConfirmation 
              processedImages={processedImages} 
              setShowBulkDownloadConfirmation={setShowBulkDownloadConfirmation} 
              handleBulkDownload={() => handleBulkDownload(processedImages, setShowBulkDownloadConfirmation, setIsLoading)}
            />
          )}
        </div>
        
        {/* Bottom toolbar with improved visibility */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md px-4 py-2 z-50 border-t border-gray-200">
          {/* Desktop toolbar */}
          <div className="hidden md:flex h-14 items-center justify-between">
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
                      onClick={() => navigateImages(
                        'prev', pendingImages, currentImageIndex, setCurrentImageIndex, setHistory,
                        setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
                      )}
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
                      onClick={() => navigateImages(
                        'next', pendingImages, currentImageIndex, setCurrentImageIndex, setHistory,
                        setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
                      )}
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
            
            {/* Moved "Approve" button to come right after the brush controls */}
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
                    pendingImages, currentImageIndex, contextRef, canvasRef, maskContextRef,
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
            </div>
          </div>
        
          {/* Mobile toolbar - simplified and more visible */}
          <div className="flex md:hidden justify-between items-center h-14">
            <div className="flex items-center gap-1">
              <Tooltip text="Undo" preferredPosition="top">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0 || mode === 'original' || isLoading}
                  className={`p-2 rounded-full ${
                    historyIndex <= 0 || mode === 'original' || isLoading ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white'
                  }`}>
                  <Undo className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip text="Redo" preferredPosition="top">
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1 || mode === 'original' || isLoading}
                  className={`p-2 rounded-full ${
                    historyIndex >= history.length - 1 || mode === 'original' || isLoading ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white'
                  }`}>
                  <Redo className="w-5 h-5" />
                </button>
              </Tooltip>
              
              {/* Add navigation controls here - NEW */}
              {pendingImages.length > 1 && (
                <div className="flex items-center ml-1">
                  <Tooltip text="Previous Image" preferredPosition="top">
                    <button
                      onClick={() => navigateImages(
                        'prev', pendingImages, currentImageIndex, setCurrentImageIndex, setHistory,
                        setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
                      )}
                      className="p-2 rounded-full text-gray-700">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <div className="text-xs text-gray-500">
                    {currentImageIndex + 1}/{pendingImages.length}
                  </div>
                  <Tooltip text="Next Image" preferredPosition="top">
                    <button
                      onClick={() => navigateImages(
                        'next', pendingImages, currentImageIndex, setCurrentImageIndex, setHistory,
                        setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
                      )}
                      className="p-2 rounded-full text-gray-700">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <Tooltip text="Decrease Brush Size" preferredPosition="top">
                <button
                  onClick={decreaseBrushSize}
                  disabled={brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                  className={`p-2 ${brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700'}`}>
                  <Minus className="w-5 h-5" />
                </button>
              </Tooltip>
              <div className={`${isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'opacity-50' : ''}`}>
                <input
                  type="range" min="1" max="50" value={brushSize} onChange={handleBrushSizeChange}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none"
                  disabled={isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                />
              </div>
              <Tooltip text="Increase Brush Size" preferredPosition="top">
  <button
    onClick={increaseBrushSize}
    disabled={brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
    className={`p-2 ${brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700'}`}>
    <Plus className="w-5 h-5" />
  </button>
</Tooltip>

{/* Mobile Approve button moved here */}
{pendingImages.length > 0 && (
  <Tooltip text="Approve Image" preferredPosition="top">
    <button
      onClick={() => handleApproveImage(
        pendingImages, isLoading, currentHistoryItem, currentImageIndex,
        setProcessedImages, setPendingImages, setCurrentImageIndex, setHistory, 
        setCurrentHistoryItem, setHistoryIndex, mode, setMode, maskCanvasRef
      )}
      disabled={isLoading}
      className={`p-2 rounded-full ml-1 ${isLoading ? 'bg-gray-100 text-gray-400' : 'bg-green-500 text-white'}`}>
      <CheckCircle className="w-5 h-5" />
    </button>
  </Tooltip>
)}
</div>

<div className="flex items-center gap-2">
  {/* Updated fit button for mobile */}
  <Tooltip text={panelsHidden ? "Show Panels" : "Hide Panels"} preferredPosition="top">
    <button
      onClick={() => fitImageToScreen(
        setPanelsHidden, setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode,
        pendingImages, currentImageIndex, contextRef, canvasRef, maskContextRef,
        setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem
      )}
      disabled={isLoading}
      className={`p-2 rounded-full ${
        isLoading ? 'bg-gray-100 text-gray-400' : 
        panelsHidden ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
      }`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
      </svg>
    </button>
  </Tooltip>

  <Tooltip text="Zoom Controls" preferredPosition="top">
    <button
      onClick={() => {
        if (isZoomed) {
          exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls);
        } else {
          handleZoomIn(setZoomLevel, MAX_ZOOM_LEVEL, isZoomed, setIsZoomed, setShowZoomControls);
        }
      }}
      disabled={isLoading}
      className={`p-2 rounded-full ${
        isLoading ? 'bg-gray-100 text-gray-400' : 
        zoomLevel > 0 ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
      }`}>
      <ZoomIn className="w-5 h-5" />
    </button>
  </Tooltip>
  
  <Tooltip text={isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'} preferredPosition="top">
    <button
      onClick={toggleCanvasLock}
      disabled={isLoading}
      className={`p-2 rounded-full ${
        isLoading ? 'bg-gray-100 text-gray-400' : 
        isCanvasLocked ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
      }`}>
      {isCanvasLocked ? (<Lock className="w-5 h-5" />) : (<Unlock className="w-5 h-5" />)}
    </button>
  </Tooltip>
  
  <Tooltip text={mode === 'original' ? 'Exit View' : 'Original'} preferredPosition="top">
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
      className={`p-2 rounded-full ${
        isLoading ? 'bg-gray-100 text-gray-400' : 
        mode === 'original' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
      }`}>
      <Eye className="w-5 h-5" />
    </button>
  </Tooltip>
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