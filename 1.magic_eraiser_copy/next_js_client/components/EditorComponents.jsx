"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Download, CheckCircle, Share2, X, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ZoomIn,
         Lock, Unlock, Eye, Undo, Redo, Plus, Minus, MessageSquare, Menu, Settings, Home } from 'lucide-react';
import Image from 'next/image';

// Tooltip Component (unified version)
export const Tooltip = ({ children, text, preferredPosition = "top", isMobile = false }) => {
  // On mobile, we can disable tooltips entirely or make them behave differently
  if (isMobile) {
    return children;
  }
  
  const [show, setShow] = useState(false);
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPosition, setActualPosition] = useState(preferredPosition);

  // Handle tooltip position when it appears
  useEffect(() => {
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

// Left Panel Component
export const LeftPanel = ({ 
  isMobile, leftPanelExpanded, setLeftPanelExpanded, 
  processedImages, setShowBulkDownloadConfirmation, panelsHidden, 
  handleRecoverImage, activePanel, leftPanelActiveIndex, setActivePanel 
}) => {
  if (isMobile || panelsHidden) return null;
  return (
    <div 
      className={`bg-white shadow-sm h-full transition-all duration-300 flex flex-col ${
        leftPanelExpanded ? 'w-64' : 'w-12'
      } ${activePanel === 'left' ? 'ring-1 ring-green-400' : ''}`}
      onClick={() => processedImages.length > 0 && setActivePanel('left')}
    >
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className={`text-sm font-medium text-gray-700 ${!leftPanelExpanded && 'sr-only'}`}>Processed Images</h3>
        <Tooltip text={leftPanelExpanded ? "Hide panel" : "Show panel"}>
          <button onClick={() => setLeftPanelExpanded(!leftPanelExpanded)} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
            {leftPanelExpanded ? <ChevronLeft size={16} /> : <ArrowRight size={16} />}
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
                  <Tooltip text="Download All (B)">
                    <button onClick={() => setShowBulkDownloadConfirmation(true)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-1 rounded-md flex items-center">
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
                    leftPanelActiveIndex={leftPanelActiveIndex}
                    setActivePanel={setActivePanel}
                    isMobile={isMobile}
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

// Right Panel Component
export const RightPanel = ({ 
  isMobile, rightPanelExpanded, setRightPanelExpanded, 
  pendingImages, currentImageIndex, setCurrentImageIndex, 
  setHistory, setCurrentHistoryItem, setHistoryIndex, 
  mode, setMode, maskCanvasRef, panelsHidden,
  activePanel, setActivePanel
}) => {
  if (isMobile || panelsHidden) return null;
  return (
    <div 
      className={`bg-white shadow-sm h-full transition-all duration-300 flex flex-col ${
        rightPanelExpanded ? 'w-64' : 'w-12'
      } ${activePanel === 'right' ? 'ring-1 ring-green-400' : ''}`}
      onClick={() => pendingImages.length > 0 && setActivePanel('right')}
    >
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <Tooltip text={rightPanelExpanded ? "Hide panel" : "Show panel"}>
          <button onClick={() => setRightPanelExpanded(!rightPanelExpanded)} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
            {rightPanelExpanded ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
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
                    setActivePanel={setActivePanel}
                    isMobile={isMobile}
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

// ImageItem Component
export const ImageItem = ({ 
  image, index, type, isSelected, currentImageIndex, setCurrentImageIndex, 
  pendingImages, setHistory, setCurrentHistoryItem, setHistoryIndex, 
  mode, setMode, maskCanvasRef, handleRecoverImage, activePanel, leftPanelActiveIndex,
  setActivePanel, isMobile
}) => {
  const isProcessed = type === 'processed';
  const imageSource = isProcessed ? image.processedImage : image;
  
  // Determine if this item has focus based on panel and index
  const hasFocus = isProcessed 
    ? (activePanel === 'left' && index === leftPanelActiveIndex)
    : (activePanel === 'right' && index === currentImageIndex);
  
  return (
    <div 
      key={isProcessed ? image.timestamp : index}
      className={`relative cursor-pointer rounded-md overflow-hidden mb-3 transition-all duration-200 shadow-sm ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : 
        hasFocus ? 'ring-2 ring-green-500 shadow-md' :
        'hover:brightness-95'
      } group`}
      onClick={() => {
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
      }}>
      {/* Using regular img tag for data URLs which Next.js Image doesn't support well */}
      <img 
        src={imageSource} 
        alt={isProcessed ? "Processed Image" : "Pending Image"} 
        className="object-cover rounded-md w-full h-24"
      />
      
      {isSelected && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-sm">Current</div>
      )}
      
      {/* Show focus indicator */}
      {hasFocus && (
        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-sm">Focused</div>
      )}
      
      {!isProcessed && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">#{index + 1}</div>
      )}

      {isProcessed && handleRecoverImage && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering parent click
            handleRecoverImage(index);
          }}
          className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full opacity-0 hover:bg-blue-600 group-hover:opacity-100 transition-opacity"
          title="Move back to editing queue"
          aria-label="Move back to editing queue">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Brush Size Indicator Component
export const BrushSizeIndicator = ({ brushSize }) => {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none fade-in">
      <div className="flex flex-col items-center">
        {/* Circle representing brush size */}
        <div 
          className="rounded-full bg-red-500 bg-opacity-50 border-2 border-white shadow-lg mb-2"
          style={{ 
            width: `${brushSize * 2}px`, 
            height: `${brushSize * 2}px`,
          }}
        ></div>
        {/* Size text */}
        <div className="bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Brush Size: {brushSize}
        </div>
      </div>
    </div>
  );
};

// Zoom Controls Component
// Updated ZoomControls Component for EditorComponents.jsx
export const ZoomControls = ({ 
  zoomLevel, MAX_ZOOM_LEVEL, getZoomPercentage, 
  handleZoomIn, handleZoomOut, handleResetZoom, 
  isPanning, zoomDrawMode, setZoomDrawMode, 
  setShowZoomControls, exitZoomMode 
}) => {
  return (
    <div className="zoom-controls" style={{ zIndex: 40 }}>
      <div className="p-2 border-b border-gray-100 flex justify-between items-center">
        <span className="text-xs font-medium text-gray-700">
          Zoom: {getZoomPercentage(zoomLevel)}%
        </span>
        <div className="flex items-center gap-1">
          {/* Hide panel button that doesn't exit zoom mode */}
          <Tooltip text="Hide controls panel" preferredPosition="left">
            <button
              onClick={() => setShowZoomControls(false)}
              className="text-gray-500 hover:text-gray-700 p-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </Tooltip>
          
          {/* Exit zoom mode button */}
          <Tooltip text="Exit zoom mode" preferredPosition="left">
            <button
              onClick={exitZoomMode}
              className="text-gray-500 hover:text-gray-700 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="p-2 flex flex-col gap-2">
        {/* Add a toggle button to switch between draw and pan modes */}
        <button
  onClick={() => {
    setZoomDrawMode(!zoomDrawMode);
    // Add this line to hide the controls when switching to draw mode
    if (!zoomDrawMode) {
      setShowZoomControls(false);
    }
  }}
  className={`flex items-center justify-center p-1.5 rounded text-xs ${
    zoomDrawMode 
      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`}
>
          {zoomDrawMode ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span>Switch to Pan Mode</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Switch to Draw Mode</span>
            </>
          )}
        </button>

        <Tooltip text="Increase zoom level" preferredPosition="left">
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= MAX_ZOOM_LEVEL}
            className={`flex items-center justify-center p-1.5 rounded text-xs ${
              zoomLevel >= MAX_ZOOM_LEVEL
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Plus className="w-3 h-3 mr-1" /> Zoom In
          </button>
        </Tooltip>
        <Tooltip text="Decrease zoom level" preferredPosition="left">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0}
            className={`flex items-center justify-center p-1.5 rounded text-xs ${
              zoomLevel <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Minus className="w-3 h-3 mr-1" /> Zoom Out
          </button>
        </Tooltip>
        <Tooltip text="Return to normal view" preferredPosition="left">
          <button
            onClick={handleResetZoom}
            disabled={zoomLevel === 0}
            className={`flex items-center justify-center p-1.5 rounded text-xs ${
              zoomLevel === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Reset Zoom
          </button>
        </Tooltip>
        
        <Tooltip text="Exit zoom mode completely" preferredPosition="left">
          <button
            onClick={exitZoomMode}
            className={`flex items-center justify-center p-1.5 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200 mt-1`}
          >
            Exit Zoom Mode
          </button>
        </Tooltip>
      </div>
      {zoomLevel > 0 && (
        <div className="p-2 pt-0 text-xs text-gray-500">
          {zoomDrawMode 
            ? 'Drawing enabled in zoom mode'
            : (isPanning ? 'Release to exit pan mode' : 'Drag canvas to pan')}
        </div>
      )}
      <div className="p-2 pt-0 text-xs text-gray-500">
        Shift+Scroll to adjust zoom level
      </div>
      
      {/* Add keyboard shortcut hint */}
      <div className="p-2 pt-0 text-xs text-gray-500 border-t border-gray-100 mt-1">
        Press Z to toggle between pan/draw modes
      </div>
    </div>
  );
};
// Corrected HistoryPanel Component
export const HistoryPanel = ({ 
  historyMinimized, 
  setHistoryMinimized, 
  setShowHistory, 
  history, 
  mode, 
  historyPageIndex, 
  TABS_PER_PAGE, 
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
    <div className="absolute top-3 left-3 w-64 z-[55] bg-white rounded-md shadow-md overflow-hidden border border-gray-100 transition-all duration-200 fade-in">
      <div className="flex justify-between items-center p-1.5 bg-gray-50 border-b border-gray-100">
        <h3 className="text-xs font-medium text-gray-700">Edit History</h3>
        <div className="flex items-center">
          <Tooltip text={historyMinimized ? "Show Tabs" : "Hide Tabs"} preferredPosition="bottom">
            <button 
              onClick={() => setHistoryMinimized(!historyMinimized)} 
              className="text-gray-500 hover:text-gray-700 p-1"
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
          </Tooltip>
          <Tooltip text="Close history panel" preferredPosition="bottom">
            <button 
              onClick={() => setShowHistory(false)} 
              className="text-gray-500 hover:text-gray-700 p-1 ml-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div className={`${historyMinimized ? 'hidden' : 'block'} p-1.5 max-h-60 overflow-y-auto fade-in`}>
        {/* Original tab is always visible and doesn't count in pagination */}
        <div className="flex items-center justify-between mb-2">
          <Tooltip text="View original image (O)" preferredPosition="bottom">
            <div 
              key="original"
              data-tab-id="original"
              className={`relative cursor-pointer rounded overflow-hidden ${
                mode === 'original' ? 'ring-2 ring-[#abf134] shadow-md' : 'hover:brightness-90'
              }`}
              onClick={() => {
                // Remember the current tab if it's not the original
                if (currentHistoryItem && !currentHistoryItem.isOriginal) {
                  setLastNonOriginalItem(currentHistoryItem);
                }
                
                // Switch to original view
                setMode('original');
                maskCanvasRef.current.style.display = 'none';
                loadImageToCanvas(initialImage);
              }}
              >
              <img
                src={initialImage}
                alt="Original"
                className="object-cover rounded w-16 h-12"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">
                Original
              </div>
            </div>
          </Tooltip>
          
          {/* Pagination controls */}
          <div className="flex items-center gap-1">
            <Tooltip text="Previous page" preferredPosition="bottom">
              <button
                className={`p-1 rounded ${historyPageIndex === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={handlePrevHistoryPage}
                disabled={historyPageIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Tooltip>
            
            <div className="text-xs text-gray-500">
              {historyPageIndex + 1} / {Math.max(1, Math.ceil(history.filter(item => !item.isOriginal).length / TABS_PER_PAGE))}
            </div>
            
            <Tooltip text="Next page" preferredPosition="bottom">
              <button
                className={`p-1 rounded ${
                  historyPageIndex >= Math.ceil(history.filter(item => !item.isOriginal).length / TABS_PER_PAGE) - 1
                  ? 'text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={handleNextHistoryPage}
                disabled={historyPageIndex >= Math.ceil(history.filter(item => !item.isOriginal).length / TABS_PER_PAGE) - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
        
        {/* Paginated history tabs container */}
        <div className="flex flex-wrap gap-1.5 overflow-hidden pb-1" ref={historyContainerRef}>
          {history
            .filter(item => !item.isOriginal) // Filter out the original item
            .slice(historyPageIndex * TABS_PER_PAGE, (historyPageIndex + 1) * TABS_PER_PAGE) // Take only the current page items
            .map((item) => {
              const actualIndex = history.findIndex(h => h.id === item.id);
              return (
                <div
                  key={item.id}
                  data-tab-id={item.id}
                  className={`relative cursor-pointer rounded overflow-hidden group ${
                    (currentHistoryItem && currentHistoryItem.id === item.id && mode !== 'original')
                      ? 'ring-3 ring-[#abf134] shadow-md z-20' // Enhanced glow effect, higher z-index
                      : 'hover:brightness-90'
                  }`}
                  onClick={() => {
                    if (mode === 'original') {
                      // If in original mode and clicking a non-original item,
                      // exit original mode first and update current item
                      setMode('brush');
                      maskCanvasRef.current.style.display = 'block';
                    }
                    setHistoryIndex(actualIndex);
                    setCurrentHistoryItem(history[actualIndex]);
                    setLastNonOriginalItem(history[actualIndex]); // Update the last non-original item
                    loadImageToCanvas(item.processedImage);
                  }}
                >
                  <img
                    src={item.processedImage}
                    alt={`Edit ${actualIndex}`}
                    className={`object-cover rounded ${
                      (currentHistoryItem && currentHistoryItem.id === item.id && mode !== 'original')
                        ? 'w-24 h-20 shadow-md transform scale-105 z-10' // Larger size for selected tab
                        : 'w-20 h-16' // Normal size for unselected tabs
                    }`}
                  />
                  
                  {/* Add glowing border for selected item - visible in both normal and hover states */}
                  {(currentHistoryItem && currentHistoryItem.id === item.id && mode !== 'original') && (
                    <div className="absolute inset-0 border-3 border-[#abf134] rounded pointer-events-none"></div>
                  )}
                  
                  {/* Close button - show on non-original items when hovered */}
                  <Tooltip text="Delete tab (X)" preferredPosition="top">
                    <button
                      className="absolute top-0 right-0 bg-black bg-opacity-60 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent click
                        handleDeleteTab(item.id);
                      }}
                      style={{cursor: 'pointer'}}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Tooltip>
                  
                  <div className="absolute top-0 left-0 bg-black bg-opacity-40 text-white text-xs px-1 rounded-br">
                    {actualIndex}
                  </div>
                </div>
              );
            })}
        </div>
        
        {/* Show message when no history items */}
        {history.filter(item => !item.isOriginal).length === 0 && (
          <div className="text-center py-4 text-xs text-gray-500">
            No edits yet. Paint an area to generate a new version.
          </div>
        )}
      </div>
    </div>
  );
};