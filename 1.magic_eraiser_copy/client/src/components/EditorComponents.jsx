import React, { useState, useRef, useEffect } from 'react';
import { Download, CheckCircle, Share2, X, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ZoomIn,
         Lock, Unlock, Eye, Undo, Redo, Plus, Minus, MessageSquare, Menu, Settings } from 'lucide-react';

// Tooltip Component (unified version)
export const Tooltip = ({ children, text, preferredPosition = "top" }) => {
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
  setActivePanel
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
      <img src={imageSource} alt={isProcessed ? "Processed Image" : "Pending Image"} className="object-cover rounded-md w-full h-24" />
      
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

      {/* Add delete/recover button for processed images - FULLY VISIBLE ON HOVER */}
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

// Context Menu component
export const ContextMenu = ({ contextMenuRef, contextMenuPosition, isDraggingContextMenu, setDragOffset, setIsDraggingContextMenu, setShowContextMenu }) => {
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
          // Only handle left mouse button
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
        <Tooltip text="Close" preferredPosition="top">
          <button 
            onClick={() => setShowContextMenu(false)} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
      <div className="p-3 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Undo</div>
          <div className="font-medium">Ctrl/Cmd + Z</div>
          <div className="text-gray-600">Redo</div>
          <div className="font-medium">Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z</div>
          <div className="text-gray-600">Navigate Between Panels</div>
          <div className="font-medium">← →</div>
          <div className="text-gray-600">Navigate Within Panel</div>
          <div className="font-medium">↑ ↓</div>
          <div className="text-gray-600">Toggle History</div>
          <div className="font-medium">H</div>
          <div className="text-gray-600">Toggle Canvas Lock</div>
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
          <div className="font-medium">Shift + + or Shift + Scroll Up</div>
          <div className="text-gray-600">Decrease Brush Size</div>
          <div className="font-medium">Shift + - or Shift + Scroll Down</div>
          <div className="text-gray-600">Zoom In (in zoom mode)</div>
          <div className="font-medium">Shift + Scroll Up</div>
          <div className="text-gray-600">Zoom Out (in zoom mode)</div>
          <div className="font-medium">Shift + Scroll Down</div>
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
        </div>
      </div>
    </div>
  );
};

// Instructions Modal Component
export const InstructionsModal = ({ isMobile, setShowInstructions }) => {
  return (
    <div className={`fixed ${isMobile ? 'inset-4 z-50' : 'top-3 right-3 w-64'} bg-white rounded-md shadow-md overflow-hidden border border-gray-100 transition-all duration-200 fade-in z-[60]`}>
      <div className="flex justify-between items-center p-1.5 bg-gray-50 border-b border-gray-100">
        <h3 className="text-xs font-medium text-gray-700">Instructions</h3>
        <div className="flex items-center">
          <Tooltip text="Close" preferredPosition="top">
            <button 
              onClick={() => setShowInstructions(false)} 
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
      
      <div className={`p-3 ${isMobile ? 'max-h-[60vh]' : 'max-h-[70vh]'} overflow-y-auto`}>
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1.5">How to use:</h4>
          <ol className="list-decimal ml-4 space-y-0.5 text-xs text-gray-600">
            <li>Use the brush to paint over areas you want to remove or modify</li>
            <li>The painted areas (in red) will be regenerated by AI</li>
            <li>Adjust brush size as needed using the slider or shortcuts</li>
            <li>Use the zoom controls (Z key) to zoom in on details</li>
            <li>When zoomed in, drag the canvas to pan around</li>
            <li>Use the history panel to go back to previous states</li>
            <li>Toggle between original and edited views</li>
            <li>Press L to lock/unlock canvas to prevent accidental drawing</li>
          </ol>
        </div>
        
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1.5">Troubleshooting:</h4>
          <ul className="list-disc ml-4 space-y-0.5 text-xs text-gray-600">
            <li><span className="font-medium">Brush not working?</span> Check if:</li>
            <li className="ml-3">- Canvas is locked (unlock with L key)</li>
            <li className="ml-3">- You're in Original View mode (press O to exit)</li>
            <li className="ml-3">- You're in pan mode while zoomed (click outside canvas)</li>
          </ul>
        </div>
        
        {!isMobile && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1.5">Keyboard Shortcuts:</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="text-gray-600">Undo</div>
              <div className="font-medium">Ctrl/Cmd + Z</div>
              <div className="text-gray-600">Switch Between Panels</div>
              <div className="font-medium">Left/Right Arrow</div>
              <div className="text-gray-600">Navigate Within Panel</div>
              <div className="font-medium">Up/Down Arrow</div>
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
              <div className="text-gray-600">Instructions</div>
              <div className="font-medium">I</div>
              <div className="text-gray-600">Download</div>
              <div className="font-medium">D</div>
              <div className="text-gray-600">Brush Size +</div>
              <div className="font-medium">Shift + +</div>
              <div className="text-gray-600">Brush Size -</div>
              <div className="font-medium">Shift + -</div>
              <div className="text-gray-600">Zoom In (in zoom mode)</div>
              <div className="font-medium">Shift + Scroll Up</div>
              <div className="text-gray-600">Zoom Out (in zoom mode)</div>
              <div className="font-medium">Shift + Scroll Down</div>
              <div className="text-gray-600">Previous Image</div>
              <div className="font-medium">Left Arrow</div>
              <div className="text-gray-600">Next Image</div>
              <div className="font-medium">Right Arrow</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Feedback Dialog Component
export const FeedbackDialog = ({ setShowFeedbackDialog }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
      <div className="bg-white rounded-md shadow-md p-4 md:p-5 max-w-md w-full mx-4 space-y-3 slide-up">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Provide Feedback</h3>
          <Tooltip text="Close" preferredPosition="left">
            <button 
              onClick={() => setShowFeedbackDialog(false)} 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback Type
            </label>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bug">Report a Bug</option>
              <option value="feature">Suggest a Feature</option>
              <option value="other">Other Feedback</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea 
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Please describe your feedback in detail..."
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Tooltip text="Discard feedback" preferredPosition="top">
              <button
                onClick={() => setShowFeedbackDialog(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </Tooltip>
            <Tooltip text="Send feedback to our team" preferredPosition="top">
              <button
                onClick={() => {
                  alert("Thank you for your feedback! This feature will be fully implemented soon.");
                  setShowFeedbackDialog(false);
                }}
                className="px-4 py-2 text-sm bg-[#abf134] rounded-md text-black hover:bg-[#9ed830]"
              >
                Submit
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Dialog Component
export const DeleteConfirmationDialog = ({ isMobile, setShowDeleteConfirmation, setTabToDelete, handleConfirmDelete }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
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
            <Tooltip text="Cancel deletion" preferredPosition="top">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setTabToDelete(null);
                }}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </Tooltip>
            <Tooltip text="Permanently delete this tab" preferredPosition="top">
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-xs bg-red-600 rounded text-white hover:bg-red-700"
              >
                Delete
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

// Zoom Controls Component
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
        <Tooltip text="Close zoom controls" preferredPosition="left">
          <button
            onClick={exitZoomMode} // This now explicitly exits zoom mode
            className="text-gray-500 hover:text-gray-700 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      </div>
      <div className="p-2 flex flex-col gap-2">
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
            className="flex items-center justify-center p-1.5 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200 mt-1"
          >
            Exit Zoom Mode
          </button>
        </Tooltip>
      </div>
      {zoomLevel > 0 && (
        <div className="p-2 pt-0 text-xs text-gray-500">
          {isPanning ? 'Release to exit pan mode' : 'Drag canvas to pan'}
        </div>
      )}
      <div className="p-2 pt-0 text-xs text-gray-500">
        Shift+Scroll to adjust zoom level
      </div>
    </div>
  );
};

// History Panel Component
export const HistoryPanel = ({ 
  isMobile, 
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
    <div className={`${isMobile ? 'fixed inset-4 z-50' : 'absolute top-3 left-3 w-64'} bg-white rounded-md shadow-md overflow-hidden border border-gray-100 transition-all duration-200 fade-in z-[55]`}>
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
      
      <div className={`${historyMinimized ? 'hidden' : 'block'} p-1.5 ${isMobile ? 'max-h-[60vh]' : 'max-h-60'} overflow-y-auto fade-in`}>
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
                
                // Close on mobile after selection
                if (isMobile) {
                  setShowHistory(false);
                }
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
                    
                    // Close on mobile after selection
                    if (isMobile) {
                      setShowHistory(false);
                    }
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

// Mobile Menu Component
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
        <Tooltip text="Toggle Canvas Lock (L)" preferredPosition="left">
          <button 
            onClick={() => {
              toggleCanvasLock();
              setIsMobileMenuOpen(false);
            }} 
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
          >
            {isCanvasLocked ? (
              <Lock className="w-3.5 h-3.5 text-gray-700" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-gray-700" />
            )}
            {isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'}
          </button>
        </Tooltip>
        <Tooltip text="Toggle History Panel (H)" preferredPosition="left">
          <button 
            onClick={() => {
              if (!showHistory) {
                setShowHistory(true);
                setHistoryMinimized(false); // Always show tabs when clicking from mobile menu
              } else {
                setShowHistory(false);
              }
              setIsMobileMenuOpen(false);
            }} 
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            History
          </button>
        </Tooltip>
        <Tooltip text="Toggle Zoom Controls (Z)" preferredPosition="left">
          <button 
            onClick={() => {
              setShowZoomControls(!showZoomControls);
              setIsMobileMenuOpen(false);
            }} 
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
          >
            <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
            Zoom Controls
          </button>
        </Tooltip>
        <Tooltip text="Show Instructions (I)" preferredPosition="left">
          <button 
            onClick={() => {
              setShowInstructions(!showInstructions);
              setIsMobileMenuOpen(false);
            }} 
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            Instructions
          </button>
        </Tooltip>
        <Tooltip text="Download (D)" preferredPosition="left">
          <button 
            onClick={() => {
              handleDownload();
              setIsMobileMenuOpen(false);
            }} 
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
            disabled={isLoading}
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </Tooltip>
        <Tooltip text="Toggle Original View (O)" preferredPosition="left">
          <button 
            onClick={() => {
              toggleOriginalView();
              setIsMobileMenuOpen(false);
            }} 
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded flex items-center gap-1.5"
            disabled={isLoading}
          >
            <Eye className="w-3.5 h-3.5" />
            {mode === 'original' ? 'Exit View' : 'Original'}
          </button>
        </Tooltip>
      </div>
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

// Processing Overlay Component
export const ProcessingOverlay = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 pointer-events-auto fade-in" style={{ background: 'none' }}>
      <div className="bg-white rounded-lg px-6 py-3 shadow-lg flex items-center gap-3 slide-up">
        <svg className="animate-spin h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-gray-800 font-medium">Processing...</span>
      </div>
    </div>
  );
};

// Download Dialog Component
export const DownloadDialog = ({ showDownloadDialog, setShowDownloadDialog, canvasRef, processedImages, setIsLoading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
      <div className="bg-white rounded-md shadow-lg p-5 max-w-md w-full mx-4 space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Download Options</h3>
        <div className="space-y-4">
          <Tooltip text="Download the current image view" preferredPosition="right">
            <button 
              onClick={() => {
                const currentCanvasState = canvasRef.current.toDataURL('image/png');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const link = document.createElement('a');
                link.download = `inpainted-image-${timestamp}.png`;
                link.href = currentCanvasState;
                link.click();
                setShowDownloadDialog(false);
              }}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2">
              <Download className="h-5 w-5" />Download Current Image
            </button>
          </Tooltip>
          
          <Tooltip text={processedImages.length > 0 ? "Download all processed images" : "No processed images available"} preferredPosition="right">
            <button 
              onClick={() => {
                if (processedImages.length === 0) {
                  alert('No processed images to download');
                  setShowDownloadDialog(false);
                  return;
                }
                
                if (processedImages.length === 0) return;
                setShowDownloadDialog(false);
                
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
              }}
              disabled={processedImages.length === 0}
              className={`w-full px-4 py-3 rounded-md flex items-center justify-center gap-2 ${
                processedImages.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
              }`}>
              <Download className="h-5 w-5" />Download All Processed Images ({processedImages.length})
            </button>
          </Tooltip>
        </div>
        <div className="flex justify-end">
          <Tooltip text="Close dialog" preferredPosition="top">
            <button onClick={() => setShowDownloadDialog(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

// Bulk Download Confirmation Component
export const BulkDownloadConfirmation = ({ processedImages, setShowBulkDownloadConfirmation, handleBulkDownload }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
      <div className="bg-white rounded-md shadow-lg p-5 max-w-md w-full mx-4 space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Bulk Download</h3>
        <p className="text-gray-600">Download all {processedImages.length} processed images?</p>
        <div className="flex justify-end space-x-3 pt-2">
          <Tooltip text="Cancel download" preferredPosition="top">
            <button onClick={() => setShowBulkDownloadConfirmation(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Cancel</button>
          </Tooltip>
          <Tooltip text="Download all processed images" preferredPosition="top">
            <button onClick={handleBulkDownload} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Download All</button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};