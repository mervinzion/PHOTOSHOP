"use client";

import React from 'react';
import { X, Download, CheckCircle } from 'lucide-react';

// Tooltip component redefined to avoid circular dependency
const Tooltip = ({ children, text, preferredPosition = "top", isMobile = false }) => {
  if (isMobile) {
    return children;
  }

  const [show, setShow] = React.useState(false);
  const tooltipRef = React.useRef(null);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [actualPosition, setActualPosition] = React.useState(preferredPosition);

  React.useEffect(() => {
    if (show && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const parentRect = tooltipRef.current.parentElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newPosition;
      let newActualPosition;

      // Determine the best position based on available space
      if (preferredPosition === "top" && parentRect.top < rect.height + 8) {
        newPosition = { top: parentRect.height + 8, left: (parentRect.width - rect.width) / 2 };
        newActualPosition = "bottom";
      } else if (preferredPosition === "bottom" && viewportHeight - parentRect.bottom < rect.height + 8) {
        newPosition = { top: -(rect.height + 8), left: (parentRect.width - rect.width) / 2 };
        newActualPosition = "top";
      } else {
        switch (preferredPosition) {
          case "bottom":
            newPosition = { top: parentRect.height + 8, left: (parentRect.width - rect.width) / 2 };
            break;
          case "top":
          default:
            newPosition = { top: -(rect.height + 8), left: (parentRect.width - rect.width) / 2 };
            break;
        }
        newActualPosition = preferredPosition;
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
            className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
              actualPosition === "top" ? "bottom-0 left-1/2 -mb-1 -ml-1" :
              actualPosition === "bottom" ? "top-0 left-1/2 -mt-1 -ml-1" : ""
            }`}
          />
        </div>
      )}
    </div>
  );
};

// Instructions Modal Component
// Replace the InstructionsModal component with this implementation
export const InstructionsModal = ({ isMobile, setShowInstructions }) => {
  return (
    <div 
      className={`fixed z-[60] instructions-modal`}
      style={{
        top: isMobile ? '16px' : '12px',
        right: isMobile ? '16px' : '12px',
        width: isMobile ? 'calc(100% - 32px)' : '320px',
        backgroundColor: 'white',
        borderRadius: '6px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #F3F4F6'
      }}
    >
      <div 
        style={{
          padding: '8px',
          backgroundColor: '#F9FAFB',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: '#000000',
          margin: 0
        }}>Instructions</h3>
        <button 
          onClick={() => setShowInstructions(false)} 
          style={{ 
            background: 'none',
            border: 'none',
            color: '#6B7280',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div style={{ 
        padding: '16px', 
        maxHeight: isMobile ? '60vh' : '70vh', 
        overflowY: 'auto'
      }}>
        {/* How to use section */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: '#000000',
            marginBottom: '8px'
          }}>How to use:</h4>
          <ol style={{ 
            listStyleType: 'decimal', 
            marginLeft: '16px', 
            color: '#4B5563',
            fontSize: '14px'
          }}>
            <li style={{ marginBottom: '4px' }}>Use the brush to paint over areas you want to remove or modify</li>
            <li style={{ marginBottom: '4px' }}>The painted areas (in red) will be regenerated by AI</li>
            <li style={{ marginBottom: '4px' }}>Adjust brush size using the slider or keyboard shortcuts</li>
            <li style={{ marginBottom: '4px' }}>Use the zoom controls (Z key) to zoom in on details</li>
            <li style={{ marginBottom: '4px' }}>When zoomed in, drag the canvas to pan around</li>
            <li style={{ marginBottom: '4px' }}>Use the history panel to go back to previous states</li>
            <li style={{ marginBottom: '4px' }}>Toggle between original and edited views with O key</li>
            <li style={{ marginBottom: '4px' }}>Press L to lock/unlock canvas to prevent accidental drawing</li>
          </ol>
        </div>
        
        {/* Troubleshooting section */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: '#000000',
            marginBottom: '8px'
          }}>Troubleshooting:</h4>
          <ul style={{ 
            listStyleType: 'disc', 
            marginLeft: '16px', 
            color: '#4B5563',
            fontSize: '14px'
          }}>
            <li style={{ marginBottom: '4px' }}><span style={{ fontWeight: 500, color: '#000000' }}>Brush not working?</span> Check if:</li>
            <li style={{ marginLeft: '12px', marginBottom: '4px' }}>- Canvas is locked (unlock with L key)</li>
            <li style={{ marginLeft: '12px', marginBottom: '4px' }}>- You're in Original View mode (press O to exit)</li>
            <li style={{ marginLeft: '12px', marginBottom: '4px' }}>- You're in pan mode while zoomed (press Z to toggle)</li>
          </ul>
        </div>
        
        {/* Keyboard Shortcuts section */}
        <div>
          <h4 style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: '#000000',
            marginBottom: '8px'
          }}>Keyboard Shortcuts:</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Undo</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Ctrl/Cmd + Z</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Redo</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Ctrl/Cmd + Y</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Toggle History</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>H</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Lock/Unlock Canvas</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>L</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Zoom Controls</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Z</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Original View</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>O</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Instructions</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>I</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Download</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>D</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Brush Size +</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Shift + +</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Brush Size -</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Shift + -</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Fit Image to Screen</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>F</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Approve Image</td>
                <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Y</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Feedback Dialog Component
// Replace the FeedbackDialog component with this implementation
export const FeedbackDialog = ({ setShowFeedbackDialog, isMobile = false }) => {
  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 fade-in">
      <div 
        className={`bg-white rounded-md shadow-md ${isMobile ? 'w-[90%]' : 'max-w-md w-full'} mx-4 slide-up`}
        style={{ padding: '20px', margin: 'auto' }}
        id="feedback-dialog-container"
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {/* Header row */}
            <tr>
              <td style={{ 
                color: '#000000', 
                fontWeight: 600, 
                fontSize: '18px',
                textAlign: 'left',
                paddingBottom: '12px'
              }}>
                Provide Feedback
              </td>
              <td style={{ textAlign: 'right' }}>
                <button 
                  onClick={() => setShowFeedbackDialog(false)} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  <X className="h-5 w-5" style={{ color: '#6B7280' }} />
                </button>
              </td>
            </tr>
            
            {/* Feedback Type row */}
            <tr>
              <td colSpan="2" style={{ paddingBottom: '8px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#000000',
                    marginBottom: '4px'
                  }}>
                    Feedback Type
                  </label>
                </div>
                <select 
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#000000'
                  }}
                >
                  <option value="bug">Report a Bug</option>
                  <option value="feature">Suggest a Feature</option>
                  <option value="other">Other Feedback</option>
                </select>
              </td>
            </tr>
            
            {/* Description row */}
            <tr>
              <td colSpan="2" style={{ paddingBottom: '16px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: 500, 
                    color: '#000000',
                    marginBottom: '4px'
                  }}>
                    Description
                  </label>
                </div>
                <textarea 
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #D1D5DB', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#000000',
                    minHeight: '100px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Please describe your feedback in detail..."
                ></textarea>
              </td>
            </tr>
            
            {/* Buttons row */}
            <tr>
              <td colSpan="2" style={{ textAlign: 'right' }}>
                <button
                  onClick={() => setShowFeedbackDialog(false)}
                  style={{ 
                    padding: '8px 16px', 
                    marginRight: '8px',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert("Thank you for your feedback! This feature will be fully implemented soon.");
                    setShowFeedbackDialog(false);
                  }}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#ABF134',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Submit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
            <Tooltip text="Cancel deletion" preferredPosition="top" isMobile={isMobile}>
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
            <Tooltip text="Permanently delete this tab" preferredPosition="top" isMobile={isMobile}>
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

// Download Dialog Component
export const DownloadDialog = ({ showDownloadDialog, setShowDownloadDialog, canvasRef, processedImages, setIsLoading, isMobile = false }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
      <div className={`bg-white rounded-md shadow-lg p-5 max-w-md ${isMobile ? 'w-[90%]' : 'w-full'} mx-4 space-y-4`}>
        <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-medium text-gray-900`}>Download Options</h3>
        <div className="space-y-4">
          <Tooltip text="Download the current image view" preferredPosition="right" isMobile={isMobile}>
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
              className={`w-full px-4 ${isMobile ? 'py-4 text-base' : 'py-3 text-sm'} bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2`}>
              <Download className={isMobile ? "h-6 w-6" : "h-5 w-5"} />Download Current Image
            </button>
          </Tooltip>
          
          <Tooltip text={processedImages.length > 0 ? "Download all processed images" : "No processed images available"} preferredPosition="right" isMobile={isMobile}>
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
              className={`w-full px-4 ${isMobile ? 'py-4 text-base' : 'py-3 text-sm'} rounded-md flex items-center justify-center gap-2 ${
                processedImages.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
              }`}>
              <Download className={isMobile ? "h-6 w-6" : "h-5 w-5"} />Download All Processed Images ({processedImages.length})
            </button>
          </Tooltip>
        </div>
        <div className="flex justify-end">
          <Tooltip text="Close dialog" preferredPosition="top" isMobile={isMobile}>
            <button 
              onClick={() => setShowDownloadDialog(false)} 
              className={`px-4 ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200`}
            >
              Cancel
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

// Bulk Download Confirmation Component
export const BulkDownloadConfirmation = ({ processedImages, setShowBulkDownloadConfirmation, handleBulkDownload, isMobile = false }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
      <div className={`bg-white rounded-md shadow-lg p-5 max-w-md ${isMobile ? 'w-[90%]' : 'w-full'} mx-4 space-y-4`}>
        <h3 className={`${isMobile ? 'text-xl' : 'text-lg'} font-medium text-gray-900`}>Bulk Download</h3>
        <p className={`text-gray-600 ${isMobile ? 'text-base' : ''}`}>Download all {processedImages.length} processed images?</p>
        <div className="flex justify-end space-x-3 pt-2">
          <Tooltip text="Cancel download" preferredPosition="top" isMobile={isMobile}>
            <button 
              onClick={() => setShowBulkDownloadConfirmation(false)} 
              className={`px-4 ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200`}
            >
              Cancel
            </button>
          </Tooltip>
          <Tooltip text="Download all processed images" preferredPosition="top" isMobile={isMobile}>
            <button 
              onClick={handleBulkDownload} 
              className={`px-4 ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} bg-blue-500 text-white rounded-md hover:bg-blue-600`}
            >
              Download All
            </button>
          </Tooltip>
        </div>
      </div>
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Undo</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Ctrl/Cmd + Z</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Redo</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Ctrl/Cmd + Y or<br/>Ctrl/Cmd + Shift + Z</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Navigate Between Panels</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>← →</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Navigate Within Panel</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>↑ ↓</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Toggle History</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>H</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Toggle Canvas Lock</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>L</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Toggle Original View</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>O</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Toggle Instructions</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>I</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Toggle Zoom Controls</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Z</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Toggle Shortcuts</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>S or Right-click</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Download Image</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>D</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Increase Brush Size</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Shift + + or<br/>Shift + Scroll Up</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Decrease Brush Size</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Shift + - or<br/>Shift + Scroll Down</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Zoom In (in zoom mode)</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Shift + Scroll Up</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Zoom Out (in zoom mode)</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Shift + Scroll Down</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Previous Image</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Left Arrow</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Next Image</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Right Arrow</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Next History Tab</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>T</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Previous History Tab</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>Shift + T</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#4B5563', fontSize: '14px' }}>Delete Current Tab</td>
              <td style={{ padding: '4px 0', fontWeight: 500, color: '#000000', fontSize: '14px' }}>X</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Processing Overlay Component
// Updated ProcessingOverlay Component with transparent background
export const ProcessingOverlay = ({ isMobile = false }) => {
  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-50 pointer-events-auto fade-in" style={{ background: 'transparent' }}>
      <div className={`bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-6 py-3 shadow-lg flex items-center gap-3 slide-up ${isMobile ? 'px-8 py-4' : ''}`}>
        <svg className={`animate-spin ${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-gray-800`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className={`text-gray-800 font-medium ${isMobile ? 'text-lg' : ''}`}>Processing...</span>
      </div>
    </div>
  );
};