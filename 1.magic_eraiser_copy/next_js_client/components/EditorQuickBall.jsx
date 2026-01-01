// EditorQuickBall.jsx with improved positioning, boundary awareness, and auto mode button
import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, ZoomIn, Eye, Lock, Unlock, CheckCircle, Home, 
  Plus, Minus, Undo, Redo, Download, Menu, Zap
} from 'lucide-react';

const EditorQuickBall = ({
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
  showMobileMenu,
  setShowMobileMenu,
  isLoading,
  setShowMobileDownloadDialog,
  toggleZoomTooltip,
  showZoomTooltip,
  setShowZoomTooltip,
  isAutoMode,
  toggleAutoMode,
  hasPendingChanges
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRadius, setMenuRadius] = useState(85);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  // Dynamic positions for the QuickBall
  const [position, setPosition] = useState({
    resting: { right: '30px', bottom: '70px' }, // Default resting position 
    center: { right: '50%', bottom: '70px' }    // Default center position
  });
  
  // Current position state (resting or center)
  const [currentPosition, setCurrentPosition] = useState('resting');
  
  // Store screen dimensions
  const [screenDimensions, setScreenDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Check screen size and adjust position and size on mount and resize
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Update screen dimensions
      setScreenDimensions({
        width: windowWidth,
        height: windowHeight
      });
      
      // Calculate safe radius based on both dimensions and position
      let safeRadius = 85; // Default radius
      
      // For very small screens, use a much smaller radius
      if (windowWidth < 330) {
        safeRadius = 60; // Reduced further to prevent overlap
      } 
      // For small screens, use a slightly smaller radius
      else if (windowWidth < 380) {
        safeRadius = 70; // Reduced to prevent buttons being cut off
      } 
      // For medium-sized screens
      else if (windowWidth < 500) {
        safeRadius = 75; // Slightly reduced for better visibility
      }
      
      // Additional safety check: ensure we don't exceed the boundaries
      // Calculate distance to the closest screen edge when in center position
      const minEdgeDistance = Math.min(
        windowWidth / 2,      // Distance to right edge when centered
        windowHeight - 70     // Distance to bottom edge
      );
      
      // Ensure radius doesn't cause buttons to go off-screen (accounting for button size)
      const maxSafeRadius = minEdgeDistance - 60; // 60px buffer for the button size
      
      // Use the smaller of our calculated radius or the safe maximum
      safeRadius = Math.min(safeRadius, maxSafeRadius);
      
      // Calculate bottom position based on screen size
      const calculateBottomPosition = () => {
        // Increase bottom spacing for smaller screens
        if (windowWidth < 330) {
          return '90px'; // Much more space on very small screens
        } else if (windowWidth < 380) {
          return '85px'; // More space on small screens
        } else if (windowWidth < 500) {
          return '80px'; // Slightly more space on medium screens
        } else {
          return '75px'; // Default for larger screens
        }
      };
      
      // Set positions with dynamic bottom value
      const bottomPosition = calculateBottomPosition();
      setPosition({
        resting: { 
          right: windowWidth < 330 ? '16px' : windowWidth < 380 ? '20px' : '30px', 
          bottom: bottomPosition
        },
        center: { 
          right: '50%', 
          bottom: bottomPosition
        }
      });
      
      // Set the calculated menu radius
      setMenuRadius(safeRadius);
    };
    
    // Set initial position
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Toggle the quick ball open/closed state and move to center when open
  const toggleQuickBall = () => {
    if (!isDragging) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      
      // Move to center position when opening, back to resting when closing
      setCurrentPosition(newIsOpen ? 'center' : 'resting');
      
      // Hide zoom tooltip when opening QuickBall
      if (newIsOpen && showZoomTooltip) {
        setShowZoomTooltip(false);
      }
      
      // Provide haptic feedback when toggling
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };
  
  // Drag functionality (only available when in resting position and closed)
  const handleDragStart = (e) => {
    if (isOpen || currentPosition === 'center') return; // Don't drag while menu is open or in center
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    setIsDragging(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };
  
  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const ballWidth = 56; // QuickBall width
    
    // Calculate new position relative to viewport
    let newRight = windowWidth - (touch.clientX - dragOffset.x + ballWidth/2);
    let newBottom = windowHeight - (touch.clientY - dragOffset.y + ballWidth/2);
    
    // Keep within screen bounds with padding
    newRight = Math.max(16, Math.min(windowWidth - ballWidth - 16, newRight));
    newBottom = Math.max(16, Math.min(windowHeight - ballWidth - 16, newBottom));
    
    // Update resting position
    setPosition(prev => ({
      ...prev,
      resting: {
        right: `${newRight}px`,
        bottom: `${newBottom}px`
      }
    }));
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };
  
  // Handle tool selection
  const handleToolSelect = (toolAction) => {
    // Execute the tool action
    toolAction();
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    // Close the quick ball and move back to resting position
    setIsOpen(false);
    setCurrentPosition('resting');
    
    // Special case for zoom mode: show tooltip after QuickBall closes if needed
    // We'll delay this slightly to ensure the QuickBall animation completes first
    if (toolAction === switchToZoomMode) {
      // The zoom tooltip will be shown by the action itself
    }
  };

  // Get current position based on state
  const getCurrentPositionStyle = () => {
    const posStyle = position[currentPosition];
    
    // For center position, add transform to truly center it
    if (currentPosition === 'center') {
      return {
        ...posStyle,
        transform: 'translateX(50%)'
      };
    }
    
    return posStyle;
  };
  
  // Calculate distribution angles for tools to ensure proper spacing
  const getToolPositionStyles = () => {
    // Calculate angles based on number of tools
    const numTools = 9; // We now have 9 tool buttons with the addition of Auto Mode
    const angleStep = (2 * Math.PI) / numTools;
    
    // Generate position styles for each tool
    return Array.from({ length: numTools }).map((_, index) => {
      // Adjust starting angle to avoid buttons at extreme bottom positions
      const startingOffset = Math.PI / 16; // Slight offset to rotate the entire formation
      const angle = (index * angleStep) + startingOffset;
      
      // Calculate specific scaling for the tool based on its position
      // This helps with edge cases and better control of exact positioning
      let toolScale = 1.0;
      
      // Special adjustments for buttons in problematic positions
      if (index === 4) { // Right side, potentially too close to bottom
        toolScale = 0.92; // Reduce radius more significantly
      } else if (index === 3 || index === 5) { // Bottom-right and bottom-left quadrants
        toolScale = 0.95; // Slight reduction for bottom tools
      }
      
      // Calculate positions using trigonometry
      const x = Math.sin(angle) * menuRadius * toolScale;
      const y = -Math.cos(angle) * menuRadius * toolScale;
      
      // Return complete style for this tool
      return `
        .tool-item:nth-child(${index + 1}) {
          transform: ${isOpen ? `translate(${x}px, ${y}px)` : 'translate(0, 0)'};
          transition: transform 0.3s ease, opacity 0.2s ease, background-color 0.2s ease;
        }
      `;
    }).join('\n');
  };

  return (
    <div 
      className="quick-ball-container"
      ref={containerRef}
      style={{
        position: 'fixed',
        ...getCurrentPositionStyle(),
        zIndex: 40,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Custom styles for the QuickBall */}
      <style jsx>{`
        .quick-ball {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: ${isOpen ? '#ffffff' : 'rgba(59, 130, 246, 0.9)'};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: ${isDragging ? 'none' : 'transform 0.3s ease, background-color 0.3s ease'};
          transform: ${isOpen ? 'rotate(45deg)' : isDragging ? 'scale(1.05)' : 'rotate(0)'};
          touch-action: none; /* Prevent browser handling of touch events */
        }
        
        .quick-ball:active {
          transform: ${isOpen ? 'rotate(45deg) scale(0.95)' : isDragging ? 'scale(1.05)' : 'scale(0.95)'};
        }
        
        .tool-item {
          position: absolute;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          opacity: ${isOpen ? 1 : 0};
          pointer-events: ${isOpen ? 'auto' : 'none'};
          z-index: ${isOpen ? 1 : -1};
        }
        
        .tool-item:active {
          transform: scale(0.9) !important;
        }
        
        /* Dynamic positioning for tools */
        ${getToolPositionStyles()}
      `}</style>
      
      {/* Tool items positioned in a circle */}
      <div className="tools-container">
        {/* Draw mode */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(switchToDrawMode)}
          disabled={mode === 'original' || isCanvasLocked || isLoading}
          style={{ 
            background: interactionMode === 'draw' ? '#dbeafe' : 'white',
            color: interactionMode === 'draw' ? '#2563eb' : '#64748b'
          }}
        >
          <Edit3 size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
        
        {/* Zoom mode */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(() => {
            switchToZoomMode();
            // Delay showing the tooltip after QuickBall closes
            setTimeout(() => {
              if (interactionMode === 'zoom') {
                toggleZoomTooltip();
              }
            }, 300); // Delay to let QuickBall close animation finish
          })}
          disabled={isLoading}
          style={{ 
            background: interactionMode === 'zoom' ? '#dbeafe' : 'white',
            color: interactionMode === 'zoom' ? '#2563eb' : '#64748b'
          }}
        >
          <ZoomIn size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
        
        {/* Reset zoom */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(resetZoom)}
          disabled={isLoading}
          style={{ color: '#64748b' }}
        >
          <Home size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
        
        {/* Toggle original view */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(toggleOriginalView)}
          disabled={isLoading}
          style={{ 
            background: mode === 'original' ? '#dbeafe' : 'white',
            color: mode === 'original' ? '#2563eb' : '#64748b'
          }}
        >
          <Eye size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
        
        {/* Toggle canvas lock */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(toggleCanvasLock)}
          disabled={isLoading}
          style={{ 
            background: isCanvasLocked ? '#dbeafe' : 'white',
            color: isCanvasLocked ? '#2563eb' : '#64748b'
          }}
        >
          {isCanvasLocked ? <Unlock size={screenDimensions.width < 330 ? 18 : 20} /> : <Lock size={screenDimensions.width < 330 ? 18 : 20} />}
        </button>
        
        {/* Auto/Manual mode toggle - NEW BUTTON */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(toggleAutoMode)}
          disabled={isLoading}
          style={{ 
            background: isAutoMode ? '#dbeafe' : 'white',
            color: isAutoMode ? '#2563eb' : '#64748b'
          }}
        >
          <Zap size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
        
        {/* Approve image */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(handleApproveImage)}
          disabled={isLoading}
          style={{ 
            background: '#10b981',
            color: 'white'
          }}
        >
          <CheckCircle size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
        
        {/* Download */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(() => setShowMobileDownloadDialog(true))}
          disabled={isLoading}
          style={{ color: '#64748b' }}
        >
          <Download size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
        
        {/* Menu */}
        <button 
          className="tool-item"
          onClick={() => handleToolSelect(() => setShowMobileMenu(true))}
          disabled={isLoading}
          style={{ color: '#64748b' }}
        >
          <Menu size={screenDimensions.width < 330 ? 18 : 20} />
        </button>
      </div>
      
      {/* Main quick ball button */}
      <button 
        className="quick-ball"
        onClick={toggleQuickBall}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        disabled={isLoading}
        style={{cursor: isDragging ? 'grabbing' : 'grab'}}
      >
        <svg 
          width={screenDimensions.width < 330 ? "20" : "24"} 
          height={screenDimensions.width < 330 ? "20" : "24"}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={isOpen ? "#3b82f6" : "white"} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};

export default EditorQuickBall;