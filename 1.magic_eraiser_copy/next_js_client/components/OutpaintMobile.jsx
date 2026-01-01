import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Settings, ArrowLeft, Crop, Check, X, Split, Maximize, Minimize, ChevronUp, ChevronDown, Menu, Eye, EyeOff } from 'lucide-react';
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

const OutpaintMobile = ({ initialImage, onReset }) => {
    // State to control crop page visibility
    const [showCropPage, setShowCropPage] = useState(false);
    
    // Core state management
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
    const [viewportHeight, setViewportHeight] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipPosition = useRef({ x: 0, y: 0 });
    const [keyboardShortcutPressed, setKeyboardShortcutPressed] = useState('');
    const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0, originalWidth: 0, originalHeight: 0 });

    // Mobile-specific state
    const [showControls, setShowControls] = useState(false); // Start with controls hidden
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [activeTab, setActiveTab] = useState('prompt'); // 'prompt', 'settings', 'history'
    const [drawerTransition, setDrawerTransition] = useState(false); // For smooth animation

    // Refs to prevent unnecessary re-renders
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

    // Crop feature states
    const [cropMode, setCropMode] = useState(false);
    
    // Refs for various UI elements
    const canvasContainerRef = useRef(null);
    const mainContainerRef = useRef(null);
    const headerRef = useRef(null);
    const controlsPanelRef = useRef(null);
    const drawerRef = useRef(null);
    
    // States for visual feedback
    const [showPreviewComparison, setShowPreviewComparison] = useState(false);
    const [previewMode, setPreviewMode] = useState('outpaint'); // 'outpaint' or 'crop'
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

    // Update canvas dimensions - optimized for mobile
    const updateCanvasDimensions = useCallback(() => {
        if (!currentImage || !canvasContainerRef.current || !mainContainerRef.current || !headerRef.current) return;

        // Get actual heights of UI elements
        const headerHeight = headerRef.current.offsetHeight;
        const bottomControlsHeight = 50; // Just the height of the toggle button
        const bottomPadding = 16; // Reduced padding for mobile
        
        // Calculate available container height
        const availableHeight = viewportHeight - headerHeight - bottomControlsHeight - bottomPadding;
        
        // Full width minus padding for mobile
        const availableWidth = mainContainerRef.current.offsetWidth - 24; // 12px padding on each side
        
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
                // Image is wider than container space
                canvasWidth = Math.min(availableWidth, img.width);
                canvasHeight = canvasWidth / imageRatio;
            } else {
                // Image is taller than container space
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
            setContainerSize({
                width: canvasWidth,
                height: canvasHeight
            });
            
            // Calculate scale factor
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

    // Initialize with the provided image
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

    // Generate preview
    const generatePreview = async (imageData) => {
        try {
            setIsLoading(true);
            
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
                
                // Generate client-side preview
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

    // Generate comparison previews
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
    
    // Open comparison view
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
    
    // Add keyboard shortcut for comparison view (still useful for tablets)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            if (e.key === 'c' && !cropMode && currentImage && !showPreviewComparison) {
                e.preventDefault();
                
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

    // Calculate extension for aspect ratio
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

    // Auto-update outpaint preview when aspect ratio changes
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
                
                // API call
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
                
                // Close the controls drawer after successful outpainting
                setShowControls(false);
                
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

    // Handle crop button click
    const handleCropButtonClick = () => {
        if (currentImage) {
            setShowCropPage(true);
        }
    };
    
    // Handle crop completion
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
    
    // Toggle controls panel with animation
    const toggleControls = () => {
        setDrawerTransition(true);
        
        if (showControls) {
            // First trigger animation
            if (drawerRef.current) {
                drawerRef.current.style.transform = 'translateY(100%)';
            }
            
            // Then update state after animation
            setTimeout(() => {
                setShowControls(false);
                setDrawerTransition(false);
            }, 300);
        } else {
            setShowControls(true);
            
            // Trigger the entrance animation after component mount
            setTimeout(() => {
                if (drawerRef.current) {
                    drawerRef.current.style.transform = 'translateY(0)';
                }
                
                setTimeout(() => {
                    setDrawerTransition(false);
                }, 300);
            }, 50);
        }
    };
    
    // Toggle history panel for mobile
    const toggleHistoryPanel = () => {
        setShowHistoryPanel(!showHistoryPanel);
    };
    
    // If showing crop page, render that instead
    if (showCropPage) {
        return (
            <OutpaintCropPage 
                imageSrc={currentImage}
                onCropDone={handleCropDone}
            />
        );
    }
    
    // Render mobile-optimized layout with full-screen drawer
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-white" ref={mainContainerRef}>
            {/* CSS for drawer transitions */}
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
                .drawer-transition {
                    transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);
                }
            `}</style>
            
            <KeyboardShortcutIndicator keyboardShortcutPressed={keyboardShortcutPressed} />
            
            {/* Header - Fixed height, mobile optimized */}
            <div className="py-2 border-b z-10" ref={headerRef}>
                <div className="flex items-center justify-between px-3">
                    <button 
                        onClick={onReset}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-base font-semibold">Outpainting Editor</h1>
                    <button 
                        onClick={toggleHistoryPanel}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* History panel for mobile - slides in from the right */}
            {showHistoryPanel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
                    <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-xs bg-white shadow-lg flex flex-col">
                        <div className="flex justify-between items-center p-3 border-b">
                            <h2 className="font-medium">History</h2>
                            <button onClick={toggleHistoryPanel}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3">
                            <div className="grid grid-cols-2 gap-2">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="relative cursor-pointer group"
                                        onClick={() => {
                                            setCurrentImage(item.image);
                                            toggleHistoryPanel();
                                        }}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.isOriginal ? "Original" : "History"}
                                            className="w-full aspect-video object-cover rounded border border-gray-200"
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
                    </div>
                </div>
            )}

            {/* Main content - Takes available space minus header and controls */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Canvas container - Centered */}
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
                                style={{ userSelect: 'none' }}
                                draggable="false"
                            />

                            {/* Real-time crop preview overlay */}
                            {currentImage && !cropMode && showCropPreview && selectedRatio !== 'Custom' && (
                                <div 
                                    className="absolute inset-0"
                                    style={{ 
                                        transition: 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)',
                                        pointerEvents: 'auto'
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
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-sm">
                                        <p className="text-xs font-medium">Crop Preview</p>
                                        <button 
                                            className="mt-1 px-2 py-0.5 bg-[#abf134] text-black rounded text-xs font-medium hover:bg-[#9ed830] transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCropButtonClick();
                                            }}
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            Open Crop Tool
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Floating action buttons at the bottom */}
                <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3 z-10">
                    <button 
                        onClick={toggleControls}
                        className="px-4 py-2 bg-white shadow-lg rounded-full flex items-center gap-2 text-sm font-medium"
                    >
                        {showControls ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        {showControls ? 'Close Editor' : 'Open Editor'}
                    </button>
                    
                    <button 
                        onClick={handleCropButtonClick}
                        className="px-4 py-2 bg-white shadow-lg rounded-full flex items-center gap-2 text-sm font-medium"
                        disabled={!currentImage}
                    >
                        <Crop className="w-4 h-4" />
                        Crop
                    </button>
                </div>
                
                {/* Full-screen drawer for controls */}
                {showControls && (
                    <div 
                        ref={drawerRef}
                        className={`fixed inset-0 bg-white z-30 ${drawerTransition ? 'drawer-transition' : ''}`}
                        style={{ transform: 'translateY(100%)' }}
                    >
                        {/* Drawer header with close button */}
                        <div className="py-3 px-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Outpainting Controls</h2>
                            <button 
                                onClick={toggleControls}
                                className="p-1 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Tab navigation */}
                        <div className="flex border-b">
                            <button 
                                onClick={() => setActiveTab('prompt')}
                                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'prompt' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                            >
                                Prompt
                            </button>
                            <button 
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
                            >
                                Settings
                            </button>
                        </div>
                        
                        {/* Tab content - scrollable */}
                        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 110px)' }}>
                            {/* Prompt tab */}
                            {activeTab === 'prompt' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Prompt</label>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className="w-full p-3 border rounded-lg text-sm"
                                            rows={5}
                                            placeholder="Describe what you want to add to the image..."
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Negative Prompt</label>
                                        <textarea
                                            value={negativePrompt}
                                            onChange={(e) => setNegativePrompt(e.target.value)}
                                            className="w-full p-3 border rounded-lg text-sm"
                                            rows={3}
                                            placeholder="Describe what you want to avoid in the image..."
                                        />
                                    </div>
                                    
                                    {/* Show preview in prompt tab too */}
                                    {showEnhancedPreview && enhancedPreview && (
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-medium">Preview</label>
                                                <button 
                                                    onClick={() => setShowEnhancedPreview(false)}
                                                    className="text-xs flex items-center gap-1 text-blue-600"
                                                >
                                                    <EyeOff className="w-3.5 h-3.5" /> Hide
                                                </button>
                                            </div>
                                            <div className="relative border rounded-lg overflow-hidden">
                                                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1">
                                                    <Maximize className="w-3 h-3" />
                                                    <span>Preview</span>
                                                </div>
                                                <div className="w-full aspect-video flex items-center justify-center bg-gray-100 overflow-hidden">
                                                    <img 
                                                        src={enhancedPreview}
                                                        alt="Preview" 
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="pt-4">
                                        <button
                                            onClick={handleOutpaint}
                                            disabled={isLoading}
                                            className="w-full px-4 py-3 bg-[#abf134] text-black rounded-lg hover:bg-[#9ed830] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-base font-medium"
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
                                            className="w-full mt-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base font-medium"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Result
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Settings tab */}
                            {activeTab === 'settings' && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                                        <select
                                            value={selectedRatio}
                                            onChange={(e) => setSelectedRatio(e.target.value)}
                                            className="w-full p-3 border rounded-lg text-sm"
                                            style={{
                                                color: selectedRatio === 'Custom' ? '#FFFFFF' : '#000000',
                                                backgroundColor: selectedRatio === 'Custom' ? '#000000' : '#FFFFFF',
                                                fontWeight: 500
                                            }}
                                        >
                                            {Object.keys(aspectRatioOptions).map((ratio) => (
                                                <option 
                                                    key={ratio} 
                                                    value={ratio}
                                                    style={{ color: '#000000', fontWeight: 500 }}
                                                >
                                                    {ratio}
                                                </option>
                                            ))}
                                        </select>
                                        
                                        <div className="flex flex-col mt-2">
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-700 font-medium">
                                                    {selectedRatio !== 'Custom' ? `AI-generated content: ${aiContentPercentage}%` : ''}
                                                </div>
                                                <button
                                                    onClick={openComparisonView}
                                                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-500"
                                                >
                                                    <Split className="w-3 h-3" />
                                                    Compare options
                                                </button>
                                            </div>
                                            
                                            {selectedRatio !== 'Custom' && (
                                                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full" 
                                                        style={{ width: `${aiContentPercentage}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Enhanced Preview toggle */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium">Preview</label>
                                            <button 
                                                onClick={() => setShowEnhancedPreview(!showEnhancedPreview)}
                                                className="text-sm flex items-center gap-1 text-blue-600"
                                            >
                                                {showEnhancedPreview ? (
                                                    <>
                                                        <EyeOff className="w-4 h-4" /> Hide
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-4 h-4" /> Show
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        
                                        {showEnhancedPreview && enhancedPreview && (
                                            <div className="relative border rounded-lg overflow-hidden">
                                                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1">
                                                    <Maximize className="w-3 h-3" />
                                                    <span>Preview</span>
                                                </div>
                                                <div className="w-full aspect-video flex items-center justify-center bg-gray-100 overflow-hidden">
                                                    <img 
                                                        src={enhancedPreview}
                                                        alt="Preview" 
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Extension controls for custom ratio */}
                                    {selectedRatio === 'Custom' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Extend Width: {extendWidth}px</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1024"
                                                    step="64"
                                                    value={extendWidth}
                                                    onChange={(e) => {
                                                        const newWidth = parseInt(e.target.value);
                                                        setExtendWidth(newWidth);
                                                        
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
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Extend Height: {extendHeight}px</label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1024"
                                                    step="64"
                                                    value={extendHeight}
                                                    onChange={(e) => {
                                                        const newHeight = parseInt(e.target.value);
                                                        setExtendHeight(newHeight);
                                                        
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
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                            
                                            <AIContentPercentageDisplay aiContentPercentage={aiContentPercentage} />
                                        </>
                                    )}

                                    {/* Advanced settings toggle */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => setShowSettings(!showSettings)}
                                            className="flex items-center gap-2 w-full p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span className="font-medium">Advanced Settings</span>
                                            {showSettings ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                                        </button>
                                        
                                        {showSettings && (
                                            <div className="mt-3 space-y-4 p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Steps: {steps}</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="20"
                                                            max="100"
                                                            value={steps}
                                                            onChange={(e) => setSteps(parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <span className="text-sm w-8 text-center">{steps}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Guidance Scale: {guidanceScale}</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="20"
                                                            step="0.5"
                                                            value={guidanceScale}
                                                            onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <span className="text-sm w-8 text-center">{guidanceScale}</span>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Seed</label>
                                                    <div className="flex gap-3 items-center">
                                                        <input
                                                            type="number"
                                                            value={seed}
                                                            onChange={(e) => setSeed(parseInt(e.target.value))}
                                                            disabled={randomSeed}
                                                            className="flex-1 p-2 border rounded-lg text-sm"
                                                        />
                                                        <label className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={randomSeed}
                                                                onChange={(e) => setRandomSeed(e.target.checked)}
                                                                className="w-4 h-4"
                                                            />
                                                            Random
                                                        </label>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Samples</label>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="1"
                                                            max="4"
                                                            value={numSamples}
                                                            onChange={(e) => setNumSamples(parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                        <span className="text-sm w-8 text-center">{numSamples}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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

export default OutpaintMobile;