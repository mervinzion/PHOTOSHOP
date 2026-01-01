import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, ToggleLeft, ToggleRight, Settings, Info } from 'lucide-react';
import EnhanceMobile from './Enhance_Mobile';

// Style Injector Component to ensure our styles aren't overridden
const StyleInjector = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #settings-dialog-container {
        background-color: rgba(0, 0, 0, 0.5) !important;
      }
      
      #settings-title,
      #settings-dialog label,
      .dialog-text,
      #app-title,
      #mode-label,
      #scale-label,
      #completed-images-title,
      #no-images-text,
      #download-button,
      #mode-toggle-button {
        font-weight: 500 !important;
        color: #000000 !important;
      }
      
      #settings-dialog *,
      #mode-toggle-button *,
      #download-button * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  return null;
};

// New Settings Dialog Component with Direct HTML approach
const EnhanceSettingsDialog = ({ 
  onConfirm, 
  onCancel, 
  pendingImages, 
  defaultScale = 2.0 
}) => {
  const [useIndividualScales, setUseIndividualScales] = useState(false);
  const [globalScale, setGlobalScale] = useState(defaultScale);
  const [individualScales, setIndividualScales] = useState(
    pendingImages.map(() => defaultScale)
  );

  const handleConfirm = () => {
    onConfirm({
      useIndividualScales,
      globalScale,
      individualScales
    });
  };

  // Using direct HTML elements instead of div with className
  return (
    <table id="settings-dialog-container" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      background: 'rgba(0, 0, 0, 0.5)', // Transparent black
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      width: '100%',
      height: '100%'
    }}>
      <tbody>
        <tr>
          <td style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            <div id="settings-dialog" style={{
              background: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '32rem'
            }}>
              {/* Title with explicit styling */}
              <h2 id="settings-title" style={{
                fontSize: '1.25rem',
                lineHeight: '1.75rem',
                fontWeight: 500, // As requested
                marginBottom: '1rem',
                color: '#000000', // Force black color
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
              }}>Enhancement Settings</h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      id="useIndividualScales"
                      checked={useIndividualScales}
                      onChange={(e) => setUseIndividualScales(e.target.checked)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {/* Checkbox label with explicit styling */}
                    <label htmlFor="useIndividualScales" style={{
                      fontSize: '0.875rem',
                      fontWeight: 500, // As requested
                      color: '#000000', // Force black color
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
                      Use different scale factors for each image
                    </label>
                  </div>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Info className="h-4 w-4 text-blue-500 cursor-help" />
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '0.25rem',
                      display: 'none',
                      background: '#EBF5FF',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#1E40AF',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      width: '12rem'
                    }} className="group-hover:block">
                      Higher scale factors produce better quality but take longer to process.
                    </div>
                  </div>
                </div>
                
                {!useIndividualScales ? (
                  <div>
                    {/* Scale factor label with explicit styling */}
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500, // As requested
                      marginBottom: '0.25rem',
                      color: '#000000', // Force black color
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
                      Scale Factor for All Images: {globalScale}x
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.5"
                      value={globalScale}
                      onChange={(e) => setGlobalScale(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '0.75rem', 
                      color: '#6B7280',
                      marginTop: '0.25rem'
                    }}>
                      <span>1x</span>
                      <span>2x</span>
                      <span>3x</span>
                      <span>4x</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    marginTop: '1rem',
                    maxHeight: '16rem',
                    overflowY: 'auto',
                    paddingRight: '0.5rem'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#4B5563',
                      fontWeight: 500, // As requested
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }} className="dialog-text">Set scale factor for each image:</p>
                    {pendingImages.map((img, index) => (
                      <div key={img.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{
                          width: '4rem',
                          height: '4rem',
                          background: '#E5E7EB',
                          overflow: 'hidden',
                          borderRadius: '0.25rem',
                          flexShrink: 0
                        }}>
                          <img 
                            src={img.original} 
                            alt={`Image ${index + 1}`} 
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500, // As requested
                            marginBottom: '0.25rem',
                            color: '#000000', // Force black color
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            Image {index + 1}: {individualScales[index]}x
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="4"
                            step="0.5"
                            value={individualScales[index]}
                            onChange={(e) => {
                              const newScales = [...individualScales];
                              newScales[index] = parseFloat(e.target.value);
                              setIndividualScales(newScales);
                            }}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '0.75rem' 
              }}>
                <button
                  onClick={onCancel}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.25rem',
                    color: '#374151',
                    fontWeight: 500,
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563EB',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                >
                  Start Processing
                </button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

// Desktop Enhance Editor Component (original)
const EnhanceEditorDesktop = ({ initialImage, onReset }) => {
    // Add the StyleInjector at the top level to ensure styles are applied
    
    // UI state
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'canvas'
    const [sliderPosition, setSliderPosition] = useState(50);
    const [scale, setScale] = useState(2.0);
    const [error, setError] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    
    // New settings states
    const [showSettingsDialog, setShowSettingsDialog] = useState(true);
    const [useIndividualScales, setUseIndividualScales] = useState(false);
    const [individualScales, setIndividualScales] = useState([]);
    const [processingEnabled, setProcessingEnabled] = useState(false);
    
    // Image processing state
    const [pendingImages, setPendingImages] = useState([]);
    const [completedImages, setCompletedImages] = useState([]);
    const [currentProcessingIndex, setCurrentProcessingIndex] = useState(null);
    const [activeDisplayImage, setActiveDisplayImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    
    // Refs
    const canvasRef = useRef(null);
    const originalImageRef = useRef(null);
    const processedImageRef = useRef(null);
    
    // Initialize queue when component loads
    useEffect(() => {
        if (Array.isArray(initialImage) && initialImage.length > 0) {
            const formattedQueue = initialImage.map((img, index) => ({
                id: `img-${Date.now()}-${index}`,
                original: img,
                processed: null,
                isProcessing: false,
                scale: scale // Default scale will be overridden by settings dialog
            }));
            setPendingImages(formattedQueue);
            // Initialize individual scales with default values
            setIndividualScales(formattedQueue.map(() => scale));
        } else if (initialImage) {
            const singleImage = {
                id: `img-${Date.now()}-0`,
                original: initialImage,
                processed: null,
                isProcessing: false,
                scale: scale
            };
            setPendingImages([singleImage]);
            setIndividualScales([scale]);
        }
    }, [initialImage]);
    
    // Handle settings confirmation
    const handleSettingsConfirm = (settings) => {
        const { useIndividualScales, globalScale, individualScales } = settings;
        
        setUseIndividualScales(useIndividualScales);
        
        if (useIndividualScales) {
            setIndividualScales(individualScales);
            // Update each image in the queue with its individual scale
            const updatedPending = pendingImages.map((img, index) => ({
                ...img,
                scale: individualScales[index]
            }));
            setPendingImages(updatedPending);
        } else {
            // Set global scale and update all images to use it
            setScale(globalScale);
            const updatedPending = pendingImages.map(img => ({
                ...img,
                scale: globalScale
            }));
            setPendingImages(updatedPending);
        }
        
        // Close dialog and enable processing
        setShowSettingsDialog(false);
        setProcessingEnabled(true);
    };
    
    // Process next image whenever the queue or processing state changes
    useEffect(() => {
        const processNextImage = async () => {
            // If processing is not enabled yet, don't do anything
            if (!processingEnabled) {
                return;
            }
            
            // If already processing or no images to process, don't do anything
            if (isProcessing || pendingImages.length === 0) {
                return;
            }
            
            // Start processing the first image in the queue
            setIsProcessing(true);
            const imageToProcess = pendingImages[0];
            
            // Update the pending image to show it's being processed
            const updatedPending = [...pendingImages];
            updatedPending[0] = { ...updatedPending[0], isProcessing: true };
            setPendingImages(updatedPending);
            
            try {
                // Convert base64 to blob
                const response = await fetch(imageToProcess.original);
                const blob = await response.blob();
                
                // Create form data
                const formData = new FormData();
                formData.append('file', blob, 'image.png');
                
                // Use the image's individual scale if available, otherwise use global scale
                const scaleToUse = imageToProcess.scale || scale;
                formData.append('scale', scaleToUse);
                
                // Send to backend
                const apiResponse = await fetch('http://localhost:8000/enhance/', {
                    method: 'POST',
                    body: formData,
                });
                
                if (!apiResponse.ok) {
                    throw new Error('Enhancement failed');
                }
                
                const processedBlob = await apiResponse.blob();
                const processedUrl = URL.createObjectURL(processedBlob);
                
                // Create the completed image object
                const completedImage = {
                    id: imageToProcess.id,
                    original: imageToProcess.original,
                    processed: processedUrl,
                    scale: scaleToUse, // Store which scale was used
                    timestamp: Date.now()
                };
                
                // Add to completed images
                setCompletedImages(prev => [...prev, completedImage]);
                
                // Remove from pending queue
                setPendingImages(prev => prev.slice(1));
                
                // Set as active display image if no active image yet or in live mode
                if (!activeDisplayImage || viewMode === 'live') {
                    setActiveDisplayImage(completedImage);
                }
                
            } catch (err) {
                console.error('Processing error:', err);
                setError(`Error: ${err.message}`);
                
                // Remove the failed image from queue
                setPendingImages(prev => prev.slice(1));
            } finally {
                setIsProcessing(false);
            }
        };
        
        processNextImage();
    }, [pendingImages, isProcessing, scale, viewMode, activeDisplayImage, processingEnabled]);
    
    // Handle slider mouse down
    const handleSliderMouseDown = (e) => {
        if (viewMode !== 'canvas') return;
        
        e.preventDefault();
        
        // Find the actual image element for more precise bounds
        const imageElement = processedImageRef.current;
        if (!imageElement) return;
        
        // Get the image's actual dimensions and position
        const imageRect = imageElement.getBoundingClientRect();
        
        // Check if click is within the image bounds (no tolerance)
        if (
            e.clientX < imageRect.left || 
            e.clientX > imageRect.right || 
            e.clientY < imageRect.top || 
            e.clientY > imageRect.bottom
        ) return;
        
        // Get initial position
        const initialX = e.clientX;
        const initialPosition = sliderPosition;
        
        // Define mouse move handler
        const handleMouseMove = (moveEvent) => {
            // Only respond to mouse moves if they're within the image horizontally
            if (moveEvent.clientX < imageRect.left || moveEvent.clientX > imageRect.right) return;
            
            // Calculate how far the mouse has moved as a percentage of image width
            const deltaX = moveEvent.clientX - initialX;
            const percentageDelta = (deltaX / imageRect.width) * 100;
            
            // Calculate new position, clamped between 0-100%
            const newPosition = Math.max(0, Math.min(100, initialPosition + percentageDelta));
            setSliderPosition(newPosition);
        };
        
        // Define mouse up handler to clean up
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        // Add event listeners for dragging
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
    
    // Load and cache images to ensure consistent size
    useEffect(() => {
        if (activeDisplayImage && activeDisplayImage.processed) {
            // Reset dimensions before reloading to avoid stale state
            setImageDimensions({ width: 0, height: 0 });
            
            // Calculate the available space for the image
            const calculateAvailableSpace = () => {
                if (canvasRef.current) {
                    const containerRect = canvasRef.current.getBoundingClientRect();
                    const availableWidth = containerRect.width * 0.95; // 95% of container width
                    const availableHeight = containerRect.height * 0.95; // 95% of container height
                    return { width: availableWidth, height: availableHeight };
                }
                return { width: 0, height: 0 };
            };
            
            // Preload both images to get dimensions
            const preloadOriginal = new Image();
            const preloadProcessed = new Image();
            
            let originalLoaded = false;
            let processedLoaded = false;
            
            const checkBothLoaded = () => {
                if (originalLoaded && processedLoaded) {
                    // Get intrinsic dimensions of both images
                    const maxNaturalWidth = Math.max(preloadOriginal.naturalWidth, preloadProcessed.naturalWidth);
                    const maxNaturalHeight = Math.max(preloadOriginal.naturalHeight, preloadProcessed.naturalHeight);
                    
                    // Calculate aspect ratio
                    const aspectRatio = maxNaturalWidth / maxNaturalHeight;
                    
                    // Get available space
                    const availableSpace = calculateAvailableSpace();
                    
                    // Calculate dimensions to fit within available space while maintaining aspect ratio
                    let finalWidth, finalHeight;
                    
                    if (maxNaturalWidth > availableSpace.width || maxNaturalHeight > availableSpace.height) {
                        // Image is larger than available space, need to scale down
                        const widthRatio = availableSpace.width / maxNaturalWidth;
                        const heightRatio = availableSpace.height / maxNaturalHeight;
                        
                        // Use the smaller ratio to ensure image fits within bounds
                        const scaleFactor = Math.min(widthRatio, heightRatio);
                        
                        finalWidth = maxNaturalWidth * scaleFactor;
                        finalHeight = maxNaturalHeight * scaleFactor;
                    } else {
                        // Image is smaller than available space, use natural dimensions
                        finalWidth = maxNaturalWidth;
                        finalHeight = maxNaturalHeight;
                    }
                    
                    setImageDimensions({
                        width: finalWidth,
                        height: finalHeight,
                        aspectRatio: aspectRatio
                    });
                }
            };
            
            preloadOriginal.onload = () => {
                originalLoaded = true;
                checkBothLoaded();
            };
            
            preloadProcessed.onload = () => {
                processedLoaded = true;
                checkBothLoaded();
            };
            
            preloadOriginal.src = activeDisplayImage.original;
            preloadProcessed.src = activeDisplayImage.processed;
            
            // Handle window resize to recalculate available space
            const handleResize = () => {
                if (originalLoaded && processedLoaded) {
                    checkBothLoaded();
                }
            };
            
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [activeDisplayImage]);

    // Monitoring for actual image dimensions
    useEffect(() => {
        // Create a resize observer to update slider dimensions when image loads
        if (processedImageRef.current) {
            const updateSliderDimensions = () => {
                // Force a re-render to update slider dimensions
                setImageDimensions(prev => ({...prev}));
            };
            
            // Check if image is already loaded
            if (processedImageRef.current.complete) {
                updateSliderDimensions();
            } else {
                // Set up load listener
                processedImageRef.current.addEventListener('load', updateSliderDimensions);
                return () => {
                    processedImageRef.current?.removeEventListener('load', updateSliderDimensions);
                };
            }
        }
    }, [activeDisplayImage, processedImageRef.current]);
    
    // Delete an image from completed images
    const handleDeleteImage = (imageId) => {
        // Remove the image from the completed images array
        const newCompletedImages = completedImages.filter(img => img.id !== imageId);
        setCompletedImages(newCompletedImages);
        
        // If the active image is the one being deleted, set a new active image
        if (activeDisplayImage && activeDisplayImage.id === imageId) {
            if (newCompletedImages.length > 0) {
                setActiveDisplayImage(newCompletedImages[0]);
            } else {
                setActiveDisplayImage(null);
            }
        }
    };
    
    // Download images (selected or all)
    const handleDownload = (option = 'selected') => {
        setShowDownloadMenu(false);
        
        if (option === 'selected') {
            if (!activeDisplayImage || !activeDisplayImage.processed) return;
            
            const link = document.createElement('a');
            link.href = activeDisplayImage.processed;
            link.download = `enhanced-${Date.now()}.png`;
            link.click();
        } else if (option === 'all') {
            // Create a zip file with all images
            completedImages.forEach((img, index) => {
                if (img.processed) {
                    const link = document.createElement('a');
                    link.href = img.processed;
                    link.download = `enhanced-${index+1}-${Date.now()}.png`;
                    // Small delay between downloads to avoid browser issues
                    setTimeout(() => {
                        link.click();
                    }, index * 100);
                }
            });
        }
    };

    // Select a completed image - Now works in both modes
    const handleSelectCompleted = (img) => {
        // Allow selection in both live and canvas modes
        setActiveDisplayImage(img);
    };
    
    // Toggle view mode
    const toggleViewMode = () => {
        const newMode = viewMode === 'live' ? 'canvas' : 'live';
        setViewMode(newMode);
    };

    // Re-open settings
    const handleOpenSettings = () => {
        setShowSettingsDialog(true);
        setProcessingEnabled(false);
    };
    
    return (
        <div className="fixed inset-0 bg-white">
            {/* Add the StyleInjector to ensure our styles are applied */}
            <StyleInjector />
            
            {/* Settings Dialog */}
            {showSettingsDialog && pendingImages.length > 0 && (
                <EnhanceSettingsDialog
                    pendingImages={pendingImages}
                    defaultScale={scale}
                    onConfirm={handleSettingsConfirm}
                    onCancel={() => {
                        // If user cancels, just use default settings
                        setShowSettingsDialog(false);
                        setProcessingEnabled(true);
                    }}
                />
            )}

            {/* Header with Direct HTML */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderBottom: '1px solid #E5E7EB'
            }}>
                <button 
                    onClick={onReset}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        color: '#4B5563',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                
                {/* Title with direct HTML */}
                <h1 id="app-title" style={{
                    fontSize: '1.5rem',
                    lineHeight: '2rem',
                    fontWeight: 500,
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>GFPGAN Face Enhancement</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Settings button */}
                    <button
                        onClick={handleOpenSettings}
                        disabled={pendingImages.length === 0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            color: '#4B5563',
                            borderRadius: '0.25rem',
                            cursor: pendingImages.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: pendingImages.length === 0 ? 0.5 : 1
                        }}
                        onMouseOver={(e) => {
                            if (pendingImages.length > 0) {
                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    
                    {/* Download button with direct HTML */}
                    <div style={{ position: 'relative' }}>
                        <button
                            id="download-button"
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            disabled={completedImages.length === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                color: '#4B5563',
                                borderRadius: '0.25rem',
                                cursor: completedImages.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: completedImages.length === 0 ? 0.5 : 1,
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                            onMouseOver={(e) => {
                                if (completedImages.length > 0) {
                                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        
                        {/* Download dropdown menu */}
                        {showDownloadMenu && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                marginTop: '0.5rem',
                                width: '12rem',
                                backgroundColor: 'white',
                                borderRadius: '0.375rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                zIndex: 50
                            }}>
                                <div style={{ padding: '0.25rem 0' }}>
                                    <button
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            color: '#374151',
                                            cursor: !activeDisplayImage || !activeDisplayImage.processed ? 'not-allowed' : 'pointer',
                                            opacity: !activeDisplayImage || !activeDisplayImage.processed ? 0.5 : 1
                                        }}
                                        onClick={() => handleDownload('selected')}
                                        disabled={!activeDisplayImage || !activeDisplayImage.processed}
                                        onMouseOver={(e) => {
                                            if (activeDisplayImage && activeDisplayImage.processed) {
                                                e.currentTarget.style.backgroundColor = '#F9FAFB';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        Download Selected
                                    </button>
                                    <button
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            color: '#374151',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleDownload('all')}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Download All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Main Layout */}
            <div className="flex h-[calc(100vh-72px)]">
                {/* Left Panel - Completed Images with Direct HTML */}
                <div style={{
                    width: '16rem',
                    borderRight: '1px solid #E5E7EB',
                    overflowY: 'auto',
                    padding: '1rem'
                }}>
                    {/* Title with direct HTML */}
                    <h2 id="completed-images-title" style={{
                        textTransform: 'uppercase',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#000000',
                        marginBottom: '0.75rem',
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>COMPLETED IMAGES</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {completedImages.map(img => (
                            <div 
                                key={img.id} 
                                style={{
                                    border: activeDisplayImage && activeDisplayImage.id === img.id 
                                        ? '1px solid #3B82F6' 
                                        : '1px solid #E5E7EB',
                                    borderRadius: '0.25rem',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    boxShadow: activeDisplayImage && activeDisplayImage.id === img.id 
                                        ? '0 0 0 2px rgba(59, 130, 246, 0.2)' 
                                        : 'none'
                                }}
                                onMouseOver={(e) => {
                                    if (!(activeDisplayImage && activeDisplayImage.id === img.id)) {
                                        e.currentTarget.style.borderColor = '#D1D5DB';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!(activeDisplayImage && activeDisplayImage.id === img.id)) {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }
                                }}
                            >
                                <div 
                                    style={{ 
                                        position: 'relative',
                                        height: '120px',
                                        width: '100%'
                                    }}
                                    onClick={() => handleSelectCompleted(img)}
                                >
                                    <img 
                                        src={img.processed} 
                                        alt="Completed" 
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                    {/* Display scale badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '0.25rem',
                                        left: '0.25rem',
                                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        padding: '0 0.375rem',
                                        borderRadius: '0.125rem'
                                    }}>
                                        {img.scale}x
                                    </div>
                                </div>
                                {/* Delete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteImage(img.id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '0.25rem',
                                        right: '0.25rem',
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        borderRadius: '9999px',
                                        backgroundColor: 'rgba(31, 41, 55, 0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        cursor: 'pointer',
                                        opacity: 0,
                                        transition: 'opacity 0.2s, background-color 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.6)'}
                                    className="group-hover:opacity-100"
                                >
                                    <span style={{ fontSize: '0.75rem' }}>×</span>
                                </button>
                            </div>
                        ))}
                        
                        {completedImages.length === 0 && (
                            <div id="no-images-text" style={{
                                color: '#000000',
                                fontSize: '0.875rem',
                                textAlign: 'center',
                                padding: '2rem 0',
                                fontWeight: 500,
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}>
                                No processed images yet
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Center Panel - Canvas */}
                <div className="flex-1 flex flex-col">
                    {/* Mode Toggle Bar with Direct HTML */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 1rem',
                        borderBottom: '1px solid #E5E7EB',
                        backgroundColor: '#F9FAFB'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Mode toggle button with direct HTML */}
                            <button
                                id="mode-toggle-button"
                                onClick={toggleViewMode}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '0.25rem',
                                    border: '1px solid #E5E7EB',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    color: '#000000',
                                    fontWeight: 500,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}
                            >
                                {viewMode === 'live' ? (
                                    <>
                                        <ToggleLeft className="h-4 w-4" />
                                        Live Mode
                                    </>
                                ) : (
                                    <>
                                        <ToggleRight className="h-4 w-4" />
                                        Canvas Mode
                                    </>
                                )}
                            </button>
                        </div>
                        
                        <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#6B7280' 
                        }}>
                            {viewMode === 'live' 
                                ? 'Select image from completed images' 
                                : 'Use slider to compare before & after'}
                        </div>
                        
                        {/* Close dropdown when clicking outside */}
                        {showDownloadMenu && (
                            <div 
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 40
                                }}
                                onClick={() => setShowDownloadMenu(false)}
                            ></div>
                        )}
                    </div>
                    
                    {/* Canvas Area */}
                    <div className="flex-1 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                        {activeDisplayImage ? (
                            <div 
                                ref={canvasRef}
                                className="relative overflow-hidden flex items-center justify-center m-2"
                                style={{ 
                                    width: '100%',
                                    height: 'calc(100% - 16px)',
                                    position: 'relative'
                                }}
                            >
                                {/* Image container - ensures both images have identical dimensions */}
                                <div className="relative flex items-center justify-center h-full w-full">
                                    {activeDisplayImage.processed && (
                                        <div 
                                            className="relative image-container flex-shrink-0" 
                                            style={{
                                                maxWidth: '95%',
                                                maxHeight: '95%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <div className="relative image-content-wrapper" style={{
                                                width: imageDimensions.width > 0 ? `${imageDimensions.width}px` : 'auto',
                                                height: imageDimensions.height > 0 ? `${imageDimensions.height}px` : 'auto',
                                                position: 'relative'
                                            }}>
                                                <img 
                                                    ref={originalImageRef}
                                                    src={activeDisplayImage.original} 
                                                    alt="Original" 
                                                    className="absolute top-0 left-0 w-full h-full object-contain"
                                                    style={{ 
                                                        pointerEvents: 'none',
                                                        display: viewMode === 'live' ? 'none' : 'block',
                                                        zIndex: 10
                                                    }}
                                                />
                                                
                                                {/* Processed Image with clip mask for slider */}
                                                <div 
                                                    className="absolute top-0 left-0 w-full h-full overflow-hidden"
                                                    style={{
                                                        clipPath: viewMode === 'canvas' 
                                                            ? `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                                                            : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                                                        pointerEvents: 'none',
                                                        zIndex: 20
                                                    }}
                                                >
                                                    <img 
                                                        ref={processedImageRef}
                                                        src={activeDisplayImage.processed} 
                                                        alt="Processed" 
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                
                                                {/* Slider elements - only in canvas mode */}
                                                {viewMode === 'canvas' && (
                                                    <>
                                                        {/* Slider Line */}
                                                        <div 
                                                            className="absolute w-0.5 bg-white shadow-sm"
                                                            style={{ 
                                                                left: `${sliderPosition}%`,
                                                                pointerEvents: 'none',
                                                                top: 0,
                                                                height: '100%',
                                                                zIndex: 30
                                                            }}
                                                        />
                                                        
                                                        {/* Slider Handle - this is what user interacts with */}
                                                        <div 
                                                            className="absolute cursor-ew-resize"
                                                            style={{ 
                                                                left: `${sliderPosition}%`,
                                                                width: '20px',
                                                                transform: 'translateX(-10px)',
                                                                pointerEvents: 'auto',
                                                                top: 0,
                                                                height: '100%',
                                                                zIndex: 40
                                                            }}
                                                            onMouseDown={handleSliderMouseDown}
                                                        >
                                                            {/* Sleek minimal slider handle */}
                                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md border border-gray-300 flex items-center justify-center">
                                                                <div className="w-0.5 h-3 bg-gray-400 rounded-full"></div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500">
                                {pendingImages.length > 0 
                                    ? (processingEnabled ? 'Processing images...' : 'Configure settings to start processing') 
                                    : 'No images available'}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Right Panel - Queue and Settings with Direct HTML */}
                <div style={{
                    width: '16rem',
                    borderLeft: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Settings with Direct HTML */}
                    <div style={{
                        padding: '1rem',
                        borderBottom: '1px solid #E5E7EB'
                    }}>
                        <h2 style={{
                            textTransform: 'uppercase',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '0.75rem'
                        }}>CURRENT SETTINGS</h2>
                        
                        <div>
                            {useIndividualScales ? (
                                <div style={{ fontSize: '0.875rem' }}>
                                    <span id="mode-label" style={{
                                        fontWeight: 500,
                                        color: '#000000',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>Mode:</span> <span id="mode-label">Individual scales</span>
                                    <div style={{
                                        marginTop: '0.5rem',
                                        fontSize: '0.75rem',
                                        color: '#6B7280'
                                    }}>
                                        Each image has its own scale factor
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '0.875rem' }}>
                                        <span id="mode-label" style={{
                                            fontWeight: 500,
                                            color: '#000000',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                        }}>Mode:</span> <span id="mode-label">Global scale</span>
                                    </div>
                                    <div style={{ marginTop: '0.25rem' }}>
                                        <label id="scale-label" style={{
                                            display: 'block',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#000000',
                                            marginBottom: '0.25rem',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                        }}>
                                            Scale Factor: {scale}x
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="4"
                                            step="0.5"
                                            value={scale}
                                            onChange={(e) => {
                                                const newScale = parseFloat(e.target.value);
                                                setScale(newScale);
                                                // Update all pending images with the new scale
                                                if (!useIndividualScales && pendingImages.length > 0) {
                                                    const updatedPending = pendingImages.map(img => ({
                                                        ...img,
                                                        scale: newScale
                                                    }));
                                                    setPendingImages(updatedPending);
                                                }
                                            }}
                                            style={{
                                                width: '100%'
                                            }}
                                            disabled={useIndividualScales}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Queue */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem'
                    }}>
                        <h2 style={{
                            textTransform: 'uppercase',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '0.75rem'
                        }}>
                            QUEUE ({pendingImages.length})
                        </h2>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            {pendingImages.map((img, index) => (
                                <div 
                                    key={img.id}
                                    style={{
                                        border: img.isProcessing 
                                            ? '1px solid #10B981' 
                                            : '1px solid #E5E7EB',
                                        borderRadius: '0.25rem',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ 
                                        position: 'relative',
                                        height: '120px',
                                        width: '100%'
                                    }}>
                                        <img 
                                            src={img.original} 
                                            alt={`Queue ${index + 1}`} 
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        {/* Display scale badge */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '0.25rem',
                                            left: '0.25rem',
                                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            padding: '0 0.375rem',
                                            borderRadius: '0.125rem'
                                        }}>
                                            {img.scale}x
                                        </div>
                                    </div>
                                    {img.isProcessing && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{
                                                backgroundColor: '#10B981',
                                                color: 'white',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem'
                                            }}>
                                                Processing...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {pendingImages.length === 0 && (
                                <div style={{
                                    color: '#9CA3AF',
                                    fontSize: '0.875rem',
                                    textAlign: 'center',
                                    padding: '2rem 0'
                                }}>
                                    All images processed
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Error Message */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
                    {error}
                    <button 
                        className="ml-4 text-red-700" 
                        onClick={() => setError(null)}
                    >
                        
                    </button>
                </div>
            )}
        </div>
    );
};

// Responsive wrapper component to conditionally render mobile or desktop version
const EnhanceEditor = ({ initialImage, onReset }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Common breakpoint for tablet/mobile
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Render the appropriate component based on screen size
  return isMobile ? 
    <EnhanceMobile initialImage={initialImage} onReset={onReset} /> : 
    <EnhanceEditorDesktop initialImage={initialImage} onReset={onReset} />;
};

export default EnhanceEditor;