// PowerPaintEditor_s1.js - Supporting components and utilities
import React from 'react';
import { 
  Download, Settings, Wand2, Undo, Redo, Eye, ChevronLeft, X, Plus, 
  Minus, Menu, Lock, Unlock, MessageSquare, ZoomIn, CheckCircle, 
  Share2, ArrowLeft, ArrowRight, PanelLeftClose, PanelRightClose
} from 'lucide-react';

// Constants
export const MAX_ZOOM_LEVEL = 40;
export const TABS_PER_PAGE = 4;

// ====================
// Utility Functions
// ====================

export const getZoomPercentage = (level) => {
    return 100 + (level * 10);
};

export const getCanvasCoordinates = (clientX, clientY, maskCanvasRef, zoomLevel, panPosition) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;
    
    const x = displayX * scaleX;
    const y = displayY * scaleY;
    
    return { x, y };
};

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

export const isBrushDisabled = (mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) => {
    return mode === 'original' || mode === 'sam' || isLoading || isCanvasLocked || (isZoomed && !zoomDrawMode);
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

export const animateScroll = (element, targetScrollLeft) => {
    const startScrollLeft = element.scrollLeft;
    const distance = targetScrollLeft - startScrollLeft;
    const duration = 500; // ms
    const startTime = performance.now();
    
    // Animate with spring physics for that Apple-like feel
    const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Elastic easing function (mimics spring physics)
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

// ====================
// Tooltip Component
// ====================

export const Tooltip = ({ children, text, preferredPosition = "top" }) => {
    const [show, setShow] = React.useState(false);
    const tooltipRef = React.useRef(null);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });
    const [actualPosition, setActualPosition] = React.useState(preferredPosition);
  
    // Handle tooltip position when it appears
    React.useEffect(() => {
      if (show && tooltipRef.current) {
        const rect = tooltipRef.current.getBoundingClientRect();
        const parentRect = tooltipRef.current.parentElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Check if there's enough space in all directions
        const spaceAbove = parentRect.top;
        const spaceBelow = viewportHeight - parentRect.bottom;
        const spaceLeft = parentRect.left;
        const spaceRight = viewportWidth - parentRect.right;
        
        let newPosition;
        let newActualPosition;
        
        // Determine best position based on available space
        if (preferredPosition === "top" && spaceAbove < rect.height + 8 && spaceBelow >= rect.height + 8) {
          // Not enough space above, but enough below -> switch to bottom
          newPosition = { top: parentRect.height + 8, left: (parentRect.width - rect.width) / 2 };
          newActualPosition = "bottom";
        } else if (preferredPosition === "bottom" && spaceBelow < rect.height + 8 && spaceAbove >= rect.height + 8) {
          // Not enough space below, but enough above -> switch to top
          newPosition = { top: -(rect.height + 8), left: (parentRect.width - rect.width) / 2 };
          newActualPosition = "top";
        } else if (preferredPosition === "left" && spaceLeft < rect.width + 8 && spaceRight >= rect.width + 8) {
          // Not enough space left, but enough right -> switch to right
          newPosition = { top: (parentRect.height - rect.height) / 2, left: parentRect.width + 8 };
          newActualPosition = "right";
        } else if (preferredPosition === "right" && spaceRight < rect.width + 8 && spaceLeft >= rect.width + 8) {
          // Not enough space right, but enough left -> switch to left
          newPosition = { top: (parentRect.height - rect.height) / 2, left: -(rect.width + 8) };
          newActualPosition = "left";
        } else {
          // Use preferred position
          switch (preferredPosition) {
            case "bottom":
              newPosition = { top: parentRect.height + 8, left: (parentRect.width - rect.width) / 2 };
              break;
            case "left":
              newPosition = { top: (parentRect.height - rect.height) / 2, left: -(rect.width + 8) };
              break;
            case "right":
              newPosition = { top: (parentRect.height - rect.height) / 2, left: parentRect.width + 8 };
              break;
            case "top":
            default:
              newPosition = { top: -(rect.height + 8), left: (parentRect.width - rect.width) / 2 };
              break;
          }
          newActualPosition = preferredPosition;
        }
        
        // Additional adjustments to prevent horizontal overflow
        if (newActualPosition === "top" || newActualPosition === "bottom") {
          // Check if tooltip would overflow to the left
          const tooltipLeft = parentRect.left + newPosition.left;
          if (tooltipLeft < 8) {
            newPosition.left += (8 - tooltipLeft);
          }
          
          // Check if tooltip would overflow to the right
          const tooltipRight = tooltipLeft + rect.width;
          if (tooltipRight > viewportWidth - 8) {
            newPosition.left -= (tooltipRight - viewportWidth + 8);
          }
        }
        
        setPosition(newPosition);
        setActualPosition(newActualPosition);
      }
    }, [show, preferredPosition]);
  
    return (
      <div className="relative inline-flex">
        <div
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          onFocus={() => setShow(true)}
          onBlur={() => setShow(false)}
        >
          {children}
        </div>
        {show && (
          <div
            ref={tooltipRef}
            className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md z-50 whitespace-nowrap"
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px`,
            }}
          >
            {text}
            <div 
              className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 
                ${actualPosition === 'top' ? 'bottom-0 left-1/2 -mb-1 -ml-1' : 
                  actualPosition === 'bottom' ? 'top-0 left-1/2 -mt-1 -ml-1' : 
                  actualPosition === 'left' ? 'right-0 top-1/2 -mr-1 -mt-1' : 
                  'left-0 top-1/2 -ml-1 -mt-1'}`}
            />
          </div>
        )}
      </div>
    );
};

// ====================
// Panel Components
// ====================

export const LeftPanel = ({ 
    isMobile, 
    leftPanelExpanded, 
    setLeftPanelExpanded, 
    processedImages, 
    setShowBulkDownloadConfirmation, 
    panelsHidden, 
    handleRecoverImage, 
    activePanel, 
    leftPanelActiveIndex, 
    setActivePanel 
}) => {
    if (isMobile || panelsHidden) return null;
    
    return (
        <div 
            className={`bg-white shadow-sm h-full transition-all duration-300 flex flex-col ${
                leftPanelExpanded ? 'w-72' : 'w-12'
            } ${activePanel === 'left' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => processedImages.length > 0 && setActivePanel('left')}
            role="region"
            aria-label="Processed Images"
        >
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className={`text-sm font-medium text-gray-700 ${!leftPanelExpanded && 'sr-only'}`}>Processed Images</h3>
                <Tooltip text={leftPanelExpanded ? "Hide panel" : "Show panel"} preferredPosition="bottom">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setLeftPanelExpanded(!leftPanelExpanded);
                        }} 
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                        aria-label={leftPanelExpanded ? "Hide panel" : "Show panel"}
                    >
                        {leftPanelExpanded ? <PanelLeftClose size={16} /> : <ArrowRight size={16} />}
                    </button>
                </Tooltip>
            </div>
            {leftPanelExpanded && (
                <div className="p-3 overflow-y-auto flex-1">
                    {processedImages.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-gray-500">{processedImages.length} image{processedImages.length !== 1 ? 's' : ''}</span>
                                {processedImages.length > 1 && (
                                    <Tooltip text="Download All (B)" preferredPosition="bottom">
                                        <button 
                                            onClick={() => setShowBulkDownloadConfirmation(true)} 
                                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-md flex items-center"
                                            aria-label="Download all processed images"
                                        >
                                            <Download size={12} className="inline mr-1" />Download All
                                        </button>
                                    </Tooltip>
                                )}
                            </div>
                            <div className="space-y-3">
                                {processedImages.map((image, index) => (
                                    <ImageItem 
                                        key={image.timestamp} 
                                        image={image} 
                                        index={index} 
                                        type="processed" 
                                        isSelected={false} 
                                        handleRecoverImage={handleRecoverImage}
                                        activePanel={activePanel}
                                        activeIndex={leftPanelActiveIndex}
                                        setActivePanel={setActivePanel}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-60 text-center">
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <Share2 size={32} className="text-gray-300 mb-3 mx-auto" />
                                <p className="text-gray-500">Processed images will appear here</p>
                                <p className="text-xs mt-2 text-gray-400">Use the ✓ button or press Y to approve</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const RightPanel = ({ 
    isMobile, 
    rightPanelExpanded, 
    setRightPanelExpanded, 
    pendingImages, 
    currentImageIndex, 
    setCurrentImageIndex, 
    setHistory, 
    setCurrentHistoryItem, 
    setHistoryIndex, 
    mode, 
    setMode, 
    maskCanvasRef, 
    panelsHidden,
    activePanel, 
    setActivePanel
}) => {
    if (isMobile || panelsHidden) return null;
    
    return (
        <div 
            className={`bg-white shadow-sm h-full transition-all duration-300 flex flex-col ${
                rightPanelExpanded ? 'w-72' : 'w-12'
            } ${activePanel === 'right' ? 'ring-2 ring-green-400' : ''}`}
            onClick={() => pendingImages.length > 0 && setActivePanel('right')}
            role="region"
            aria-label="Pending Images"
        >
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <Tooltip text={rightPanelExpanded ? "Hide panel" : "Show panel"} preferredPosition="bottom">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setRightPanelExpanded(!rightPanelExpanded);
                        }} 
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                        aria-label={rightPanelExpanded ? "Hide panel" : "Show panel"}
                    >
                        {rightPanelExpanded ? <PanelRightClose size={16} /> : <ArrowLeft size={16} />}
                    </button>
                </Tooltip>
                <h3 className={`text-sm font-medium text-gray-700 ${!rightPanelExpanded && 'sr-only'}`}>Pending Images</h3>
            </div>
            {rightPanelExpanded && (
                <div className="p-3 overflow-y-auto flex-1">
                    {pendingImages.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-gray-500">{pendingImages.length} image{pendingImages.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="space-y-3">
                                {pendingImages.map((image, index) => (
                                    <ImageItem 
                                        key={index} 
                                        image={image} 
                                        index={index} 
                                        type="pending" 
                                        isSelected={index === currentImageIndex}
                                        currentImageIndex={currentImageIndex} 
                                        setCurrentImageIndex={setCurrentImageIndex}
                                        pendingImages={pendingImages} 
                                        setHistory={setHistory} 
                                        setCurrentHistoryItem={setCurrentHistoryItem}
                                        setHistoryIndex={setHistoryIndex} 
                                        mode={mode} 
                                        setMode={setMode} 
                                        maskCanvasRef={maskCanvasRef}
                                        activePanel={activePanel}
                                        activeIndex={currentImageIndex}
                                        setActivePanel={setActivePanel}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-60 text-center">
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <CheckCircle size={32} className="text-green-300 mb-3 mx-auto" />
                                <p className="text-gray-500">All images processed!</p>
                                <p className="text-xs mt-2 text-gray-400">Go to processed tab to download</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ImageItem = ({ 
    image, 
    index, 
    type, 
    isSelected, 
    handleRecoverImage, 
    activePanel,
    activeIndex,
    setActivePanel,
    // Props for pending images
    currentImageIndex, 
    setCurrentImageIndex, 
    pendingImages, 
    setHistory, 
    setCurrentHistoryItem, 
    setHistoryIndex, 
    mode, 
    setMode, 
    maskCanvasRef
}) => {
    const isProcessed = type === 'processed';
    const imageSource = isProcessed ? image.processedImage : image;
    
    // Determine if this item has focus based on panel and index
    const hasFocus = isProcessed 
        ? (activePanel === 'left' && index === activeIndex)
        : (activePanel === 'right' && index === activeIndex);
    
    const handleClick = () => {
        // Set this panel as active on click
        setActivePanel(isProcessed ? 'left' : 'right');
        
        if (!isProcessed) {
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
        }
    };
    
    return (
        <div 
            key={isProcessed ? image.timestamp : index}
            className={`relative cursor-pointer rounded-md overflow-hidden mb-3 transition-all duration-200 shadow-sm ${
                isSelected ? 'ring-2 ring-blue-500 shadow-md' : 
                hasFocus ? 'ring-2 ring-green-500 shadow-md' :
                'hover:brightness-95'
            } group`}
            onClick={handleClick}
            role="button"
            aria-pressed={isSelected || hasFocus}
            aria-label={isProcessed ? `Processed image ${index + 1}` : `Pending image ${index + 1}`}
            tabIndex={0}
        >
            <img 
                src={imageSource} 
                alt={isProcessed ? "Processed Image" : "Pending Image"} 
                className="object-cover rounded-md w-full h-28" 
                loading="lazy"
            />
            
            {/* Selected indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-sm">Current</div>
            )}
            
            {/* Focus indicator */}
            {hasFocus && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-sm">Focused</div>
            )}
            
            {/* Index badge for pending images */}
            {!isProcessed && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">#{index + 1}</div>
            )}

            {/* Recover button for processed images */}
            {isProcessed && handleRecoverImage && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering parent click
                        handleRecoverImage(index);
                    }}
                    className="absolute top-2 right-2 bg-blue-500 text-white p-1.5 rounded-full opacity-0 hover:bg-blue-600 group-hover:opacity-100 transition-opacity"
                    title="Move back to editing queue"
                    aria-label="Move back to editing queue"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>
            )}
        </div>
    );
};

// ====================
// UI Components
// ====================

export const ZoomControls = ({ 
    zoomLevel, 
    maxZoomLevel, 
    getZoomPercentage, 
    handleZoomIn, 
    handleZoomOut, 
    handleResetZoom, 
    isPanning, 
    zoomDrawMode, 
    setZoomDrawMode, 
    exitZoomMode 
}) => {
    return (
        <div className="zoom-controls" style={{ bottom: '85px' }}>
            <div className="p-2 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700">
                    Zoom: {getZoomPercentage(zoomLevel)}%
                </span>
                <button
                    onClick={exitZoomMode}
                    className="text-gray-500 hover:text-gray-700 p-0.5"
                    aria-label="Close zoom controls"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
            <div className="p-2 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= maxZoomLevel}
                    className={`flex items-center justify-center p-1.5 rounded text-xs ${
                        zoomLevel >= maxZoomLevel
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label="Zoom in"
                >
                    <Plus className="w-3 h-3 mr-1" /> Zoom In
                </button>
                <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0}
                    className={`flex items-center justify-center p-1.5 rounded text-xs ${
                        zoomLevel <= 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label="Zoom out"
                >
                    <Minus className="w-3 h-3 mr-1" /> Zoom Out
                </button>
                <button
                    onClick={handleResetZoom}
                    disabled={zoomLevel === 0}
                    className={`flex items-center justify-center p-1.5 rounded text-xs ${
                        zoomLevel === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label="Reset zoom"
                >
                    Reset Zoom
                </button>
                <button
                    onClick={() => setZoomDrawMode(!zoomDrawMode)}
                    className={`flex items-center justify-center p-1.5 rounded text-xs ${
                        zoomDrawMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label={zoomDrawMode ? "Switch to pan mode" : "Switch to draw mode"}
                >
                    {zoomDrawMode ? "Switch to Pan Mode" : "Switch to Draw Mode"}
                </button>
                <button
                    onClick={exitZoomMode}
                    className="flex items-center justify-center p-1.5 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200 mt-1"
                    aria-label="Exit zoom mode"
                >
                    Exit Zoom Mode
                </button>
            </div>
            {zoomLevel > 0 && (
                <div className="p-2 pt-0 text-xs text-gray-500">
                    {isPanning ? 
                        'Release to exit pan mode' : 
                        'Drag canvas to pan'}
                </div>
            )}
            <div className="p-2 pt-0 text-xs text-gray-500">
                Shift+Scroll to adjust zoom level
            </div>
        </div>
    );
};

export const BrushSizeIndicator = ({ brushSize }) => {
    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none fade-in">
            <div className="flex flex-col items-center">
                <div 
                    className="rounded-full bg-red-500 bg-opacity-50 border-2 border-white shadow-xl mb-3"
                    style={{ 
                        width: `${brushSize * 2.5}px`, 
                        height: `${brushSize * 2.5}px`,
                    }}
                ></div>
                <div className="bg-black bg-opacity-90 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg">
                    Brush Size: {brushSize}
                </div>
            </div>
        </div>
    );
};

export const ContextMenu = ({ 
    contextMenuRef, 
    contextMenuPosition, 
    isDraggingContextMenu, 
    setDragOffset, 
    setIsDraggingContextMenu, 
    setShowContextMenu 
}) => {
    return (
        <div 
            ref={contextMenuRef}
            className={`fixed bg-white rounded-lg shadow-lg border border-gray-100 z-[65] w-64 ${isDraggingContextMenu ? 'cursor-grabbing' : ''}`}
            style={{ 
                left: `${Math.min(contextMenuPosition.x, window.innerWidth - 270)}px`, 
                top: `${Math.min(contextMenuPosition.y, window.innerHeight - 400)}px`
            }}
        >
            <div 
                className={`p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center ${isDraggingContextMenu ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={(e) => {
                    if (e.button === 0) {
                        e.preventDefault();
                        const rect = contextMenuRef.current.getBoundingClientRect();
                        setDragOffset({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                        });
                        setIsDraggingContextMenu(true);
                    }
                }}
            >
                <h3 className="text-sm font-medium text-gray-700">Keyboard Shortcuts</h3>
                <button 
                    onClick={() => setShowContextMenu(false)} 
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close shortcut menu"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="p-3 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Undo</div>
                    <div className="font-medium">Ctrl/Cmd + Z</div>
                    <div className="text-gray-600">Redo</div>
                    <div className="font-medium">Ctrl/Cmd + Y</div>
                    <div className="text-gray-600">Toggle History</div>
                    <div className="font-medium">H</div>
                    <div className="text-gray-600">Lock/Unlock Canvas</div>
                    <div className="font-medium">L</div>
                    <div className="text-gray-600">Toggle Original View</div>
                    <div className="font-medium">O</div>
                    <div className="text-gray-600">Toggle Instructions</div>
                    <div className="font-medium">I</div>
                    <div className="text-gray-600">Toggle Zoom Controls</div>
                    <div className="font-medium">Z</div>
                    <div className="text-gray-600">Toggle Shortcuts</div>
                    <div className="font-medium">S or Right-click</div>
                    <div className="text-gray-600">Download Image</div>
                    <div className="font-medium">D</div>
                    <div className="text-gray-600">Increase Brush Size</div>
                    <div className="font-medium">Shift + +</div>
                    <div className="text-gray-600">Decrease Brush Size</div>
                    <div className="font-medium">Shift + -</div>
                    <div className="text-gray-600">Approve Image</div>
                    <div className="font-medium">Y</div>
                    <div className="text-gray-600">Previous Image</div>
                    <div className="font-medium">Left Arrow</div>
                    <div className="text-gray-600">Next Image</div>
                    <div className="font-medium">Right Arrow</div>
                    <div className="text-gray-600">Next History Tab</div>
                    <div className="font-medium">T</div>
                    <div className="text-gray-600">Previous History Tab</div>
                    <div className="font-medium">Shift + T</div>
                    <div className="text-gray-600">Delete Current Tab</div>
                    <div className="font-medium">X</div>
                    <div className="text-gray-600">Navigate Panel Items</div>
                    <div className="font-medium">↑/↓ Arrows</div>
                    <div className="text-gray-600">Switch Between Panels</div>
                    <div className="font-medium">←/→ Arrows</div>
                </div>
            </div>
        </div>
    );
};

export const HistoryPanel = ({ 
    isMobile, 
    historyMinimized, 
    setHistoryMinimized, 
    setShowHistory, 
    history, 
    mode, 
    historyPageIndex, 
    tabsPerPage, 
    currentHistoryItem,
    setMode,
    maskCanvasRef,
    setHistoryIndex,
    setCurrentHistoryItem,
    setLastNonOriginalItem,
    loadImageToCanvas,
    initialImage,
    handlePrevHistoryPage,
    handleNextHistoryPage,
    handleDeleteTab,
    historyContainerRef
}) => {
    return (
        <div className={`${isMobile ? 'fixed inset-4 z-50' : 'absolute top-4 left-4 w-72'} bg-white rounded-md shadow-lg overflow-hidden border border-gray-100 transition-all duration-200 fade-in z-[55]`}>
            <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-medium text-gray-700">Edit History</h3>
                <div className="flex items-center">
                    <button 
                        onClick={() => setHistoryMinimized(!historyMinimized)} 
                        className="text-gray-500 hover:text-gray-700 p-1"
                        aria-label={historyMinimized ? "Show tabs" : "Hide tabs"}
                    >
                        {historyMinimized ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        )}
                    </button>
                    <button 
                        onClick={() => setShowHistory(false)} 
                        className="text-gray-500 hover:text-gray-700 p-1 ml-0.5"
                        aria-label="Close history panel"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            
            <div className={`${historyMinimized ? 'hidden' : 'block'} p-2 ${isMobile ? 'max-h-[60vh]' : 'max-h-60'} overflow-y-auto fade-in`}>
                {/* Original tab */}
                <div className="flex items-center justify-between mb-2">
                    <div 
                        key="original"
                        data-tab-id="original"
                        className={`relative cursor-pointer rounded overflow-hidden ${
                            mode === 'original' ? 'ring-2 ring-[#abf134] shadow-md' : 'hover:brightness-90'
                        }`}
                        onClick={() => {
                            if (currentHistoryItem && !currentHistoryItem.isOriginal) {
                                setLastNonOriginalItem(currentHistoryItem);
                            }
                            
                            setMode('original');
                            maskCanvasRef.current.style.display = 'none';
                            loadImageToCanvas(initialImage);
                            
                            if (isMobile) {
                                setShowHistory(false);
                            }
                        }}
                        role="button"
                        aria-pressed={mode === 'original'}
                        aria-label="Original image"
                    >
                        <img
                            src={initialImage}
                            alt="Original"
                            className="object-cover rounded w-16 h-12"
                            loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">
                            Original
                        </div>
                    </div>
                    
                    {/* Pagination controls */}
                    <div className="flex items-center gap-1">
                        <button
                            className={`p-1 rounded ${historyPageIndex === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={handlePrevHistoryPage}
                            disabled={historyPageIndex === 0}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="text-xs text-gray-500">
                            {historyPageIndex + 1} / {Math.max(1, Math.ceil(history.filter(item => !item.isOriginal).length / tabsPerPage))}
                        </div>
                        
                        <button
                            className={`p-1 rounded ${
                                historyPageIndex >= Math.ceil(history.filter(item => !item.isOriginal).length / tabsPerPage) - 1
                                ? 'text-gray-300'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={handleNextHistoryPage}
                            disabled={historyPageIndex >= Math.ceil(history.filter(item => !item.isOriginal).length / tabsPerPage) - 1}
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Paginated history tabs */}
                <div className="flex flex-wrap gap-2 overflow-hidden pb-2 pt-1" ref={historyContainerRef}>
                    {history
                        .filter(item => !item.isOriginal)
                        .slice(historyPageIndex * tabsPerPage, (historyPageIndex + 1) * tabsPerPage)
                        .map((item) => {
                            const actualIndex = history.findIndex(h => h.id === item.id);
                            const isCurrentTab = currentHistoryItem && currentHistoryItem.id === item.id && mode !== 'original';
                            
                            return (
                                <div
                                    key={item.id}
                                    data-tab-id={item.id}
                                    className={`relative cursor-pointer rounded overflow-hidden group transition-all duration-200 ${
                                        isCurrentTab
                                            ? 'ring-3 ring-[#abf134] shadow-md z-20 scale-105'
                                            : 'hover:brightness-90'
                                    }`}
                                    onClick={() => {
                                        if (mode === 'original') {
                                            setMode('brush');
                                            maskCanvasRef.current.style.display = 'block';
                                        }
                                        setHistoryIndex(actualIndex);
                                        setCurrentHistoryItem(history[actualIndex]);
                                        setLastNonOriginalItem(history[actualIndex]);
                                        loadImageToCanvas(item.processedImage, actualIndex);
                                        
                                        if (isMobile) {
                                            setShowHistory(false);
                                        }
                                    }}
                                    role="button"
                                    aria-pressed={isCurrentTab}
                                    aria-label={`Edit ${actualIndex}`}
                                >
                                    <img
                                        src={item.processedImage}
                                        alt={`Edit ${actualIndex}`}
                                        className={`object-cover rounded ${
                                            isCurrentTab
                                                ? 'w-24 h-20'
                                                : 'w-20 h-16'
                                        }`}
                                        loading="lazy"
                                    />
                                    
                                    {isCurrentTab && (
                                        <div className="absolute inset-0 border-3 border-[#abf134] rounded pointer-events-none"></div>
                                    )}
                                    
                                    <button
                                        className="absolute top-0 right-0 bg-black bg-opacity-60 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTab(item.id);
                                        }}
                                        title="Delete tab"
                                        aria-label="Delete tab"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                    <div className="absolute top-0 left-0 bg-black bg-opacity-40 text-white text-xs px-1.5 py-0.5 rounded-br">
                                        {actualIndex}
                                    </div>
                                </div>
                            );
                        })}
                </div>
                
                {/* No history message */}
                {history.filter(item => !item.isOriginal).length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-500">
                        No edits yet. Paint an area to generate a new version.
                    </div>
                )}
            </div>
        </div>
    );
};

// Dialog Components

export const DeleteConfirmationDialog = ({ isMobile, setShowDeleteConfirmation, setTabToDelete, handleConfirmDelete }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 fade-in">
            <div className="bg-white rounded-md shadow-md p-4 md:p-5 max-w-xs w-full mx-4 space-y-3 slide-up">
                <h3 className="text-sm font-medium text-gray-900">Delete Tab</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                    Are you sure you want to delete this tab? This action cannot be undone.
                </p>
                <div className="flex flex-col space-y-3">
                    {!isMobile && (
                        <div className="text-xs text-gray-500 self-start">
                            <span className="inline-block bg-gray-100 rounded px-1.5 py-0.5 mr-1.5 font-mono text-2xs">Enter</span> to confirm
                            <span className="ml-2 inline-block bg-gray-100 rounded px-1.5 py-0.5 mr-1.5 font-mono text-2xs">Esc</span> to cancel
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => {
                                setShowDeleteConfirmation(false);
                                setTabToDelete(null);
                            }}
                            className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-3 py-1.5 text-xs bg-red-600 rounded text-white hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DownloadDialog = ({ setShowDownloadDialog, canvasRef, processedImages, downloadCurrentImage, downloadAllImages }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 fade-in">
            <div className="bg-white rounded-md shadow-lg p-5 max-w-md w-full mx-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Download Options</h3>
                <div className="space-y-4">
                    <button 
                        onClick={downloadCurrentImage}
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
                    >
                        <Download className="h-5 w-5" />Download Current Image
                    </button>
                    
                    <button 
                        onClick={downloadAllImages}
                        disabled={processedImages.length === 0}
                        className={`w-full px-4 py-3 rounded-md flex items-center justify-center gap-2 ${
                        processedImages.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                    >
                        <Download className="h-5 w-5" />Download All Processed Images ({processedImages.length})
                    </button>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => setShowDownloadDialog(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export const BulkDownloadConfirmation = ({ processedImages, setShowBulkDownloadConfirmation, handleBulkDownload }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 fade-in">
            <div className="bg-white rounded-md shadow-lg p-5 max-w-md w-full mx-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Bulk Download</h3>
                <p className="text-gray-600">Download all {processedImages.length} processed images?</p>
                <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={() => setShowBulkDownloadConfirmation(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
                    <button onClick={handleBulkDownload} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Download All</button>
                </div>
            </div>
        </div>
    );
};

export const InstructionsModal = ({ isMobile, setShowInstructions }) => {
    return (
        <div className={`${isMobile ? 'fixed inset-4 z-50' : 'absolute top-4 right-4 w-72'} bg-white rounded-md shadow-md overflow-hidden border border-gray-100 transition-all duration-200 fade-in z-[60]`}>
            <div className="flex justify-between items-center p-1.5 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-medium text-gray-700">Instructions</h3>
                <div className="flex items-center">
                    <button 
                        onClick={() => setShowInstructions(false)} 
                        className="text-gray-500 hover:text-gray-700 p-1"
                        aria-label="Close instructions"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            
            <div className={`p-3 ${isMobile ? 'max-h-[60vh]' : 'max-h-[70vh]'} overflow-y-auto`}>
                <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">How to use:</h4>
                    <ol className="list-decimal ml-4 space-y-0.5 text-xs text-gray-600">
                        <li>Use the brush to paint over areas you want to remove or modify</li>
                        <li>The painted areas (in red) will be regenerated by AI</li>
                        <li>Provide a text prompt to guide the generation</li>
                        <li>Adjust brush size as needed using the slider or shortcuts</li>
                        <li>Use the zoom controls (Z key) to zoom in on details</li>
                        <li>When zoomed in, drag the canvas to pan around</li>
                        <li>Use the history panel to go back to previous states</li>
                        <li>Toggle between original and edited views (O key)</li>
                        <li>Press L to lock/unlock canvas to prevent accidental drawing</li>
                        <li>Use arrow keys to navigate between and within panels</li>
                    </ol>
                </div>
                
                <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Panel Navigation:</h4>
                    <ol className="list-decimal ml-4 space-y-0.5 text-xs text-gray-600">
                        <li>Use <strong>←/→</strong> arrows to switch between left and right panels</li>
                        <li>Use <strong>↑/↓</strong> arrows to navigate within the active panel</li>
                        <li>The active panel is highlighted with a green border</li>
                        <li>Press <strong>Enter</strong> to select the highlighted item</li>
                    </ol>
                </div>
                
                <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">SAM Mode:</h4>
                    <ol className="list-decimal ml-4 space-y-0.5 text-xs text-gray-600">
                        <li>Switch to SAM mode to use AI to select objects</li>
                        <li>Click on objects in the image to select them</li>
                        <li>Generate mask to create a selection based on your clicks</li>
                        <li>Then use inpainting to modify the selected areas</li>
                    </ol>
                </div>
                
                <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Troubleshooting:</h4>
                    <ul className="list-disc ml-4 space-y-0.5 text-xs text-gray-600">
                        <li><span className="font-medium">Brush not working?</span> Check if:</li>
                        <li className="ml-3">- Canvas is locked (unlock with L key)</li>
                        <li className="ml-3">- You're in Original View mode (press O to exit)</li>
                        <li className="ml-3">- You're in SAM mode (switch to Brush mode)</li>
                        <li className="ml-3">- You're in pan mode while zoomed (click Z to toggle draw mode)</li>
                    </ul>
                </div>
                
                {!isMobile && (
                    <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1.5">Keyboard Shortcuts:</h4>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                            <div className="text-gray-600">Undo</div>
                            <div className="font-medium">Ctrl/Cmd + Z</div>
                            <div className="text-gray-600">Redo</div>
                            <div className="font-medium">Ctrl/Cmd + Y</div>
                            <div className="text-gray-600">Toggle History</div>
                            <div className="font-medium">H</div>
                            <div className="text-gray-600">Lock/Unlock Canvas</div>
                            <div className="font-medium">L</div>
                            <div className="text-gray-600">Zoom Controls</div>
                            <div className="font-medium">Z</div>
                            <div className="text-gray-600">Original View</div>
                            <div className="font-medium">O</div>
                            <div className="text-gray-600">Fit to Screen</div>
                            <div className="font-medium">F</div>
                            <div className="text-gray-600">Instructions</div>
                            <div className="font-medium">I</div>
                            <div className="text-gray-600">Download</div>
                            <div className="font-medium">D</div>
                            <div className="text-gray-600">Approve Image</div>
                            <div className="font-medium">Y</div>
                            <div className="text-gray-600">Navigate Panels</div>
                            <div className="font-medium">←/→/↑/↓</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const FeedbackDialog = ({ setShowFeedbackDialog }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 fade-in">
            <div className="bg-white rounded-md shadow-md p-4 md:p-5 max-w-md w-full mx-4 space-y-3 slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Provide Feedback</h3>
                    <button 
                        onClick={() => setShowFeedbackDialog(false)} 
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label="Close feedback dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="feedback-type">
                            Feedback Type
                        </label>
                        <select 
                            id="feedback-type"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="bug">Report a Bug</option>
                            <option value="feature">Suggest a Feature</option>
                            <option value="other">Other Feedback</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="feedback-description">
                            Description
                        </label>
                        <textarea 
                            id="feedback-description"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="Please describe your feedback in detail..."
                        ></textarea>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowFeedbackDialog(false)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                alert("Thank you for your feedback! This feature will be implemented soon.");
                                setShowFeedbackDialog(false);
                            }}
                            className="px-4 py-2 text-sm bg-[#abf134] rounded-md text-black hover:bg-[#9ed830]"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MobileMenu = ({ 
    toggleCanvasLock, 
    isCanvasLocked, 
    showHistory, 
    setShowHistory, 
    setHistoryMinimized, 
    showZoomControls, 
    setShowZoomControls, 
    showInstructions, 
    setShowInstructions, 
    handleDownload, 
    toggleOriginalView, 
    mode, 
    setIsMobileMenuOpen, 
    isLoading 
}) => {
    return (
        <div className="absolute top-10 right-0 z-50 bg-white shadow-lg border-l border-t border-gray-200 w-40 rounded-bl-lg">
            <div className="p-1.5">
                <button 
                    onClick={() => {
                        toggleCanvasLock();
                        setIsMobileMenuOpen(false);
                    }} 
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
                    aria-label={isCanvasLocked ? "Unlock Canvas" : "Lock Canvas"}
                >
                    {isCanvasLocked ? (
                        <Lock className="w-3.5 h-3.5 text-gray-700" />
                    ) : (
                        <Unlock className="w-3.5 h-3.5 text-gray-700" />
                    )}
                    {isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'}
                </button>
                <button 
                    onClick={() => {
                        if (!showHistory) {
                            setShowHistory(true);
                            setHistoryMinimized(false);
                        } else {
                            setShowHistory(false);
                        }
                        setIsMobileMenuOpen(false);
                    }} 
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
                    aria-label="History"
                >
                    <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    History
                </button>
                <button 
                    onClick={() => {
                        setShowZoomControls(!showZoomControls);
                        setIsMobileMenuOpen(false);
                    }} 
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
                    aria-label="Zoom Controls"
                >
                    <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
                    Zoom Controls
                </button>
                <button 
                    onClick={() => {
                        setShowInstructions(!showInstructions);
                        setIsMobileMenuOpen(false);
                    }} 
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
                    aria-label="Instructions"
                >
                    <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                    Instructions
                </button>
                <button 
                    onClick={() => {
                        handleDownload();
                        setIsMobileMenuOpen(false);
                    }} 
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
                    disabled={isLoading}
                    aria-label="Download"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download
                </button>
                <button 
                    onClick={() => {
                        toggleOriginalView();
                        setIsMobileMenuOpen(false);
                    }} 
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
                    disabled={isLoading}
                    aria-label={mode === 'original' ? "Exit View" : "Original"}
                >
                    <Eye className="w-3.5 h-3.5" />
                    {mode === 'original' ? 'Exit View' : 'Original'}
                </button>
            </div>
        </div>
    );
};

// Settings Panel Component
export const SettingsPanel = ({ 
    modelType, 
    setModelType,
    steps, 
    setSteps,
    guidanceScale, 
    setGuidanceScale,
    seed, 
    setSeed,
    negativePrompt, 
    setNegativePrompt
}) => {
    return (
        <div className="absolute bottom-24 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80 z-50">
            <h3 className="font-medium mb-4">Advanced Settings</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">Model Type</label>
                    <select
                        value={modelType}
                        onChange={(e) => setModelType(e.target.value)}
                        className="w-full p-2 border rounded mt-1"
                    >
                        <option value="sdxl">SDXL (Best Quality)</option>
                        <option value="realistic_vision">Realistic Vision (Photorealistic)</option>
                        <option value="deliberate">Deliberate (Detailed)</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Steps: {steps}</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={steps}
                        onChange={(e) => setSteps(parseInt(e.target.value))}
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Higher values = better quality, lower values = faster generation
                    </p>
                </div>
                <div>
                    <label className="text-sm font-medium">Guidance Scale: {guidanceScale}</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={guidanceScale}
                        onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Seed</label>
                    <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Negative Prompt</label>
                    <textarea
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={3}
                        placeholder="Enter negative prompt..."
                    />
                </div>
            </div>
        </div>
    );
};

// Processing Overlay Component
export const ProcessingOverlay = ({ message = "Processing..." }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 pointer-events-auto fade-in" style={{ background: 'rgba(0, 0, 0, 0.4)' }}>
            <div className="bg-white rounded-lg px-6 py-4 shadow-lg flex items-center gap-3 slide-up">
                <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-800 font-medium">{message}</span>
            </div>
        </div>
    );
};

// Canvas Lock Overlay
export const CanvasLockOverlay = () => {
    return (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg pointer-events-none">
            <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span>Canvas Locked (Press L to unlock)</span>
            </div>
        </div>
    );
};

// Zoom Mode Overlay
export const ZoomModeOverlay = ({ isPanning, zoomDrawMode }) => {
    if (isPanning) return null;
    
    return (
        <>
            {!zoomDrawMode && (
                <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-lg pointer-events-none">
                    <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        <span>Zoom Mode (Click and drag to pan)</span>
                    </div>
                </div>
            )}
            
            {zoomDrawMode && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg pointer-events-none transition-opacity duration-300 fade-out">
                    <span>Draw Mode Active (Press Z to toggle pan/draw)</span>
                </div>
            )}
        </>
    );
};

// Create custom styles for the application
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
            bottom: 85px; /* Adjusted to avoid overlap with toolbar */
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 40;
            display: flex;
            flex-direction: column;
            padding: 6px;
            user-select: none;
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
            box-shadow: 0 0 0 2px rgba(171, 241, 52, 0.5);
        }
        
        .panel-active {
            outline: 2px solid #48bb78;
            z-index: 10;
        }
        
        /* Touch-friendly improvements */
        @media (max-width: 992px) {
            .btn-touch {
                min-height: 44px;
                min-width: 44px;
            }
            
            .input-touch {
                min-height: 44px;
            }
            
            .range-touch {
                height: 30px;
            }
            
            .range-touch::-webkit-slider-thumb {
                width: 24px;
                height: 24px;
            }
        }
    `;
    return style;
};