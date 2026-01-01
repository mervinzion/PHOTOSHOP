import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Pipette, ArrowLeft, Download, Redo, Plus, Check, RefreshCw, Sliders, X, Edit3 } from 'lucide-react';

// QuickBall Component based on EditorQuickBall.jsx reference
const QuickBall = ({ children, onToggle, onPositionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [menuRadius, setMenuRadius] = useState(85);
  const ballRef = useRef(null);

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

      // Provide haptic feedback when toggling
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      if (onToggle) {
        onToggle(newIsOpen);
      }
    }
  };

  // Drag functionality (only available when in resting position and closed)
  const handleDragStart = (e) => {
    if (isOpen || currentPosition === 'center') return; // Don't drag while menu is open or in center

    e.preventDefault(); // Add this to prevent default behavior

    const touch = e.touches[0];
    const rect = ballRef.current.getBoundingClientRect();
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
    const newPosition = {
      ...position,
      resting: {
        right: `${newRight}px`,
        bottom: `${newBottom}px`
      }
    };

    setPosition(newPosition);

    if (onPositionChange) {
      onPositionChange(newPosition.resting);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  // Add event listeners for drag
  useEffect(() => {
    const handleMove = (e) => handleDragMove(e);
    const handleEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging]);

  // Calculate distribution angles for tools to ensure proper spacing
  const getToolPositionStyles = () => {
    // Calculate angles based on number of tools
    const numTools = React.Children.count(children); // Count the number of child elements
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
          opacity: ${isOpen ? 1 : 0};
          pointer-events: ${isOpen ? 'auto' : 'none'};
          transition: transform 0.3s ease ${index * 0.05}s, opacity 0.2s ease ${index * 0.05}s, background-color 0.2s ease;
        }
      `;
    }).join('\n');
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

  return (
    <div
      className="quick-ball-container"
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
          z-index: 50;
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
        {React.Children.map(children, (child, index) => (
          <div className="tool-item" key={index}>
            {child}
          </div>
        ))}
      </div>

      {/* Main quick ball button */}
      <button
        ref={ballRef}
        className="quick-ball"
        onClick={toggleQuickBall}
        onTouchStart={handleDragStart}
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

      {/* Background overlay when menu is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={toggleQuickBall}
        />
      )}
    </div>
  );
};

// Main Color Changer component
const ColorChangerMobile = ({ initialImage, onReset }) => {
    // UI state
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'canvas'
    const [sliderPosition, setSliderPosition] = useState(50);
    const [error, setError] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [activeSection, setActiveSection] = useState('editor'); // 'editor', 'queue', 'completed'

    // QuickBall state
    const [quickBallPosition, setQuickBallPosition] = useState({ right: '30px', bottom: '80px' });
    const [isQuickBallOpen, setIsQuickBallOpen] = useState(false);

    // Color changer state
    const [sourceColor, setSourceColor] = useState('#ff0000');
    const [targetColor, setTargetColor] = useState('#0000ff');
    const [tolerance, setTolerance] = useState(30);
    const [isPickingColor, setIsPickingColor] = useState(false);

    // Image processing state
    const [pendingImages, setPendingImages] = useState([]);
    const [completedImages, setCompletedImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeDisplayImage, setActiveDisplayImage] = useState(null);
    const [currentImageBeingProcessed, setCurrentImageBeingProcessed] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    // Track intermediate changes/history for the current working image
    const [changeHistory, setChangeHistory] = useState([]);
    const [currentChangeIndex, setCurrentChangeIndex] = useState(-1);

    // Use refs for values that shouldn't trigger re-renders
    const colorValuesRef = useRef({
        sourceColor,
        targetColor,
        tolerance
    });

    // Keep the ref in sync with state
    useEffect(() => {
        colorValuesRef.current = {
            sourceColor,
            targetColor,
            tolerance
        };
    }, [sourceColor, targetColor, tolerance]);

    // Refs
    const canvasRef = useRef(null);
    const originalCanvasRef = useRef(null);
    const processedCanvasRef = useRef(null);

    // Initialize queue when component loads
    useEffect(() => {
        if (Array.isArray(initialImage) && initialImage.length > 0) {
            const formattedQueue = initialImage.map((img, index) => ({
                id: `img-${Date.now()}-${index}`,
                original: img,
                processed: null,
                isProcessing: false,
                tolerance: tolerance,
                sourceColor: sourceColor,
                targetColor: targetColor
            }));
            setPendingImages(formattedQueue);

            // Set the first image as the one being processed
            setCurrentImageBeingProcessed(formattedQueue[0]);
        } else if (initialImage) {
            const singleImage = {
                id: `img-${Date.now()}-0`,
                original: initialImage,
                processed: null,
                isProcessing: false,
                tolerance: tolerance,
                sourceColor: sourceColor,
                targetColor: targetColor
            };
            setPendingImages([singleImage]);

            // Set the single image as the one being processed
            setCurrentImageBeingProcessed(singleImage);
        }
    }, [initialImage, sourceColor, targetColor, tolerance]);

    // Load and cache images to ensure consistent size
    useEffect(() => {
        // Use either the active display image or the current image being processed
        const imageToDisplay = activeDisplayImage || currentImageBeingProcessed;

        if (!imageToDisplay) {
            console.log("⚠️ No image to display in useEffect");
            return;
        }

        // Reset dimensions before reloading to avoid stale state
        setImageDimensions({ width: 0, height: 0 });

        // Create a stable ID for the image to track when it actually changes
        const imageId = imageToDisplay.id;
        const imageSrc = imageToDisplay.original;

        console.log("🔄 Loading image in useEffect:", imageId);

        // Load original image to get dimensions
        const img = new Image();

        img.onload = () => {
            // Verify the image is still relevant (avoid stale updates)
            if ((activeDisplayImage?.id !== imageId && currentImageBeingProcessed?.id !== imageId)) {
                console.log("⚠️ Image no longer relevant:", imageId);
                return;
            }

            console.log("✅ Image loaded in useEffect, natural dimensions:", img.naturalWidth, "x", img.naturalHeight);

            // Calculate the available space for the image
            const containerRect = canvasRef.current ? canvasRef.current.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight * 0.7 };
            const availableWidth = containerRect.width;
            const availableHeight = containerRect.height;

            console.log("📏 Available space:", availableWidth, "x", availableHeight);

            // Calculate dimensions to fit within available space while maintaining aspect ratio
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let finalWidth, finalHeight;

            if (img.naturalWidth > availableWidth || img.naturalHeight > availableHeight) {
                // Image is larger than available space, need to scale down
                const widthRatio = availableWidth / img.naturalWidth;
                const heightRatio = availableHeight / img.naturalHeight;

                // Use the smaller ratio to ensure image fits within bounds
                const scaleFactor = Math.min(widthRatio, heightRatio);

                finalWidth = img.naturalWidth * scaleFactor;
                finalHeight = img.naturalHeight * scaleFactor;
            } else {
                // Image is smaller than available space, use natural dimensions
                finalWidth = img.naturalWidth;
                finalHeight = img.naturalHeight;
            }

            console.log("📏 Final display dimensions:", finalWidth, "x", finalHeight);

            setImageDimensions({
                width: finalWidth,
                height: finalHeight,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            });

            // Draw the image on original canvas
            if (originalCanvasRef.current) {
                const canvas = originalCanvasRef.current;
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                console.log("✅ Image drawn on original canvas in useEffect");
            }
        };

        img.onerror = (err) => {
            console.error("❌ Error loading image in useEffect:", err);
            setError("Failed to load image");
        };

        img.src = imageSrc;

        // Handle window resize to recalculate available space
        const handleResize = () => {
            if (img.complete) {
                img.onload();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [activeDisplayImage?.id, currentImageBeingProcessed?.id]);

    // Utility functions for color conversions - memoized to prevent recreating on render
    const colorUtils = useMemo(() => {
        return {
            rgbToHex: (r, g, b) => {
                return '#' + [r, g, b].map(x => {
                    const hex = x.toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                }).join('');
            },

            hexToRgb: (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            },

            colorDistance: (color1, color2) => {
                return Math.sqrt(
                    Math.pow(color1.r - color2.r, 2) +
                    Math.pow(color1.g - color2.g, 2) +
                    Math.pow(color1.b - color2.b, 2)
                );
            },

            // Add a new function to validate hex color codes
            isValidHexColor: (color) => {
                return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
            }
        };
    }, []);

    // Pick color from canvas
    const handlePickColor = useCallback((e) => {
        if (!isPickingColor) return;

        // This will close the quickball if open while picking
        if (isQuickBallOpen) {
            setIsQuickBallOpen(false);
        }

        try {
            // If we have an activeDisplayImage, we need to load it to the canvas first
            if (activeDisplayImage && originalCanvasRef.current) {
                const canvas = originalCanvasRef.current;
                const ctx = canvas.getContext('2d');

                // Load the original image to the canvas
                const img = new Image();
                img.onload = () => {
                    // Set canvas dimensions to match the image
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;

                    // Draw the image to the canvas
                    ctx.drawImage(img, 0, 0);

                    // Now process the pick with the updated canvas
                    processPick(e);
                };
                img.src = activeDisplayImage.original;
            } else {
                // Process directly if no activeDisplayImage
                processPick(e);
            }
        } catch (err) {
            console.error("❌ Error picking color:", err);
            setIsPickingColor(false);
            setError("Failed to pick color. Try again.");
        }

        // Prevent default to avoid conflicts with QuickBall
        if (e.cancelable) {
            e.preventDefault();
        }

        // Helper function to process the actual color picking
        function processPick(event) {
            if (!originalCanvasRef.current) {
                setError("Canvas not available. Try again.");
                return;
            }

            const canvas = originalCanvasRef.current;
            const rect = canvas.getBoundingClientRect();

            // Get correct coordinates based on event type
            let clientX, clientY;

            if (event.type.includes('touch')) {
                // For touch events
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                // For mouse events
                clientX = event.clientX;
                clientY = event.clientY;
            }

            // Calculate the scaling factor between the displayed canvas and the actual canvas size
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            // Calculate the actual coordinates on the canvas
            const x = Math.floor((clientX - rect.left) * scaleX);
            const y = Math.floor((clientY - rect.top) * scaleY);

            console.log("Picking color at coordinates:", x, y, "Canvas size:", canvas.width, canvas.height);

            // Ensure the coordinates are within the canvas bounds
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                const ctx = canvas.getContext('2d');
                const pixelData = ctx.getImageData(x, y, 1, 1).data;

                console.log("Picked pixel data:", pixelData);

                const hexColor = colorUtils.rgbToHex(pixelData[0], pixelData[1], pixelData[2]);

                setSourceColor(hexColor);

                // Update the reference values
                if (colorValuesRef.current) {
                    colorValuesRef.current.sourceColor = hexColor;
                }

                // Update current image if it exists
                if (currentImageBeingProcessed) {
                    // Create a copy with the new source color
                    const updatedImage = {
                        ...currentImageBeingProcessed,
                        sourceColor: hexColor
                    };

                    // Update state with the modified image
                    setCurrentImageBeingProcessed(updatedImage);

                    // Update pending images if needed
                    setPendingImages(prev =>
                        prev.map(img =>
                            img.id === updatedImage.id
                                ? updatedImage
                                : img
                        )
                    );
                }

                // Exit the color picking mode
                setIsPickingColor(false);

                // Show success message with haptic feedback
                setError({ type: 'success', message: 'Color selected!' });
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }

                // Clear success message after 2 seconds
                setTimeout(() => {
                    setError(prev => {
                        if (prev && prev.type === 'success') {
                            return null;
                        }
                        return prev;
                    });
                }, 2000);
            } else {
                console.log("Coordinates out of bounds:", x, y);
                setError("Please click within the image boundaries.");
            }
        }
    }, [isPickingColor, colorUtils, currentImageBeingProcessed, isQuickBallOpen, activeDisplayImage]);

    // Initialize specialized canvas events for color picking
    useEffect(() => {
        // If we're in color picking mode and have a canvas reference
        if (isPickingColor && originalCanvasRef.current) {
            const canvas = originalCanvasRef.current;

            // Touch and mouse event handlers with proper passive options
            const handleTouchStart = (e) => {
                if (isPickingColor) {
                    handlePickColor(e);
                    // Stop propagation to prevent QuickBall from responding
                    e.stopPropagation();
                    // Cancel default to prevent scrolling, etc.
                    if (e.cancelable) e.preventDefault();
                }
            };

            const handleMouseDown = (e) => {
                if (isPickingColor) {
                    handlePickColor(e);
                    // Stop propagation to prevent QuickBall from responding
                    e.stopPropagation();
                }
            };

            // Add event listeners with correct options
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('mousedown', handleMouseDown);

            // Cleanup event listeners when component unmounts or dependencies change
            return () => {
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('mousedown', handleMouseDown);
            };
        }
    }, [isPickingColor, handlePickColor]);

    // Process the current image
    const handleProcessImage = useCallback(() => {
        if (!currentImageBeingProcessed || !originalCanvasRef.current) return;

        setIsProcessing(true);
        setError(null);

        // Use setTimeout to ensure UI updates before heavy processing
        setTimeout(() => {
            try {
                // Determine which canvas to use as source
                const useProcessedAsSource = changeHistory.length > 0 && currentChangeIndex >= 0;

                const sourceCanvas = useProcessedAsSource ? processedCanvasRef.current : originalCanvasRef.current;
                const ctx = sourceCanvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
                const data = imageData.data;

                const sourceRgb = colorUtils.hexToRgb(currentImageBeingProcessed.sourceColor || sourceColor);
                const targetRgb = colorUtils.hexToRgb(currentImageBeingProcessed.targetColor || targetColor);
                const currentTolerance = currentImageBeingProcessed.tolerance || tolerance;

                if (!sourceRgb || !targetRgb) {
                    throw new Error('Invalid color format');
                }

                for (let i = 0; i < data.length; i += 4) {
                    const pixelColor = {
                        r: data[i],
                        g: data[i + 1],
                        b: data[i + 2]
                    };

                    const distance = colorUtils.colorDistance(pixelColor, sourceRgb);

                    if (distance < currentTolerance) {
                        // Calculate how close the match is as a percentage
                        const factor = 1 - (distance / currentTolerance);

                        // Blend between original color and target color based on match factor
                        data[i] = pixelColor.r + factor * (targetRgb.r - pixelColor.r);
                        data[i + 1] = pixelColor.g + factor * (targetRgb.g - pixelColor.g);
                        data[i + 2] = pixelColor.b + factor * (targetRgb.b - pixelColor.b);
                        // Alpha channel remains unchanged
                    }
                }

                // Display the processed image
                const processedCanvas = processedCanvasRef.current;
                if (processedCanvas) {
                    const processedCtx = processedCanvas.getContext('2d');
                    processedCanvas.width = sourceCanvas.width;
                    processedCanvas.height = sourceCanvas.height;
                    processedCtx.putImageData(imageData, 0, 0);

                    // Create a data URL from the canvas
                    const processedDataUrl = processedCanvas.toDataURL('image/png');

                    // Create a temporary image object with the latest changes
                    const processedImage = {
                        id: `${currentImageBeingProcessed.id}-change-${Date.now()}`,
                        original: currentImageBeingProcessed.original,
                        processed: processedDataUrl,
                        sourceColor: currentImageBeingProcessed.sourceColor || sourceColor,
                        targetColor: currentImageBeingProcessed.targetColor || targetColor,
                        tolerance: currentImageBeingProcessed.tolerance || tolerance,
                        timestamp: Date.now()
                    };

                    // Set as active display image
                    setActiveDisplayImage(processedImage);
                    setIsProcessing(false);

                    // Show success message
                    setError({ type: 'success', message: 'Image processed!' });

                    // Close QuickBall if open
                    setIsQuickBallOpen(false);

                    // Haptic feedback
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }

                    // Clear success message after 2 seconds
                    setTimeout(() => {
                        setError(prev => {
                            if (prev && prev.type === 'success') {
                                return null;
                            }
                            return prev;
                        });
                    }, 2000);
                }
            } catch (err) {
                setError(err.message);
                console.error('Error processing image:', err);
                setIsProcessing(false);
            }
        }, 0);
    }, [currentImageBeingProcessed, sourceColor, targetColor, tolerance, colorUtils, changeHistory, currentChangeIndex]);

    // Handle append button click
    const handleAppendChange = useCallback(() => {
        if (!activeDisplayImage || !activeDisplayImage.processed) {
            setError("Please process an image before appending changes");
            return;
        }

        // Create a change record with the current color settings
        const change = {
            id: `change-${Date.now()}`,
            imageDataUrl: activeDisplayImage.processed,
            sourceColor: currentImageBeingProcessed.sourceColor || sourceColor,
            targetColor: currentImageBeingProcessed.targetColor || targetColor,
            tolerance: currentImageBeingProcessed.tolerance || tolerance,
            timestamp: Date.now()
        };

        // Add the change to history and update the index
        setChangeHistory(prevHistory => {
            // If we're not at the latest change, trim the history
            const updatedHistory = prevHistory.slice(0, currentChangeIndex + 1);
            return [...updatedHistory, change];
        });

        setCurrentChangeIndex(prevIndex => prevIndex + 1);

        // We need to update the current image being processed to use the new
        // processed image as the starting point for the next color change
        if (currentImageBeingProcessed) {
            // Get the processed image from the processed canvas
            const processedCanvas = processedCanvasRef.current;
            if (processedCanvas) {
                // Create a new base image for further processing
                const processedDataUrl = processedCanvas.toDataURL('image/png');

                // Update the original canvas with the processed result
                const img = new Image();
                img.onload = () => {
                    if (originalCanvasRef.current) {
                        const canvas = originalCanvasRef.current;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                };
                img.src = processedDataUrl;
            }
        }

        // Show confirmation message
        setError({ type: 'success', message: 'Change appended!' });

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        // Close QuickBall if open
        setIsQuickBallOpen(false);

        // Clear error after 2 seconds if it's a success message
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [activeDisplayImage, currentImageBeingProcessed, sourceColor, targetColor, tolerance, currentChangeIndex]);

    // Debounced update tolerance
    const handleUpdateTolerance = useCallback((newTolerance) => {
        setTolerance(newTolerance);

        // Update ref directly
        colorValuesRef.current.tolerance = newTolerance;

        // If there's a current image being processed, update its tolerance
        if (currentImageBeingProcessed) {
            // Update property directly without creating new object
            currentImageBeingProcessed.tolerance = newTolerance;

            // Batch update to pending images
            requestAnimationFrame(() => {
                // Update in pending images array in next frame
                setPendingImages(prev =>
                    prev.map(img =>
                        img.id === currentImageBeingProcessed.id
                            ? {...img, tolerance: newTolerance}
                            : img
                    )
                );
            });
        }
    }, [currentImageBeingProcessed]);

    // Enhanced validate and sanitize hex color
    const validateHexColor = useCallback((input) => {
        // Ensure it starts with #
        let value = input;
        if (!value.startsWith('#')) {
            value = '#' + value;
        }

        // Remove any non-hex characters
        value = value.replace(/[^#A-Fa-f0-9]/g, '');

        // Limit to 7 characters (# + 6 hex digits)
        if (value.length > 7) {
            value = value.slice(0, 7);
        }

        return value;
    }, []);

    // Improved target color handler
    const handleUpdateTargetColor = useCallback((newColor) => {
        // Always update the display value
        setTargetColor(newColor);

        // Only update processing values if it's a valid color
        if (colorUtils.isValidHexColor(newColor)) {
            // Update ref directly
            colorValuesRef.current.targetColor = newColor;

            // If there's a current image being processed, update its target color
            if (currentImageBeingProcessed) {
                // Update property directly without creating new object
                currentImageBeingProcessed.targetColor = newColor;

                // Batch update to pending images
                requestAnimationFrame(() => {
                    // Update in pending images array in next frame
                    setPendingImages(prev =>
                        prev.map(img =>
                            img.id === currentImageBeingProcessed.id
                                ? {...img, targetColor: newColor}
                                : img
                        )
                    );
                });
            }
        }
    }, [currentImageBeingProcessed, colorUtils]);

    // Target color change handler - allows typing while maintaining validation
    const handleTargetColorChange = useCallback((e) => {
        const rawInput = e.target.value;

        // If user is deleting the # at the beginning, don't block them
        if (rawInput === '') {
            handleUpdateTargetColor('#000000'); // Default to black when empty
            return;
        }

        // Don't auto-prepend # when user is typing
        let sanitizedInput = rawInput;

        // Only remove invalid characters
        sanitizedInput = sanitizedInput.replace(/[^#A-Fa-f0-9]/g, '');

        // Ensure we don't exceed 7 chars
        if (sanitizedInput.length > 7) {
            sanitizedInput = sanitizedInput.slice(0, 7);
        }

        // Always update the input value to show what user is typing
        handleUpdateTargetColor(sanitizedInput);
    }, [handleUpdateTargetColor]);

    // Select a completed image
    const handleSelectCompleted = useCallback((img) => {
        setActiveDisplayImage(img);
        // Switch back to editor view after selecting an image
        setActiveSection('editor');
        // Close QuickBall if open
        setIsQuickBallOpen(false);
    }, []);

    // Toggle view mode
    const toggleViewMode = useCallback(() => {
        setViewMode(prev => prev === 'live' ? 'canvas' : 'live');

        // Show toast notification of mode change
        setError({
            type: 'success',
            message: `Switched to ${viewMode === 'live' ? 'canvas' : 'live'} mode`
        });

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(20);
        }

        // Clear success message after 2 seconds
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [viewMode]);

    // Redo a previously completed image
    const handleRedoImage = useCallback((imageId) => {
        // Find the image in completedImages
        const imageToRedo = completedImages.find(img => img.id === imageId);

        if (!imageToRedo) {
            console.error('❌ Image not found in completedImages:', imageId);
            return;
        }

        // Create a new image object for the pending queue with a guaranteed unique ID
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 9);
        const redoImage = {
            ...imageToRedo,
            id: `redo-${timestamp}-${randomString}`, // New unique ID
            processed: null, // Reset processed state
            isProcessing: false,
            timestamp: timestamp
        };

        // Force view mode to 'live' to ensure proper display
        setViewMode('live');

        // Reset change history for new edits
        setChangeHistory([]);
        setCurrentChangeIndex(-1);

        // Remove from completed images first
        setCompletedImages(prev => prev.filter(img => img.id !== imageId));

        // Add to pending images
        setPendingImages(prev => [redoImage, ...prev]);

        // Force clearing the canvas first
        if (originalCanvasRef.current) {
            const canvas = originalCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (processedCanvasRef.current) {
            const canvas = processedCanvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        // Important: Clear activeDisplayImage first to force re-render
        setActiveDisplayImage(null);

        // Wait a moment to ensure all state updates have processed
        setTimeout(() => {
            // Then set the currentImageBeingProcessed
            setCurrentImageBeingProcessed(redoImage);

            // And then set the activeDisplayImage
            setTimeout(() => {
                setActiveDisplayImage(redoImage);

                // Pre-load the image to ensure proper dimensions
                const preloadImg = new Image();
                preloadImg.onload = () => {
                    // Force drawing to canvas after image is loaded
                    if (originalCanvasRef.current) {
                        const canvas = originalCanvasRef.current;
                        canvas.width = preloadImg.naturalWidth;
                        canvas.height = preloadImg.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(preloadImg, 0, 0);

                        // Ensure dimensions are updated
                        setImageDimensions({
                            width: preloadImg.naturalWidth,
                            height: preloadImg.naturalHeight,
                            naturalWidth: preloadImg.naturalWidth,
                            naturalHeight: preloadImg.naturalHeight
                        });
                    }
                };
                preloadImg.src = redoImage.original;
            }, 50);
        }, 50);

        // Switch back to editor view
        setActiveSection('editor');

        // Close QuickBall if open
        setIsQuickBallOpen(false);

        // Success message
        setError({ type: 'success', message: 'Image ready for processing!' });

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        // Clear success message after 2 seconds
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [completedImages]);

    // Download images
    const handleDownload = useCallback((option = 'selected') => {
        setShowDownloadMenu(false);

        if (option === 'selected') {
            if (!activeDisplayImage || !activeDisplayImage.processed) return;

            const link = document.createElement('a');
            link.href = activeDisplayImage.processed;
            link.download = `colored-${Date.now()}.png`;
            link.click();

            // Show success message
            setError({ type: 'success', message: 'Downloading image...' });

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(40);
            }

            // Close QuickBall if open
            setIsQuickBallOpen(false);

            // Clear success message after 2 seconds
            setTimeout(() => {
                setError(prev => {
                    if (prev && prev.type === 'success') {
                        return null;
                    }
                    return prev;
                });
            }, 2000);
        } else if (option === 'all') {
            // Create a zip file with all images
            if (completedImages.length === 0) return;

            completedImages.forEach((img, index) => {
                if (img.processed) {
                    const link = document.createElement('a');
                    link.href = img.processed;
                    link.download = `colored-${index+1}-${Date.now()}.png`;
                    // Small delay between downloads to avoid browser issues
                    setTimeout(() => {
                        link.click();
                    }, index * 100);
                }
            });

            // Show success message
            setError({ type: 'success', message: 'Downloading all images...' });

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([30, 50, 30]);
            }

            // Close QuickBall if open
            setIsQuickBallOpen(false);

            // Clear success message after 2 seconds
            setTimeout(() => {
                setError(prev => {
                    if (prev && prev.type === 'success') {
                        return null;
                    }
                    return prev;
                });
            }, 2000);
        }
    }, [activeDisplayImage, completedImages]);

    // Handle slider touch/mouse down
    const handleSliderDown = useCallback((e) => {
        if (viewMode !== 'canvas') return;

        if (e.cancelable) {
            e.preventDefault();
        }

        // Find the actual image element for more precise bounds
        const imageContainer = canvasRef.current;
        if (!imageContainer) return;

        // Get the container's actual dimensions and position
        const containerRect = imageContainer.getBoundingClientRect();

        // Check if touch/click is within the container bounds
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        if (
            clientX < containerRect.left ||
            clientX > containerRect.right ||
            clientY < containerRect.top ||
            clientY > containerRect.bottom
        ) return;

        // Get initial position
        const initialX = clientX;
        const containerWidth = containerRect.width;
        const initialPosition = sliderPosition;

        // Define move handler for both mouse and touch
        const handleMove = (moveEvent) => {
            if (moveEvent.cancelable) {
                moveEvent.preventDefault(); // Prevent scrolling while dragging
            }

            // Get current position based on event type
            const currentX = moveEvent.type.includes('touch')
                ? moveEvent.touches[0].clientX
                : moveEvent.clientX;

            // Calculate how far the pointer has moved as a percentage of container width
            const deltaX = currentX - initialX;
            const percentageDelta = (deltaX / containerWidth) * 100;

            // Calculate new position, clamped between 0-100%
            const newPosition = Math.max(0, Math.min(100, initialPosition + percentageDelta));
            setSliderPosition(newPosition);
        };

        // Define up/end handler to clean up
        const handleEnd = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
        };

        // Add event listeners for dragging (both mouse and touch)
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchend', handleEnd);
    }, [viewMode, sliderPosition]);

    // Reset to handle change history
    const handleReset = useCallback(() => {
        // Clear change history
        setChangeHistory([]);
        setCurrentChangeIndex(-1);

        // Force view mode to live to ensure we're not in split-view mode
        setViewMode('live');

        // CRITICAL FIX: We need to use either currentImageBeingProcessed OR activeDisplayImage
        // since the display could be showing either one
        const imageToReset = currentImageBeingProcessed || activeDisplayImage;

        if (imageToReset) {
            // Generate a new unique ID
            const newUniqueId = `reset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

            // Create a fresh reset image object with processed=null
            const resetImage = {
                ...imageToReset,
                id: newUniqueId,
                processed: null  // This is critical - we must clear the processed property
            };

            // Clear active display image FIRST (this is key)
            setActiveDisplayImage(null);

            // Set currentImageBeingProcessed to the reset image
            setCurrentImageBeingProcessed(resetImage);

            // After a small delay, set the activeDisplayImage to force a refresh
            setTimeout(() => {
                setActiveDisplayImage(resetImage);
            }, 50);

            // Update pending images if needed
            if (imageToReset.id) {
                setPendingImages(prev => {
                    // First remove the existing image if it exists
                    const filtered = prev.filter(img => img.id !== imageToReset.id);
                    // Then add the reset image at the beginning
                    return [resetImage, ...filtered];
                });
            }

            // IMPORTANT: Force clear both canvases regardless of refs
            if (processedCanvasRef.current) {
                const processedCanvas = processedCanvasRef.current;
                const processedCtx = processedCanvas.getContext('2d');
                processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
            }

            // Redraw original canvas with the original image
            if (originalCanvasRef.current) {
                const canvas = originalCanvasRef.current;
                const ctx = canvas.getContext('2d');

                // Clear the canvas first
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Load the original image
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);
                };
                img.onerror = (err) => {
                    console.error('❌ Error loading image:', err);
                    setError("Failed to load original image");
                };

                // Make sure we're using the original image source
                img.src = imageToReset.original;
            }
        }

        // Clear any error messages
        setError(null);

        // Close QuickBall if open
        setIsQuickBallOpen(false);

        // Show success message
        setError({ type: 'success', message: 'Image reset successful!' });

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(40);
        }

        // Clear success message after 2 seconds
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [currentImageBeingProcessed, activeDisplayImage]);

    // Handle Done button click - add the current image with all appended changes to completed images
    // Then automatically pull the next image from the queue
    const handleDone = useCallback(() => {
        if (!activeDisplayImage || !activeDisplayImage.processed) {
            setError("Please process an image before marking it as done");
            return;
        }

        // Create a final image that includes all the appended changes
        const finalImage = {
            id: `final-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            original: currentImageBeingProcessed.original,
            processed: activeDisplayImage.processed,
            sourceColor: currentImageBeingProcessed.sourceColor || sourceColor,
            targetColor: currentImageBeingProcessed.targetColor || targetColor,
            tolerance: currentImageBeingProcessed.tolerance || tolerance,
            timestamp: Date.now(),
            changesCount: changeHistory.length + 1 // Include the current change
        };

        // Add to completed images
        setCompletedImages(prev => [...prev, finalImage]);

        // Reset the change history for the next round of edits
        setChangeHistory([]);
        setCurrentChangeIndex(-1);

        // Get the current image ID to remove it from the pending queue
        const currentImageId = currentImageBeingProcessed?.id;

        // Update pending images queue - remove the current image
        setPendingImages(prev => {
            // Filter out the current image
            const updatedQueue = prev.filter(img => img.id !== currentImageId);
            return updatedQueue;
        });

        // Clear canvases
        if (originalCanvasRef.current && processedCanvasRef.current) {
            const processedCanvas = processedCanvasRef.current;
            const processedCtx = processedCanvas.getContext('2d');
            processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);

            const originalCanvas = originalCanvasRef.current;
            const originalCtx = originalCanvas.getContext('2d');
            originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        }

        // After removing the current image from the queue, check if there are more images
        // and set the next one as the current image being processed
        setTimeout(() => {
            setPendingImages(prevPendingImages => {
                if (prevPendingImages.length > 0) {
                    // Get the next image from the queue
                    const nextImage = prevPendingImages[0];

                    // Set it as the current image being processed
                    setCurrentImageBeingProcessed(nextImage);
                    setActiveDisplayImage(nextImage);

                    // Load the next original image onto the canvas
                    if (originalCanvasRef.current) {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = originalCanvasRef.current;
                            if (canvas) {
                                const ctx = canvas.getContext('2d');
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                canvas.width = img.naturalWidth;
                                canvas.height = img.naturalHeight;
                                ctx.drawImage(img, 0, 0);
                            }
                        };
                        img.src = nextImage.original;
                    }

                    setError({ type: 'success', message: 'Image saved! Next image loaded.' });
                } else {
                    // No more images in the queue
                    setCurrentImageBeingProcessed(null);
                    setActiveDisplayImage(null);
                    setError({ type: 'success', message: 'Image saved! Queue empty.' });
                }
                return prevPendingImages;
            });
        }, 100); // Small delay to ensure state updates happen in sequence

        // Close QuickBall if open
        setIsQuickBallOpen(false);

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([30, 30, 60]);
        }

        // Clear success message after 2 seconds
        setTimeout(() => {
            setError(prev => {
                if (prev && prev.type === 'success') {
                    return null;
                }
                return prev;
            });
        }, 2000);
    }, [activeDisplayImage, currentImageBeingProcessed, sourceColor, targetColor, tolerance, changeHistory]);

    // Display number of stacked changes
    const getChangeCountLabel = useCallback(() => {
        if (changeHistory.length === 0) {
            return null;
        }

        return `${changeHistory.length + 1} change${changeHistory.length > 0 ? 's' : ''} stacked`;
    }, [changeHistory]);

    // Show section based on user selection
    const handleSectionView = useCallback((section) => {
        setActiveSection(section);
        // Close QuickBall if open
        setIsQuickBallOpen(false);
    }, []);

    return (
        <div className="fixed inset-0 bg-white flex flex-col h-full overflow-hidden">
            {/* Minimal header with back button and title */}
            <div className="absolute top-0 left-0 z-50 p-2">
                <button
                    onClick={onReset}
                    className="p-2 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            {/* Main canvas area - takes up entire screen */}
            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    {(activeDisplayImage || currentImageBeingProcessed) ? (
                        <div
                            ref={canvasRef}
                            className="relative flex items-center justify-center w-full h-full"
                        >
                            <div className="relative max-w-full max-h-full flex items-center justify-center">
                                {/* Canvas container */}
                                <div
                                    className="relative"
                                    style={{
                                        width: imageDimensions.width > 0 ? `${imageDimensions.width}px` : 'auto',
                                        height: imageDimensions.height > 0 ? `${imageDimensions.height}px` : 'auto'
                                    }}
                                >
                                    {/* Original Canvas */}
                                    <canvas
                                        ref={originalCanvasRef}
                                        className={`absolute inset-0 w-full h-full z-20 ${isPickingColor ? 'cursor-crosshair' : 'cursor-default'}`}
                                        style={{
                                            opacity: activeDisplayImage && !isPickingColor ? 0 : 1
                                        }}
                                    />

                                    {/* Processed Canvas - hidden initially */}
                                    <canvas
                                        ref={processedCanvasRef}
                                        className="absolute inset-0 w-full h-full z-10 hidden"
                                    />

                                    {/* Fallback display for original image */}
                                    {!activeDisplayImage && currentImageBeingProcessed && (
                                        <img
                                            src={currentImageBeingProcessed.original}
                                            alt="Original"
                                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                            style={{
                                                zIndex: isPickingColor ? 5 : 10
                                            }}
                                        />
                                    )}

                                    {/* Display processed images */}
                                    {activeDisplayImage && (
                                        <>
                                            {/* Original Image */}
                                            <img
                                                src={activeDisplayImage.original}
                                                alt="Original"
                                                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                                            />

                                            {/* Processed Image with clip mask for slider */}
                                            {activeDisplayImage.processed && (
                                                <div
                                                    className="absolute inset-0 overflow-hidden pointer-events-none z-20"
                                                    style={{
                                                        clipPath: viewMode === 'canvas'
                                                            ? `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                                                            : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                                                    }}
                                                >
                                                    <img
                                                        src={activeDisplayImage.processed}
                                                        alt="Processed"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            )}

                                            {/* Slider elements - only in canvas mode with processed image */}
                                            {viewMode === 'canvas' && activeDisplayImage.processed && (
                                                <>
                                                    {/* Slider Line */}
                                                    <div
                                                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm z-30 pointer-events-none"
                                                        style={{ left: `${sliderPosition}%` }}
                                                    />

                                                    {/* Slider Handle - touch/mouse interaction */}
                                                    <div
                                                        className="absolute top-0 bottom-0 w-8 cursor-ew-resize z-40"
                                                        style={{
                                                            left: `${sliderPosition}%`,
                                                            transform: 'translateX(-1rem)'
                                                        }}
                                                        onMouseDown={handleSliderDown}
                                                        onTouchStart={handleSliderDown}
                                                    >
                                                        {/* Visible handle */}
                                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow border border-gray-300 flex items-center justify-center">
                                                            <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}

                                    {/* Color picking indicator */}
                                    {isPickingColor && (
                                        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20">
                                            <div className="bg-black/80 text-white px-4 py-2 rounded text-sm max-w-xs text-center">
                                                Tap on the image to select a color
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500 p-8 text-center">
                            {pendingImages.length > 0
                                ? 'Select an image to process'
                                : 'No images available'}
                        </div>
                    )}
                </div>
            </div>

            {/* Show stacked changes count if any */}
            {getChangeCountLabel() && (
                <div className="absolute top-12 right-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium z-20">
                    {getChangeCountLabel()}
                </div>
            )}

            {/* Essential Color Controls Task Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 z-30 py-1.5 px-2 flex items-center justify-between">
                {/* Source Color */}
                <div className="flex items-center gap-2 flex-1">
                    <div
                        className="w-8 h-8 rounded-full shadow overflow-hidden border border-gray-300"
                        style={{ backgroundColor: currentImageBeingProcessed?.sourceColor || sourceColor }}
                    />
                    <div className="text-xs text-gray-700 truncate max-w-[80px]">
                        {currentImageBeingProcessed?.sourceColor || sourceColor}
                    </div>
                </div>

                {/* Target Color */}
                <div className="flex items-center gap-2 flex-1">
                    <input
                        type="color"
                        value={currentImageBeingProcessed?.targetColor || targetColor}
                        onChange={(e) => handleUpdateTargetColor(e.target.value)}
                        className="w-8 h-8 rounded-full shadow overflow-hidden border border-gray-300"
                        style={{ padding: 0 }}
                    />
                    <input
                        type="text"
                        value={currentImageBeingProcessed?.targetColor || targetColor}
                        onChange={handleTargetColorChange}
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        maxLength={7}
                        className="text-xs bg-gray-100 px-2 py-1 rounded w-20 text-gray-800 border border-transparent focus:outline-none focus:border-gray-300"
                    />
                </div>

                {/* Tolerance */}
                <div className="flex flex-col gap-0.5 items-center ml-2">
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-gray-700">{tolerance}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={currentImageBeingProcessed?.tolerance || tolerance}
                        onChange={(e) => handleUpdateTolerance(parseInt(e.target.value))}
                        className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                {/* Color Picker Button */}
                <button
                    onClick={() => setIsPickingColor(!isPickingColor)}
                    className={`ml-1 p-2 rounded-full ${isPickingColor ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} focus:outline-none`}
                >
                    <Pipette size={18} />
                </button>
            </div>

            {/* QuickBall with action buttons */}
            <QuickBall
                onPositionChange={setQuickBallPosition}
                onToggle={setIsQuickBallOpen}
            >
                {/* View Mode Toggle */}
                <button
                    onClick={toggleViewMode}
                    className="w-12 h-12 rounded-full bg-yellow-400 shadow-md flex items-center justify-center"
                    title={viewMode === 'live' ? 'Switch to canvas mode' : 'Switch to live mode'}
                >
                    {viewMode === 'live' ? <Sliders size={20} color="#000" /> : <Edit3 size={20} color="#000" />}
                </button>

                {/* Process Image Button */}
                <button
                    onClick={handleProcessImage}
                    disabled={isProcessing || !currentImageBeingProcessed}
                    className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center ${!currentImageBeingProcessed ? 'bg-gray-300 text-gray-500' : 'bg-lime-400 text-black'}`}
                >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-t-transparent border-black rounded-full animate-spin"></div>
                    ) : (
                        <RefreshCw size={20} />
                    )}
                </button>

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700"
                >
                    <X size={20} />
                </button>

                {/* Append Changes Button */}
                <button
                    onClick={handleAppendChange}
                    disabled={!activeDisplayImage || !activeDisplayImage.processed}
                    className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center ${!activeDisplayImage || !activeDisplayImage.processed ? 'bg-gray-300 text-gray-500' : 'bg-yellow-400 text-black'}`}
                >
                    <Plus size={20} />
                </button>

                {/* Done Button */}
                <button
                    onClick={handleDone}
                    disabled={!activeDisplayImage || !activeDisplayImage.processed}
                    className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center ${!activeDisplayImage || !activeDisplayImage.processed ? 'bg-gray-300 text-gray-500' : 'bg-indigo-600 text-white'}`}
                >
                    <Check size={20} />
                </button>

                {/* Download Button */}
                <button
                    onClick={() => handleDownload('selected')}
                    disabled={!activeDisplayImage || !activeDisplayImage.processed}
                    className={`w-12 h-12 rounded-full shadow-md flex items-center justify-center ${!activeDisplayImage || !activeDisplayImage.processed ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white'}`}
                >
                    <Download size={20} />
                </button>
            </QuickBall>

            {/* Section panels - only visible when selected */}
            {activeSection !== 'editor' && (
                <div className="absolute inset-0 bg-white z-50 pt-10">
                    {/* Back button for sections */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 bg-white border-b border-gray-200">
                        <button
                            onClick={() => setActiveSection('editor')}
                            className="p-2 text-gray-600 bg-gray-100 rounded-full"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-lg font-medium">
                            {activeSection === 'completed' ? 'Completed Images' : 'Image Queue'}
                        </h1>
                        <div className="w-10"></div> {/* Spacer for alignment */}
                    </div>

                    {/* Completed Images */}
                    {activeSection === 'completed' && (
                        <div className="p-3 grid grid-cols-2 gap-3 overflow-auto h-full">
                            {completedImages.map(img => (
                                <div
                                    key={img.id}
                                    className={`relative border rounded-lg overflow-hidden ${activeDisplayImage && activeDisplayImage.id === img.id ? 'border-lime-400 shadow' : 'border-gray-200'}`}
                                >
                                    <div
                                        className="relative pt-[100%] w-full cursor-pointer"
                                        onClick={() => handleSelectCompleted(img)}
                                    >
                                        <img
                                            src={img.processed || img.original}
                                            alt="Completed"
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />

                                        {/* Changes count badge */}
                                        {img.changesCount > 1 && (
                                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                                                {img.changesCount} changes
                                            </div>
                                        )}
                                    </div>

                                    {/* Redo button */}
                                    <button
                                        onClick={() => handleRedoImage(img.id)}
                                        className="absolute top-1 right-1 bg-gray-800/70 text-white flex items-center justify-center rounded text-xs px-2 py-1"
                                        title="Move back to queue for processing"
                                    >
                                        <Redo size={14} />
                                    </button>
                                </div>
                            ))}

                            {completedImages.length === 0 && (
                                <div className="col-span-2 text-gray-500 text-center py-12 px-4">
                                    No completed images yet
                                </div>
                            )}
                        </div>
                    )}

                    {/* Queue Section */}
                    {activeSection === 'queue' && (
                        <div className="p-3 grid grid-cols-2 gap-3 overflow-auto h-full">
                            {pendingImages.map((img, index) => (
                                <div
                                    key={img.id}
                                    className="relative border border-gray-200 rounded-lg overflow-hidden"
                                >
                                    <div className="relative pt-[100%] w-full">
                                        <img
                                            src={img.original}
                                            alt={`Queue ${index + 1}`}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />

                                        {/* Position indicator */}
                                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                                            Position: {index + 1}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {pendingImages.length === 0 && (
                                <div className="col-span-2 text-gray-500 text-center py-12 px-4">
                                    No images in queue
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Menu selector buttons */}
            <div className="absolute top-0 right-0 z-50 p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSectionView('queue')}
                        className={`p-2 rounded-full relative ${activeSection === 'queue' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
                        title="Image Queue"
                    >
                        <Edit3 size={20} />
                        {pendingImages.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {pendingImages.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => handleSectionView('completed')}
                        className={`p-2 rounded-full relative ${activeSection === 'completed' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
                        title="Completed Images"
                    >
                        <Check size={20} />
                        {completedImages.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                {completedImages.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Error/Success Toast Messages */}
            {error && (
                <div className={`fixed bottom-16 left-1/2 transform -translate-x-1/2 max-w-xs w-[calc(100%-2rem)] px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between ${error.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    <span className="text-sm">
                        {error.message || error}
                    </span>
                    <button
                        className={`ml-3 ${error.type === 'success' ? 'text-green-700' : 'text-red-700'} bg-transparent border-none text-xl font-bold leading-none`}
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Enhanced Color Picking Overlay */}
            {isPickingColor && (
                <div
                    className="absolute inset-0 z-50 cursor-crosshair"
                    onClick={handlePickColor}
                    onTouchStart={handlePickColor}
                >
                    <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded text-sm max-w-xs text-center pointer-events-none">
                        Tap anywhere on the image to select a color
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorChangerMobile;
