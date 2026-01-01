import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Settings, ArrowLeft, Crop, Check, X, Split, Maximize, Minimize ,} from 'lucide-react';
import { imageUtils, calculateExtensionDimensions, calculateAIContentPercentage } from './OutpaintEditor_s1';
import { 
    Tooltip, 
    KeyboardShortcutIndicator, 
    ComparisonPreview, 
    previewUtils,
    EnhancedPreviewControls,
    AIContentPercentageDisplay
} from './OutpaintEditor_s2';
import OutpaintCropPage from './Outpaint_CropPage';
import OutpaintMobile from './OutpaintMobile';

const OutpaintEditor = ({ initialImage, onReset }) => {
    // Add state to control crop page visibility
    const [showCropPage, setShowCropPage] = useState(false);
    
    // Add state for responsive detection - must be at top level with other hooks
    const [isMobile, setIsMobile] = useState(false);
    
    // State management code
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [enhancedPreview, setEnhancedPreview] = useState(null);
    const [showEnhancedPreview, setShowEnhancedPreview] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [prompt, setPrompt] = useState('A serene natural landscape with beautiful details');
    const [currentImage, setCurrentImage] = useState(null);
    const [history, setHistory] = useState([]);
    const [currentImageDimensions, setCurrentImageDimensions] = useState(null);
    const [forceOutpaint, setForceOutpaint] = useState(false);
    const [canvasScale, setCanvasScale] = useState(1);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    // Add state for tooltip visibility (optional for custom tooltip)
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipPosition = useRef({ x: 0, y: 0 });
    // State for keyboard shortcut visual feedback
    const [keyboardShortcutPressed, setKeyboardShortcutPressed] = useState('');
    // State for enhanced preview dimensions
    const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0, originalWidth: 0, originalHeight: 0 });

    // Refs to prevent unnecessary re-renders and track values
    const pendingStateUpdatesRef = useRef(false);
    const extensionDimensionsRef = useRef({ extendWidth: 128, extendHeight: 0 });
    const cropRecommendationTimerRef = useRef(null);

    // Extension settings
    const [extendWidth, setExtendWidth] = useState(128);
    const [extendHeight, setExtendHeight] = useState(128);
    
    // Advanced settings
    const [steps, setSteps] = useState(30);
    const [guidanceScale, setGuidanceScale] = useState(7.5);
    const [seed, setSeed] = useState(42);
    const [randomSeed, setRandomSeed] = useState(false);
    const [negativePrompt, setNegativePrompt] = useState('ugly, blurry, poor quality, distorted, deformed');
    const [numSamples, setNumSamples] = useState(1);

    // Aspect ratio settings
    const [selectedRatio, setSelectedRatio] = useState('Custom');
    const aspectRatioOptions = {
        'Custom': null,
        '1:1 Square': 1.0,
        '4:3 Standard': 4/3,
        '3:2 Classic': 3/2,
        '16:9 Widescreen': 16/9,
        '2:1 Panorama': 2.0,
        '21:9 Ultrawide': 21/9,
        '9:16 Portrait': 9/16,
        '3:4 Portrait': 3/4,
        '5:4 Photo': 5/4,
        '4:5 Portrait': 4/5,
        '2:3 Portrait': 2/3,
    };

    // Crop feature states - keeping minimal states for future use
    const [cropMode, setCropMode] = useState(false);
    
    // Canvas and container refs
    const canvasContainerRef = useRef(null);
    const mainContainerRef = useRef(null);
    const headerRef = useRef(null);
    const rightPanelRef = useRef(null);
    
    // New state variables for visual feedback
    const [showPreviewComparison, setShowPreviewComparison] = useState(false);
    const [previewMode, setPreviewMode] = useState('outpaint'); // 'outpaint' or 'crop'
    // Store the selected ratio when entering preview to restore it if needed
    const [previousRatio, setPreviousRatio] = useState(null);
    const [cropPreview, setCropPreview] = useState(null);
    const [showCropPreview, setShowCropPreview] = useState(false);
    const [outpaintDimensions, setOutpaintDimensions] = useState({ 
        width: 0, height: 0, originalWidth: 0, originalHeight: 0
    });
    const [comparisonPreviews, setComparisonPreviews] = useState({
        crop: null,
        outpaint: null,
        isGenerating: false
    });
    
    // State for AI content percentage
    const [aiContentPercentage, setAiContentPercentage] = useState(0);

    // Check for mobile viewport on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Standard breakpoint for mobile
        };
        
        // Initial check
        checkMobile();
        
        // Add resize listener
        window.addEventListener('resize', checkMobile);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Calculate available viewport height for the canvas
    useEffect(() => {
        const calculateViewportHeight = () => {
            const vh = window.innerHeight;
            setViewportHeight(vh);
        };

        calculateViewportHeight();
        window.addEventListener('resize', calculateViewportHeight);
        return () => {
            window.removeEventListener('resize', calculateViewportHeight);
        };
    }, []);

    // Function to update canvas dimensions
    const updateCanvasDimensions = useCallback(() => {
        if (!currentImage || !canvasContainerRef.current || !mainContainerRef.current || !headerRef.current) return;

        // Get actual heights of UI elements
        const headerHeight = headerRef.current.offsetHeight;
        const buttonRowHeight = 56; // Height of the buttons row below canvas
        const bottomPadding = 24; // Safe area at the bottom of the screen
        
        // Calculate available container height (remove header, button area, and padding)
        const availableHeight = viewportHeight - headerHeight - buttonRowHeight - bottomPadding;
        
        // Get panel width 
        const panelWidth = rightPanelRef.current ? rightPanelRef.current.offsetWidth : 320;
        
        // Calculate available width for canvas (with spacing)
        const containerWidth = mainContainerRef.current.offsetWidth;
        const availableWidth = containerWidth - panelWidth - 48; // 48px for padding/margins
        
        // Load image to get natural dimensions
        const img = new Image();
        img.onload = () => {
            // Store original image dimensions
            setCurrentImageDimensions({
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height
            });

            // Calculate scale to fit image in available space while maintaining aspect ratio
            const imageRatio = img.width / img.height;
            const containerRatio = availableWidth / availableHeight;
            
            let canvasWidth, canvasHeight;
            
            if (imageRatio > containerRatio) {
                // Image is wider than container space (relative to their heights)
                canvasWidth = Math.min(availableWidth, img.width);
                canvasHeight = canvasWidth / imageRatio;
            } else {
                // Image is taller than container space (relative to their widths)
                canvasHeight = Math.min(availableHeight, img.height);
                canvasWidth = canvasHeight * imageRatio;
            }
            
            // Set a maximum scale for very large images to prevent excessive shrinking
            const maxScale = Math.min(1, availableWidth / img.width, availableHeight / img.height);
            if (maxScale < 1) {
                canvasWidth = img.width * maxScale;
                canvasHeight = img.height * maxScale;
            }
            
            // Set container size
            setContainerSize({
                width: canvasWidth,
                height: canvasHeight
            });
            
            // Calculate the scale ratio between displayed and original dimensions
            const scaleFactor = canvasWidth / img.width;
            setCanvasScale(scaleFactor);
        };
        img.src = currentImage;
    }, [currentImage, viewportHeight]);

    // Update dimensions when window is resized
    useEffect(() => {
        const handleResize = () => {
            updateCanvasDimensions();
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [updateCanvasDimensions]);

    useEffect(() => {
        if (initialImage) {
            setCurrentImage(initialImage);
            setHistory([{
                id: 'original',
                image: initialImage,
                isOriginal: true
            }]);
            generatePreview(initialImage);
            
            // Initialize AI content percentage
            const img = new Image();
            img.onload = () => {
                const currentWidth = img.width;
                const currentHeight = img.height;
                
                const percentage = calculateAIContentPercentage(
                    currentWidth,
                    currentHeight,
                    currentWidth + extendWidth,
                    currentHeight + extendHeight
                );
                
                setAiContentPercentage(percentage);
            };
            img.src = initialImage;
        }
    }, [initialImage]);

    // Update dimensions when image or container changes
    useEffect(() => {
        if (currentImage) {
            updateCanvasDimensions();
        }
    }, [currentImage, updateCanvasDimensions]);

    // Client-side only preview generation - no API calls
    const generatePreview = async (imageData) => {
        try {
            setIsLoading(true);
            
            // First, get original image dimensions
            const img = new Image();
            img.onload = () => {
                const originalWidth = img.width;
                const originalHeight = img.height;
                
                // Calculate new dimensions after outpainting
                const newWidth = originalWidth + extendWidth;
                const newHeight = originalHeight + extendHeight;
                
                // Store dimensions for visualization
                setOutpaintDimensions({
                    width: newWidth,
                    height: newHeight,
                    originalWidth,
                    originalHeight
                });
                
                // Generate client-side preview (no API calls)
                imageUtils.createMockPreview(img, originalWidth, originalHeight, extendWidth, extendHeight, setPreview);
                
                // Generate enhanced preview
                const dimensions = imageUtils.createEnhancedOutpaintPreview(
                    img, 
                    originalWidth, 
                    originalHeight, 
                    extendWidth, 
                    extendHeight, 
                    selectedRatio, 
                    aspectRatioOptions, 
                    setEnhancedPreview
                );
                
                setPreviewDimensions(dimensions);
                setIsLoading(false);
            };
            img.src = imageData;
        } catch (error) {
            console.error('Error generating preview:', error);
            setIsLoading(false);
        }
    };

    // Generate comparison previews using the extracted function
    const generateComparisonPreviews = () => {
        previewUtils.generateComparisonPreviews({
            currentImage,
            selectedRatio,
            setPreviousRatio,
            setShowPreviewComparison,
            aspectRatioOptions,
            pendingStateUpdatesRef,
            setComparisonPreviews,
            extendWidth,
            extendHeight,
            setAiContentPercentage,
            currentImageDimensions
        });
    };
    
    // Use the extracted openComparisonView function
    const openComparisonView = useCallback(() => {
        previewUtils.openComparisonView({
            currentImage,
            pendingStateUpdatesRef,
            selectedRatio,
            setPreviousRatio,
            generateComparisonPreviews
        });
    }, [currentImage, selectedRatio, generateComparisonPreviews]);

    // Handle ratio restoration when dialog is closed
    useEffect(() => {
        if (!showPreviewComparison && previousRatio) {
            requestAnimationFrame(() => {
                setSelectedRatio(previousRatio);
            });
        }
    }, [showPreviewComparison, previousRatio]);
    
    // Add keyboard shortcut for comparison view
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle when not in an input field or textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // Press 'c' key to open comparison view
            if (e.key === 'c' && !cropMode && currentImage && !showPreviewComparison) {
                e.preventDefault();
                
                // Show visual feedback that shortcut was recognized
                setKeyboardShortcutPressed('c');
                setTimeout(() => {
                    setKeyboardShortcutPressed('');
                }, 500);
                
                openComparisonView();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [openComparisonView, cropMode, currentImage, showPreviewComparison]);

    // Update crop preview when aspect ratio changes
    useEffect(() => {
        if (currentImage && selectedRatio !== 'Custom' && !pendingStateUpdatesRef.current) {
            clearTimeout(cropRecommendationTimerRef.current);
            cropRecommendationTimerRef.current = setTimeout(() => {
                imageUtils.generateCropPreview(
                    currentImage, 
                    selectedRatio, 
                    aspectRatioOptions, 
                    pendingStateUpdatesRef, 
                    setCropPreview, 
                    setShowCropPreview
                );
            }, 200);
        }
    }, [selectedRatio, currentImage]);

    // Use the extracted calculateExtensionForAspectRatio function
    const calculateExtensionForAspectRatio = useCallback(() => {
        previewUtils.calculateExtensionForAspectRatio({
            currentImage,
            selectedRatio,
            aspectRatioOptions,
            setExtendWidth,
            setExtendHeight,
            setAiContentPercentage,
            generatePreview,
            showEnhancedPreview,
            setEnhancedPreview
        });
    }, [currentImage, selectedRatio, aspectRatioOptions, showEnhancedPreview]);

    // Auto-update the outpaint preview when aspect ratio changes
    useEffect(() => {
        if (currentImage && selectedRatio !== 'Custom' && !cropMode && !pendingStateUpdatesRef.current) {
            const timer = setTimeout(() => {
                calculateExtensionForAspectRatio();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [currentImage, selectedRatio, cropMode, calculateExtensionForAspectRatio]);

    // Handle outpaint - This function talks to the backend
    const handleOutpaint = async () => {
        try {
            setIsLoading(true);
            
            // Convert base64 to blob
            const response = await fetch(currentImage);
            const blob = await response.blob();
            
            // Create form data
            const formData = new FormData();
            formData.append('file', blob, 'image.png');

            // Create settings object
            const settings = {
                prompt,
                negative_prompt: negativePrompt,
                guidance_scale: guidanceScale,
                num_steps: steps,
                seed: randomSeed ? null : seed,
                extend_width: parseInt(extendWidth),
                extend_height: parseInt(extendHeight),
                num_samples: numSamples
            };

            // Append settings as JSON string
            formData.append('settings', JSON.stringify(settings));

            try {
                console.log('Connecting to backend API for outpainting...');
                
                // This is the ONLY API call in the entire application
                const processResponse = await fetch('http://localhost:8000/api/process-image', {
                    method: 'POST',
                    body: formData,
                });

                if (!processResponse.ok) {
                    throw new Error('Image processing failed');
                }

                const data = await processResponse.json();
                
                // Add results to history
                const newHistoryItems = data.images.map((base64Image, index) => ({
                    id: Date.now() + index,
                    image: `data:image/png;base64,${base64Image}`,
                    isOriginal: false
                }));

                setHistory(prev => [...prev, ...newHistoryItems]);
                setCurrentImage(`data:image/png;base64,${data.images[0]}`);
                
            } catch (error) {
                console.error('Error during API outpainting, using mock result:', error);
                
                // Show user a message about failed backend connection
                alert('Backend server is not available. Using client-side preview instead.');
                
                // Create a mock outpainted result since backend is unavailable
                const img = new Image();
                img.onload = () => {
                    imageUtils.createMockOutpaintedResult(img, extendWidth, extendHeight, setHistory, setCurrentImage);
                };
                img.src = currentImage;
            }
        } catch (error) {
            console.error('Error during outpainting:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Generate crop preview when aspect ratio changes
    useEffect(() => {
        if (selectedRatio !== 'Custom' && currentImage && !cropMode && !pendingStateUpdatesRef.current) {
            setTimeout(() => {
                imageUtils.generateCropPreview(
                    currentImage, 
                    selectedRatio, 
                    aspectRatioOptions, 
                    pendingStateUpdatesRef, 
                    setCropPreview, 
                    setShowCropPreview
                );
            }, 150);
        } else if (cropMode || selectedRatio === 'Custom') {
            setShowCropPreview(false);
        }
    }, [selectedRatio, currentImage, cropMode, aspectRatioOptions]);

    // Handle when user clicks the crop button - Modified to open the crop page
    const handleCropButtonClick = () => {
        if (currentImage) {
            setShowCropPage(true);
        }
    };
    
    // Handle the completion of crop operation
    const handleCropDone = (croppedImageUrl) => {
        if (croppedImageUrl) {
            // Add the cropped image to history
            const newHistoryItem = {
                id: Date.now(),
                image: croppedImageUrl,
                isOriginal: false
            };
            
            setHistory(prev => [...prev, newHistoryItem]);
            setCurrentImage(croppedImageUrl);
        }
        
        // Hide the crop page
        setShowCropPage(false);
    };
    
    // Render logic - first check if we should show crop page
    if (showCropPage) {
        return (
            <OutpaintCropPage 
                imageSrc={currentImage}
                onCropDone={handleCropDone}
            />
        );
    }
    
    // Determine which version to render based on screen size
    // IMPORTANT: This render logic now happens after all hooks are declared
    // to avoid the "Rendered fewer hooks than expected" error
    if (isMobile) {
        return (
            <OutpaintMobile 
                initialImage={initialImage} 
                onReset={onReset} 
            />
        );
    }
    
    // Desktop version
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden" ref={mainContainerRef}>
            {/* Keyboard shortcut visual feedback */}
            <style jsx global>{`
                @keyframes keypress-animation {
                    0% { opacity: 0; transform: scale(0.5); }
                    25% { opacity: 1; transform: scale(1.2); }
                    50% { opacity: 1; transform: scale(1); }
                    75% { opacity: 0.7; transform: scale(1); }
                    100% { opacity: 0; transform: scale(1); }
                }
                .animate-keypress {
                    animation: keypress-animation 0.5s ease-out forwards;
                }
            `}</style>
            
            <KeyboardShortcutIndicator keyboardShortcutPressed={keyboardShortcutPressed} />
            
            {/* Header - Fixed height */}
            <div className="py-3 border-b" ref={headerRef}>
                <div className="flex items-center justify-between px-4">
                    <button 
                        onClick={onReset}
                        className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-lg font-semibold">Outpainting Editor</h1>
                    <div className="w-16"></div>
                </div>
            </div>

            {/* Main content with canvas and controls - Flex to fill remaining space */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left panel - Image display area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Canvas container - Centered with flex */}
                    <div className="flex-1 flex items-center justify-center p-3" ref={canvasContainerRef}>
                        {currentImage && (
                            <div 
                                className="relative m-auto"
                                style={{
                                    width: containerSize.width,
                                    height: containerSize.height,
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                }}
                            >
                                <img 
                                    src={currentImage} 
                                    alt="Current" 
                                    className="object-contain w-full h-full"
                                    style={{ 
                                        userSelect: 'none'
                                    }}
                                    draggable="false"
                                />

                                {/* Real-time crop preview overlay when aspect ratio is selected but not in crop mode */}
                                {currentImage && !cropMode && showCropPreview && selectedRatio !== 'Custom' && (
                                    <div 
                                        className="absolute inset-0"
                                        style={{ 
                                            transition: 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)',
                                            pointerEvents: 'auto'  // Changed to allow clicks through
                                        }}
                                    >
                                        {/* Semi-transparent overlay for areas that would be cropped out */}
                                        <div className="absolute inset-0 bg-black bg-opacity-50" style={{ pointerEvents: 'none' }}>
                                            {/* This will be the "window" showing what would be kept */}
                                            <div 
                                                className="absolute bg-transparent border-2 border-[#abf134]"
                                                style={{
                                                    left: `${(outpaintDimensions.originalWidth / 2 - (outpaintDimensions.originalHeight * aspectRatioOptions[selectedRatio]) / 2) * canvasScale}px`,
                                                    top: '0px',
                                                    width: `${(outpaintDimensions.originalHeight * aspectRatioOptions[selectedRatio]) * canvasScale}px`,
                                                    height: `${outpaintDimensions.originalHeight * canvasScale}px`,
                                                    display: currentImageDimensions && currentImageDimensions.aspectRatio > aspectRatioOptions[selectedRatio] ? 'block' : 'none'
                                                }}
                                            />
                                            <div 
                                                className="absolute bg-transparent border-2 border-[#abf134]"
                                                style={{
                                                    left: '0px',
                                                    top: `${(outpaintDimensions.originalHeight / 2 - (outpaintDimensions.originalWidth / aspectRatioOptions[selectedRatio]) / 2) * canvasScale}px`,
                                                    width: `${outpaintDimensions.originalWidth * canvasScale}px`,
                                                    height: `${(outpaintDimensions.originalWidth / aspectRatioOptions[selectedRatio]) * canvasScale}px`,
                                                    display: currentImageDimensions && currentImageDimensions.aspectRatio < aspectRatioOptions[selectedRatio] ? 'block' : 'none'
                                                }}
                                            />
                                        </div>
                                        
                                        {/* Overlay with information */}
                                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-sm">
                                            <p className="font-medium">Crop Preview</p>
                                            <button 
                                                className="mt-1 px-2 py-1 bg-[#abf134] text-black rounded text-xs font-medium hover:bg-[#9ed830] transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent event bubbling
                                                    handleCropButtonClick();
                                                }}
                                                style={{ pointerEvents: 'auto' }} // Explicitly enable pointer events
                                            >
                                                Open Crop Tool
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Fixed-height toolbar with crop/preview controls */}
                    <div className="px-4 py-2">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-medium">Current Image</h2>
                            <Tooltip text="Open crop tool">
                                <button 
                                    onClick={handleCropButtonClick}
                                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                                    disabled={!currentImage}
                                    style={{
                                        fontWeight: 500,
                                        color: '#000000',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                    }}
                                >
                                    <Crop className="w-4 h-4" />
                                    Crop
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Right panel - Controls */}
                <div className="w-80 border-l overflow-y-auto" ref={rightPanelRef}>
                    <div className="p-4 space-y-6">
                        {/* History */}
                        <div>
                            <h2 className="text-lg font-medium mb-2">History</h2>
                            <div className="flex flex-wrap gap-2">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative cursor-pointer group"
                                        onClick={() => setCurrentImage(item.image)}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.isOriginal ? "Original" : "History"}
                                            className="w-20 h-16 object-cover rounded border border-gray-200"
                                            style={{ userSelect: 'none' }}
                                            draggable="false"
                                        />
                                        {item.isOriginal && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                                                Original
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Prompt */}
                        <div>
                            <h2 className="text-lg font-medium mb-2">Prompt</h2>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full p-2 border rounded"
                                rows={3}
                                placeholder="Describe what you want to add..."
                            />
                        </div>

                        {/* Extension Settings */}
                        <div>
                            <h2 className="text-lg font-medium mb-2">Extension Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Aspect Ratio</label>
                                    <select
                                        value={selectedRatio}
                                        onChange={(e) => setSelectedRatio(e.target.value)}
                                        className="w-full p-2 border rounded mt-1"
                                        style={{
                                            color: selectedRatio === 'Custom' ? '#FFFFFF' : '#000000', // White color for "Custom"
                                            backgroundColor: selectedRatio === 'Custom' ? '#000000' : '#FFFFFF', // Optional: Black background for contrast
                                            fontWeight: 500,
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                        }}
                                    >
                                        {Object.keys(aspectRatioOptions).map((ratio) => (
                                            <option 
                                                key={ratio} 
                                                value={ratio}
                                                style={{ 
                                                    color: '#000000', 
                                                    fontWeight: 500
                                                }}
                                            >
                                                {ratio}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    <div className="flex flex-col mt-1">
                                        <div className="flex justify-between items-center">
                                            <div className="text-xs text-gray-700 font-medium">
                                                {selectedRatio !== 'Custom' ? `AI-generated content: ${aiContentPercentage}%` : ''}
                                            </div>
                                            <Tooltip text="Compare crop vs outpaint options (Press 'c' key)">
                                                <button
                                                    onClick={openComparisonView}
                                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-500"
                                                    data-compare-options-button
                                                >
                                                    <Split className="w-3 h-3" />
                                                    Compare options (c)
                                                </button>
                                            </Tooltip>
                                        </div>
                                        
                                        {selectedRatio !== 'Custom' && (
                                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className="bg-blue-600 h-1.5 rounded-full" 
                                                    style={{ width: `${aiContentPercentage}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                               {/* Enhanced Outpaint Preview using the extracted component */}
                                <EnhancedPreviewControls 
                                    showEnhancedPreview={showEnhancedPreview}
                                    setShowEnhancedPreview={setShowEnhancedPreview}
                                    enhancedPreview={enhancedPreview}
                                    aiContentPercentage={aiContentPercentage}
                                />
                                
                                {/* Extension controls and buttons */}
                                {selectedRatio === 'Custom' && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium">Extend Width: {extendWidth}px</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1024"
                                                step="64"
                                                value={extendWidth}
                                                onChange={(e) => {
                                                    const newWidth = parseInt(e.target.value);
                                                    setExtendWidth(newWidth);
                                                    
                                                    // Update AI content percentage
                                                    if (currentImageDimensions) {
                                                        const percentage = calculateAIContentPercentage(
                                                            currentImageDimensions.width,
                                                            currentImageDimensions.height,
                                                            currentImageDimensions.width + newWidth,
                                                            currentImageDimensions.height + extendHeight
                                                        );
                                                        setAiContentPercentage(percentage);
                                                    }
                                                    
                                                    generatePreview(currentImage);
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Extend Height: {extendHeight}px</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="1024"
                                                step="64"
                                                value={extendHeight}
                                                onChange={(e) => {
                                                    const newHeight = parseInt(e.target.value);
                                                    setExtendHeight(newHeight);
                                                    
                                                    // Update AI content percentage
                                                    if (currentImageDimensions) {
                                                        const percentage = calculateAIContentPercentage(
                                                            currentImageDimensions.width,
                                                            currentImageDimensions.height,
                                                            currentImageDimensions.width + extendWidth,
                                                            currentImageDimensions.height + newHeight
                                                        );
                                                        setAiContentPercentage(percentage);
                                                    }
                                                    
                                                    generatePreview(currentImage);
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                        
                                        {/* Using extracted AIContentPercentageDisplay component */}
                                        <AIContentPercentageDisplay aiContentPercentage={aiContentPercentage} />
                                    </>
                                )}

                                {/* Advanced Settings Toggle */}
                                <div>
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="flex items-center gap-2 w-full p-2 text-left text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span className="text-sm font-medium">Advanced Settings</span>
                                    </button>
                                    
                                    {showSettings && (
                                        <div className="mt-2 space-y-4">
                                            <div>
                                                <label className="text-sm font-medium">Steps: {steps}</label>
                                                <input
                                                    type="range"
                                                    min="20"
                                                    max="100"
                                                    value={steps}
                                                    onChange={(e) => setSteps(parseInt(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Guidance Scale: {guidanceScale}</label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="20"
                                                    step="0.5"
                                                    value={guidanceScale}
                                                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="text-sm font-medium">Seed</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={seed}
                                                        onChange={(e) => setSeed(parseInt(e.target.value))}
                                                        disabled={randomSeed}
                                                        className="w-full p-2 border rounded"
                                                    />
                                                    <label className="flex items-center gap-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={randomSeed}
                                                            onChange={(e) => setRandomSeed(e.target.checked)}
                                                        />
                                                        Random
                                                    </label>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Negative Prompt</label>
                                                <textarea
                                                    value={negativePrompt}
                                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                                    className="w-full p-2 border rounded"
                                                    rows={3}
                                                    placeholder="Enter negative prompt..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Generate/Download Buttons */}
                                <div className="space-y-2 pt-3">
                                    <button
                                        onClick={handleOutpaint}
                                        disabled={isLoading}
                                        className="w-full px-4 py-2 bg-[#abf134] text-black rounded hover:bg-[#9ed830] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Processing...' : 'Generate Outpainting'}
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            if (!currentImage) return;
                                            const link = document.createElement('a');
                                            link.download = `outpainted-${Date.now()}.png`;
                                            link.href = currentImage;
                                            link.click();
                                        }}
                                        disabled={!currentImage}
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        style={{
                                            fontWeight: 500,
                                            color: currentImage ? '#000000' : '#9CA3AF',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                        }}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Result
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Comparison modal - Using the extracted component */}
            <ComparisonPreview 
                showPreviewComparison={showPreviewComparison}
                setShowPreviewComparison={setShowPreviewComparison}
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                comparisonPreviews={comparisonPreviews}
                setCropMode={setCropMode}
                setForceOutpaint={setForceOutpaint}
                setAutoAspectRatioCrop={() => {}}
                previousRatio={previousRatio}
                setSelectedRatio={setSelectedRatio}
                aiContentPercentage={aiContentPercentage}
            />
        </div>
    );
};

export default OutpaintEditor;