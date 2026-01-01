import { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { ArrowLeft, Minus, Plus, Lock, Unlock } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

export default function OutpaintCropPage({ imageSrc, onCropDone }) {
  // State for crop settings and output
  const [imageSrcState, setImageSrcState] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(null); // Start with freeform
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const bottomToolbarRef = useRef(null);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [selectedPreset, setSelectedPreset] = useState('free');
  const [unlockMaxCoverage, setUnlockMaxCoverage] = useState(false);

  // Update viewport height on resize
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set the image source when component mounts or when imageSrc prop changes
  useEffect(() => {
    if (imageSrc) {
      setImageSrcState(imageSrc);
    }
  }, [imageSrc]);

  // Function to update canvas dimensions
  const updateCanvasDimensions = useCallback(() => {
    if (!imageSrcState || !containerRef.current || !headerRef.current) return;

    // Get actual heights of UI elements
    const headerHeight = headerRef.current.offsetHeight;
    const buttonRowHeight = 0; // Removed zoom controls from top
    const bottomToolbarHeight = 64; // Height of the aspect ratio toolbar (h-16 = 64px)
    const bottomPadding = 24; // Safe area at the bottom

    // Calculate available container height
    const availableHeight = viewportHeight - headerHeight - buttonRowHeight - bottomToolbarHeight - bottomPadding;

    // Get panel width (assuming no right panel, adjust if needed)
    const panelWidth = 0; // No right panel in this component
    const containerWidth = containerRef.current.offsetWidth;
    const availableWidth = containerWidth - panelWidth - 48; // 48px for padding/margins

    // Load image to get natural dimensions
    const img = new Image();
    img.onload = () => {
      // Store original image dimensions
      setImageSize({ width: img.width, height: img.height });

      // Calculate scale to fit image in available space while maintaining aspect ratio
      const imageRatio = img.width / img.height;
      const containerRatio = availableWidth / availableHeight;

      let canvasWidth, canvasHeight;

      if (imageRatio > containerRatio) {
        canvasWidth = Math.min(availableWidth, img.width);
        canvasHeight = canvasWidth / imageRatio;
      } else {
        canvasHeight = Math.min(availableHeight, img.height);
        canvasWidth = canvasHeight * imageRatio;
      }

      // Set a maximum scale for very large images
      const maxScale = Math.min(1, availableWidth / img.width, availableHeight / img.height);
      if (maxScale < 1) {
        canvasWidth = img.width * maxScale;
        canvasHeight = img.height * maxScale;
      }

      // Set container size
      setContainerSize({ width: canvasWidth, height: canvasHeight });

      // Calculate the scale ratio
      const scaleFactor = canvasWidth / img.width;
      setCanvasScale(scaleFactor);

      // Initialize crop to cover the entire image
      const newCrop = {
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      };
      setCrop(newCrop);
      setCompletedCrop(newCrop);
      setDimensions({ width: img.width, height: img.height });
    };
    img.src = imageSrcState;
  }, [imageSrcState, viewportHeight]);

  // Update dimensions when image loads or viewport changes
  useEffect(() => {
    updateCanvasDimensions();
  }, [updateCanvasDimensions]);

  // Calculate maximum coverage crop with current aspect ratio
  const calculateMaxCoverageCrop = useCallback(() => {
    if (!imgRef.current || aspect === null) return;
    
    const { naturalWidth, naturalHeight } = imgRef.current;
    const imageRatio = naturalWidth / naturalHeight;
    
    let newWidth, newHeight, newX, newY;
    
    if (aspect > imageRatio) {
      // Aspect ratio is wider than the image, so we'll make the crop the full width
      newWidth = 100; // 100% width
      // Calculate height to maintain the aspect ratio
      newHeight = (naturalWidth / aspect) / naturalHeight * 100;
      newX = 0;
      // Center vertically
      newY = (100 - newHeight) / 2;
    } else {
      // Aspect ratio is taller than the image, so we'll make the crop the full height
      newHeight = 100; // 100% height
      // Calculate width to maintain the aspect ratio
      newWidth = (naturalHeight * aspect) / naturalWidth * 100;
      // Center horizontally
      newX = (100 - newWidth) / 2;
      newY = 0;
    }
    
    // Ensure we never exceed 100% on any dimension
    newWidth = Math.min(newWidth, 100);
    newHeight = Math.min(newHeight, 100);
    
    const newCrop = {
      unit: '%',
      width: newWidth,
      height: newHeight,
      x: newX,
      y: newY
    };
    
    setCrop(newCrop);
    setCompletedCrop(newCrop);
    
    // Update the dimensions accurately
    if (imgRef.current) {
      const cropWidth = Math.round((newWidth / 100) * naturalWidth);
      const cropHeight = Math.round((newHeight / 100) * naturalHeight);
      setDimensions({ width: cropWidth, height: cropHeight });
    }
  }, [aspect]);
  
  // Initialize crop when image loads
  const onImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    imgRef.current = e.currentTarget;
    const container = containerRef.current;
    if (!container) {
      console.error('DEBUG CRITICAL: Container ref is null in onImageLoad');
      return;
    }

    // If aspect ratio is already selected, apply it after image load
    if (aspect !== null) {
      if (unlockMaxCoverage) {
        calculateMaxCoverageCrop();
      } else if (selectedPreset === 'original') {
        // For original preset, we want to use the full image
        const newCrop = {
          unit: '%',
          width: 100,
          height: 100,
          x: 0,
          y: 0
        };
        setCrop(newCrop);
        setCompletedCrop(newCrop);
        setDimensions({ width: naturalWidth, height: naturalHeight });
      } else {
        applyAspectRatio(aspect, naturalWidth, naturalHeight);
      }
    }

    console.log('DEBUG IMAGE DETAILS:', {
      naturalWidth,
      naturalHeight,
      displayWidth: e.currentTarget.width,
      displayHeight: e.currentTarget.height,
      complete: e.currentTarget.complete,
      currentSrc: e.currentTarget.currentSrc?.substring(0, 30) + '...'
    });
  };

  // Apply aspect ratio to current image
  const applyAspectRatio = (aspectValue, width, height) => {
    if (!aspectValue || !width || !height) return;
    
    // Create a centered crop with the specified aspect ratio
    const newCrop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 }, // Start with 90% width to ensure visibility
        aspectValue,
        width,
        height
      ),
      width,
      height
    );
    
    setCrop(newCrop);
    setCompletedCrop(newCrop);
    
    // Calculate dimensions based on the crop
    const cropWidth = Math.round((newCrop.width / 100) * width);
    const cropHeight = Math.round((newCrop.height / 100) * height);
    setDimensions({ width: cropWidth, height: cropHeight });
  };

  // Handle changes to the crop
  const onCropChange = (pixelCrop, percentCrop) => {
    // If unlock max coverage is active, don't allow manual changes
    if (unlockMaxCoverage) return;
    
    // Only update the crop if the aspect ratio is maintained or if we're in free mode
    if (!aspect || (pixelCrop.width > 0 && pixelCrop.height > 0)) {
      setCrop(percentCrop);
      
      // Update the dimensions to match the current crop
      if (imgRef.current) {
        const { naturalWidth, naturalHeight } = imgRef.current;
        const cropWidth = Math.round((percentCrop.width / 100) * naturalWidth);
        const cropHeight = Math.round((percentCrop.height / 100) * naturalHeight);
        setDimensions({ width: cropWidth, height: cropHeight });
      }
    }
  };

  // Update crop state when user makes a selection
  const onCompleteCrop = (c) => {
    if (unlockMaxCoverage) return;
    
    setCompletedCrop(c);

    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const cropWidth = Math.round((c.width / 100) * naturalWidth);
      const cropHeight = Math.round((c.height / 100) * naturalHeight);
      setDimensions({ width: cropWidth, height: cropHeight });
    }
  };

  // Handle aspect ratio selection
  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    
    let newAspect;
    switch(preset) {
      case 'free':
        newAspect = null;
        break;
      case 'original':
        // For original, we want to maintain the original aspect ratio of the image
        // but use the entire image (100% coverage)
        if (imgRef.current) {
          newAspect = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
          
          // Set a timeout to ensure the aspect ratio is set before applying maximum coverage
          setTimeout(() => {
            // For original preset, we want maximum coverage by default
            setUnlockMaxCoverage(true);
            
            // Force a recalculation to fill the entire image
            const { naturalWidth, naturalHeight } = imgRef.current;
            const newCrop = {
              unit: '%',
              width: 100,
              height: 100,
              x: 0,
              y: 0
            };
            setCrop(newCrop);
            setCompletedCrop(newCrop);
            setDimensions({ width: naturalWidth, height: naturalHeight });
          }, 10);
        } else {
          newAspect = null;
        }
        break;
      case 'square':
        newAspect = 1;
        break;
      // All other preset cases remain the same
      case '16:9':
        newAspect = 16/9;
        break;
      case '9:16':
        newAspect = 9/16;
        break;
      case '4:3':
        newAspect = 4/3;
        break;
      case '3:4':
        newAspect = 3/4;
        break;
      case '3:2':
        newAspect = 3/2;
        break;
      case '2:3':
        newAspect = 2/3;
        break;
      case '5:4':
        newAspect = 5/4;
        break;
      case '4:5':
        newAspect = 4/5;
        break;
      case '2:1':
        newAspect = 2/1;
        break;
      case '1:2':
        newAspect = 1/2;
        break;
      default:
        newAspect = null;
    }

    setAspect(newAspect);

    // If preset is free, turn off max coverage
    if (preset === 'free') {
      setUnlockMaxCoverage(false);
    }

    // For all presets except original and free (handled above)
    if (preset !== 'original' && preset !== 'free' && imgRef.current) {
      // If unlock is enabled and we have an aspect ratio, calculate max coverage
      if (unlockMaxCoverage && newAspect !== null) {
        // Need a slight delay to ensure aspect ratio is set first
        setTimeout(() => calculateMaxCoverageCrop(), 10);
      } else {
        const { naturalWidth, naturalHeight } = imgRef.current;
        if (newAspect) {
          // Apply the aspect ratio constraint to the crop
          applyAspectRatio(newAspect, naturalWidth, naturalHeight);
        }
      }
    }
  };

  // Function to toggle the unlock state
  const toggleUnlock = () => {
    const newUnlockState = !unlockMaxCoverage;
    setUnlockMaxCoverage(newUnlockState);
    
    if (newUnlockState && aspect !== null) {
      calculateMaxCoverageCrop();
    }
  };

  // Recalculate crop when unlock is toggled or aspect changes
  useEffect(() => {
    if (unlockMaxCoverage && aspect !== null) {
      calculateMaxCoverageCrop();
    }
  }, [unlockMaxCoverage, aspect, calculateMaxCoverageCrop]);

  // Reset crop
  const handleReset = () => {
    setAspect(null);
    setSelectedPreset('free');
    setZoom(1);
    setUnlockMaxCoverage(false);

    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const newCrop = { unit: '%', width: 100, height: 100, x: 0, y: 0 };
      setCrop(newCrop);
      setCompletedCrop(newCrop);
      setDimensions({ width: naturalWidth, height: naturalHeight });
    }
  };

  // Generate cropped image
  const generateCrop = () => {
    if (!completedCrop || !imgRef.current) {
      console.error('Missing completedCrop or image reference');
      onCropDone(null);
      return;
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    const image = imgRef.current;
    const { naturalWidth, naturalHeight } = image;

    try {
      // Convert percent to pixels
      const pixelCrop = {
        x: Math.round((completedCrop.x / 100) * naturalWidth),
        y: Math.round((completedCrop.y / 100) * naturalHeight),
        width: Math.round((completedCrop.width / 100) * naturalWidth),
        height: Math.round((completedCrop.height / 100) * naturalHeight)
      };

      if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
        throw new Error('Invalid crop dimensions');
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(
        image, 
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 
        0, 0, pixelCrop.width, pixelCrop.height
      );

      const croppedImageUrl = canvas.toDataURL('image/png', 1.0);
      onCropDone(croppedImageUrl);
    } catch (error) {
      console.error('Error in crop method:', error);
      onCropDone(null);
    }
  };

  // Cancel cropping
  const handleCancel = () => {
    onCropDone(null);
  };

  // Helper component for aspect ratio buttons
  function AspectButton({ onClick, label, isSelected = false }) {
    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center min-w-14 h-12 px-2 rounded ${
          isSelected ? 'bg-gray-700' : 'hover:bg-gray-800'
        }`}
      >
        <span className="text-xs text-white">{label}</span>
      </button>
    );
  }

  // Unlock button component
  function UnlockButton() {
    return (
      <button
        onClick={toggleUnlock}
        className={`flex items-center justify-center px-3 py-1.5 rounded ${
          unlockMaxCoverage ? 'bg-gray-700' : 'hover:bg-gray-800'
        }`}
      >
        {unlockMaxCoverage ? (
          <Lock className="w-4 h-4 mr-1 text-white" />
        ) : (
          <Unlock className="w-4 h-4 mr-1 text-white" />
        )}
        <span className="text-xs text-white">
          {unlockMaxCoverage ? 'Max Cover' : 'Max Cover'}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0d1117] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-2 h-14" ref={headerRef}>
        <button onClick={handleCancel} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 rounded text-white">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="text-center"><h1 className="text-lg font-normal">Crop</h1></div>
        <div className="flex space-x-2">
          <button onClick={generateCrop} className="px-4 py-2 bg-[#f4584e] hover:bg-[#f56b61] rounded text-white">
            Save options
          </button>
          <button onClick={handleCancel} className="px-4 py-2 hover:bg-gray-800 rounded text-white">
            Cancel
          </button>
        </div>
      </div>

     {/* Main Canvas Area */}
     <div className="flex-1 flex items-center justify-center p-3 overflow-auto" ref={containerRef}>
        {imageSrcState && (
          <div 
            className="relative m-auto"
            style={{
              width: containerSize.width,
              height: containerSize.height,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <ReactCrop
              crop={crop}
              onChange={(pixelCrop, percentCrop) => onCropChange(pixelCrop, percentCrop)}
              onComplete={(c) => onCompleteCrop(c)}
              aspect={aspect}
              minWidth={20}
              minHeight={20}
              locked={aspect !== null && unlockMaxCoverage} // Lock it when both aspect ratio is set AND unlock max is active
              disabled={unlockMaxCoverage} // Disable interaction when unlock max is active
              ruleOfThirds
              className="max-h-full max-w-full"
            >
              <img
                ref={imgRef}
                src={imageSrcState}
                alt="Crop target"
                onLoad={onImageLoad}
                className="object-contain w-full h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center', userSelect: 'none' }}
                draggable="false"
                crossOrigin="anonymous"
              />
            </ReactCrop>

            {dimensions.width > 0 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 px-2 py-1 text-white text-sm rounded">
                {dimensions.width} × {dimensions.height}
              </div>
            )}
            
            {aspect !== null && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded flex items-center">
                <Lock className="w-3 h-3 mr-1 text-white" />
                <span className="text-white text-xs">
                  {unlockMaxCoverage ? "Maximum coverage" : "Aspect ratio locked"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Toolbar with Presets, Zoom and Reset Controls */}
      <div className="h-16 bg-[#111827] border-t border-gray-800 flex items-center justify-between px-4" ref={bottomToolbarRef}>
        <div className="flex space-x-4 overflow-x-auto">
          <AspectButton onClick={() => handlePresetChange('free')} label="Free" isSelected={selectedPreset === 'free'} />
          <AspectButton onClick={() => handlePresetChange('original')} label="Original" isSelected={selectedPreset === 'original'} />
          <AspectButton onClick={() => handlePresetChange('square')} label="Square" isSelected={selectedPreset === 'square'} />
          <AspectButton onClick={() => handlePresetChange('16:9')} label="16:9" isSelected={selectedPreset === '16:9'} />
          <AspectButton onClick={() => handlePresetChange('9:16')} label="9:16" isSelected={selectedPreset === '9:16'} />
          <AspectButton onClick={() => handlePresetChange('4:3')} label="4:3" isSelected={selectedPreset === '4:3'} />
          <AspectButton onClick={() => handlePresetChange('3:4')} label="3:4" isSelected={selectedPreset === '3:4'} />
          <AspectButton onClick={() => handlePresetChange('3:2')} label="3:2" isSelected={selectedPreset === '3:2'} />
          <AspectButton onClick={() => handlePresetChange('2:3')} label="2:3" isSelected={selectedPreset === '2:3'} />
          <AspectButton onClick={() => handlePresetChange('1:2')} label="1:2" isSelected={selectedPreset === '1:2'} />
          <AspectButton onClick={() => handlePresetChange('2:1')} label="2:1" isSelected={selectedPreset === '2:1'} />
        </div>
        <div className="flex items-center space-x-2">
          {/* Only show the Unlock button when an aspect ratio is selected */}
          {aspect !== null && (
            <UnlockButton />
          )}
          <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-1 hover:bg-gray-800 rounded text-white">
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm min-w-16 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-1 hover:bg-gray-800 rounded text-white">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="px-2 py-1 hover:bg-gray-800 rounded text-white text-sm">
            Reset
          </button>
        </div>
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}