import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, ToggleLeft, ToggleRight, Settings, Info, ChevronDown, ChevronUp, X } from 'lucide-react';

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
      #strength-label,
      #saturation-label,
      #completed-images-title,
      #queue-title,
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

// Mobile Colorization Settings Dialog Component
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
        height: '100%',
        padding: '1rem'
      }}>
        <div id="settings-dialog" style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '1rem',
          width: '100%',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {/* Title with explicit styling */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 id="settings-title" style={{
              fontSize: '1.125rem',
              lineHeight: '1.5rem',
              fontWeight: 500,
              color: '#000000',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>Colorization Settings</h2>
            <button 
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem'
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
                  id="useIndividualSettings"
                  checked={useIndividualSettings}
                  onChange={(e) => setUseIndividualSettings(e.target.checked)}
                  style={{ marginRight: '0.5rem', width: '1.25rem', height: '1.25rem' }}
                />
                {/* Checkbox label with explicit styling */}
                <label htmlFor="useIndividualSettings" style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#000000',
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Use different settings for each image
                </label>
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Info size={16} className="text-blue-500 cursor-help" />
              </div>
            </div>
            
            {!useIndividualSettings ? (
              <div style={{ marginTop: '1rem' }}>
                <div>
                  {/* Strength label with explicit styling */}
                  <label id="strength-label" style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '0.25rem',
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    Color Strength: {globalStrength.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={globalStrength}
                    onChange={(e) => setGlobalStrength(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '2rem' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.75rem', 
                    color: '#6B7280',
                    marginTop: '0.25rem'
                  }}>
                    <span>Subtle</span>
                    <span>Balanced</span>
                    <span>Vivid</span>
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  {/* Saturation label with explicit styling */}
                  <label id="saturation-label" style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    marginBottom: '0.25rem',
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                  }}>
                    Color Saturation: {globalSaturation.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={globalSaturation}
                    onChange={(e) => setGlobalSaturation(parseFloat(e.target.value))}
                    style={{ width: '100%', height: '2rem' }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '0.75rem', 
                    color: '#6B7280',
                    marginTop: '0.25rem'
                  }}>
                    <span>Muted</span>
                    <span>Natural</span>
                    <span>Vibrant</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                marginTop: '1rem',
                maxHeight: '60vh',
                overflowY: 'auto',
                paddingRight: '0.5rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#4B5563',
                  fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }} className="dialog-text">Set settings for each image:</p>
                {pendingImages.map((img, index) => (
                  <div key={img.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.375rem',
                    padding: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
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
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#000000',
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                      }}>Image {index + 1}</div>
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        marginBottom: '0.25rem',
                        color: '#000000',
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
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
                        style={{ width: '100%', height: '2rem' }}
                      />
                    </div>
                    
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        marginBottom: '0.25rem',
                        color: '#000000',
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
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
                        style={{ width: '100%', height: '2rem' }}
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
            gap: '0.75rem',
            marginTop: '0.5rem' 
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
                fontSize: '0.875rem',
                flex: '1'
              }}
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
                fontSize: '0.875rem',
                flex: '1'
              }}
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

const MobileColorizationEditor = ({ 
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
  
  // Mobile-specific UI state
  const [activeSection, setActiveSection] = useState('canvas'); // 'canvas', 'completed', 'queue'
  const [expandedSection, setExpandedSection] = useState(null); // For expandable sections
  
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
        
        // If we just finished an image and the active section is not 'canvas', 
        // switch to showing the canvas with the result
        if (activeSection !== 'canvas') {
          setActiveSection('canvas');
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
  }, [pendingImages, isProcessing, viewMode, activeDisplayImage, processingEnabled, activeSection]);
  
  // Handle slider touch
  const handleSliderTouch = (e) => {
    if (viewMode !== 'canvas') return;
    
    e.preventDefault();
    
    // Find the actual image element for more precise bounds
    const imageElement = colorizedImageRef.current;
    if (!imageElement) return;
    
    // Get the image's actual dimensions and position
    const imageRect = imageElement.getBoundingClientRect();
    
    // Get touch coordinates
    const touch = e.touches[0];
    
    // Check if touch is within the image bounds
    if (
      touch.clientX < imageRect.left || 
      touch.clientX > imageRect.right || 
      touch.clientY < imageRect.top || 
      touch.clientY > imageRect.bottom
    ) return;
    
    // Calculate position as percentage
    const positionPercentage = ((touch.clientX - imageRect.left) / imageRect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, positionPercentage)));
  };
  
  const handleSliderTouchMove = (e) => {
    if (viewMode !== 'canvas') return;
    
    // Find the actual image element for more precise bounds
    const imageElement = colorizedImageRef.current;
    if (!imageElement) return;
    
    // Get the image's actual dimensions and position
    const imageRect = imageElement.getBoundingClientRect();
    
    // Get touch coordinates
    const touch = e.touches[0];
    
    // Calculate position as percentage
    const positionPercentage = ((touch.clientX - imageRect.left) / imageRect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, positionPercentage)));
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
          const availableWidth = containerRect.width * 0.95;
          const availableHeight = containerRect.height * 0.95;
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
  
  // Select a completed image
  const handleSelectCompleted = (img) => {
    setActiveDisplayImage(img);
    // When selecting an image from the completed section, switch to canvas view
    setActiveSection('canvas');
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
  
  // Toggle section for mobile
  const toggleSection = (section) => {
    setActiveSection(section);
  };
  
  // Toggle expandable sections (for settings/info)
  const toggleExpanded = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
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
      height: '100vh'
    }}>
      {/* Add the StyleInjector */}
      <StyleInjector />
      
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: 'white',
        zIndex: 10
      }}>
        <button 
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            color: '#4B5563',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        
        <h1 id="app-title" style={{
          fontSize: '1.125rem',
          fontWeight: 500,
          color: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>Image Colorization</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleOpenSettings}
            disabled={pendingImages.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              color: '#4B5563',
              borderRadius: '0.25rem',
              cursor: pendingImages.length === 0 ? 'not-allowed' : 'pointer',
              opacity: pendingImages.length === 0 ? 0.5 : 1
            }}
          >
            <Settings size={20} />
          </button>
          
          <div style={{ position: 'relative' }}>
            <button
              id="download-button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={completedImages.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                color: '#4B5563',
                borderRadius: '0.25rem',
                cursor: completedImages.length === 0 ? 'not-allowed' : 'pointer',
                opacity: completedImages.length === 0 ? 0.5 : 1
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
                      padding: '0.75rem 1rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      cursor: !activeDisplayImage || !activeDisplayImage.colorized ? 'not-allowed' : 'pointer',
                      opacity: !activeDisplayImage || !activeDisplayImage.colorized ? 0.5 : 1
                    }}
                    onClick={() => handleDownload('selected')}
                    disabled={!activeDisplayImage || !activeDisplayImage.colorized}
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
                      cursor: 'pointer'
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
      
      {/* Navigation tabs for mobile */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB'
      }}>
        <button
          onClick={() => toggleSection('canvas')}
          style={{
            flex: 1,
            padding: '0.75rem',
            textAlign: 'center',
            borderBottom: activeSection === 'canvas' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeSection === 'canvas' ? '#2563EB' : '#6B7280',
            fontWeight: activeSection === 'canvas' ? 500 : 400,
            fontSize: '0.875rem'
          }}
        >
          Canvas
        </button>
        <button
          onClick={() => toggleSection('completed')}
          style={{
            flex: 1,
            padding: '0.75rem',
            textAlign: 'center',
            borderBottom: activeSection === 'completed' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeSection === 'completed' ? '#2563EB' : '#6B7280',
            fontWeight: activeSection === 'completed' ? 500 : 400,
            fontSize: '0.875rem'
          }}
        >
          Completed ({completedImages.length})
        </button>
        <button
          onClick={() => toggleSection('queue')}
          style={{
            flex: 1,
            padding: '0.75rem',
            textAlign: 'center',
            borderBottom: activeSection === 'queue' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeSection === 'queue' ? '#2563EB' : '#6B7280',
            fontWeight: activeSection === 'queue' ? 500 : 400,
            fontSize: '0.875rem'
          }}
        >
          Queue ({pendingImages.length})
        </button>
      </div>
      
      {/* Main content area - show only the active section */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Canvas Section */}
        <div style={{
          display: activeSection === 'canvas' ? 'flex' : 'none',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Mode Toggle Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 1rem',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB'
          }}>
            <button
              id="mode-toggle-button"
              onClick={toggleViewMode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                padding: '0.5rem 0.75rem',
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
                  Live Mode
                </>
              ) : (
                <>
                  <ToggleRight size={16} />
                  Canvas Mode
                </>
              )}
            </button>
            
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#6B7280' 
            }}>
              {viewMode === 'canvas' && 'Slide to compare'}
            </div>
          </div>
          
          {/* Canvas Area */}
          <div style={{
            flex: 1,
            backgroundColor: '#F3F4F6',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {activeDisplayImage ? (
              <div 
                ref={canvasRef}
                style={{ 
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0.5rem',
                  width: '100%',
                  height: 'calc(100% - 16px)'
                }}
              >
                {/* Image container */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%'
                }}>
                  {activeDisplayImage.colorized && (
                    <div style={{
                      position: 'relative',
                      flexShrink: 0,
                      maxWidth: '95%',
                      maxHeight: '95%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{
                        position: 'relative',
                        width: imageDimensions.width > 0 ? `${imageDimensions.width}px` : 'auto',
                        height: imageDimensions.height > 0 ? `${imageDimensions.height}px` : 'auto'
                      }}>
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
                        
                        {/* Colorized Image with clip mask for slider */}
                        <div style={{
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
                        }}>
                          <img 
                            ref={colorizedImageRef}
                            src={activeDisplayImage.colorized} 
                            alt="Colorized" 
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
                            <div style={{ 
                              position: 'absolute',
                              width: '2px',
                              backgroundColor: 'white',
                              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                              left: `${sliderPosition}%`,
                              pointerEvents: 'none',
                              top: 0,
                              height: '100%',
                              zIndex: 30
                            }} />
                            
                            {/* Slider Handle - for touch */}
                            <div style={{ 
                              position: 'absolute',
                              left: `${sliderPosition}%`,
                              width: '24px',
                              transform: 'translateX(-12px)',
                              pointerEvents: 'auto',
                              top: 0,
                              height: '100%',
                              zIndex: 40
                            }}
                              onTouchStart={handleSliderTouch}
                              onTouchMove={handleSliderTouchMove}
                            >
                              {/* Mobile-friendly slider handle */}
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '24px',
                                height: '24px',
                                backgroundColor: 'white',
                                borderRadius: '9999px',
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                border: '1px solid #D1D5DB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <div style={{
                                  width: '2px',
                                  height: '12px',
                                  backgroundColor: '#9CA3AF',
                                  borderRadius: '9999px'
                                }}></div>
                              </div>
                            </div>
                            
                            {/* Invisible touch area for the entire image for easy slider movement */}
                            <div 
                              style={{ 
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 35
                              }}
                              onTouchStart={handleSliderTouch}
                              onTouchMove={handleSliderTouchMove}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                color: '#6B7280',
                textAlign: 'center',
                padding: '2rem 1rem'
              }}>
                {pendingImages.length > 0 
                  ? (processingEnabled ? 'Processing images...' : 'Configure settings to start processing') 
                  : 'No images available'}
              </div>
            )}
          </div>
        </div>
        
        {/* Completed Images Section */}
        <div style={{
          display: activeSection === 'completed' ? 'block' : 'none',
          height: '100%',
          overflowY: 'auto',
          padding: '1rem'
        }}>
          <h2 id="completed-images-title" style={{
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '0.75rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>COMPLETED IMAGES</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
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
                onClick={() => handleSelectCompleted(img)}
              >
                <div 
                  style={{ 
                    position: 'relative',
                    paddingBottom: '100%',
                    width: '100%'
                  }}
                >
                  <img 
                    src={img.colorized} 
                    alt="Colorized" 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  {/* Display settings badge */}
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
                    S: {img.strength.toFixed(1)}
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
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(31, 41, 55, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          {completedImages.length === 0 && (
            <div id="no-images-text" style={{
              color: '#000000',
              fontSize: '0.875rem',
              textAlign: 'center',
              padding: '2rem 0',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              No colorized images yet
            </div>
          )}
        </div>
        
        {/* Queue Section */}
        <div style={{
          display: activeSection === 'queue' ? 'block' : 'none',
          height: '100%',
          overflowY: 'auto',
          padding: '1rem'
        }}>
          <h2 id="queue-title" style={{
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '0.75rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            QUEUE ({pendingImages.length})
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                  paddingBottom: '66%',
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
                  {/* Display settings badge */}
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
                    S: {img.strength.toFixed(1)}
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
      
      {/* Settings panel - collapsible on mobile */}
      {activeSection === 'canvas' && (
        <div style={{
          borderTop: '1px solid #E5E7EB',
          backgroundColor: 'white'
        }}>
          <button
            onClick={() => toggleExpanded('settings')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              borderBottom: expandedSection === 'settings' ? '1px solid #E5E7EB' : 'none'
            }}
          >
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#000000'
            }}>Current Settings</span>
            {expandedSection === 'settings' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedSection === 'settings' && (
            <div style={{ padding: '0.75rem 1rem 1rem' }}>
              {useIndividualSettings ? (
                <div style={{ fontSize: '0.875rem' }}>
                  <span id="mode-label" style={{
                    fontWeight: 500,
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                  }}>Mode:</span> <span>Individual settings</span>
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#6B7280'
                  }}>
                    Each image has its own color settings
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.875rem' }}>
                    <span id="mode-label" style={{
                      fontWeight: 500,
                      color: '#000000',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>Mode:</span> <span style={{
                      fontWeight: 500,
                      color: '#000000',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>Global settings</span>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <label id="strength-label" style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#000000',
                      marginBottom: '0.25rem',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
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
                      style={{
                        width: '100%',
                        height: '2rem'
                      }}
                      disabled={useIndividualSettings}
                    />
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <label id="saturation-label" style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#000000',
                      marginBottom: '0.25rem',
                      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
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
                      style={{
                        width: '100%',
                        height: '2rem'
                      }}
                      disabled={useIndividualSettings}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Error Message Toast - More prominent on mobile */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          backgroundColor: '#FEE2E2',
          border: '1px solid #F87171',
          color: '#B91C1C',
          padding: '0.75rem 1rem',
          borderRadius: '0.375rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.875rem' }}>{error}</div>
          <button 
            style={{
              color: '#B91C1C',
              cursor: 'pointer',
              padding: '0.5rem',
              marginLeft: '0.5rem'
            }}
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Overlay to close dropdowns when clicking outside */}
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
  );
};

export default MobileColorizationEditor;