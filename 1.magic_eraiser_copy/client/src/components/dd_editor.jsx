import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, ToggleLeft, ToggleRight, Settings, Info } from 'lucide-react';

// Settings Dialog Component
const ColorizationSettingsDialog = ({ 
  onConfirm, 
  onCancel, 
  pendingImages, 
  defaultStrength = 1.0,
  defaultSaturation = 0.8
}) => {
  const [useIndividualSettings, setUseIndividualSettings] = useState(false);
  const [globalStrength, setGlobalStrength] = useState(defaultStrength);
  const [globalSaturation, setGlobalSaturation] = useState(defaultSaturation);
  const [individualSettings, setIndividualSettings] = useState(
    pendingImages.map(() => ({ strength: defaultStrength, saturation: defaultSaturation }))
  );

  const handleConfirm = () => {
    onConfirm({
      useIndividualSettings,
      globalStrength,
      globalSaturation,
      individualSettings
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Colorization Settings</h2>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useIndividualSettings"
                checked={useIndividualSettings}
                onChange={(e) => setUseIndividualSettings(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="useIndividualSettings" className="text-sm font-medium">
                Use different settings for each image
              </label>
            </div>
            <div className="group relative">
              <Info className="h-4 w-4 text-blue-500 cursor-help" />
              <div className="absolute right-0 mt-1 hidden group-hover:block bg-blue-50 p-2 rounded text-xs text-blue-800 shadow-md w-48">
                Adjust color strength and saturation for best results.
              </div>
            </div>
          </div>
          
          {!useIndividualSettings ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Color Strength: {globalStrength.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={globalStrength}
                  onChange={(e) => setGlobalStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Subtle</span>
                  <span>Balanced</span>
                  <span>Vivid</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Color Saturation: {globalSaturation.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={globalSaturation}
                  onChange={(e) => setGlobalSaturation(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Muted</span>
                  <span>Natural</span>
                  <span>Vibrant</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              <p className="text-sm text-gray-600">Set settings for each image:</p>
              {pendingImages.map((img, index) => (
                <div key={img.id} className="flex flex-col space-y-2 border rounded-md p-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-200 overflow-hidden rounded flex-shrink-0">
                      <img 
                        src={img.original} 
                        alt={`Image ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-sm font-medium">Image {index + 1}</div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Strength: {individualSettings[index].strength.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={individualSettings[index].strength}
                      onChange={(e) => {
                        const newSettings = [...individualSettings];
                        newSettings[index] = {
                          ...newSettings[index],
                          strength: parseFloat(e.target.value)
                        };
                        setIndividualSettings(newSettings);
                      }}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Saturation: {individualSettings[index].saturation.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.1"
                      value={individualSettings[index].saturation}
                      onChange={(e) => {
                        const newSettings = [...individualSettings];
                        newSettings[index] = {
                          ...newSettings[index],
                          saturation: parseFloat(e.target.value)
                        };
                        setIndividualSettings(newSettings);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Processing
          </button>
        </div>
      </div>
    </div>
  );
};

const ColorizationEditor = ({ 
  initialImage, 
  onReset, 
  imageIndex = 0, 
  totalImages = 1, 
  onImageComplete, 
  onNextImage, 
  onPreviousImage, 
  isBulkMode = false 
}) => {
    // UI state
    const [viewMode, setViewMode] = useState('live'); // 'live' or 'canvas'
    const [sliderPosition, setSliderPosition] = useState(50);
    const [strength, setStrength] = useState(1.0);
    const [saturation, setSaturation] = useState(0.8);
    const [error, setError] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    
    // Settings states
    const [showSettingsDialog, setShowSettingsDialog] = useState(true);
    const [useIndividualSettings, setUseIndividualSettings] = useState(false);
    const [individualSettings, setIndividualSettings] = useState([]);
    const [processingEnabled, setProcessingEnabled] = useState(false);
    
    // Image processing state
    const [pendingImages, setPendingImages] = useState([]);
    const [completedImages, setCompletedImages] = useState([]);
    const [activeDisplayImage, setActiveDisplayImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    
    // Refs
    const canvasRef = useRef(null);
    const originalImageRef = useRef(null);
    const colorizedImageRef = useRef(null);
    
    // Initialize queue when component loads
    useEffect(() => {
        if (Array.isArray(initialImage) && initialImage.length > 0) {
            const formattedQueue = initialImage.map((img, index) => ({
                id: `img-${Date.now()}-${index}`,
                original: img,
                colorized: null,
                isProcessing: false,
                strength: strength,
                saturation: saturation
            }));
            setPendingImages(formattedQueue);
            // Initialize individual settings with default values
            setIndividualSettings(formattedQueue.map(() => ({ strength, saturation })));
        } else if (initialImage) {
            const singleImage = {
                id: `img-${Date.now()}-0`,
                original: initialImage,
                colorized: null,
                isProcessing: false,
                strength: strength,
                saturation: saturation
            };
            setPendingImages([singleImage]);
            setIndividualSettings([{ strength, saturation }]);
        }
    }, [initialImage]);
    
    // Handle settings confirmation
    const handleSettingsConfirm = (settings) => {
        const { useIndividualSettings, globalStrength, globalSaturation, individualSettings } = settings;
        
        setUseIndividualSettings(useIndividualSettings);
        
        if (useIndividualSettings) {
            setIndividualSettings(individualSettings);
            // Update each image in the queue with its individual settings
            const updatedPending = pendingImages.map((img, index) => ({
                ...img,
                strength: individualSettings[index].strength,
                saturation: individualSettings[index].saturation
            }));
            setPendingImages(updatedPending);
        } else {
            // Set global settings and update all images to use them
            setStrength(globalStrength);
            setSaturation(globalSaturation);
            const updatedPending = pendingImages.map(img => ({
                ...img,
                strength: globalStrength,
                saturation: globalSaturation
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
                
                // Add the image's settings
                formData.append('strength', imageToProcess.strength.toString());
                formData.append('saturation', imageToProcess.saturation.toString());
                
                // Send to backend
                const apiResponse = await fetch('http://localhost:8000/colorize', {
                    method: 'POST',
                    body: formData,
                });
                
                if (!apiResponse.ok) {
                    throw new Error('Colorization failed');
                }
                
                const colorizedBlob = await apiResponse.blob();
                const colorizedUrl = URL.createObjectURL(colorizedBlob);
                
                // Create the completed image object
                const completedImage = {
                    id: imageToProcess.id,
                    original: imageToProcess.original,
                    colorized: colorizedUrl,
                    strength: imageToProcess.strength,
                    saturation: imageToProcess.saturation,
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
                
                // Call the parent's image complete callback if provided
                if (onImageComplete) {
                    onImageComplete(colorizedUrl);
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
    }, [pendingImages, isProcessing, viewMode, activeDisplayImage, processingEnabled]);
    
    // Handle slider mouse down
    const handleSliderMouseDown = (e) => {
        if (viewMode !== 'canvas') return;
        
        e.preventDefault();
        
        // Find the actual image element for more precise bounds
        const imageElement = colorizedImageRef.current;
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
        if (activeDisplayImage && activeDisplayImage.colorized) {
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
            const preloadColorized = new Image();
            
            let originalLoaded = false;
            let colorizedLoaded = false;
            
            const checkBothLoaded = () => {
                if (originalLoaded && colorizedLoaded) {
                    // Get intrinsic dimensions of both images
                    const maxNaturalWidth = Math.max(preloadOriginal.naturalWidth, preloadColorized.naturalWidth);
                    const maxNaturalHeight = Math.max(preloadOriginal.naturalHeight, preloadColorized.naturalHeight);
                    
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
            
            preloadColorized.onload = () => {
                colorizedLoaded = true;
                checkBothLoaded();
            };
            
            preloadOriginal.src = activeDisplayImage.original;
            preloadColorized.src = activeDisplayImage.colorized;
            
            // Handle window resize to recalculate available space
            const handleResize = () => {
                if (originalLoaded && colorizedLoaded) {
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
        if (colorizedImageRef.current) {
            const updateSliderDimensions = () => {
                // Force a re-render to update slider dimensions
                setImageDimensions(prev => ({...prev}));
            };
            
            // Check if image is already loaded
            if (colorizedImageRef.current.complete) {
                updateSliderDimensions();
            } else {
                // Set up load listener
                colorizedImageRef.current.addEventListener('load', updateSliderDimensions);
                return () => {
                    colorizedImageRef.current?.removeEventListener('load', updateSliderDimensions);
                };
            }
        }
    }, [activeDisplayImage, colorizedImageRef.current]);
    
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
            if (!activeDisplayImage || !activeDisplayImage.colorized) return;
            
            const link = document.createElement('a');
            link.href = activeDisplayImage.colorized;
            link.download = `colorized-${Date.now()}.png`;
            link.click();
        } else if (option === 'all') {
            // Create a zip file with all images
            completedImages.forEach((img, index) => {
                if (img.colorized) {
                    const link = document.createElement('a');
                    link.href = img.colorized;
                    link.download = `colorized-${index+1}-${Date.now()}.png`;
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
            {/* Settings Dialog */}
            {showSettingsDialog && pendingImages.length > 0 && (
                <ColorizationSettingsDialog
                    pendingImages={pendingImages}
                    defaultStrength={strength}
                    defaultSaturation={saturation}
                    onConfirm={handleSettingsConfirm}
                    onCancel={() => {
                        // If user cancels, just use default settings
                        setShowSettingsDialog(false);
                        setProcessingEnabled(true);
                    }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
                <button 
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <h1 className="text-2xl font-semibold">Image Colorization</h1>
                <div className="flex items-center gap-2">
                    {/* Settings button to reopen dialog */}
                    <button
                        onClick={handleOpenSettings}
                        disabled={pendingImages.length === 0}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    
                    <div className="relative">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                            disabled={completedImages.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        
                        {/* Download dropdown menu */}
                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                                <div className="py-1">
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleDownload('selected')}
                                        disabled={!activeDisplayImage || !activeDisplayImage.colorized}
                                    >
                                        Download Selected
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleDownload('all')}
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
                {/* Left Panel - Completed Images */}
                <div className="w-64 border-r overflow-y-auto p-4">
                    <h2 className="uppercase text-sm font-medium text-gray-500 mb-3">COMPLETED IMAGES</h2>
                    <div className="space-y-3">
                        {completedImages.map(img => (
                            <div 
                                key={img.id} 
                                className={`border rounded overflow-hidden cursor-pointer transition relative group ${
                                    activeDisplayImage && activeDisplayImage.id === img.id 
                                        ? 'border-blue-500 ring-2 ring-blue-200' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div 
                                    className="relative" 
                                    style={{ height: "120px", width: "100%" }}
                                    onClick={() => handleSelectCompleted(img)}
                                >
                                    <img 
                                        src={img.colorized} 
                                        alt="Colorized" 
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    {/* Display settings badge */}
                                    <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                                        S: {img.strength.toFixed(1)}
                                    </div>
                                </div>
                                {/* Delete button - only visible on hover using group-hover */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteImage(img.id);
                                    }}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-gray-800 bg-opacity-60 flex items-center justify-center text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <span className="text-xs">×</span>
                                </button>
                            </div>
                        ))}
                        
                        {completedImages.length === 0 && (
                            <div className="text-gray-400 text-sm text-center py-8">
                                No colorized images yet
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Center Panel - Canvas */}
                <div className="flex-1 flex flex-col">
                    {/* Mode Toggle Bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleViewMode}
                                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded border bg-white"
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
                        
                        <div className="text-sm text-gray-500">
                            {viewMode === 'live' 
                                ? 'Select image from completed images' 
                                : 'Use slider to compare before & after'}
                        </div>
                        
                        {/* Close dropdown when clicking outside */}
                        {showDownloadMenu && (
                            <div 
                                className="fixed inset-0 z-40" 
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
                                    {activeDisplayImage.colorized && (
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
                                                
                                                {/* Colorized Image with clip mask for slider */}
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
                                                        ref={colorizedImageRef}
                                                        src={activeDisplayImage.colorized} 
                                                        alt="Colorized" 
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
                
                {/* Right Panel - Queue and Settings */}
                <div className="w-64 border-l flex flex-col">
                    {/* Settings */}
                    <div className="p-4 border-b">
                        <h2 className="uppercase text-sm font-medium text-gray-500 mb-3">CURRENT SETTINGS</h2>
                        <div>
                            {useIndividualSettings ? (
                                <div className="text-sm">
                                    <span className="font-medium">Mode:</span> Individual settings
                                    <div className="mt-2 text-xs text-gray-500">
                                        Each image has its own color settings
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-sm">
                                        <span className="font-medium">Mode:</span> Global settings
                                    </div>
                                    <div className="mt-1">
                                        <label className="text-sm font-medium block mb-1">
                                            Color Strength: {strength.toFixed(1)}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.1"
                                            value={strength}
                                            onChange={(e) => {
                                                const newStrength = parseFloat(e.target.value);
                                                setStrength(newStrength);
                                                // Update all pending images with the new strength
                                                if (!useIndividualSettings && pendingImages.length > 0) {
                                                    const updatedPending = pendingImages.map(img => ({
                                                        ...img,
                                                        strength: newStrength
                                                    }));
                                                    setPendingImages(updatedPending);
                                                }
                                            }}
                                            className="w-full"
                                            disabled={useIndividualSettings}
                                        />
                                    </div>
                                    <div className="mt-1">
                                        <label className="text-sm font-medium block mb-1">
                                            Saturation: {saturation.toFixed(1)}
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1.5"
                                            step="0.1"
                                            value={saturation}
                                            onChange={(e) => {
                                                const newSaturation = parseFloat(e.target.value);
                                                setSaturation(newSaturation);
                                                // Update all pending images with the new saturation
                                                if (!useIndividualSettings && pendingImages.length > 0) {
                                                    const updatedPending = pendingImages.map(img => ({
                                                        ...img,
                                                        saturation: newSaturation
                                                    }));
                                                    setPendingImages(updatedPending);
                                                }
                                            }}
                                            className="w-full"
                                            disabled={useIndividualSettings}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Queue */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <h2 className="uppercase text-sm font-medium text-gray-500 mb-3">
                            QUEUE ({pendingImages.length})
                        </h2>
                        <div className="space-y-3">
                            {pendingImages.map((img, index) => (
                                <div 
                                    key={img.id}
                                    className={`border rounded overflow-hidden relative ${
                                        img.isProcessing 
                                            ? 'border-green-500' 
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className="relative" style={{ height: "120px", width: "100%" }}>
                                        <img 
                                            src={img.original} 
                                            alt={`Queue ${index + 1}`} 
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                        {/* Display settings badge */}
                                        <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                                            S: {img.strength.toFixed(1)}
                                        </div>
                                    </div>
                                    {img.isProcessing && (
                                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                            <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                                                Processing...
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {pendingImages.length === 0 && (
                                <div className="text-gray-400 text-sm text-center py-8">
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
                        ×
                    </button>
                </div>
            )}
        </div>
    );
};

export default ColorizationEditor;