import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Settings, Eye, EyeOff, ArrowLeft, Crop, Check, X, Split, Maximize, Minimize, Scissors } from 'lucide-react';
import { imageUtils, cropUtils, calculateExtensionDimensions, calculateAIContentPercentage } from './OutpaintEditor_s1';

// Modified ComparisonPreview component with AI content percentage display
const ComparisonPreview = ({ 
    showPreviewComparison,
    setShowPreviewComparison,
    previewMode,
    setPreviewMode,
    comparisonPreviews,
    setCropMode,
    setForceOutpaint,
    setAutoAspectRatioCrop,
    previousRatio,
    setSelectedRatio,
    aiContentPercentage
}) => {
    if (!showPreviewComparison) {
        return null;
    }
    
    // Enhanced close handler that ensures ratio restoration
    const handleClose = () => {
        // Ensure ratio is restored properly
        if (previousRatio) {
            setSelectedRatio(previousRatio);
        }
        setShowPreviewComparison(false);
    };
    
    // Continue with selected mode
    const handleContinue = () => {
        setShowPreviewComparison(false);
        
        if (previewMode === 'crop') {
            setCropMode(true);
            setAutoAspectRatioCrop(true);
        } else {
            setForceOutpaint(true);
            // For outpaint, make sure to keep the previously selected ratio
            if (previousRatio) {
                setSelectedRatio(previousRatio);
            }
        }
    };
    
    // Handle ESC key and clicks outside the dialog
    useEffect(() => {
        const handleOutsideClick = (e) => {
            // If clicked outside the dialog content
            if (e.target.classList.contains('comparison-modal-overlay')) {
                handleClose();
            }
        };
        
        const handleEscKey = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        
        // Add event listeners
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleEscKey);
        
        // Clean up
        return () => {
            document.removeEventListener('click', handleOutsideClick);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [previousRatio]);
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 comparison-modal-overlay"
        >
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Choose Your Approach</h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">Press 'c' to open</span>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto p-4">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Crop Option - Entire card is clickable */}
                        <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 
                                ${previewMode === 'crop' 
                                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}
                            onClick={() => setPreviewMode('crop')}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium flex items-center gap-1">
                                    <Scissors className="w-4 h-4" />
                                    Crop Approach
                                </h4>
                                <div 
                                    className={`px-3 py-1 text-sm rounded ${
                                        previewMode === 'crop' 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-100'
                                    }`}
                                >
                                    Selected
                                </div>
                            </div>
                            <div className="aspect-video relative bg-gray-100 mb-3 flex items-center justify-center overflow-hidden">
                                {comparisonPreviews.isGenerating ? (
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <div className="text-gray-500">Generating crop preview...</div>
                                    </div>
                                ) : comparisonPreviews.crop ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={comparisonPreviews.crop} 
                                            alt="Crop Preview" 
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-500">No preview available</div>
                                )}
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-green-700">
                                    Preserves original image quality
                                </p>
                                <ul className="text-gray-700 space-y-1">
                                    <li className="flex items-start gap-1">
                                        <span className="text-green-500 font-bold mt-1">✓</span>
                                        Better quality - uses only your original pixels
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className="text-green-500 font-bold mt-1">✓</span>
                                        Faster - no AI generation required
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className="text-green-500 font-bold mt-1">✓</span>
                                        Predictable results every time
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        {/* Outpaint Option - Entire card is clickable */}
                        <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 
                                ${previewMode === 'outpaint' 
                                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}
                            onClick={() => setPreviewMode('outpaint')}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium flex items-center gap-1">
                                    <Maximize className="w-4 h-4" />
                                    Outpaint Approach
                                </h4>
                                <div 
                                    className={`px-3 py-1 text-sm rounded ${
                                        previewMode === 'outpaint' 
                                            ? 'bg-blue-500 text-white' 
                                            : 'bg-gray-100'
                                    }`}
                                >
                                    Selected
                                </div>
                            </div>
                            <div className="aspect-video relative bg-gray-100 mb-3 flex items-center justify-center overflow-hidden">
                                {comparisonPreviews.isGenerating ? (
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <div className="text-gray-500">Generating enhanced preview...</div>
                                    </div>
                                ) : comparisonPreviews.outpaint ? (
                                    <div className="relative w-full h-full">
                                        <img 
                                            src={comparisonPreviews.outpaint} 
                                            alt="Outpaint Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-500">No preview available</div>
                                )}
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-amber-700">
                                    AI extends your image to new dimensions
                                </p>
                                <div className="mt-1 mb-2 bg-blue-50 px-3 py-2 rounded border border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-blue-800">AI-generated content:</span>
                                        <span className="font-bold text-blue-800">{aiContentPercentage}%</span>
                                    </div>
                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${aiContentPercentage}%` }}></div>
                                    </div>
                                </div>
                                <ul className="text-gray-700 space-y-1">
                                    <li className="flex items-start gap-1">
                                        <span className="text-green-500 font-bold mt-1">✓</span>
                                        Keeps all of your original image
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className="text-green-500 font-bold mt-1">✓</span>
                                        Expands the canvas with AI-generated content
                                    </li>
                                    <li className="flex items-start gap-1">
                                        <span className="text-amber-500 font-bold mt-1">!</span>
                                        Results vary based on prompt and settings
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleContinue}
                            className="px-4 py-2 bg-blue-500 text-white rounded"
                        >
                            Continue with {previewMode === 'crop' ? 'Crop' : 'Outpaint'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OutpaintEditor = ({ initialImage, onReset }) => {
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
    const [cropTransitioning, setCropTransitioning] = useState(false);
    const [canvasScale, setCanvasScale] = useState(1);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [viewportHeight, setViewportHeight] = useState(0);
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

    // Crop feature states
    const [cropMode, setCropMode] = useState(false);
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState(null);
    const cropContainerRef = useRef(null);
    const cropImageRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const mainContainerRef = useRef(null);
    const headerRef = useRef(null);
    const rightPanelRef = useRef(null);
    const [autoAspectRatioCrop, setAutoAspectRatioCrop] = useState(true);

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
            
            // Update the image container style directly for more precise control
            if (cropContainerRef.current && cropImageRef.current) {
                cropContainerRef.current.style.width = `${canvasWidth}px`;
                cropContainerRef.current.style.height = `${canvasHeight}px`;
                cropImageRef.current.style.width = `${canvasWidth}px`;
                cropImageRef.current.style.height = `${canvasHeight}px`;
            }
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

    // Preview generation with AI content percentage and enhanced outpaint preview
    const generateComparisonPreviews = () => {
        if (!currentImage || pendingStateUpdatesRef.current) {
            return;
        }
        
        // Track the current ratio before showing dialog
        setPreviousRatio(selectedRatio);
        
        // Start tracking that we're generating previews
        pendingStateUpdatesRef.current = true;
        
        // Show the comparison dialog
        setShowPreviewComparison(true);
        
        // Calculate AI content percentage if it hasn't been calculated yet
        if (aiContentPercentage === 0 && currentImageDimensions) {
            const img = new Image();
            img.onload = () => {
                const currentWidth = img.width;
                const currentHeight = img.height;
                
                if (selectedRatio !== 'Custom') {
                    const targetRatio = aspectRatioOptions[selectedRatio];
                    const dimensions = calculateExtensionDimensions(
                        currentWidth, 
                        currentHeight, 
                        targetRatio
                    );
                    
                    const percentage = calculateAIContentPercentage(
                        currentWidth,
                        currentHeight,
                        dimensions.width,
                        dimensions.height
                    );
                    
                    setAiContentPercentage(percentage);
                } else {
                    const percentage = calculateAIContentPercentage(
                        currentWidth,
                        currentHeight,
                        currentWidth + extendWidth,
                        currentHeight + extendHeight
                    );
                    
                    setAiContentPercentage(percentage);
                }
            };
            img.src = currentImage;
        }
        
        // Show loading state
        setComparisonPreviews({ crop: null, outpaint: null, isGenerating: true });
        
        // Use our existing functions to generate better previews
        const processImage = () => {
            const img = new Image();
            
            img.onload = () => {
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                // Generate crop preview using the proper aspect ratio
                let cropPreviewData;
                
                if (selectedRatio !== 'Custom') {
                    // Use the target aspect ratio for the crop
                    const targetRatio = aspectRatioOptions[selectedRatio];
                    const currentRatio = imgWidth / imgHeight;
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let cropWidth, cropHeight, cropX, cropY;
                    
                    // Calculate dimensions while preserving as much of the image as possible
                    if (currentRatio > targetRatio) {
                        // Image is wider than target ratio, maintain height
                        cropHeight = imgHeight;
                        cropWidth = imgHeight * targetRatio;
                        // Center horizontally
                        cropX = (imgWidth - cropWidth) / 2;
                        cropY = 0;
                    } else {
                        // Image is taller than target ratio, maintain width
                        cropWidth = imgWidth;
                        cropHeight = imgWidth / targetRatio;
                        // Center vertically
                        cropX = 0;
                        cropY = (imgHeight - cropHeight) / 2;
                    }
                    
                    // Set canvas dimensions to the crop size
                    canvas.width = cropWidth;
                    canvas.height = cropHeight;
                    
                    // Draw the cropped portion to the canvas
                    ctx.drawImage(
                        img,
                        cropX, cropY, cropWidth, cropHeight,
                        0, 0, cropWidth, cropHeight
                    );
                    
                    cropPreviewData = canvas.toDataURL('image/png');
                } else {
                    // For custom ratio, just use a centered crop at 85% size
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Fixed crop dimensions
                    const cropWidth = imgWidth * 0.85;
                    const cropHeight = imgHeight * 0.85;
                    const cropX = (imgWidth - cropWidth) / 2;
                    const cropY = (imgHeight - cropHeight) / 2;
                    
                    // Set canvas dimensions
                    canvas.width = cropWidth;
                    canvas.height = cropHeight;
                    
                    // Draw the cropped portion
                    ctx.drawImage(
                        img,
                        cropX, cropY, cropWidth, cropHeight,
                        0, 0, cropWidth, cropHeight
                    );
                    
                    cropPreviewData = canvas.toDataURL('image/png');
                }
                
                // Generate enhanced outpaint preview
                let outpaintPreviewData;
                let outpaintTempCanvas = document.createElement('canvas');
                
                // Create a temporary storage for the enhanced preview
                const setTempOutpaintPreview = (dataUrl) => {
                    outpaintPreviewData = dataUrl;
                };
                
                // Use our existing enhanced preview generator
                if (selectedRatio !== 'Custom') {
                    const targetRatio = aspectRatioOptions[selectedRatio];
                    // Calculate extension dimensions
                    const dimensions = calculateExtensionDimensions(
                        imgWidth, 
                        imgHeight, 
                        targetRatio
                    );
                    
                    // Use the enhanced preview generator
                    imageUtils.createEnhancedOutpaintPreview(
                        img, 
                        imgWidth, 
                        imgHeight, 
                        dimensions.extendWidth, 
                        dimensions.extendHeight, 
                        selectedRatio, 
                        aspectRatioOptions, 
                        setTempOutpaintPreview
                    );
                } else {
                    // For custom dimensions
                    imageUtils.createEnhancedOutpaintPreview(
                        img, 
                        imgWidth, 
                        imgHeight, 
                        extendWidth, 
                        extendHeight, 
                        selectedRatio, 
                        aspectRatioOptions, 
                        setTempOutpaintPreview
                    );
                }
                
                // Update state once all previews are generated
                // Use a short timeout to ensure the enhanced preview has been set
                setTimeout(() => {
                    setComparisonPreviews({
                        crop: cropPreviewData,
                        outpaint: outpaintPreviewData,
                        isGenerating: false
                    });
                    pendingStateUpdatesRef.current = false;
                }, 100);
            };
            
            img.src = currentImage;
        };
        
        // Start processing after a short delay
        setTimeout(processImage, 50);
    };
    
    // Direct openComparisonView function without calculations
    const openComparisonView = useCallback(() => {
        if (!currentImage || pendingStateUpdatesRef.current) {
            return;
        }
        
        // Save the current ratio
        setPreviousRatio(selectedRatio);
        
        // Generate previews
        generateComparisonPreviews();
    }, [currentImage, selectedRatio]);

    
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

    // Updated calculation for aspect ratio with AI percentage
    const calculateExtensionForAspectRatio = useCallback(() => {
        if (!currentImage || selectedRatio === 'Custom') return;

        const img = new Image();
        img.onload = () => {
            const currentWidth = img.width;
            const currentHeight = img.height;
            const targetRatio = aspectRatioOptions[selectedRatio];
            
            // Use the utility function to calculate dimensions
            const dimensions = calculateExtensionDimensions(
                currentWidth, 
                currentHeight, 
                targetRatio
            );
            
            // Calculate AI content percentage
            const percentage = calculateAIContentPercentage(
                currentWidth,
                currentHeight,
                dimensions.width,
                dimensions.height
            );
            
            // Only update state in a batched way
            requestAnimationFrame(() => {
                setExtendWidth(dimensions.extendWidth);
                setExtendHeight(dimensions.extendHeight);
                setAiContentPercentage(percentage);
                generatePreview(currentImage);
                
                // Generate enhanced preview directly if needed
                if (showEnhancedPreview) {
                    imageUtils.createEnhancedOutpaintPreview(
                        img, 
                        currentWidth, 
                        currentHeight, 
                        dimensions.extendWidth, 
                        dimensions.extendHeight, 
                        selectedRatio, 
                        aspectRatioOptions, 
                        setEnhancedPreview
                    );
                }
            });
        };
        img.src = currentImage;
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

    // Reset crop area when entering crop mode
    useEffect(() => {
        if (cropMode && currentImage) {
            if (autoAspectRatioCrop && selectedRatio !== 'Custom') {
                // Don't initialize to full size first, just set transitioning
                setCropTransitioning(true);
                
                // Small delay to ensure transition works properly
                setTimeout(() => {
                    cropUtils.setOptimalCropArea(
                        currentImage, 
                        cropMode, 
                        selectedRatio, 
                        aspectRatioOptions, 
                        setCropTransitioning, 
                        setCropArea, 
                        updateCanvasDimensions
                    );
                }, 50);
            } else {
                const img = new Image();
                img.onload = () => {
                    // Initialize crop area to full image size with transition
                    setCropTransitioning(true);
                    setCropArea({
                        x: 0,
                        y: 0,
                        width: img.width,
                        height: img.height
                    });
                    
                    // Update canvas dimensions after crop area is set
                    updateCanvasDimensions();
                    
                    setTimeout(() => {
                        setCropTransitioning(false);
                    }, 350);
                };
                img.src = currentImage;
            }
        }
    }, [cropMode, currentImage, updateCanvasDimensions, autoAspectRatioCrop, selectedRatio, aspectRatioOptions]);

    // Handle aspect ratio changes with smooth transitions
    useEffect(() => {
        if (cropMode && currentImage && autoAspectRatioCrop && selectedRatio !== 'Custom') {
            cropUtils.setOptimalCropArea(
                currentImage, 
                cropMode, 
                selectedRatio, 
                aspectRatioOptions, 
                setCropTransitioning, 
                setCropArea, 
                updateCanvasDimensions
            );
        }
    }, [selectedRatio, autoAspectRatioCrop, cropMode, currentImage, aspectRatioOptions, updateCanvasDimensions]);

    // Using utilities from support file for crop operations
    const handleCropStart = (e) => {
        cropUtils.handleCropStart(
            e, cropMode, cropContainerRef, cropArea, canvasScale, 
            setResizeHandle, setIsDragging, setDragStart, 
            setCropArea, setAutoAspectRatioCrop
        );
    };

    const handleCropMove = (e) => {
        cropUtils.handleCropMove(
            e, isDragging, cropMode, cropContainerRef, canvasScale, 
            cropImageRef, cropArea, resizeHandle, dragStart, selectedRatio, 
            autoAspectRatioCrop, aspectRatioOptions, setDragStart, 
            setCropArea, setResizeHandle
        );
    };

    const handleCropEnd = () => setIsDragging(false);

    const applyCrop = () => {
        cropUtils.applyCrop(
            currentImage, cropArea, setHistory, 
            setCurrentImage, setCropMode, setAutoAspectRatioCrop
        );
    };

    const cancelCrop = () => {
        setCropMode(false);
        setAutoAspectRatioCrop(true); // Reset to auto mode for next time
    };

    // Handle aspect ratio change directly from the crop UI
    const handleAspectRatioChange = (ratio) => {
        setCropTransitioning(true);
        setSelectedRatio(ratio);
        setAutoAspectRatioCrop(true);
    };

    // Reset crop to original image size
    const resetCropToOriginal = () => {
        cropUtils.resetCropToOriginal(
            currentImage, cropMode, setCropTransitioning, setCropArea, 
            setSelectedRatio, setAutoAspectRatioCrop, updateCanvasDimensions
        );
    };

    // Simple tooltip component
    const Tooltip = ({ text, children }) => {
        return (
            <div className="relative group">
                {children}
                <div className="absolute z-50 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 bottom-full mb-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    {text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
        );
    };

    // Keyboard shortcut indicator component
    const KeyboardShortcutIndicator = () => {
        if (!keyboardShortcutPressed) return null;
        
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-black bg-opacity-70 text-white text-4xl font-bold rounded-full w-24 h-24 flex items-center justify-center animate-keypress">
                    {keyboardShortcutPressed}
                </div>
            </div>
        );
    };
    
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
            
            <KeyboardShortcutIndicator />
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
                                ref={cropContainerRef}
                                className="relative m-auto"
                                style={{
                                    width: containerSize.width,
                                    height: containerSize.height,
                                    maxWidth: '100%',
                                    maxHeight: '100%'
                                }}
                                onMouseDown={handleCropStart}
                                onMouseMove={handleCropMove}
                                onMouseUp={handleCropEnd}
                                onMouseLeave={handleCropEnd}
                                onTouchStart={(e) => {
                                    const touch = e.touches[0];
                                    const evt = { 
                                        preventDefault: () => e.preventDefault(),
                                        clientX: touch.clientX,
                                        clientY: touch.clientY
                                    };
                                    handleCropStart(evt);
                                }}
                                onTouchMove={(e) => {
                                    if (isDragging) {
                                        const touch = e.touches[0];
                                        const evt = { 
                                            preventDefault: () => e.preventDefault(),
                                            clientX: touch.clientX,
                                            clientY: touch.clientY
                                        };
                                        handleCropMove(evt);
                                    }
                                }}
                                onTouchEnd={() => handleCropEnd()}
                            >
                                <img 
                                    ref={cropImageRef}
                                    src={currentImage} 
                                    alt="Current" 
                                    className="object-contain w-full h-full"
                                    style={{ 
                                        userSelect: 'none', 
                                        pointerEvents: cropMode ? 'none' : 'auto'
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
                                                    setCropMode(true);
                                                    setAutoAspectRatioCrop(true);
                                                }}
                                                style={{ pointerEvents: 'auto' }} // Explicitly enable pointer events
                                            >
                                                Open Crop Tool
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {cropMode && (
                                    <>
                                        {/* Semi-transparent overlay */}
                                        <div className="absolute inset-0 bg-black bg-opacity-50" style={{ pointerEvents: 'none' }} />
                                        
                                        {/* Crop selection area */}
                                        <div 
                                            className="absolute border-2 border-[#abf134] box-content cursor-move"
                                            style={{
                                                left: `${cropArea.x * canvasScale}px`,
                                                top: `${cropArea.y * canvasScale}px`,
                                                width: `${cropArea.width * canvasScale}px`,
                                                height: `${cropArea.height * canvasScale}px`,
                                                transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none',
                                                pointerEvents: 'none'
                                            }}
                                        >
                                            {/* Clear view of the selected area */}
                                            <div className="absolute inset-0" style={{
                                                clipPath: `inset(0 0 0 0)`,
                                                marginLeft: `-2px`,
                                                marginTop: `-2px`,
                                                width: `calc(100% + 4px)`,
                                                height: `calc(100% + 4px)`,
                                                pointerEvents: 'none'
                                            }}>
                                                <img 
                                                    src={currentImage} 
                                                    alt="Crop" 
                                                    className="max-w-none"
                                                    style={{
                                                        position: 'absolute',
                                                        left: `-${cropArea.x * canvasScale}px`,
                                                        top: `-${cropArea.y * canvasScale}px`,
                                                        width: cropImageRef.current?.width || '100%',
                                                        height: 'auto',
                                                        pointerEvents: 'none',
                                                        userSelect: 'none',
                                                        draggable: 'false',
                                                        transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                    }}
                                                />
                                            </div>

                                            {/* Resize handles */}
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white -left-2 -top-2 cursor-nw-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white -right-2 -top-2 cursor-ne-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white -left-2 -bottom-2 cursor-sw-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white -right-2 -bottom-2 cursor-se-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white left-1/2 -ml-1.5 -top-2 cursor-n-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white left-1/2 -ml-1.5 -bottom-2 cursor-s-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white top-1/2 -mt-1.5 -left-2 cursor-w-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />
                                            <div className="absolute w-3 h-3 bg-[#abf134] border border-white top-1/2 -mt-1.5 -right-2 cursor-e-resize" 
                                                style={{ 
                                                    pointerEvents: 'auto',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }} 
                                            />

                                            {/* Display crop dimensions */}
                                            <div 
                                                className="absolute -top-8 left-0 bg-black bg-opacity-75 text-white px-2 py-1 text-xs rounded" 
                                                style={{ 
                                                    pointerEvents: 'none',
                                                    transition: cropTransitioning ? 'all 0.35s cubic-bezier(0.2, 0, 0.2, 1)' : 'none'
                                                }}
                                            >
                                                {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Fixed-height toolbar with crop/preview controls */}
                    <div className="px-4 py-2">
                        {!cropMode ? (
                            <div className="flex justify-between items-center">
                                <h2 className="text-sm font-medium">Current Image</h2>
                                <Tooltip text="Open crop tool">
                                    <button 
                                        onClick={() => setCropMode(true)}
                                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                                        disabled={!currentImage}
                                    >
                                        <Crop className="w-4 h-4" />
                                        Crop
                                    </button>
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="flex justify-between">
                                {/* Aspect ratio buttons in a row for crop mode */}
                                <div className="flex flex-wrap gap-1">
                                    <button 
                                        onClick={resetCropToOriginal}
                                        className="px-2 py-1 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        Original
                                    </button>
                                    {Object.entries(aspectRatioOptions).filter(([key]) => key !== 'Custom').slice(0, 5).map(([key, ratio]) => (
                                        <button 
                                            key={key} 
                                            onClick={() => handleAspectRatioChange(key)}
                                            className={`px-2 py-1 text-xs rounded ${selectedRatio === key ? 'bg-[#abf134] text-black' : 'bg-gray-200 text-gray-800'}`}
                                        >
                                            {key.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                                
                                {/* Apply/Cancel buttons */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={applyCrop}
                                        className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                                    >
                                        <Check className="w-4 h-4" />
                                        Apply
                                    </button>
                                    <button 
                                        onClick={cancelCrop}
                                        className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
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

                        {/* Prompt (hide in crop mode) */}
                        {!cropMode && (
                            <>
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
                                            >
                                                {Object.keys(aspectRatioOptions).map((ratio) => (
                                                    <option key={ratio} value={ratio}>{ratio}</option>
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
                                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"
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
                                        
                                        {/* Enhanced Outpaint Preview */}
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-sm font-medium">Outpaint Preview</h3>
                                                <button 
                                                    onClick={() => setShowEnhancedPreview(!showEnhancedPreview)}
                                                    className="text-xs flex items-center gap-1 text-gray-600 hover:text-gray-800"
                                                >
                                                    {showEnhancedPreview ? (
                                                        <>
                                                            <Eye className="w-3.5 h-3.5" /> Hide
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="w-3.5 h-3.5" /> Show
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            
                                            {showEnhancedPreview && enhancedPreview && (
                                                <div className="relative border rounded overflow-hidden mb-4">
                                                    <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1">
                                                        <Maximize className="w-3 h-3" />
                                                        <span>Preview only</span>
                                                    </div>
                                                    <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-white shadow-md text-xs rounded-full">
                                                        <div className="flex items-center gap-1">
                                                            <span>AI: <b>{aiContentPercentage}%</b></span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full aspect-video flex items-center justify-center bg-gray-100 overflow-hidden">
                                                        <img 
                                                            src={enhancedPreview}
                                                            alt="Enhanced Outpaint Preview" 
                                                            className="max-w-full max-h-full object-contain"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
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
                                                
                                                {/* Show AI percentage for custom mode too */}
                                                <div className="bg-blue-50 p-3 rounded border border-blue-100">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-semibold text-blue-800">AI-generated content:</span>
                                                        <span className="font-bold text-blue-800">{aiContentPercentage}%</span>
                                                    </div>
                                                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${aiContentPercentage}%` }}></div>
                                                    </div>
                                                </div>
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
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Result
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
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
                setAutoAspectRatioCrop={setAutoAspectRatioCrop}
                previousRatio={previousRatio}
                setSelectedRatio={setSelectedRatio}
                aiContentPercentage={aiContentPercentage}
            />
        </div>
    );
};

export default OutpaintEditor;