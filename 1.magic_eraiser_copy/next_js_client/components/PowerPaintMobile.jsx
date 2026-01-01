import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, CheckCircle, X, ArrowLeft, ArrowRight, 
  Lock, Unlock, Eye, Undo, Redo, Plus, Minus, 
  MessageSquare, Menu, ZoomIn, Home, Settings, 
  Edit3, ZoomOut, Wand2, Save
} from 'lucide-react';

// Constants for mobile configuration
const MOBILE_BRUSH_SIZES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
const DEFAULT_MOBILE_BRUSH_SIZE = 20;
const MOBILE_GESTURE_THRESHOLD = 10; // Pixel threshold for gesture detection
const MOBILE_HAPTIC_DURATION = {
  SHORT: 50,
  MEDIUM: 100,
  LONG: 200,
  PATTERN: [30, 30, 30]
};

// Inject global style fix to override framework styles
const injectStyleFix = () => {
  if (typeof document === 'undefined') return () => {};
  
  const styleId = 'power-paint-style-fix';
  const existingStyle = document.getElementById(styleId);
  
  if (existingStyle) {
    return () => {
      const element = document.getElementById(styleId);
      if (element) document.head.removeChild(element);
    };
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Direct styling overrides for PowerPaint components */
    #power-paint-app * {
      color: #000000 !important;
      font-weight: 500 !important;
    }
    
    /* Menu and dialog specific overrides */
    .power-paint-menu,
    .power-paint-dialog {
      color: #000000 !important;
      font-weight: 500 !important;
    }
    
    /* Force menu background to be transparent */
    .power-paint-backdrop {
      background-color: rgba(0, 0, 0, 0.3) !important;
    }
    
    /* Force menu content to be white */
    .power-paint-menu-content {
      background-color: #FFFFFF !important;
    }
    
    /* QuickBall menu overrides */
    .quick-ball-menu * {
      color: #000000 !important;
      font-weight: 500 !important;
    }
    
    /* Input placeholder color fix */
    .prompt-input::placeholder {
      color: #6B7280 !important;
      font-weight: 500 !important;
    }
    
    /* Force black text for all buttons */
    button {
      color: #000000 !important;
    }
    
    /* Exception for white text buttons */
    button.text-white {
      color: #FFFFFF !important;
    }
  `;
  
  document.head.appendChild(style);
  
  return () => {
    const element = document.getElementById(styleId);
    if (element) document.head.removeChild(element);
  };
};

// QuickBall Component - Mobile-optimized tool menu
const QuickBall = ({ 
  mode, 
  interactionMode, 
  switchToDrawMode, 
  switchToZoomMode, 
  resetZoom, 
  toggleOriginalView, 
  toggleCanvasLock, 
  isCanvasLocked, 
  increaseBrushSize, 
  decreaseBrushSize, 
  handleUndo, 
  handleRedo, 
  handleApproveImage, 
  historyIndex, 
  history, 
  isLoading, 
  setShowDownloadDialog, 
  toggleZoomTooltip,
  showZoomTooltip,
  samModeActive,
  setSamModeActive
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Toggle QuickBall open/closed
  const toggleQuickBall = () => {
    if (navigator.vibrate) {
      navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
    }
    setIsOpen(!isOpen);
    
    // Close zoom tooltip if open when QuickBall opens
    if (!isOpen && showZoomTooltip) {
      toggleZoomTooltip();
    }
  };
  
  // Function to trigger haptic feedback and close ball
  const handleAction = (action) => {
    if (navigator.vibrate) {
      navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
    }
    action();
    setIsOpen(false);
  };
  
  return (
    <div className="quick-ball-container fixed bottom-20 right-4 z-40">
      {/* Main QuickBall button */}
      <button 
        className={`quick-ball w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center z-50 transition-transform duration-300 ${isOpen ? 'transform rotate-45' : ''}`}
        onClick={toggleQuickBall}
        style={{
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
          border: '2px solid #e5e7eb',
          color: '#000000' // Force black color
        }}
      >
        {isOpen ? (
          <X className="w-8 h-8 text-gray-700" style={{ color: '#000000' }} />
        ) : (
          <Menu className="w-8 h-8 text-gray-700" style={{ color: '#000000' }} />
        )}
      </button>
      
      {/* Tool options that appear when QuickBall is open */}
      {isOpen && (
        <div 
          className="quick-ball-menu absolute bottom-16 right-2 w-64 bg-white rounded-lg shadow-lg overflow-hidden power-paint-menu-content" 
          style={{
            animation: 'fadeInUp 0.2s ease-out forwards',
            backgroundColor: '#FFFFFF' // Force white background
          }}
        >
          <div className="grid grid-cols-4 gap-1 p-2">
            {/* Draw mode */}
            <button 
              onClick={() => handleAction(switchToDrawMode)}
              className={`p-2 rounded-md flex flex-col items-center justify-center text-xs
                ${interactionMode === 'draw' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
              `}
              disabled={isLoading}
              style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
            >
              <Edit3 className="w-5 h-5 mb-1" style={{ color: interactionMode === 'draw' ? '#1D4ED8' : '#000000' }} />
              <span style={{ color: interactionMode === 'draw' ? '#1D4ED8' : '#000000', fontWeight: 500 }}>Draw</span>
            </button>
            
            {/* Zoom mode */}
            <button 
              onClick={() => handleAction(switchToZoomMode)}
              className={`p-2 rounded-md flex flex-col items-center justify-center text-xs
                ${interactionMode === 'zoom' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
              `}
              disabled={isLoading}
              style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
            >
              <ZoomIn className="w-5 h-5 mb-1" style={{ color: interactionMode === 'zoom' ? '#1D4ED8' : '#000000' }} />
              <span style={{ color: interactionMode === 'zoom' ? '#1D4ED8' : '#000000', fontWeight: 500 }}>Zoom</span>
            </button>
            
            {/* Reset zoom */}
            <button 
              onClick={() => handleAction(resetZoom)}
              className="p-2 rounded-md flex flex-col items-center justify-center text-xs hover:bg-gray-100"
              disabled={isLoading}
              style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
            >
              <Home className="w-5 h-5 mb-1" style={{ color: '#000000' }} />
              <span style={{ color: '#000000', fontWeight: 500 }}>Reset</span>
            </button>
            
            {/* Original view toggle */}
            <button 
              onClick={() => handleAction(toggleOriginalView)}
              className={`p-2 rounded-md flex flex-col items-center justify-center text-xs
                ${mode === 'original' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
              `}
              disabled={isLoading}
              style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
            >
              <Eye className="w-5 h-5 mb-1" style={{ color: mode === 'original' ? '#1D4ED8' : '#000000' }} />
              <span style={{ color: mode === 'original' ? '#1D4ED8' : '#000000', fontWeight: 500 }}>Original</span>
            </button>
            
            {/* SAM mode toggle */}
            <button 
              onClick={() => handleAction(() => setSamModeActive(!samModeActive))}
              className={`p-2 rounded-md flex flex-col items-center justify-center text-xs
                ${samModeActive ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}
              `}
              disabled={isLoading}
              style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
            >
              <Wand2 className="w-5 h-5 mb-1" style={{ color: samModeActive ? '#047857' : '#000000' }} />
              <span style={{ color: samModeActive ? '#047857' : '#000000', fontWeight: 500 }}>SAM</span>
            </button>
            
            {/* Lock canvas toggle */}
            <button 
              onClick={() => handleAction(toggleCanvasLock)}
              className={`p-2 rounded-md flex flex-col items-center justify-center text-xs
                ${isCanvasLocked ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'}
              `}
              disabled={isLoading}
              style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
            >
              {isCanvasLocked ? (
                <>
                  <Lock className="w-5 h-5 mb-1" style={{ color: '#B91C1C' }} />
                  <span style={{ color: '#B91C1C', fontWeight: 500 }}>Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5 mb-1" style={{ color: '#000000' }} />
                  <span style={{ color: '#000000', fontWeight: 500 }}>Unlocked</span>
                </>
              )}
            </button>
            
            {/* Undo */}
            <button 
              onClick={() => handleAction(handleUndo)}
              className="p-2 rounded-md flex flex-col items-center justify-center text-xs hover:bg-gray-100"
              disabled={historyIndex <= 0 || mode === 'original' || isLoading}
              style={{ color: historyIndex <= 0 || mode === 'original' || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}
            >
              <Undo className="w-5 h-5 mb-1" style={{ color: historyIndex <= 0 || mode === 'original' || isLoading ? '#9CA3AF' : '#000000' }} />
              <span style={{ color: historyIndex <= 0 || mode === 'original' || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}>Undo</span>
            </button>
            
            {/* Redo */}
            <button 
              onClick={() => handleAction(handleRedo)}
              className="p-2 rounded-md flex flex-col items-center justify-center text-xs hover:bg-gray-100"
              disabled={historyIndex >= history.length - 1 || mode === 'original' || isLoading}
              style={{ color: historyIndex >= history.length - 1 || mode === 'original' || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}
            >
              <Redo className="w-5 h-5 mb-1" style={{ color: historyIndex >= history.length - 1 || mode === 'original' || isLoading ? '#9CA3AF' : '#000000' }} />
              <span style={{ color: historyIndex >= history.length - 1 || mode === 'original' || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}>Redo</span>
            </button>
            
            {/* Increase Brush Size */}
            <button 
              onClick={() => handleAction(increaseBrushSize)}
              className="p-2 rounded-md flex flex-col items-center justify-center text-xs hover:bg-gray-100"
              disabled={mode === 'original' || isCanvasLocked || isLoading}
              style={{ color: mode === 'original' || isCanvasLocked || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}
            >
              <Plus className="w-5 h-5 mb-1" style={{ color: mode === 'original' || isCanvasLocked || isLoading ? '#9CA3AF' : '#000000' }} />
              <span style={{ color: mode === 'original' || isCanvasLocked || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}>Brush+</span>
            </button>
            
            {/* Decrease Brush Size */}
            <button 
              onClick={() => handleAction(decreaseBrushSize)}
              className="p-2 rounded-md flex flex-col items-center justify-center text-xs hover:bg-gray-100"
              disabled={mode === 'original' || isCanvasLocked || isLoading}
              style={{ color: mode === 'original' || isCanvasLocked || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}
            >
              <Minus className="w-5 h-5 mb-1" style={{ color: mode === 'original' || isCanvasLocked || isLoading ? '#9CA3AF' : '#000000' }} />
              <span style={{ color: mode === 'original' || isCanvasLocked || isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}>Brush-</span>
            </button>
            
            {/* Download */}
            <button 
              onClick={() => handleAction(() => setShowDownloadDialog(true))}
              className="p-2 rounded-md flex flex-col items-center justify-center text-xs hover:bg-gray-100"
              disabled={isLoading}
              style={{ color: isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}
            >
              <Download className="w-5 h-5 mb-1" style={{ color: isLoading ? '#9CA3AF' : '#000000' }} />
              <span style={{ color: isLoading ? '#9CA3AF' : '#000000', fontWeight: 500 }}>Download</span>
            </button>
            
            {/* Approve */}
            <button 
              onClick={() => handleAction(handleApproveImage)}
              className="p-2 rounded-md flex flex-col items-center justify-center text-xs hover:bg-gray-100 bg-green-50"
              disabled={isLoading}
              style={{ fontWeight: 500 }}
            >
              <CheckCircle className="w-5 h-5 mb-1 text-green-600" />
              <span className="text-green-600" style={{ fontWeight: 500 }}>Approve</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

const PowerPaintMobile = ({
  initialImage,
  onReset,
  isLoading,
  setIsLoading,
  mode,
  setMode,
  brushSize,
  setBrushSize,
  isCanvasLocked,
  setIsCanvasLocked,
  samModeActive,
  setSamModeActive,
  samPoints,
  setSamPoints,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  modelType,
  setModelType,
  steps,
  setSteps,
  guidanceScale,
  setGuidanceScale,
  seed,
  setSeed,
  history,
  setHistory,
  historyIndex,
  setHistoryIndex,
  currentHistoryItem,
  setCurrentHistoryItem,
  pendingImages,
  setPendingImages,
  processedImages,
  setProcessedImages,
  currentImageIndex,
  setCurrentImageIndex,
  canvasRef,
  maskCanvasRef,
  contextRef,
  maskContextRef,
  maskBackupRef,
  hasDrawnRef,
  handleUndo,
  handleRedo,
  toggleOriginalView,
  toggleCanvasLock,
  handleApproveImage,
  handleGenerate,
  handleRecoverImage,
  handleDownloadImage,
  handleBulkDownload,
  navigateImages,
  startDrawing,
  draw,
  stopDrawing,
  showBrushSizePreview,
  handleBrushSizeChange,
  increaseBrushSize,
  decreaseBrushSize
}) => {
  // Mobile-specific state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [showMobileBrushControls, setShowMobileBrushControls] = useState(false);
  const [showMobileImageList, setShowMobileImageList] = useState(false);
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);
  const [showMobileDownloadDialog, setShowMobileDownloadDialog] = useState(false);
  const [showMobileSettingsDialog, setShowMobileSettingsDialog] = useState(false);
  const [showMobileFeedbackDialog, setShowMobileFeedbackDialog] = useState(false);
  const [showZoomTooltip, setShowZoomTooltip] = useState(false);
  const [useQuickBall, setUseQuickBall] = useState(true);
  
  // Zoom and gesture states
  const [isGestureZooming, setIsGestureZooming] = useState(false);
  const [initialTouchDistance, setInitialTouchDistance] = useState(0);
  const [currentZoomScale, setCurrentZoomScale] = useState(1);
  const [initialPanPosition, setInitialPanPosition] = useState({ x: 0, y: 0 });
  const [currentPanPosition, setCurrentPanPosition] = useState({ x: 0, y: 0 });
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  
  // Interaction mode - 'draw', 'zoom', 'view'
  const [interactionMode, setInteractionMode] = useState('draw');
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const [showModeIndicator, setShowModeIndicator] = useState(false);
  
  // Refs
  const mobileCanvasContainerRef = useRef(null);
  const mobileGestureTimeoutRef = useRef(null);
  const zoomIndicatorTimeoutRef = useRef(null);
  const promptInputRef = useRef(null);
  
  // Apply style fixes to override Next.js framework styling
  useEffect(() => {
    const cleanup = injectStyleFix();
    return cleanup;
  }, []);
  
  // Init canvas and load image
  useEffect(() => {
    if (!initialImage || !canvasRef.current) return;

    // Configure canvas for optimal mobile display
    const canvas = canvasRef.current;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.position = "relative";
    canvas.style.display = "block";
    
    // Create a new 2D context
    contextRef.current = canvas.getContext('2d', { alpha: false });
    
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Set mask canvas dimensions
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = img.width;
        maskCanvasRef.current.height = img.height;
        maskContextRef.current = maskCanvasRef.current.getContext('2d', { alpha: true });
      }
      
      // Draw the image
      contextRef.current.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    
    img.onerror = (error) => {
      console.error("Error loading image:", error);
    };
    
    // Set the source to trigger loading
    img.src = initialImage;
  }, [initialImage]);

  // Ensure container has proper sizing
  useEffect(() => {
    if (mobileCanvasContainerRef.current) {
      mobileCanvasContainerRef.current.style.minHeight = '300px';
    }
  }, []);
  
  // Reset zoom and pan when changing images
  useEffect(() => {
    setCurrentZoomScale(1);
    setCurrentPanPosition({ x: 0, y: 0 });
  }, [currentImageIndex]);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (mobileGestureTimeoutRef.current) {
        clearTimeout(mobileGestureTimeoutRef.current);
      }
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
    };
  }, []);
  
  // Toggle interaction mode
  const toggleInteractionMode = () => {
    // Cycle through modes: draw -> zoom -> view -> draw
    setInteractionMode(prevMode => {
      if (prevMode === 'draw') return 'zoom';
      if (prevMode === 'zoom') return 'view';
      return 'draw';
    });
    
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
    }
    
    // Show feedback to user
    setShowModeIndicator(true);
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current);
    }
    zoomIndicatorTimeoutRef.current = setTimeout(() => {
      setShowModeIndicator(false);
    }, 2000);
  };
  
  // Switch directly to draw mode while maintaining zoom
  const switchToDrawMode = () => {
    setInteractionMode('draw');
    // Close zoom tooltip if open
    setShowZoomTooltip(false);
    
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
    }
    
    // Show feedback to user
    setShowModeIndicator(true);
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current);
    }
    zoomIndicatorTimeoutRef.current = setTimeout(() => {
      setShowModeIndicator(false);
    }, 2000);
  };
  
  // Switch directly to zoom mode
  const switchToZoomMode = () => {
    setInteractionMode('zoom');
    
    // Check if QuickBall is open before showing zoom tooltip
    const quickBallOpen = document.querySelector('.quick-ball') && 
                          document.querySelector('.quick-ball').style.transform.includes('rotate(45deg)');
    
    // Only show the zoom tooltip if QuickBall is not open
    if (!quickBallOpen) {
      setShowZoomTooltip(true);
    }
    
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
    }
    
    // Show feedback to user
    setShowModeIndicator(true);
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current);
    }
    zoomIndicatorTimeoutRef.current = setTimeout(() => {
      setShowModeIndicator(false);
    }, 2000);
  };
  
  // Reset zoom to original scale
  const resetZoom = () => {
    setCurrentZoomScale(1);
    setCurrentPanPosition({ x: 0, y: 0 });
    
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
    }
    
    // Show feedback to user
    setShowZoomIndicator(true);
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current);
    }
    zoomIndicatorTimeoutRef.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 2000);
  };
  
  // Mobile gesture handlers
  const handleTouchStart = (e) => {
    // Handle based on interaction mode
    if (interactionMode === 'draw' && !isCanvasLocked && mode !== 'original') {
      // In drawing mode, handle brush
      // Create a synthetic mouse event from touch event to avoid preventDefault issues
      const touch = e.touches[0];
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: touch.target,
        type: 'mousedown',
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      startDrawing(mouseEvent);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;
    const doubleTapDelay = 300; // milliseconds
    
    // Check for double tap to reset zoom
    if (timeSinceLastTap < doubleTapDelay && timeSinceLastTap > 0) {
      // Reset zoom and pan
      resetZoom();
      
      // Reset last tap
      setLastTap(0);
      return;
    }
    
    setLastTap(now);
    setTouchStartTime(now);
    
    if (e.touches.length === 2 && (interactionMode === 'zoom' || interactionMode === 'view')) {
      // Two finger touch - prepare for zoom/pan
      e.preventDefault();
      setIsGestureZooming(true);
      
      // Calculate initial distance between two fingers
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      setInitialTouchDistance(distance);
      
      // Provide haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
      }
    } 
    else if (e.touches.length === 1) {
      if (interactionMode === 'zoom' || interactionMode === 'view' || mode === 'original' || isCanvasLocked) {
        // In zoom/view mode, prepare for panning
        e.preventDefault();
        setInitialPanPosition({
          x: e.touches[0].clientX - currentPanPosition.x,
          y: e.touches[0].clientY - currentPanPosition.y
        });
      }
    }
  };
  
  const handleTouchMove = (e) => {
    // Handle based on interaction mode
    if (interactionMode === 'draw' && !isCanvasLocked && mode !== 'original') {
      // In drawing mode, handle brush
      // Create a synthetic mouse event from touch event
      const touch = e.touches[0];
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: touch.target,
        type: 'mousemove',
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      draw(mouseEvent);
      return;
    }
    
    if (e.touches.length === 2 && isGestureZooming && (interactionMode === 'zoom' || interactionMode === 'view')) {
      // Handle two-finger zoom gesture
      e.preventDefault();
      
      // Calculate new distance between fingers
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate zoom factor based on distance change
      const scaleFactor = newDistance / initialTouchDistance;
      const newZoomScale = Math.max(0.5, Math.min(5, currentZoomScale * scaleFactor));
      
      // Update zoom scale
      setCurrentZoomScale(newZoomScale);
      setInitialTouchDistance(newDistance);
      
      // Show zoom indicator
      setShowZoomIndicator(true);
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
      zoomIndicatorTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 2000);
    } 
    else if (e.touches.length === 1) {
      if (interactionMode === 'zoom' || interactionMode === 'view' || mode === 'original' || isCanvasLocked) {
        // Handle panning in zoom or view mode
        e.preventDefault();
        const newPanX = e.touches[0].clientX - initialPanPosition.x;
        const newPanY = e.touches[0].clientY - initialPanPosition.y;
        
        // Apply constraints to prevent panning too far
        const container = mobileCanvasContainerRef.current;
        const canvas = canvasRef.current;
        
        if (container && canvas) {
          const containerRect = container.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          
          // Calculate max pan distance based on zoom level and container/canvas size
          const maxPanX = Math.max(0, (canvasRect.width * currentZoomScale - containerRect.width) / 2);
          const maxPanY = Math.max(0, (canvasRect.height * currentZoomScale - containerRect.height) / 2);
          
          setCurrentPanPosition({
            x: Math.max(-maxPanX, Math.min(maxPanX, newPanX)),
            y: Math.max(-maxPanY, Math.min(maxPanY, newPanY))
          });
        }
      }
    }
  };
  
  const handleTouchEnd = (e) => {
    const touchDuration = Date.now() - touchStartTime;
    
    if (isGestureZooming) {
      setIsGestureZooming(false);
      
      // Safe preventDefault
      try {
        e.preventDefault();
      } catch (err) {
        // Ignore if preventDefault is not available
      }
      
      // Provide haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
      }
    } 
    else if (interactionMode === 'draw' && mode !== 'original' && !isCanvasLocked) {
      // End drawing with synthetic event
      const mouseEvent = {
        type: 'mouseup',
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      stopDrawing(mouseEvent);
    }
    
    // Clear any gesture timeouts
    if (mobileGestureTimeoutRef.current) {
      clearTimeout(mobileGestureTimeoutRef.current);
    }
  };
  
  // Toggle zoom tooltip 
  const toggleZoomTooltip = () => {
    // Check if QuickBall is open, don't show tooltip in that case
    if (useQuickBall && document.querySelector('.quick-ball') && 
        document.querySelector('.quick-ball').style.transform.includes('rotate(45deg)')) {
      return; // Don't show tooltip if QuickBall is open
    }
    
    // If we're toggling on, also switch to zoom mode
    if (!showZoomTooltip) {
      switchToZoomMode();
      
      // Provide haptic feedback when showing tooltip
      if (navigator.vibrate) {
        navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
      }
    } else {
      // Animate out if we need to hide it
      const tooltipElement = document.querySelector('.zoom-tooltip');
      if (tooltipElement) {
        // Apply hide animation
        tooltipElement.style.animation = 'tooltip-hide 0.25s ease-in forwards';
        
        // Delay the state change until animation completes
        setTimeout(() => {
          setShowZoomTooltip(false);
        }, 200);
        return;
      }
    }
    setShowZoomTooltip(!showZoomTooltip);
  };
  
  // Handle SAM mode canvas click
  const handleSamCanvasClick = (e) => {
    if (!samModeActive) return;
    
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.type.startsWith('touch') && e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      
      // Safe preventDefault for touch events
      try {
        e.preventDefault();
      } catch (err) {
        // Ignore if preventDefault is not available
      }
    } else {
      clientX = e.clientX || 0;
      clientY = e.clientY || 0;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Adjust for zoom and pan
    const x = ((clientX - rect.left) * scaleX) / currentZoomScale + (currentPanPosition.x * scaleX);
    const y = ((clientY - rect.top) * scaleY) / currentZoomScale + (currentPanPosition.y * scaleY);
    
    // Add the point
    setSamPoints(prev => [...prev, { x: x / canvas.width, y: y / canvas.height }]);
    
    // Draw point on the mask canvas
    const ctx = maskContextRef.current;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
    }
  };
  
  return (
    <div id="power-paint-app" className="fixed inset-0 bg-white flex flex-col h-full">
      {/* Custom tooltip styles */}
      <style jsx>{`
        .zoom-tooltip-wrapper {
          --background: #62abff;
          --icon-color: #414856;
          --width: 50px;
          --height: 50px;
          --border-radius: var(--height);
          width: fit-content;
          height: 40px;
          position: absolute;
          left: 50%;
          bottom: 10px; /* Positioned closer to the toolbar */
          transform: translateX(-50%); /* Center it horizontally */
          z-index: 45;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .zoom-tooltip {
          width: fit-content;
          height: 40px;
          border-radius: 20px;
          background: #fff;
          padding: 0 15px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 15px;
          animation: tooltip-pop 0.35s ease-out forwards;
          transform-origin: bottom center;
        }
        
        @keyframes tooltip-pop {
          0% {
            transform: scale(0.8) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) translateY(-5px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes tooltip-hide {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(20px);
            opacity: 0;
          }
        }
        
        .zoom-tooltip button {
          transition: transform 0.15s ease;
        }
        
        .zoom-tooltip button:active {
          transform: scale(0.9);
        }
      `}</style>

      {/* Top navbar */}
      <div className="bg-white shadow-sm py-3 px-4 flex justify-between items-center z-20">
        <button 
          onClick={onReset} 
          className="text-gray-700 hover:text-gray-900 flex items-center text-sm"
          style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
        >
          <ArrowLeft className="w-4 h-4 mr-1" style={{ color: '#000000' }} />
          <span style={{ color: '#000000', fontWeight: 500 }}>Back</span>
        </button>
        
        <h1 
          className="text-base font-medium text-gray-900"
          style={{ color: '#000000', fontWeight: 500 }} // Force black color and weight
        >
          PowerPaint{pendingImages.length > 1 ? ` (${currentImageIndex + 1}/${pendingImages.length})` : ''}
        </h1>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMobileFeedbackDialog(true)} 
            className="p-1 rounded-full text-gray-700 hover:bg-gray-100"
            style={{ color: '#000000' }} // Force black color
          >
            <MessageSquare className="w-5 h-5" style={{ color: '#000000' }} />
          </button>
          
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)} 
            className="p-1 rounded-full text-gray-700 hover:bg-gray-100"
            style={{ color: '#000000' }} // Force black color
          >
            <Menu className="w-5 h-5" style={{ color: '#000000' }} />
          </button>
        </div>
      </div>
      
      {/* Main canvas area */}
      <div 
        className="flex-1 flex items-center justify-center bg-gray-50 relative overflow-hidden"
        ref={mobileCanvasContainerRef}
      >
        <div 
          className="relative"
          style={{ 
            transform: `scale(${currentZoomScale}) translate(${currentPanPosition.x}px, ${currentPanPosition.y}px)`,
            transformOrigin: 'center',
            transition: isGestureZooming ? 'none' : 'transform 0.1s ease-out' 
          }}
          onTouchStart={samModeActive ? handleSamCanvasClick : handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <canvas 
            ref={canvasRef} 
            className="rounded-lg shadow-md" 
            style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", display: "block" }} 
          />
          <canvas
            ref={maskCanvasRef}
            className="absolute top-0 left-0 rounded-lg"
            style={{ 
              cursor: isCanvasLocked ? 'not-allowed' : samModeActive ? 'pointer' : mode === 'brush' ? 'crosshair' : 'default', 
              boxShadow: "none",
              display: mode === 'original' ? 'none' : 'block',
              pointerEvents: isLoading ? 'none' : 'auto' 
            }}
          />
        </div>
        
        {/* Canvas Lock Overlay */}
        {isCanvasLocked && (
          <div className="absolute inset-0 bg-transparent flex items-center justify-center rounded-lg pointer-events-none">
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span>Canvas Locked (Tap lock icon to unlock)</span>
            </div>
          </div>
        )}
        
        {/* SAM mode indicator */}
        {samModeActive && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-green-600 bg-opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-30">
            <Wand2 className="w-5 h-5" />
            <span>SAM Mode Active (Tap to add points)</span>
          </div>
        )}
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg px-6 py-4 shadow-lg flex items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-800 font-medium text-lg" style={{ color: '#000000', fontWeight: 500 }}>Processing...</span>
            </div>
          </div>
        )}
        
        {/* Zoom indicator (shown briefly after zoom gestures) */}
        {showZoomIndicator && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-opacity">
            <ZoomIn className="w-3 h-3" />
            <span>{Math.round(currentZoomScale * 100)}%</span>
          </div>
        )}
        
        {/* Mode indicator */}
        {showModeIndicator && (
          <div className="absolute top-28 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-opacity">
            {interactionMode === 'draw' && (
              <>
                <Edit3 className="w-3 h-3" />
                <span>Draw Mode</span>
              </>
            )}
            {interactionMode === 'zoom' && (
              <>
                <ZoomIn className="w-3 h-3" />
                <span>Zoom Mode</span>
              </>
            )}
            {interactionMode === 'view' && (
              <>
                <Eye className="w-3 h-3" />
                <span>View Mode</span>
              </>
            )}
          </div>
        )}
        
        {/* Zoom Tooltip */}
        {showZoomTooltip && (
          <div className="zoom-tooltip-wrapper">
            <div className="zoom-tooltip">
              <button
                onClick={() => {
                  const newZoom = Math.max(0.5, currentZoomScale - 0.2);
                  setCurrentZoomScale(newZoom);
                  setShowZoomIndicator(true);
                  if (zoomIndicatorTimeoutRef.current) {
                    clearTimeout(zoomIndicatorTimeoutRef.current);
                  }
                  zoomIndicatorTimeoutRef.current = setTimeout(() => {
                    setShowZoomIndicator(false);
                  }, 2000);
                }}
                disabled={currentZoomScale <= 0.5}
                className="text-gray-700 p-2"
                style={{ color: '#000000' }} // Force black color
              >
                <Minus className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
              
              <button
                onClick={resetZoom}
                className="text-gray-700 p-2"
                disabled={currentZoomScale === 1}
                style={{ color: '#000000' }} // Force black color
              >
                <Home className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
              
              <button
                onClick={() => {
                  const newZoom = Math.min(5, currentZoomScale + 0.2);
                  setCurrentZoomScale(newZoom);
                  setShowZoomIndicator(true);
                  if (zoomIndicatorTimeoutRef.current) {
                    clearTimeout(zoomIndicatorTimeoutRef.current);
                  }
                  zoomIndicatorTimeoutRef.current = setTimeout(() => {
                    setShowZoomIndicator(false);
                  }, 2000);
                }}
                disabled={currentZoomScale >= 5}
                className="text-gray-700 p-2"
                style={{ color: '#000000' }} // Force black color
              >
                <Plus className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile Brush Size Controls */}
        {showMobileBrushControls && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-30 w-11/12 max-w-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium" style={{ color: '#000000', fontWeight: 500 }}>Brush Size: {brushSize}</h3>
              <button 
                onClick={() => setShowMobileBrushControls(false)} 
                className="text-gray-500 p-1 rounded-full hover:bg-gray-100"
                style={{ color: '#000000' }} // Force black color
              >
                <X className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <button 
                onClick={decreaseBrushSize} 
                className="p-2 rounded-full bg-gray-100 text-gray-700"
                disabled={brushSize <= 1}
                style={{ color: '#000000' }} // Force black color
              >
                <Minus className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
              
              <input
                type="range"
                min="1"
                max="50"
                value={brushSize}
                onChange={handleBrushSizeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none"
              />
              
              <button 
                onClick={increaseBrushSize} 
                className="p-2 rounded-full bg-gray-100 text-gray-700"
                disabled={brushSize >= 50}
                style={{ color: '#000000' }} // Force black color
              >
                <Plus className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
            </div>
            
            <div className="flex justify-center gap-2 flex-wrap">
              {MOBILE_BRUSH_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setBrushSize(size);
                    showBrushSizePreview(size);
                    if (navigator.vibrate) navigator.vibrate(MOBILE_HAPTIC_DURATION.SHORT);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    brushSize === size ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                  style={brushSize !== size ? { color: '#000000', fontWeight: 500 } : { fontWeight: 500 }} // Force color and weight
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Mobile History Panel */}
        {showMobileHistory && (
          <div className="absolute inset-x-0 bottom-16 bg-white rounded-t-lg shadow-lg z-30 max-h-[60vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-sm font-medium text-gray-700" style={{ color: '#000000', fontWeight: 500 }}>Edit History</h3>
              <button 
                onClick={() => setShowMobileHistory(false)} 
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                style={{ color: '#000000' }} // Force black color
              >
                <X className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
            </div>
            
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <button 
                  onClick={() => {
                    if (mode === 'original') return;
                    
                    setMode('original');
                    maskCanvasRef.current.style.display = 'none';
                    
                    setShowMobileHistory(false);
                  }}
                  className={`relative cursor-pointer rounded overflow-hidden ${
                    mode === 'original' ? 'ring-2 ring-blue-500 shadow-md' : 'hover:brightness-90'
                  }`}
                >
                  <img
                    src={initialImage}
                    alt="Original"
                    className="object-cover rounded w-20 h-16"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">
                    Original
                  </div>
                </button>
                
                <div className="flex flex-wrap gap-2 flex-1 justify-end">
                  {history
                    .filter(item => !item.isOriginal)
                    .slice(-5) // Show only the most recent 5 items for mobile
                    .map((item, idx) => {
                      const actualIndex = history.findIndex(h => h.id === item.id);
                      return (
                        <button
                          key={item.id}
                          className={`relative cursor-pointer rounded overflow-hidden ${
                            (currentHistoryItem && currentHistoryItem.id === item.id && mode !== 'original')
                              ? 'ring-2 ring-blue-500 shadow-md' : 'hover:brightness-90'
                          }`}
                          onClick={() => {
                            if (mode === 'original') {
                              setMode('brush');
                              maskCanvasRef.current.style.display = 'block';
                            }
                            setHistoryIndex(actualIndex);
                            setCurrentHistoryItem(history[actualIndex]);
                            // Load image and update
                            const img = new Image();
                            img.onload = () => {
                              contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                              contextRef.current.drawImage(img, 0, 0);
                            };
                            img.src = item.processedImage;
                            
                            setShowMobileHistory(false);
                          }}
                        >
                          <img
                            src={item.processedImage}
                            alt={`Edit ${actualIndex}`}
                            className="object-cover rounded w-20 h-16"
                          />
                          <div className="absolute top-0 left-0 bg-black bg-opacity-40 text-white text-xs px-1 rounded-br">
                            {actualIndex}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
              
              {history.filter(item => !item.isOriginal).length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500" style={{ color: '#000000', fontWeight: 500 }}>
                  No edits yet. Paint an area to generate a new version.
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mobile Menu - UPDATED WITH DIRECT HTML FOR BETTER STYLING */}
        {showMobileMenu && (
          <div 
            className="power-paint-backdrop absolute inset-0 z-50"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
            onClick={() => setShowMobileMenu(false)}
          >
            <div 
              className="power-paint-menu-content"
              style={{
                width: '280px',
                height: '100%',
                backgroundColor: '#FFFFFF',
                boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
              }}
              onClick={e => e.stopPropagation()} // Prevent closing when clicking on menu
            >
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #E5E7EB'
                }}
              >
                <h3 
                  className="power-paint-menu"
                  style={{
                    margin: 0,
                    padding: 0,
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#000000' // Force black text
                  }}
                >
                  Menu
                </h3>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    color: '#000000' // Force black text
                  }}
                >
                  <X className="w-5 h-5" style={{ color: '#000000' }} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button 
                  onClick={() => {
                    switchToZoomMode();
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: interactionMode === 'zoom' ? '#F3F4F6' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <ZoomIn className="w-5 h-5" style={{ color: '#64748B' }} />
                  <span style={{ color: '#000000', fontWeight: 500 }}>Zoom & Pan Mode</span>
                </button>
                
                <button 
                  onClick={() => {
                    switchToDrawMode();
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: interactionMode === 'draw' ? '#F3F4F6' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <Edit3 className="w-5 h-5" style={{ color: '#64748B' }} />
                  <span style={{ color: '#000000', fontWeight: 500 }}>Drawing Mode</span>
                </button>
                
                <button 
                  onClick={() => {
                    toggleOriginalView();
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: mode === 'original' ? '#F3F4F6' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <Eye className="w-5 h-5" style={{ color: '#64748B' }} />
                  <span style={{ color: '#000000', fontWeight: 500 }}>{mode === 'original' ? 'Exit Original View' : 'View Original'}</span>
                </button>
                
                <button 
                  onClick={() => {
                    setSamModeActive(!samModeActive);
                    if (!samModeActive) {
                      setSamPoints([]);
                      maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
                    }
                    setMode(samModeActive ? 'brush' : 'sam'); 
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: samModeActive ? '#F3F4F6' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <Wand2 className="w-5 h-5" style={{ color: '#64748B' }} />
                  <span style={{ color: '#000000', fontWeight: 500 }}>{samModeActive ? 'Exit SAM Mode' : 'SAM Mode'}</span>
                </button>
                
                <button 
                  onClick={() => {
                    toggleCanvasLock();
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isCanvasLocked ? '#F3F4F6' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  {isCanvasLocked ? (
                    <Unlock className="w-5 h-5" style={{ color: '#64748B' }} />
                  ) : (
                    <Lock className="w-5 h-5" style={{ color: '#64748B' }} />
                  )}
                  <span style={{ color: '#000000', fontWeight: 500 }}>{isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'}</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowMobileHistory(true);
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <svg className="w-5 h-5" style={{ color: '#64748B' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span style={{ color: '#000000', fontWeight: 500 }}>History</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowMobileSettingsDialog(true);
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <Settings className="w-5 h-5" style={{ color: '#64748B' }} />
                  <span style={{ color: '#000000', fontWeight: 500 }}>Advanced Settings</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowMobileDownloadDialog(true);
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <Download className="w-5 h-5" style={{ color: '#64748B' }} />
                  <span style={{ color: '#000000', fontWeight: 500 }}>Download</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowMobileInstructions(true);
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <svg className="w-5 h-5" style={{ color: '#64748B' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  </svg>
                  <span style={{ color: '#000000', fontWeight: 500 }}>Instructions</span>
                </button>
                
                {pendingImages.length > 1 && (
                  <button 
                    onClick={() => {
                      setShowMobileImageList(true);
                      setShowMobileMenu(false);
                    }}
                    className="power-paint-menu"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#000000', // Force black text
                      width: '100%'
                    }}
                  >
                    <svg className="w-5 h-5" style={{ color: '#64748B' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M3 10L21 10" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span style={{ color: '#000000', fontWeight: 500 }}>All Images ({pendingImages.length})</span>
                  </button>
                )}
                
                {processedImages.length > 0 && (
                  <button 
                    onClick={() => {
                      // Show processed images
                      setShowMobileMenu(false);
                    }}
                    className="power-paint-menu"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#000000', // Force black text
                      width: '100%'
                    }}
                  >
                    <CheckCircle className="w-5 h-5" style={{ color: '#64748B' }} />
                    <span style={{ color: '#000000', fontWeight: 500 }}>Processed ({processedImages.length})</span>
                  </button>
                )}
                
                {/* Toggle QuickBall option in menu */}
                <button 
                  onClick={() => {
                    setUseQuickBall(!useQuickBall);
                    setShowMobileMenu(false);
                  }}
                  className="power-paint-menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: useQuickBall ? '#F3F4F6' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000', // Force black text
                    width: '100%'
                  }}
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: '#64748B' }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="4"></circle>
                    <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                    <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                    <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                    <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
                  </svg>
                  <span style={{ color: '#000000', fontWeight: 500 }}>{useQuickBall ? 'Disable QuickBall' : 'Enable QuickBall'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Image List */}
        {showMobileImageList && (
          <div className="absolute inset-x-0 bottom-16 bg-white rounded-t-lg shadow-lg z-40 max-h-[60vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-sm font-medium text-gray-700" style={{ color: '#000000', fontWeight: 500 }}>Image Gallery</h3>
              <button 
                onClick={() => setShowMobileImageList(false)} 
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                style={{ color: '#000000' }} // Force black color
              >
                <X className="w-4 h-4" style={{ color: '#000000' }} />
              </button>
            </div>
            
            <div className="p-3 grid grid-cols-3 gap-2">
              {pendingImages.map((image, index) => (
                <div 
                  key={index}
                  className={`relative cursor-pointer rounded overflow-hidden aspect-square ${
                    index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    const initialHistoryItem = {
                      id: 'original',
                      processedImage: pendingImages[index],
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
                    
                    setShowMobileImageList(false);
                  }}
                >
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="object-cover w-full h-full rounded"
                  />
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Download Dialog */}
        {showMobileDownloadDialog && (
          <div className="power-paint-backdrop absolute inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div 
              className="power-paint-dialog bg-white rounded-lg p-4 w-11/12 max-w-sm mx-auto"
              style={{ backgroundColor: '#FFFFFF' }} // Force white background
            >
              <h3 className="text-lg font-medium mb-3" style={{ color: '#000000', fontWeight: 500 }}>Download Options</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    handleDownloadImage();
                    setShowMobileDownloadDialog(false);
                  }}
                  className="w-full py-3 px-4 bg-blue-500 text-white rounded-md flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span style={{ fontWeight: 500 }}>Download Current Image</span>
                </button>
                
                {processedImages.length > 0 && (
                  <button 
                    onClick={() => {
                      handleBulkDownload();
                      setShowMobileDownloadDialog(false);
                    }} 
                    className="w-full py-3 px-4 bg-green-500 text-white rounded-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span style={{ fontWeight: 500 }}>Download All Processed ({processedImages.length})</span>
                  </button>
                )}
                
                <button 
                  onClick={() => setShowMobileDownloadDialog(false)} 
                  className="w-full py-3 px-4 bg-gray-100 rounded-md"
                  style={{ color: '#000000', fontWeight: 500 }} // Force black text and weight
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Dialog */}
        {showMobileSettingsDialog && (
          <div className="power-paint-backdrop absolute inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div 
              className="power-paint-dialog bg-white rounded-lg p-4 w-11/12 max-w-sm mx-auto"
              style={{ backgroundColor: '#FFFFFF' }} // Force white background
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium" style={{ color: '#000000', fontWeight: 500 }}>Advanced Settings</h3>
                <button 
                  onClick={() => setShowMobileSettingsDialog(false)} 
                  className="text-gray-500 p-1 rounded-full hover:bg-gray-100"
                  style={{ color: '#000000' }} // Force black color
                >
                  <X className="w-5 h-5" style={{ color: '#000000' }} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ color: '#000000', fontWeight: 500 }}>
                    Model Type
                  </label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#000000', fontWeight: 500 }} // Force black text and weight
                  >
                    <option value="sdxl" style={{ color: '#000000', fontWeight: 500 }}>SDXL (Best Quality)</option>
                    <option value="realistic_vision" style={{ color: '#000000', fontWeight: 500 }}>Realistic Vision (Photorealistic)</option>
                    <option value="deliberate" style={{ color: '#000000', fontWeight: 500 }}>Deliberate (Detailed)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ color: '#000000', fontWeight: 500 }}>
                    Steps: {steps}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={steps}
                    onChange={(e) => setSteps(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none"
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ color: '#000000', fontWeight: 500 }}>Higher values = better quality, lower = faster</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ color: '#000000', fontWeight: 500 }}>
                    Guidance Scale: {guidanceScale}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ color: '#000000', fontWeight: 500 }}>
                    Seed
                  </label>
                  <input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#000000', fontWeight: 500 }} // Force black text and weight
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ color: '#000000', fontWeight: 500 }}>
                    Negative Prompt
                  </label>
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Enter negative prompt..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ color: '#000000', fontWeight: 500 }} // Force black text and weight
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowMobileSettingsDialog(false)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Instructions */}
        {showMobileInstructions && (
          <div className="absolute inset-0 bg-white z-50 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-base font-medium" style={{ color: '#000000', fontWeight: 500 }}>PowerPaint Instructions</h3>
              <button 
                onClick={() => setShowMobileInstructions(false)} 
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                style={{ color: '#000000' }} // Force black color
              >
                <X className="w-5 h-5" style={{ color: '#000000' }} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2" style={{ color: '#000000', fontWeight: 500 }}>How to use:</h4>
                <ol className="list-decimal ml-4 space-y-2 text-gray-600">
                  <li style={{ color: '#000000', fontWeight: 500 }}>Use the brush to paint over areas you want to remove or modify</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>The painted areas (in red) will be regenerated by AI</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Provide a text prompt to guide the generation</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Tap the brush icon to adjust brush size</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Tap the zoom icon to access zoom controls</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Use SAM mode to easily select objects with a few taps</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Use two fingers to zoom in on details in zoom mode</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>When zoomed in, drag to pan around</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Double-tap to reset zoom</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Tap history icon to view previous edits</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Tap eye icon to toggle original view</li>
                </ol>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2" style={{ color: '#000000', fontWeight: 500 }}>Gestures:</h4>
                <ul className="list-disc ml-4 space-y-2 text-gray-600">
                  <li style={{ color: '#000000', fontWeight: 500 }}>Pinch with two fingers to zoom in/out</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Drag with one finger to pan when zoomed</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Double-tap to reset zoom level</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2" style={{ color: '#000000', fontWeight: 500 }}>Toolbar Icons:</h4>
                <ul className="list-disc ml-4 space-y-2 text-gray-600">
                  <li style={{ color: '#000000', fontWeight: 500 }}><span className="font-medium" style={{ color: '#000000', fontWeight: 600 }}>Draw:</span> Switch to drawing mode</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}><span className="font-medium" style={{ color: '#000000', fontWeight: 600 }}>Zoom:</span> Open zoom controls</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}><span className="font-medium" style={{ color: '#000000', fontWeight: 600 }}>SAM:</span> Segment Anything Mode - tap to select objects</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}><span className="font-medium" style={{ color: '#000000', fontWeight: 600 }}>Undo/Redo:</span> Navigate edit history</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}><span className="font-medium" style={{ color: '#000000', fontWeight: 600 }}>Eye:</span> Toggle original view</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}><span className="font-medium" style={{ color: '#000000', fontWeight: 600 }}>Lock:</span> Prevent accidental drawing</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}><span className="font-medium" style={{ color: '#000000', fontWeight: 600 }}>Checkmark:</span> Approve current edit</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2" style={{ color: '#000000', fontWeight: 500 }}>QuickBall:</h4>
                <ul className="list-disc ml-4 space-y-2 text-gray-600">
                  <li style={{ color: '#000000', fontWeight: 500 }}>Tap the quick ball button to expand the tool menu</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Access all editor tools with a single tap</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Keep more screen space for your canvas</li>
                  <li style={{ color: '#000000', fontWeight: 500 }}>Toggle QuickBall on/off in the menu</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Feedback Dialog - UPDATED WITH DIRECT HTML FOR BETTER STYLING */}
        {showMobileFeedbackDialog && (
          <div 
            className="power-paint-backdrop fixed inset-0 flex items-center justify-center z-50"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 50
            }}
          >
            <div 
              className="power-paint-dialog bg-white rounded-md shadow-md p-4 w-[90%] max-w-md mx-auto space-y-3"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                padding: '16px',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}
              >
                <h3 
                  style={{
                    margin: 0,
                    padding: 0,
                    fontSize: '18px',
                    fontWeight: 500,
                    color: '#000000' // Force black text
                  }}
                >
                  Provide Feedback
                </h3>
                <button 
                  onClick={() => setShowMobileFeedbackDialog(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#000000' // Force black text
                  }}
                >
                  <X className="h-5 w-5" style={{ color: '#000000' }} />
                </button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label 
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000' // Force black text
                  }}
                >
                  Feedback Type
                </label>
                <select 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ color: '#000000', fontWeight: 500 }} // Force black text and weight
                >
                  <option value="bug" style={{ color: '#000000', fontWeight: 500 }}>Report a Bug</option>
                  <option value="feature" style={{ color: '#000000', fontWeight: 500 }}>Suggest a Feature</option>
                  <option value="other" style={{ color: '#000000', fontWeight: 500 }}>Other Feedback</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#000000' // Force black text
                  }}
                >
                  Description
                </label>
                <textarea 
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ color: '#000000', fontWeight: 500 }} // Force black text and weight
                  rows={4}
                  placeholder="Please describe your feedback in detail..."
                ></textarea>
              </div>
              
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px'
                }}
              >
                <button
                  onClick={() => setShowMobileFeedbackDialog(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '6px',
                    backgroundColor: '#F9FAFB',
                    color: '#000000', // Force black text
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Thank you for your feedback! This feature will be fully implemented soon.");
                    setShowMobileFeedbackDialog(false);
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF', // White text for button
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  className="text-white"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* QuickBall */}
        {useQuickBall && (
          <QuickBall
            mode={mode}
            interactionMode={interactionMode}
            switchToDrawMode={switchToDrawMode}
            switchToZoomMode={switchToZoomMode}
            resetZoom={resetZoom}
            toggleOriginalView={toggleOriginalView}
            toggleCanvasLock={toggleCanvasLock}
            isCanvasLocked={isCanvasLocked}
            increaseBrushSize={increaseBrushSize}
            decreaseBrushSize={decreaseBrushSize}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            handleApproveImage={handleApproveImage}
            historyIndex={historyIndex}
            history={history}
            isLoading={isLoading}
            setShowDownloadDialog={setShowMobileDownloadDialog}
            toggleZoomTooltip={toggleZoomTooltip}
            showZoomTooltip={showZoomTooltip}
            samModeActive={samModeActive}
            setSamModeActive={(active) => {
              setSamModeActive(active);
              if (!active) {
                setSamPoints([]);
                maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
              }
              setMode(active ? 'sam' : 'brush');
            }}
          />
        )}
      </div>
      
      {/* Prompt input */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 prompt-input"
            style={{ color: '#000000', fontWeight: 500 }} // Force black text and weight
            ref={promptInputRef}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt || isLoading || (samModeActive && samPoints.length === 0)}
            className={`px-4 py-2 rounded-md ${
              !prompt || isLoading || (samModeActive && samPoints.length === 0)
                ? 'bg-gray-300 text-gray-500'
                : 'bg-blue-500 text-white'
            }`}
            style={!prompt || isLoading || (samModeActive && samPoints.length === 0) 
              ? { color: '#9CA3AF', fontWeight: 500 } 
              : { fontWeight: 500 }} // Force appropriate color and weight
          >
            Generate
          </button>
        </div>
      </div>
      
      {/* Bottom toolbar - Simplified when QuickBall is enabled */}
      <div className="bg-white border-t border-gray-200 p-2 flex justify-between items-center">
        <div className="flex items-center gap-1">
          {/* QuickBall toggle button */}
          <button
            onClick={() => setUseQuickBall(!useQuickBall)}
            className={`p-2 rounded-full ${
              useQuickBall 
                ? 'text-blue-600 bg-blue-100' 
                : 'text-gray-700 active:bg-gray-200'
            }`}
            style={{ color: useQuickBall ? '#2563EB' : '#000000', fontWeight: 500 }} // Force color and weight
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
              <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
              <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
              <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
              <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
            </svg>
          </button>
          
          {/* Only show these buttons if QuickBall is disabled */}
          {!useQuickBall && (
            <>
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0 || mode === 'original' || isLoading}
                className={`p-2 rounded-full ${
                  historyIndex <= 0 || mode === 'original' || isLoading
                    ? 'text-gray-400'
                    : 'text-gray-700 active:bg-gray-200'
                }`}
                style={historyIndex <= 0 || mode === 'original' || isLoading ? {} : { color: '#000000', fontWeight: 500 }} // Force black color when enabled
              >
                <Undo className="w-5 h-5" style={historyIndex <= 0 || mode === 'original' || isLoading ? {} : { color: '#000000' }} />
              </button>
              
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1 || mode === 'original' || isLoading}
                className={`p-2 rounded-full ${
                  historyIndex >= history.length - 1 || mode === 'original' || isLoading
                    ? 'text-gray-400'
                    : 'text-gray-700 active:bg-gray-200'
                }`}
                style={historyIndex >= history.length - 1 || mode === 'original' || isLoading ? {} : { color: '#000000', fontWeight: 500 }} // Force black color when enabled
              >
                <Redo className="w-5 h-5" style={historyIndex >= history.length - 1 || mode === 'original' || isLoading ? {} : { color: '#000000' }} />
              </button>
            </>
          )}
        </div>
        
        {/* Only show these controls if QuickBall is disabled */}
        {!useQuickBall && (
          <>
            <div className="flex items-center gap-2">
              {/* SAM mode button */}
              <button
                onClick={() => {
                  setSamModeActive(!samModeActive);
                  if (!samModeActive) {
                    setSamPoints([]);
                    maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
                  }
                  setMode(samModeActive ? 'brush' : 'sam');
                }}
                disabled={isLoading}
                className={`p-2 rounded-full ${
                  isLoading
                    ? 'text-gray-400'
                    : samModeActive
                      ? 'text-green-600 bg-green-100'
                      : 'text-gray-700 active:bg-gray-200'
                }`}
                style={samModeActive ? { color: '#047857', fontWeight: 500 } : { color: '#000000', fontWeight: 500 }} // Force appropriate color
              >
                <Wand2 className="w-5 h-5" style={samModeActive ? { color: '#047857' } : { color: '#000000' }} />
              </button>
              
              {/* Brush button */}
              <button
                onClick={() => {
                  // Set to draw mode and show brush controls
                  switchToDrawMode();
                  setShowMobileBrushControls(true);
                }}
                disabled={mode === 'original' || isCanvasLocked || isLoading}
                className={`p-2 rounded-full ${
                  mode === 'original' || isCanvasLocked || isLoading
                    ? 'text-gray-400'
                    : interactionMode === 'draw'
                      ? 'text-blue-600 bg-blue-100'
                      : 'text-gray-700 active:bg-gray-200'
                }`}
                style={interactionMode === 'draw' ? { color: '#2563EB', fontWeight: 500 } : { color: '#000000', fontWeight: 500 }} // Force appropriate color
              >
                <Edit3 className="w-5 h-5" style={interactionMode === 'draw' ? { color: '#2563EB' } : { color: '#000000' }} />
              </button>
              
              {/* Zoom button - just toggles the tooltip now */}
              <button
                onClick={toggleZoomTooltip}
                disabled={isLoading}
                className={`p-2 rounded-full ${
                  isLoading
                    ? 'text-gray-400'
                    : interactionMode === 'zoom'
                      ? 'text-blue-600 bg-blue-100'
                      : 'text-gray-700 active:bg-gray-200'
                }`}
                style={interactionMode === 'zoom' ? { color: '#2563EB', fontWeight: 500 } : { color: '#000000', fontWeight: 500 }} // Force appropriate color
              >
                <ZoomIn className="w-5 h-5" style={interactionMode === 'zoom' ? { color: '#2563EB' } : { color: '#000000' }} />
              </button>
              
              <button
                onClick={toggleOriginalView}
                disabled={isLoading}
                className={`p-2 rounded-full ${
                  isLoading
                    ? 'text-gray-400'
                    : mode === 'original'
                      ? 'text-blue-600 bg-blue-100'
                      : 'text-gray-700 active:bg-gray-200'
                }`}
                style={mode === 'original' ? { color: '#2563EB', fontWeight: 500 } : { color: '#000000', fontWeight: 500 }} // Force appropriate color
              >
                <Eye className="w-5 h-5" style={mode === 'original' ? { color: '#2563EB' } : { color: '#000000' }} />
              </button>
              
              <button
                onClick={toggleCanvasLock}
                disabled={isLoading}
                className={`p-2 rounded-full ${
                  isLoading
                    ? 'text-gray-400'
                    : isCanvasLocked
                      ? 'text-blue-600 bg-blue-100' 
                      : 'text-gray-700 active:bg-gray-200'
                }`}
                style={isCanvasLocked ? { color: '#2563EB', fontWeight: 500 } : { color: '#000000', fontWeight: 500 }} // Force appropriate color
              >
                {isCanvasLocked ? <Lock className="w-5 h-5" style={{ color: '#2563EB' }} /> : <Unlock className="w-5 h-5" style={{ color: '#000000' }} />}
              </button>
            </div>
            
            <button
              onClick={handleApproveImage}
              disabled={isLoading}
              className={`p-2 rounded-full ${
                isLoading
                  ? 'text-gray-400'
                  : 'bg-green-500 text-white active:bg-green-600'
              }`}
              style={{ fontWeight: 500 }} // Force weight
            >
              <CheckCircle className="w-6 h-6" />
            </button>
          </>
        )}
        
        {/* When QuickBall is enabled, show minimal controls in toolbar */}
        {useQuickBall && (
          <>
            <div className="flex-1 flex justify-center">
              <span className="text-xs text-gray-500" style={{ color: '#000000', fontWeight: 500 }}>
                Use QuickBall for tools →
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PowerPaintMobile;