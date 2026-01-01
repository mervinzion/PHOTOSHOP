// PowerPaintEditor_s1.jsx - Supporting components and UI elements
import React from 'react';
import { 
    Download, Settings, Wand2, Undo, Redo, Eye, ChevronLeft, ChevronRight, X, Plus, 
    Minus, Menu, Lock, Unlock, MessageSquare, ZoomIn, CheckCircle, 
    Share2, ArrowLeft, ArrowRight, PanelLeftClose, PanelRightClose
  } from 'lucide-react';

// Import necessary utilities from s2
import {
  getZoomPercentage,
  isBrushDisabled,
  MAX_ZOOM_LEVEL,
  TABS_PER_PAGE
} from './PowerPaintEditor_s2';

// Design System Colors
const colors = {
  primary: '#3b82f6', // Blue
  primaryHover: '#2563eb',
  primaryText: '#ffffff',
  secondary: '#f8fafc',
  secondaryHover: '#f1f5f9',
  secondaryText: '#1e293b',
  success: '#10b981',
  successHover: '#059669',
  successText: '#ffffff',
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerText: '#ffffff',
  warning: '#f59e0b',
  warningHover: '#d97706',
  warningText: '#ffffff',
  accent: '#8b5cf6',
  accentHover: '#7c3aed',
  accentText: '#ffffff',
  neutral: '#6b7280',
  neutralHover: '#4b5563',
  neutralText: '#ffffff',
  border: '#e2e8f0',
  focusRing: 'rgba(59, 130, 246, 0.5)',
  surface: {
    bg: '#ffffff',
    hover: '#f8fafc',
    border: '#e2e8f0'
  },
  text: {
    default: '#1e293b',
    secondary: '#64748b',
    disabled: '#94a3b8'
  }
};

// ====================
// Button Components
// ====================

// Updated Button component with transparent glass variants
// Update to the Button component in PowerPaintEditor_s1.jsx to accept refs

export const Button = React.forwardRef(({ 
  onClick,
  variant = 'default',
  size = 'md',
  icon,
  label,
  ariaLabel,
  ariaPressed,
  ariaExpanded,
  disabled = false,
  active = false,
  tooltip,
  keyboardShortcut,
  rounded = false,
  glass = false // New prop for glass effect
}, ref) => {
  // Size configurations
  const sizeClasses = {
      xs: 'p-1 text-xs',
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3.5 py-2 text-sm',
      lg: 'px-4 py-2.5 text-base'
  };
  
  // Standard variant styles
  const standardVariantStyles = {
      primary: {
          default: `bg-blue-500 text-white border-blue-600 ${disabled ? '' : 'hover:bg-blue-600'}`,
          active: 'bg-blue-700 text-white border-blue-800'
      },
      secondary: {
          default: `bg-white text-gray-700 border border-gray-300 ${disabled ? '' : 'hover:bg-gray-50'}`,
          active: 'bg-blue-50 text-blue-700 border border-blue-300'
      },
      success: {
          default: `bg-green-500 text-white border-green-600 ${disabled ? '' : 'hover:bg-green-600'}`,
          active: 'bg-green-700 text-white border-green-800'
      },
      danger: {
          default: `bg-red-500 text-white border-red-600 ${disabled ? '' : 'hover:bg-red-600'}`,
          active: 'bg-red-700 text-white border-red-800'
      },
      text: {
          default: `bg-transparent text-gray-700 border-transparent ${disabled ? '' : 'hover:bg-gray-100'}`,
          active: 'bg-gray-100 text-gray-900 border-transparent'
      },
      icon: {
          default: `bg-transparent text-gray-700 border-transparent p-1 ${disabled ? '' : 'hover:bg-gray-100'}`,
          active: 'bg-gray-100 text-gray-900 border-transparent p-1'
      },
      plain: {
          default: `bg-transparent text-gray-600 border-transparent ${disabled ? '' : 'hover:text-gray-900'}`,
          active: 'bg-transparent text-gray-900 border-transparent'
      }
  };
  
  // Glass (transparent) variant styles
  const glassVariantStyles = {
      primary: {
          default: `bg-blue-500/70 backdrop-blur-sm text-white border border-white/20 ${disabled ? '' : 'hover:bg-blue-600/80'}`,
          active: 'bg-blue-700/80 backdrop-blur-sm text-white border border-white/30'
      },
      secondary: {
          default: `bg-white/70 backdrop-blur-sm text-gray-700 border border-gray-300/70 ${disabled ? '' : 'hover:bg-white/80'}`,
          active: 'bg-blue-50/80 backdrop-blur-sm text-blue-700 border border-blue-300/70'
      },
      success: {
          default: `bg-green-500/70 backdrop-blur-sm text-white border border-white/20 ${disabled ? '' : 'hover:bg-green-600/80'}`,
          active: 'bg-green-700/80 backdrop-blur-sm text-white border border-white/30'
      },
      danger: {
          default: `bg-red-500/70 backdrop-blur-sm text-white border border-white/20 ${disabled ? '' : 'hover:bg-red-600/80'}`,
          active: 'bg-red-700/80 backdrop-blur-sm text-white border border-white/30'
      },
      text: {
          default: `bg-transparent text-gray-700 ${disabled ? '' : 'hover:bg-gray-100/50 backdrop-blur-sm'}`,
          active: 'bg-gray-100/60 backdrop-blur-sm text-gray-900'
      },
      icon: {
          default: `bg-transparent text-gray-700 p-1 ${disabled ? '' : 'hover:bg-gray-100/50 backdrop-blur-sm'}`,
          active: 'bg-gray-100/60 backdrop-blur-sm text-gray-900 p-1'
      },
      plain: {
          default: `bg-transparent text-gray-600 ${disabled ? '' : 'hover:text-gray-900'}`,
          active: 'bg-transparent text-gray-900'
      }
  };
  
  // Choose between standard and glass styles
  const variantStyles = glass ? glassVariantStyles : standardVariantStyles;
  
  const baseClasses = "inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50";
  const roundedClasses = rounded === 'left' ? 'rounded-l-md' : 
                        rounded === 'right' ? 'rounded-r-md' : 
                        rounded === true ? 'rounded-full' : 
                        'rounded-md';
  
  const variantClass = active 
      ? variantStyles[variant].active 
      : variantStyles[variant].default;
  
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClass} ${roundedClasses} ${disabledClass}`;
  
  // Render with or without tooltip
  const buttonElement = (
      <button
          ref={ref}
          onClick={onClick}
          disabled={disabled}
          className={buttonClasses}
          aria-label={ariaLabel || label}
          aria-pressed={ariaPressed}
          aria-expanded={ariaExpanded}
      >
          {icon && icon}
          {label && <span className={icon ? 'ml-1' : ''}>{label}</span>}
          {keyboardShortcut && (
              <span className="ml-2 text-xs opacity-70 hidden md:inline">{keyboardShortcut}</span>
          )}
      </button>
  );
  
  if (tooltip) {
      return (
          <Tooltip text={tooltip} preferredPosition="top">
              {buttonElement}
          </Tooltip>
      );
  }
  
  return buttonElement;
});

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
            className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-md z-50 whitespace-nowrap"
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px`,
            }}
          >
            {text}
            <div 
              className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 
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
    if (panelsHidden) return null;
    
    return (
        <div 
            className={`bg-white shadow-sm h-full transition-all duration-300 flex flex-col ${
                leftPanelExpanded ? 'w-72' : 'w-12'
            } ${activePanel === 'left' ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => processedImages.length > 0 && setActivePanel('left')}
            role="region"
            aria-label="Processed Images"
        >
            <div className="py-3 px-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className={`text-sm font-medium text-gray-700 ${!leftPanelExpanded && 'sr-only'}`}>Processed Images</h3>
                <Tooltip text={leftPanelExpanded ? "Hide panel" : "Show panel"} preferredPosition="bottom">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setLeftPanelExpanded(!leftPanelExpanded);
                        }} 
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={leftPanelExpanded ? "Hide panel" : "Show panel"}
                    >
                        {leftPanelExpanded ? <PanelLeftClose size={16} /> : <ArrowRight size={16} />}
                    </button>
                </Tooltip>
            </div>
            {leftPanelExpanded && (
                <div className="p-4 overflow-y-auto flex-1">
                    {processedImages.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-gray-500">{processedImages.length} image{processedImages.length !== 1 ? 's' : ''}</span>
                                {processedImages.length > 1 && (
                                    <Tooltip text="Download All (B)" preferredPosition="bottom">
                                        <button 
                                            onClick={() => setShowBulkDownloadConfirmation(true)} 
                                            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded flex items-center transition-colors"
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
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                <Share2 size={32} className="text-gray-300 mb-3 mx-auto" />
                                <p className="text-gray-600">Processed images will appear here</p>
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
    if (panelsHidden) return null;
    
    return (
        <div 
            className={`bg-white shadow-sm h-full transition-all duration-300 flex flex-col ${
                rightPanelExpanded ? 'w-72' : 'w-12'
            } ${activePanel === 'right' ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => pendingImages.length > 0 && setActivePanel('right')}
            role="region"
            aria-label="Pending Images"
        >
            <div className="py-3 px-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <Tooltip text={rightPanelExpanded ? "Hide panel" : "Show panel"} preferredPosition="bottom">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setRightPanelExpanded(!rightPanelExpanded);
                        }} 
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={rightPanelExpanded ? "Hide panel" : "Show panel"}
                    >
                        {rightPanelExpanded ? <PanelRightClose size={16} /> : <ArrowLeft size={16} />}
                    </button>
                </Tooltip>
                <h3 className={`text-sm font-medium text-gray-700 ${!rightPanelExpanded && 'sr-only'}`}>Pending Images</h3>
            </div>
            {rightPanelExpanded && (
                <div className="p-4 overflow-y-auto flex-1">
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
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                                <CheckCircle size={32} className="text-green-300 mb-3 mx-auto" />
                                <p className="text-gray-600">All images processed!</p>
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
                className="object-cover rounded-md w-full h-32" 
                loading="lazy"
            />
            
            {/* Selected indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md">Current</div>
            )}
            
            {/* Focus indicator */}
            {hasFocus && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md">Focused</div>
            )}
            
            {/* Index badge for pending images */}
            {!isProcessed && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">#{index + 1}</div>
            )}

            {/* Recover button for processed images */}
            {isProcessed && handleRecoverImage && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering parent click
                        handleRecoverImage(index);
                    }}
                    className="absolute top-2 right-2 bg-blue-500 text-white p-2 rounded-full opacity-0 hover:bg-blue-600 group-hover:opacity-100 transition-opacity shadow-md"
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

// Updated ZoomControls Component with transparent design
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
        <div className="zoom-controls" style={{ 
            bottom: '85px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
            <div className="p-2 border-b border-gray-200/60 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                    Zoom: {getZoomPercentage(zoomLevel)}%
                </span>
                <button
                    onClick={exitZoomMode}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
                    aria-label="Close zoom controls"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="p-3 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= maxZoomLevel}
                    className={`flex items-center justify-center p-1.5 text-sm rounded-md ${
                        zoomLevel >= maxZoomLevel ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed' : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/80'
                    }`}
                    aria-label="Zoom in"
                >
                    <Plus className="w-4 h-4 mr-1" /> Zoom In
                </button>
                
                <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0}
                    className={`flex items-center justify-center p-1.5 text-sm rounded-md ${
                        zoomLevel <= 0 ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed' : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/80'
                    }`}
                    aria-label="Zoom out"
                >
                    <Minus className="w-4 h-4 mr-1" /> Zoom Out
                </button>
                
                <button
                    onClick={handleResetZoom}
                    disabled={zoomLevel === 0}
                    className={`flex items-center justify-center p-1.5 text-sm rounded-md ${
                        zoomLevel === 0 ? 'bg-gray-100/50 text-gray-400 cursor-not-allowed' : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/80'
                    }`}
                    aria-label="Reset zoom"
                >
                    Reset Zoom
                </button>
                
                <button
                    onClick={() => setZoomDrawMode(!zoomDrawMode)}
                    className={`flex items-center justify-center p-1.5 text-sm rounded-md ${
                        zoomDrawMode ? 'bg-blue-100/70 text-blue-700 hover:bg-blue-200/80' : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/80'
                    }`}
                    aria-label={zoomDrawMode ? "Switch to pan mode" : "Switch to draw mode"}
                >
                    {zoomDrawMode ? "Switch to Pan Mode" : "Switch to Draw Mode"}
                </button>
                
                <button
                    onClick={exitZoomMode}
                    className="flex items-center justify-center p-1.5 text-sm rounded-md bg-red-100/70 text-red-700 hover:bg-red-200/80 mt-2"
                    aria-label="Exit zoom mode"
                >
                    Exit Zoom Mode
                </button>
            </div>
            
            {zoomLevel > 0 && (
                <div className="p-2 pt-0 text-xs text-gray-600 bg-gray-50/60 rounded-b-lg">
                    {isPanning ? 
                        'Release to exit pan mode' : 
                        'Drag canvas to pan'} • Shift+Scroll to adjust zoom
                </div>
            )}
        </div>
    );
};

// Updated BrushSizeIndicator with transparent style
export const BrushSizeIndicator = ({ brushSize }) => {
    return (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none fade-in">
            <div className="flex flex-col items-center">
                <div 
                    className="rounded-full bg-red-500/50 border-2 border-white shadow-xl mb-4"
                    style={{ 
                        width: `${brushSize * 2.5}px`, 
                        height: `${brushSize * 2.5}px`,
                    }}
                ></div>
                <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-lg text-sm font-medium shadow-lg">
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
            className={`fixed bg-white rounded-lg shadow-lg border border-gray-200 z-[65] w-64 ${isDraggingContextMenu ? 'cursor-grabbing' : ''}`}
            style={{ 
                left: `${Math.min(contextMenuPosition.x, window.innerWidth - 270)}px`, 
                top: `${Math.min(contextMenuPosition.y, window.innerHeight - 400)}px`
            }}
        >
            <div 
                className={`py-3 px-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center rounded-t-lg ${isDraggingContextMenu ? 'cursor-grabbing' : 'cursor-grab'}`}
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
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Close shortcut menu"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-gray-600 py-1">Undo</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Ctrl/Cmd + Z</div>
                    <div className="text-gray-600 py-1">Redo</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Ctrl/Cmd + Y</div>
                    <div className="text-gray-600 py-1">Toggle History</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">H</div>
                    <div className="text-gray-600 py-1">Lock/Unlock Canvas</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">L</div>
                    <div className="text-gray-600 py-1">Toggle Original View</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">O</div>
                    <div className="text-gray-600 py-1">Toggle Instructions</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">I</div>
                    <div className="text-gray-600 py-1">Toggle Zoom Controls</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Z</div>
                    <div className="text-gray-600 py-1">Toggle Shortcuts</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">S or Right-click</div>
                    <div className="text-gray-600 py-1">Download Image</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">D</div>
                    <div className="text-gray-600 py-1">Increase Brush Size</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Shift + +</div>
                    <div className="text-gray-600 py-1">Decrease Brush Size</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Shift + -</div>
                    <div className="text-gray-600 py-1">Approve Image</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Y</div>
                    <div className="text-gray-600 py-1">Previous Image</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Left Arrow</div>
                    <div className="text-gray-600 py-1">Next Image</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Right Arrow</div>
                    <div className="text-gray-600 py-1">Next History Tab</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">T</div>
                    <div className="text-gray-600 py-1">Previous History Tab</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">Shift + T</div>
                    <div className="text-gray-600 py-1">Delete Current Tab</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">X</div>
                    <div className="text-gray-600 py-1">Navigate Panel Items</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">↑/↓ Arrows</div>
                    <div className="text-gray-600 py-1">Switch Between Panels</div>
                    <div className="font-medium py-1 px-2 bg-gray-100 rounded text-gray-700">←/→ Arrows</div>
                </div>
            </div>
        </div>
    );
};

export const HistoryPanel = ({ 
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
        <div className="absolute top-4 left-4 w-72 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 transition-all duration-200 fade-in z-[55]">
            <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-sm font-medium text-gray-700">Edit History</h3>
                <div className="flex items-center">
                    <button 
                        onClick={() => setHistoryMinimized(!historyMinimized)} 
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label={historyMinimized ? "Show tabs" : "Hide tabs"}
                    >
                        {historyMinimized ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        )}
                    </button>
                    <button 
                        onClick={() => setShowHistory(false)} 
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors ml-1"
                        aria-label="Close history panel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
            
            <div className={`${historyMinimized ? 'hidden' : 'block'} p-3 max-h-80 overflow-y-auto fade-in`}>
                {/* Original tab */}
                <div className="flex items-center justify-between mb-3">
                    <div 
                        key="original"
                        data-tab-id="original"
                        className={`relative cursor-pointer rounded overflow-hidden transition-all ${
                            mode === 'original' ? 'ring-2 ring-blue-400 shadow-md' : 'hover:brightness-90'
                        }`}
                        onClick={() => {
                            if (currentHistoryItem && !currentHistoryItem.isOriginal) {
                                setLastNonOriginalItem(currentHistoryItem);
                            }
                            
                            setMode('original');
                            maskCanvasRef.current.style.display = 'none';
                            loadImageToCanvas(initialImage);
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
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs text-center py-0.5">
                            Original
                        </div>
                    </div>
                    
                    {/* Pagination controls */}
                    <div className="flex items-center gap-1">
                        <button
                            className={`p-1 rounded ${historyPageIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                            onClick={handlePrevHistoryPage}
                            disabled={historyPageIndex === 0}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="text-xs text-gray-500 px-1">
                            {historyPageIndex + 1} / {Math.max(1, Math.ceil(history.filter(item => !item.isOriginal).length / tabsPerPage))}
                        </div>
                        
                        <button
                            className={`p-1 rounded ${
                                historyPageIndex >= Math.ceil(history.filter(item => !item.isOriginal).length / tabsPerPage) - 1
                                ? 'text-gray-300 cursor-not-allowed'
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
                                            ? 'ring-2 ring-blue-400 shadow-md z-20 scale-105'
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
                                        <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none"></div>
                                    )}
                                    
                                    <button
                                        className="absolute top-0 right-0 bg-black bg-opacity-60 text-white p-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTab(item.id);
                                        }}
                                        title="Delete tab"
                                        aria-label="Delete tab"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                    <div className="absolute top-0 left-0 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded-br">
                                        {actualIndex}
                                    </div>
                                </div>
                            );
                        })}
                </div>
                
                {/* No history message */}
                {history.filter(item => !item.isOriginal).length === 0 && (
                    <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-gray-600">No edits yet. Paint an area to generate a new version.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Dialog Components

export const DeleteConfirmationDialog = ({ setShowDeleteConfirmation, setTabToDelete, handleConfirmDelete }) => {
    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 fade-in">
        <div className="bg-white rounded-lg shadow-lg p-5 max-w-xs w-full mx-4 space-y-4 slide-up">
          <h3 className="text-lg font-medium text-gray-900">Delete Tab</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Are you sure you want to delete this tab? This action cannot be undone.
          </p>
          <div className="flex flex-col space-y-3">
            <div className="text-xs text-gray-500 self-start">
              <span className="inline-block bg-gray-100 rounded px-1.5 py-0.5 mr-1.5 font-mono text-2xs">Enter</span> to confirm
              <span className="ml-2 inline-block bg-gray-100 rounded px-1.5 py-0.5 mr-1.5 font-mono text-2xs">Esc</span> to cancel
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setTabToDelete(null);
                }}
                variant="secondary"
                size="sm"
                label="Cancel"
              />
              <Button
                onClick={handleConfirmDelete}
                variant="danger"
                size="sm"
                label="Delete"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export const DownloadDialog = ({ setShowDownloadDialog, canvasRef, processedImages, downloadCurrentImage, downloadAllImages }) => {
    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 fade-in">
        <div className="bg-white rounded-lg shadow-lg p-5 max-w-md w-full mx-4 space-y-5 slide-up">
          <h3 className="text-lg font-medium text-gray-900">Download Options</h3>
          <div className="space-y-4">
            <Button 
              onClick={downloadCurrentImage}
              variant="primary"
              size="lg"
              icon={<Download className="h-5 w-5 mr-2" />}
              label="Download Current Image"
              ariaLabel="Download Current Image"
            />
            
            <Button 
              onClick={downloadAllImages}
              disabled={processedImages.length === 0}
              variant="success"
              size="lg"
              icon={<Download className="h-5 w-5 mr-2" />}
              label={`Download All Processed Images (${processedImages.length})`}
              ariaLabel="Download All Processed Images"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              onClick={() => setShowDownloadDialog(false)} 
              variant="secondary"
              size="sm"
              label="Cancel"
            />
          </div>
        </div>
      </div>
    );
  };

  export const BulkDownloadConfirmation = ({ processedImages, setShowBulkDownloadConfirmation, handleBulkDownload }) => {
    return (
      <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 fade-in">
        <div className="bg-white rounded-lg shadow-lg p-5 max-w-md w-full mx-4 space-y-4 slide-up">
          <h3 className="text-lg font-medium text-gray-900">Bulk Download</h3>
          <p className="text-gray-600">Download all {processedImages.length} processed images?</p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button 
              onClick={() => setShowBulkDownloadConfirmation(false)} 
              variant="secondary"
              size="sm"
              label="Cancel"
            />
            <Button 
              onClick={handleBulkDownload} 
              variant="primary"
              size="sm"
              label="Download All"
            />
          </div>
        </div>
      </div>
    );
  };

// Optimized InstructionsModal Component for PowerPaintEditor
export const InstructionsModal = ({ setShowInstructions }) => {
    return (
      <div 
        className="fixed z-[60] instructions-modal"
        style={{
          top: '16px',
          right: '16px',
          width: '320px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 15px -1px rgba(0, 0, 0, 0.1), 0 2px 10px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #F3F4F6',
          animation: 'slideIn 0.2s ease-out'
        }}
      >
        <div 
          style={{
            padding: '12px 16px',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}
        >
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: 600, 
            color: '#1F2937',
            margin: 0
          }}>PowerPaint Instructions</h3>
          <button 
            onClick={() => setShowInstructions(false)} 
            style={{ 
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div style={{ 
          padding: '16px', 
          maxHeight: '70vh', 
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent'
        }}>
          {/* How to use section */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#1F2937',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              How to use:
            </h4>
            <ol style={{ 
              listStyleType: 'decimal', 
              marginLeft: '20px', 
              color: '#4B5563',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              <li style={{ marginBottom: '6px' }}>Use the brush to paint over areas you want to remove or modify</li>
              <li style={{ marginBottom: '6px' }}>The painted areas (in red) will be regenerated by AI</li>
              <li style={{ marginBottom: '6px' }}>Provide a text prompt to guide the generation</li>
              <li style={{ marginBottom: '6px' }}>Adjust brush size using the slider or keyboard shortcuts</li>
              <li style={{ marginBottom: '6px' }}>Use the zoom controls (Z key) to zoom in on details</li>
              <li style={{ marginBottom: '6px' }}>When zoomed in, drag the canvas to pan around</li>
              <li style={{ marginBottom: '6px' }}>Use the history panel to go back to previous states</li>
              <li style={{ marginBottom: '6px' }}>Toggle between original and edited views (O key)</li>
              <li style={{ marginBottom: '6px' }}>Press L to lock/unlock canvas to prevent accidental drawing</li>
            </ol>
          </div>
          
          {/* Panel Navigation section */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#1F2937',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
              Panel Navigation:
            </h4>
            <ol style={{ 
              listStyleType: 'decimal', 
              marginLeft: '20px', 
              color: '#4B5563',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              <li style={{ marginBottom: '6px' }}>Use <strong style={{ color: '#1F2937' }}>←/→</strong> arrows to switch between left and right panels</li>
              <li style={{ marginBottom: '6px' }}>Use <strong style={{ color: '#1F2937' }}>↑/↓</strong> arrows to navigate within the active panel</li>
              <li style={{ marginBottom: '6px' }}>The active panel is highlighted with a blue border</li>
              <li style={{ marginBottom: '6px' }}>Press <strong style={{ color: '#1F2937' }}>Enter</strong> to select the highlighted item</li>
            </ol>
          </div>
          
          {/* Troubleshooting section */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#1F2937',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Troubleshooting:
            </h4>
            <div style={{ 
              marginLeft: '8px', 
              color: '#4B5563',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              <p style={{ marginBottom: '6px', fontWeight: 600, color: '#1F2937' }}>Brush not working? Check if:</p>
              <ul style={{ listStyleType: 'none', marginLeft: '12px' }}>
                <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#3B82F6', marginRight: '8px' }}>•</span> Canvas is locked (unlock with L key)
                </li>
                <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#3B82F6', marginRight: '8px' }}>•</span> You're in Original View mode (press O to exit)
                </li>
                <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#3B82F6', marginRight: '8px' }}>•</span> You're in SAM mode (switch to Brush mode)
                </li>
                <li style={{ marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#3B82F6', marginRight: '8px' }}>•</span> You're in pan mode while zoomed (press Z to toggle draw mode)
                </li>
              </ul>
            </div>
          </div>
          
          {/* Keyboard Shortcuts section with direct HTML styling */}
          <div>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#1F2937',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <path d="M6 8h.01"></path>
                <path d="M10 8h.01"></path>
                <path d="M14 8h.01"></path>
                <path d="M18 8h.01"></path>
                <path d="M8 12h.01"></path>
                <path d="M12 12h.01"></path>
                <path d="M16 12h.01"></path>
                <path d="M7 16h10"></path>
              </svg>
              Keyboard Shortcuts:
            </h4>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px', width: '50%' }}>Undo</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Ctrl/Cmd + Z</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Redo</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Ctrl/Cmd + Y</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Toggle History</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>H</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Lock/Unlock Canvas</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>L</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Toggle Original View</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>O</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Zoom Controls</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Z</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Toggle Instructions</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>I</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Download</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>D</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Increase Brush Size</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Shift + +</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Decrease Brush Size</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Shift + -</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Approve Image</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Y</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Previous Image</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Left Arrow</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Next Image</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>Right Arrow</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Next History Tab</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>T</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Delete Current Tab</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>X</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', color: '#4B5563', fontSize: '13px' }}>Fit to Screen</td>
                  <td style={{ 
                    padding: '3px 4px', 
                    fontWeight: 500, 
                    color: '#000000', 
                    fontSize: '13px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '4px'
                  }}>F</td>
                </tr>
              </tbody>
            </table>
          </div>
  
          {/* Additional styles for animation */}
          <style jsx>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>
    );
  };
// Updated FeedbackDialog Component
// File: PowerPaintEditor_s1.jsx
export const FeedbackDialog = ({ setShowFeedbackDialog }) => {
  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 fade-in">
      <div id="feedback-dialog" style={{
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.25rem',
        maxWidth: '28rem',
        width: '100%',
        margin: '0 1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#000000',
            margin: 0
          }}>Provide Feedback</h3>
          <button 
            onClick={() => setShowFeedbackDialog(false)} 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close feedback dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }} htmlFor="feedback-type">
              Feedback Type
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                id="feedback-type"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#000000',
                  fontWeight: 500,
                  backgroundColor: '#ffffff',
                  appearance: 'none',
                  outline: 'none'
                }}
              >
                <option value="bug" style={{ color: '#000000', fontWeight: 400 }}>Report a Bug</option>
                <option value="feature" style={{ color: '#000000', fontWeight: 400 }}>Suggest a Feature</option>
                <option value="other" style={{ color: '#000000', fontWeight: 400 }}>Other Feedback</option>
              </select>
              <div style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#000000'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }} htmlFor="feedback-description">
              Description
            </label>
            <textarea 
              id="feedback-description"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#000000',
                fontWeight: 500,
                backgroundColor: '#ffffff',
                outline: 'none',
                resize: 'vertical',
                minHeight: '6rem',
                fontFamily: 'inherit'
              }}
              rows={4}
              placeholder="Please describe your feedback in detail..."
            ></textarea>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            onClick={() => setShowFeedbackDialog(false)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #D1D5DB',
              borderRadius: '0.375rem',
              backgroundColor: '#ffffff',
              color: '#000000',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert("Thank you for your feedback! This feature will be implemented soon.");
              setShowFeedbackDialog(false);
            }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              backgroundColor: '#3B82F6',
              color: '#ffffff',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Panel Component
// Updated SettingsPanel Component for PowerPaintEditor_s1.jsx
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
  setNegativePrompt,
  setShowSettings,
  hideModelType = false,  // Default to false to keep backward compatibility
  buttonRef = null        // Reference to the Advanced Settings button
}) => {
  // Calculate position based on the button reference
  let positionStyle = {
    position: 'absolute',
    bottom: '4rem',
    left: '50%',
    transform: 'translateX(-50%)'
  };

  // If we have a reference to the button, position above it
  if (buttonRef && buttonRef.current) {
    const buttonRect = buttonRef.current.getBoundingClientRect();
    positionStyle = {
      position: 'absolute',
      bottom: `calc(100% - ${buttonRect.top}px + 10px)`, // 10px gap above the button
      left: buttonRect.left + (buttonRect.width / 2), // Center align with button
      transform: 'translateX(-50%)'
    };
  }

  return (
      <div id="settings-panel" style={{
          ...positionStyle,
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e5e7eb',
          width: '20rem',
          zIndex: 50,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>
          {/* Header with Close Button */}
          <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
          }}>
              <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: '#000000',
                  margin: 0
              }}>Advanced Settings</h3>
              
              <button
                  onClick={() => setShowSettings(false)}
                  style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      color: '#EF4444'  // Red color for close button
                  }}
                  aria-label="Close advanced settings"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
              </button>
          </div>
          
          {/* Only show model type if not hidden */}
          {!hideModelType && (
              <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.25rem'
                  }}>
                      Model Type
                  </label>
                  <div id="settings-model-dropdown" style={{ position: 'relative' }}>
                      <select
                          value={modelType}
                          onChange={(e) => setModelType(e.target.value)}
                          style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              color: '#000000',
                              fontWeight: 500,
                              backgroundColor: '#ffffff',
                              appearance: 'none',
                              outline: 'none',
                              transition: 'none'
                          }}
                      >
                          <option value="sdxl" style={{ color: '#000000', fontWeight: 400 }}>SDXL (Best Quality)</option>
                          <option value="realistic_vision" style={{ color: '#000000', fontWeight: 400 }}>Realistic Vision (Photorealistic)</option>
                          <option value="deliberate" style={{ color: '#000000', fontWeight: 400 }}>Deliberate (Detailed)</option>
                      </select>
                      <div style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none'
                      }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                      </div>
                  </div>
              </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
              <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.25rem'
              }}>
                  Steps: {steps}
              </label>
              <input
                  type="range"
                  min="1"
                  max="100"
                  value={steps}
                  onChange={(e) => setSteps(parseInt(e.target.value))}
                  style={{
                      width: '100%',
                      height: '0.5rem',
                      borderRadius: '9999px',
                      appearance: 'none',
                      backgroundColor: '#e5e7eb',
                      outline: 'none',
                      cursor: 'pointer'
                  }}
              />
              <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem',
                  marginBottom: 0
              }}>
                  Higher values = better quality, lower values = faster generation
              </p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
              <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.25rem'
              }}>
                  Guidance Scale: {guidanceScale}
              </label>
              <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                  style={{
                      width: '100%',
                      height: '0.5rem',
                      borderRadius: '9999px',
                      appearance: 'none',
                      backgroundColor: '#e5e7eb',
                      outline: 'none',
                      cursor: 'pointer'
                  }}
              />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
              <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.25rem'
              }}>
                  Seed
              </label>
              <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value))}
                  style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      color: '#000000',
                      fontWeight: 500,
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      transition: 'none'
                  }}
              />
          </div>
          
          <div>
              <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.25rem'
              }}>
                  Negative Prompt
              </label>
              <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Enter negative prompt..."
                  style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      color: '#000000',
                      fontWeight: 500,
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      transition: 'none',
                      resize: 'vertical',
                      minHeight: '5rem',
                      fontFamily: 'inherit'
                  }}
                  rows={3}
              />
          </div>
      </div>
  );
};

// Processing Overlay Component
export const ProcessingOverlay = ({ message = "Processing..." }) => {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 pointer-events-auto fade-in bg-transparent backdrop-blur-sm">
        <div className="bg-white rounded-lg px-6 py-4 shadow-lg flex items-center gap-3 slide-up">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-800 font-medium">{message}</span>
        </div>
      </div>
    );
  };

// File: PowerPaintEditor_s1.jsx - CanvasLockOverlay
export const CanvasLockOverlay = () => {
  return (
      <div style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0.5rem',
          pointerEvents: 'none'
      }}>
          <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
              <Lock style={{ width: '1.25rem', height: '1.25rem' }} />
              <span style={{ fontWeight: 500 }}>Canvas Locked (Press L to unlock)</span>
          </div>
      </div>
  );
};
// Updated ZoomModeOverlay Component with transparent design
export const ZoomModeOverlay = ({ isPanning, zoomDrawMode }) => {
    if (isPanning) return null;
    
    return (
        <>
            {!zoomDrawMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 pointer-events-none shadow-lg">
                    <span className="text-sm">Pan Mode (Click and drag to pan)</span>
                </div>
            )}
            
            {zoomDrawMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg pointer-events-none transition-opacity duration-300 shadow-lg">
                    <span className="text-sm">Draw Mode Active (Press Z to toggle pan/draw)</span>
                </div>
            )}
        </>
    );
};