import React, { useState, useEffect } from 'react';
import { X, Split, Maximize, Scissors, Crop, Check, Eye, EyeOff } from 'lucide-react';
import { imageUtils, calculateExtensionDimensions, calculateAIContentPercentage } from './OutpaintEditor_s1';

// UI Utility Components
export const Tooltip = ({ text, children }) => {
    return (
        <div className="relative group">
            {children}
            <div className="absolute z-50 hidden group-hover:block bg-gray-500 text-white text-xs rounded px-2 py-1 bottom-full mb-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                {text}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-500"></div>
            </div>
        </div>
    );
};

// Keyboard shortcut indicator component
export const KeyboardShortcutIndicator = ({ keyboardShortcutPressed }) => {
    if (!keyboardShortcutPressed) return null;
    
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-black bg-opacity-70 text-white text-4xl font-bold rounded-full w-24 h-24 flex items-center justify-center animate-keypress">
                {keyboardShortcutPressed}
            </div>
        </div>
    );
};

// Preview Generation Utilities
export const previewUtils = {
    // Generate comparison previews for crop and outpaint options
    generateComparisonPreviews: (params) => {
        const {
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
        } = params;

        if (!currentImage || pendingStateUpdatesRef.current) {
            return;
        }
        
        // Track the current ratio before showing dialog
        setPreviousRatio(selectedRatio);
        
        // Start tracking that we're generating previews
        pendingStateUpdatesRef.current = true;
        
        // Show the comparison dialog
        setShowPreviewComparison(true);
        
        // Calculate AI content percentage if needed
        if (currentImageDimensions) {
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
        
        // Generate previews
        const processImage = () => {
            const img = new Image();
            
            img.onload = () => {
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                // Generate crop preview
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
    },
    
    // Direct helper to open comparison view
    openComparisonView: (params) => {
        const {
            currentImage, 
            pendingStateUpdatesRef, 
            selectedRatio, 
            setPreviousRatio,
            generateComparisonPreviews
        } = params;
        
        if (!currentImage || pendingStateUpdatesRef.current) {
            return;
        }
        
        // Save the current ratio
        setPreviousRatio(selectedRatio);
        
        // Generate previews
        generateComparisonPreviews();
    },

    // Calculate extension for aspect ratio with AI percentage
    calculateExtensionForAspectRatio: (params) => {
        const {
            currentImage,
            selectedRatio,
            aspectRatioOptions,
            setExtendWidth,
            setExtendHeight,
            setAiContentPercentage,
            generatePreview,
            showEnhancedPreview,
            setEnhancedPreview
        } = params;

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
    }
};

// Modified ComparisonPreview component with AI content percentage display
export const ComparisonPreview = ({ 
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
                        <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: 600, 
                            color: '#000000',
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}>Choose Your Approach</h3>
                        <span style={{ 
                            fontSize: '12px', 
                            padding: '4px 8px', 
                            backgroundColor: '#F3F4F6', 
                            borderRadius: '4px',
                            color: '#000000',
                            fontWeight: 500,
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}>Press 'c' to open</span>
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
                                <h4 style={{ 
                                    fontWeight: 500, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    color: '#000000',
                                    fontSize: '16px',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                    <Scissors className="w-4 h-4" />
                                    Crop Approach
                                </h4>
                                <div style={{ 
                                    padding: '4px 12px', 
                                    fontSize: '14px', 
                                    borderRadius: '4px',
                                    backgroundColor: previewMode === 'crop' ? '#3B82F6' : '#F3F4F6',
                                    color: previewMode === 'crop' ? '#FFFFFF' : '#000000',
                                    fontWeight: 500,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
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
                                <h4 style={{ 
                                    fontWeight: 500, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '4px',
                                    color: '#000000',
                                    fontSize: '16px',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                    <Maximize className="w-4 h-4" />
                                    Outpaint Approach
                                </h4>
                                <div style={{ 
                                    padding: '4px 12px', 
                                    fontSize: '14px', 
                                    borderRadius: '4px',
                                    backgroundColor: previewMode === 'outpaint' ? '#3B82F6' : '#F3F4F6',
                                    color: previewMode === 'outpaint' ? '#FFFFFF' : '#000000',
                                    fontWeight: 500,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
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
                                        <span style={{ 
                                            fontSize: '14px', 
                                            fontWeight: 500,
                                            color: '#000000',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                        }}>AI-generated content:</span>
                                        <span style={{ 
                                            fontWeight: 500, 
                                            color: '#000000',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                        }}>{aiContentPercentage}%</span>
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
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '4px',
                                backgroundColor: '#FFFFFF',
                                cursor: 'pointer',
                                color: '#000000',
                                fontWeight: 500,
                                fontSize: '14px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}
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

// Enhanced Preview Controls component
export const EnhancedPreviewControls = ({
    showEnhancedPreview,
    setShowEnhancedPreview,
    enhancedPreview,
    aiContentPercentage
}) => {
    return (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Outpaint Preview</h3>
                <button 
                    onClick={() => setShowEnhancedPreview(!showEnhancedPreview)}
                    className="text-xs flex items-center gap-1 text-white hover:text-gray-300"
                >
                    {showEnhancedPreview ? (
                        <>
                            <Eye className="w-3.5 h-3.5" /> Hide
                        </>
                    ) : (
                        <>
                            <EyeOff className="w-3.5 h-3.5" /> Show
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
                            <span style={{ 
                                fontWeight: 500,
                                color: '#000000',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}>AI: <b>{aiContentPercentage}%</b></span>
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
    );
};

// UI for AI Content Percentage Display
export const AIContentPercentageDisplay = ({ aiContentPercentage }) => {
    return (
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
            <div className="flex justify-between items-center">
                <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 500,
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>AI-generated content:</span>
                <span style={{ 
                    fontWeight: 500, 
                    color: '#000000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>{aiContentPercentage}%</span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${aiContentPercentage}%` }}></div>
            </div>
        </div>
    );
};