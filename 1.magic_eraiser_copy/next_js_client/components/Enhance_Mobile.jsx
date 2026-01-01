import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, ToggleLeft, ToggleRight, Settings, Info, Image as ImageIcon, Clock, X } from 'lucide-react';

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
      #mode-toggle-button,
      .tab-button,
      .mobile-section-title {
        font-weight: 500 !important;
        color: #000000 !important;
      }
      
      #settings-dialog *,
      #mode-toggle-button *,
      #download-button * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }

      /* Mobile-specific styles */
      .mobile-tab-active {
        color: #2563EB !important;
        border-bottom: 2px solid #2563EB !important;
      }

      /* Touch-friendly slider handle */
      .slider-handle {
        width: 36px !important;
        height: 36px !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  return null;
};

// Settings Dialog for Mobile
const EnhanceMobileSettingsDialog = ({ 
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

  return (
    <div id="settings-dialog-container" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      width: '100%',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        padding: '1rem'
      }}>
        <div id="settings-dialog" style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '1.25rem',
          width: '100%',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}>
          {/* Title */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 id="settings-title" style={{
              fontSize: '1.25rem',
              lineHeight: '1.75rem',
              fontWeight: 500,
              color: '#000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>Enhancement Settings</h2>
            <button 
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                lineHeight: '1',
                padding: '0.25rem',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              <X size={20} />
            </button>
          </div>
          
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
                  style={{ marginRight: '0.5rem', width: '20px', height: '20px' }}
                />
                {/* Checkbox label */}
                <label htmlFor="useIndividualScales" style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#000000',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Use different scale factors
                </label>
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Info size={18} color="#3B82F6" />
              </div>
            </div>
            
            {!useIndividualScales ? (
              <div>
                {/* Scale factor label */}
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginBottom: '0.25rem',
                  color: '#000000',
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
                  style={{ width: '100%', height: '24px' }}
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
                maxHeight: '50vh',
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#4B5563',
                  fontWeight: 500,
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
                      width: '3.5rem',
                      height: '3.5rem',
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
                        fontWeight: 500,
                        marginBottom: '0.25rem',
                        color: '#000000',
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
                        style={{ width: '100%', height: '24px' }}
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
                padding: '0.75rem 1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.25rem',
                color: '#374151',
                fontWeight: 500,
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onTouchEnd={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#2563EB',
                color: 'white',
                borderRadius: '0.25rem',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              onTouchStart={(e) => e.currentTarget.style.backgroundColor = '#1D4ED8'}
              onTouchEnd={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            >
              Start Processing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhanceMobile = ({ initialImage, onReset }) => {
  // Add the StyleInjector at the top level to ensure styles are applied
  
  // UI state
  const [activeTab, setActiveTab] = useState('preview'); // 'preview', 'completed', or 'queue'
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
  const [activeDisplayImage, setActiveDisplayImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Refs
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const processedImageRef = useRef(null);
  const sliderHandleRef = useRef(null);
  
  // Initialize queue when component loads
  useEffect(() => {
    if (Array.isArray(initialImage) && initialImage.length > 0) {
      const formattedQueue = initialImage.map((img, index) => ({
        id: `img-${Date.now()}-${index}`,
        original: img,
        processed: null,
        isProcessing: false,
        scale: scale
      }));
      setPendingImages(formattedQueue);
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
      const updatedPending = pendingImages.map((img, index) => ({
        ...img,
        scale: individualScales[index]
      }));
      setPendingImages(updatedPending);
    } else {
      setScale(globalScale);
      const updatedPending = pendingImages.map(img => ({
        ...img,
        scale: globalScale
      }));
      setPendingImages(updatedPending);
    }
    
    setShowSettingsDialog(false);
    setProcessingEnabled(true);
  };
  
  // Process next image whenever the queue or processing state changes
  useEffect(() => {
    const processNextImage = async () => {
      if (!processingEnabled) {
        return;
      }
      
      if (isProcessing || pendingImages.length === 0) {
        return;
      }
      
      setIsProcessing(true);
      const imageToProcess = pendingImages[0];
      
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
          scale: scaleToUse,
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
        
        // Switch to preview tab if no active tab is selected yet
        if (activeTab === 'queue' && pendingImages.length <= 1) {
          setActiveTab('preview');
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
  }, [pendingImages, isProcessing, scale, viewMode, activeDisplayImage, processingEnabled, activeTab]);
  
  // Handle slider touch/mouse events
  const handleSliderInteractionStart = (e) => {
    if (viewMode !== 'canvas') return;
    
    // Prevent default to avoid scrolling on touch devices
    e.preventDefault();
    
    // Determine if this is a touch or mouse event
    const clientX = e.type.includes('touch') 
      ? e.touches[0].clientX 
      : e.clientX;
    
    // Find the image element
    const imageElement = processedImageRef.current;
    if (!imageElement) return;
    
    // Get the image bounds
    const imageRect = imageElement.getBoundingClientRect();
    
    // Check if interaction is within image bounds
    if (
      clientX < imageRect.left || 
      clientX > imageRect.right
    ) return;
    
    // Calculate the initial position
    const initialX = clientX;
    const initialPosition = sliderPosition;
    
    // Define move handler
    const handleMove = (moveEvent) => {
      // Prevent default to avoid scrolling
      moveEvent.preventDefault();
      
      // Get current position
      const currentX = moveEvent.type.includes('touch') 
        ? moveEvent.touches[0].clientX 
        : moveEvent.clientX;
      
      // Only respond if within image bounds
      if (currentX < imageRect.left || currentX > imageRect.right) return;
      
      // Calculate how far moved as a percentage
      const deltaX = currentX - initialX;
      const percentageDelta = (deltaX / imageRect.width) * 100;
      
      // Calculate new position, clamped between 0-100%
      const newPosition = Math.max(0, Math.min(100, initialPosition + percentageDelta));
      setSliderPosition(newPosition);
    };
    
    // Define end handler
    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };
  
  // Load and cache images to ensure consistent size
  useEffect(() => {
    if (activeDisplayImage && activeDisplayImage.processed) {
      // Reset dimensions before reloading
      setImageDimensions({ width: 0, height: 0 });
      
      // Calculate available space
      const calculateAvailableSpace = () => {
        if (canvasRef.current) {
          const containerRect = canvasRef.current.getBoundingClientRect();
          const availableWidth = containerRect.width * 0.95;
          const availableHeight = containerRect.height * 0.95;
          return { width: availableWidth, height: availableHeight };
        }
        return { width: 0, height: 0 };
      };
      
      // Preload both images
      const preloadOriginal = new Image();
      const preloadProcessed = new Image();
      
      let originalLoaded = false;
      let processedLoaded = false;
      
      const checkBothLoaded = () => {
        if (originalLoaded && processedLoaded) {
          // Get intrinsic dimensions
          const maxNaturalWidth = Math.max(preloadOriginal.naturalWidth, preloadProcessed.naturalWidth);
          const maxNaturalHeight = Math.max(preloadOriginal.naturalHeight, preloadProcessed.naturalHeight);
          
          // Calculate aspect ratio
          const aspectRatio = maxNaturalWidth / maxNaturalHeight;
          
          // Get available space
          const availableSpace = calculateAvailableSpace();
          
          // Calculate dimensions to fit
          let finalWidth, finalHeight;
          
          if (maxNaturalWidth > availableSpace.width || maxNaturalHeight > availableSpace.height) {
            // Scale down to fit
            const widthRatio = availableSpace.width / maxNaturalWidth;
            const heightRatio = availableSpace.height / maxNaturalHeight;
            
            const scaleFactor = Math.min(widthRatio, heightRatio);
            
            finalWidth = maxNaturalWidth * scaleFactor;
            finalHeight = maxNaturalHeight * scaleFactor;
          } else {
            // Use natural dimensions
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
      
      // Handle resize
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

  // Delete an image from completed images
  const handleDeleteImage = (imageId, e) => {
    // Stop event propagation to prevent selecting the image while deleting
    if (e) {
      e.stopPropagation();
    }
    
    // Remove the image
    const newCompletedImages = completedImages.filter(img => img.id !== imageId);
    setCompletedImages(newCompletedImages);
    
    // If deleting active image, select a new one
    if (activeDisplayImage && activeDisplayImage.id === imageId) {
      if (newCompletedImages.length > 0) {
        setActiveDisplayImage(newCompletedImages[0]);
      } else {
        setActiveDisplayImage(null);
        
        // If no completed images left, switch to queue tab if it has items
        if (pendingImages.length > 0) {
          setActiveTab('queue');
        }
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
      completedImages.forEach((img, index) => {
        if (img.processed) {
          const link = document.createElement('a');
          link.href = img.processed;
          link.download = `enhanced-${index+1}-${Date.now()}.png`;
          setTimeout(() => {
            link.click();
          }, index * 100);
        }
      });
    }
  };

  // Select a completed image
  const handleSelectCompleted = (img) => {
    setActiveDisplayImage(img);
    // Switch to preview tab automatically when selecting an image
    setActiveTab('preview');
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
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Add StyleInjector */}
      <StyleInjector />
      
      {/* Settings Dialog */}
      {showSettingsDialog && pendingImages.length > 0 && (
        <EnhanceMobileSettingsDialog
          pendingImages={pendingImages}
          defaultScale={scale}
          onConfirm={handleSettingsConfirm}
          onCancel={() => {
            setShowSettingsDialog(false);
            setProcessingEnabled(true);
          }}
        />
      )}

      {/* Mobile Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <button 
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem',
            color: '#4B5563',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent'
          }}
        >
          <ArrowLeft size={20} />
          <span style={{ fontSize: '0.875rem' }}>Back</span>
        </button>
        
        {/* Title */}
        <h1 id="app-title" style={{
          fontSize: '1.125rem',
          fontWeight: 500,
          color: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>Face Enhancement</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {/* Settings button */}
          <button
            onClick={handleOpenSettings}
            disabled={pendingImages.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              color: '#4B5563',
              borderRadius: '0.25rem',
              cursor: pendingImages.length === 0 ? 'not-allowed' : 'pointer',
              opacity: pendingImages.length === 0 ? 0.5 : 1,
              border: 'none',
              background: 'transparent'
            }}
          >
            <Settings size={20} />
          </button>
          
          {/* Download button */}
          <div style={{ position: 'relative' }}>
            <button
              id="download-button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={completedImages.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                color: '#4B5563',
                borderRadius: '0.25rem',
                cursor: completedImages.length === 0 ? 'not-allowed' : 'pointer',
                opacity: completedImages.length === 0 ? 0.5 : 1,
                border: 'none',
                background: 'transparent'
              }}
            >
              <Download size={20} />
            </button>
            
            {/* Download dropdown menu */}
            {showDownloadMenu && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.25rem',
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
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: !activeDisplayImage || !activeDisplayImage.processed ? 'not-allowed' : 'pointer',
                      opacity: !activeDisplayImage || !activeDisplayImage.processed ? 0.5 : 1,
                      border: 'none',
                      background: 'transparent'
                    }}
                    onClick={() => handleDownload('selected')}
                    disabled={!activeDisplayImage || !activeDisplayImage.processed}
                  >
                    Download Selected
                  </button>
                  <button
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent'
                    }}
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
      
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <button
          className={`tab-button ${activeTab === 'preview' ? 'mobile-tab-active' : ''}`}
          onClick={() => setActiveTab('preview')}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            background: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: activeTab === 'preview' ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === 'preview' ? '2px solid #2563EB' : '2px solid transparent'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.375rem'
          }}>
            <ImageIcon size={16} />
            Preview
          </div>
        </button>
        
        <button
          className={`tab-button ${activeTab === 'completed' ? 'mobile-tab-active' : ''}`}
          onClick={() => setActiveTab('completed')}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            background: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: activeTab === 'completed' ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === 'completed' ? '2px solid #2563EB' : '2px solid transparent',
            position: 'relative'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.375rem'
          }}>
            <ImageIcon size={16} />
            Completed
            {completedImages.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '0.375rem',
                right: '0.375rem',
                backgroundColor: '#2563EB',
                color: 'white',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {completedImages.length}
              </span>
            )}
          </div>
        </button>
        
        <button
          className={`tab-button ${activeTab === 'queue' ? 'mobile-tab-active' : ''}`}
          onClick={() => setActiveTab('queue')}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            background: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: activeTab === 'queue' ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === 'queue' ? '2px solid #2563EB' : '2px solid transparent',
            position: 'relative'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.375rem'
          }}>
            <Clock size={16} />
            Queue
            {pendingImages.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '0.375rem',
                right: '0.375rem',
                backgroundColor: '#2563EB',
                color: 'white',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {pendingImages.length}
              </span>
            )}
          </div>
        </button>
      </div>
      
      {/* Main Content Area - will change based on active tab */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Preview Tab Content */}
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Mode Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 1rem',
              borderBottom: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  id="mode-toggle-button"
                  onClick={toggleViewMode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
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
                      <ToggleLeft size={16} />
                      Live
                    </>
                  ) : (
                    <>
                      <ToggleRight size={16} />
                      Compare
                    </>
                  )}
                </button>
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6B7280' 
              }}>
                {viewMode === 'canvas' && 'Slide to compare'}
              </div>
            </div>
            
            {/* Canvas Area */}
            <div 
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {activeDisplayImage ? (
                <div 
                  ref={canvasRef}
                  style={{ 
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                  }}
                >
                  {/* Image container */}
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: imageDimensions.width > 0 ? `${imageDimensions.width}px` : 'auto',
                      height: imageDimensions.height > 0 ? `${imageDimensions.height}px` : 'auto'
                    }}>
                      {/* Original Image (only visible in canvas mode) */}
                      <img 
                        ref={originalImageRef}
                        src={activeDisplayImage.original} 
                        alt="Original" 
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          pointerEvents: 'none',
                          display: viewMode === 'live' ? 'none' : 'block',
                          zIndex: 10
                        }}
                      />
                      
                      {/* Processed Image with clip mask for slider */}
                      <div 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          overflow: 'hidden',
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
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                      
                      {/* Slider elements - only in canvas mode */}
                      {viewMode === 'canvas' && (
                        <>
                          {/* Slider Line */}
                          <div 
                            style={{ 
                              position: 'absolute',
                              left: `${sliderPosition}%`,
                              top: 0,
                              width: '2px',
                              height: '100%',
                              backgroundColor: 'white',
                              boxShadow: '0 0 3px rgba(0, 0, 0, 0.2)',
                              pointerEvents: 'none',
                              zIndex: 30
                            }}
                          />
                          
                          {/* Slider Handle - touch friendly */}
                          <div 
                            ref={sliderHandleRef}
                            className="slider-handle"
                            style={{ 
                              position: 'absolute',
                              left: `${sliderPosition}%`,
                              top: '50%',
                              width: '36px',
                              height: '36px',
                              transform: 'translate(-50%, -50%)',
                              cursor: 'ew-resize',
                              zIndex: 40
                            }}
                            onMouseDown={handleSliderInteractionStart}
                            onTouchStart={handleSliderInteractionStart}
                          >
                            {/* Larger touch target for mobile */}
                            <div style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: '28px',
                              height: '28px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <div style={{
                                width: '2px',
                                height: '16px',
                                backgroundColor: '#6B7280',
                                borderRadius: '1px'
                              }}></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6B7280'
                }}>
                  {pendingImages.length > 0 ? (
                    processingEnabled ? (
                      <>
                        <div style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          Processing images...
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                          Please wait while your images are being enhanced.
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                          Configure settings
                        </div>
                        <div style={{ fontSize: '0.875rem' }}>
                          Click the Settings button to start processing.
                        </div>
                      </>
                    )
                  ) : completedImages.length > 0 ? (
                    <>
                      <div style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Select an image
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>
                        Go to the Completed tab to select an image to view.
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        No images available
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>
                        Go back to upload images for enhancement.
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Completed Images Tab Content */}
        {activeTab === 'completed' && (
          <div style={{ height: '100%', overflow: 'auto', padding: '1rem' }}>
            <h2 className="mobile-section-title" style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#000000',
              marginBottom: '0.75rem',
              textTransform: 'uppercase'
            }}>
              Completed Images ({completedImages.length})
            </h2>
            
            {completedImages.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '0.75rem',
              }}>
                {completedImages.map(img => (
                  <div 
                    key={img.id} 
                    style={{
                      border: activeDisplayImage && activeDisplayImage.id === img.id 
                        ? '2px solid #3B82F6' 
                        : '1px solid #E5E7EB',
                      borderRadius: '0.375rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                      backgroundColor: 'white'
                    }}
                    onClick={() => handleSelectCompleted(img)}
                  >
                    <div style={{ 
                      position: 'relative',
                      paddingTop: '100%', // 1:1 aspect ratio
                    }}>
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
                      {/* Scale badge */}
                      <div style={{
                        position: 'absolute',
                        top: '0.375rem',
                        left: '0.375rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.125rem'
                      }}>
                        {img.scale}x
                      </div>
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteImage(img.id, e)}
                        style={{
                          position: 'absolute',
                          top: '0.375rem',
                          right: '0.375rem',
                          width: '1.75rem',
                          height: '1.75rem',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(31, 41, 55, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                color: '#6B7280',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  No processed images yet
                </div>
                {pendingImages.length > 0 ? (
                  <div style={{ fontSize: '0.875rem' }}>
                    Images are being processed. Check the Queue tab.
                  </div>
                ) : (
                  <div style={{ fontSize: '0.875rem' }}>
                    Go back to upload images for enhancement.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Queue Tab Content */}
        {activeTab === 'queue' && (
          <div style={{ height: '100%', overflow: 'auto', padding: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem'
            }}>
              <h2 className="mobile-section-title" style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#000000',
                textTransform: 'uppercase'
              }}>
                Queue ({pendingImages.length})
              </h2>
              
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                {useIndividualScales ? 'Individual scales' : `Global scale: ${scale}x`}
              </div>
            </div>
            
            {pendingImages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingImages.map((img, index) => (
                  <div 
                    key={img.id}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      border: img.isProcessing 
                        ? '1px solid #10B981' 
                        : '1px solid #E5E7EB',
                      borderRadius: '0.375rem',
                      overflow: 'hidden',
                      position: 'relative',
                      padding: '0.75rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <div style={{ 
                      width: '4rem',
                      height: '4rem',
                      position: 'relative',
                      borderRadius: '0.25rem',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <img 
                        src={img.original} 
                        alt={`Queue ${index + 1}`} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 500
                        }}>
                          Image {index + 1}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          backgroundColor: '#E5E7EB',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          color: '#374151'
                        }}>
                          {img.scale}x scale
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {index === 0 && img.isProcessing ? (
                          <div style={{ 
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <div style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              backgroundColor: '#10B981'
                            }}></div>
                            Currently processing...
                          </div>
                        ) : (
                          <div>Waiting to be processed</div>
                        )}
                      </div>
                      
                      {useIndividualScales && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <label style={{
                            display: 'block',
                            fontSize: '0.75rem',
                            color: '#6B7280',
                            marginBottom: '0.125rem'
                          }}>
                            Scale: {img.scale}x
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="4"
                            step="0.5"
                            value={img.scale}
                            onChange={(e) => {
                              const newScale = parseFloat(e.target.value);
                              const updatedPending = [...pendingImages];
                              updatedPending[index] = {
                                ...updatedPending[index],
                                scale: newScale
                              };
                              setPendingImages(updatedPending);
                              
                              // Update individualScales too
                              const newScales = [...individualScales];
                              newScales[index] = newScale;
                              setIndividualScales(newScales);
                            }}
                            style={{ width: '100%', height: '20px' }}
                            disabled={img.isProcessing}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                color: '#6B7280',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                  No images in queue
                </div>
                {completedImages.length > 0 ? (
                  <div style={{ fontSize: '0.875rem' }}>
                    All images have been processed. Check the Completed tab.
                  </div>
                ) : (
                  <div style={{ fontSize: '0.875rem' }}>
                    Go back to upload images for enhancement.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          backgroundColor: '#FEE2E2',
          border: '1px solid #F87171',
          color: '#B91C1C',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>{error}</div>
          <button 
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#B91C1C',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Close dropdown when clicking outside */}
      {showDownloadMenu && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30
          }}
          onClick={() => setShowDownloadMenu(false)}
        ></div>
      )}
    </div>
  );
};

export default EnhanceMobile;