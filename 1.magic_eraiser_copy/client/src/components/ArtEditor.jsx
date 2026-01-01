import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, Sliders, RefreshCw } from 'lucide-react';

const ArtEditor = ({ initialImage, onReset }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [error, setError] = useState(null);
    const [selectedStyle, setSelectedStyle] = useState('Line Art');
    const [styleParams, setStyleParams] = useState({});
    const [processingOptions, setProcessingOptions] = useState({
        normalize: true,
        enhance_contrast: false,
        preserve_details: true
    });
    const [availableStyles, setAvailableStyles] = useState({});
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [isLoadingStyles, setIsLoadingStyles] = useState(true);

    // Load available styles and their parameters from the API
    useEffect(() => {
        const fetchStyles = async () => {
            try {
                setIsLoadingStyles(true);
                const response = await fetch('http://localhost:8000/styles/');
                if (!response.ok) {
                    throw new Error('Failed to fetch styles');
                }
                const data = await response.json();
                setAvailableStyles(data);
                
                // Initialize style parameters with defaults from the first style
                if (data.styles && Object.keys(data.styles).length > 0) {
                    const firstStyle = Object.keys(data.styles)[0];
                    const initialParams = {};
                    
                    if (data.styles[firstStyle].params) {
                        Object.entries(data.styles[firstStyle].params).forEach(([key, value]) => {
                            initialParams[key] = value.default;
                        });
                    }
                    
                    setStyleParams(initialParams);
                }
            } catch (err) {
                console.error('Error fetching styles:', err);
                setError('Failed to load style information. Please refresh the page.');
            } finally {
                setIsLoadingStyles(false);
            }
        };

        fetchStyles();
    }, []);

    // Update style parameters when style changes
    useEffect(() => {
        if (availableStyles.styles && availableStyles.styles[selectedStyle]) {
            const newParams = {};
            
            if (availableStyles.styles[selectedStyle].params) {
                Object.entries(availableStyles.styles[selectedStyle].params).forEach(([key, value]) => {
                    newParams[key] = value.default;
                });
            }
            
            setStyleParams(newParams);
        }
    }, [selectedStyle, availableStyles]);

    useEffect(() => {
        setCurrentImage(initialImage);
    }, [initialImage]);

    const handleStyleChange = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Convert base64 to blob
            const response = await fetch(currentImage);
            const blob = await response.blob();

            // Create form data
            const formData = new FormData();
            formData.append('file', blob, 'image.png');
            formData.append('style', selectedStyle);
            
            // Add style parameters
            formData.append('params', JSON.stringify(styleParams));
            
            // Add processing options
            formData.append('options', JSON.stringify(processingOptions));

            // Send to backend
            const apiResponse = await fetch('http://localhost:8000/process-image/', {
                method: 'POST',
                body: formData,
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.detail || 'Style processing failed');
            }

            const processedBlob = await apiResponse.blob();
            if (!processedBlob.size) {
                throw new Error('Received empty response from server');
            }
            
            const processedUrl = URL.createObjectURL(processedBlob);
            setProcessedImage(processedUrl);

        } catch (err) {
            setError(err.message);
            console.error('Error during style processing:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderParameterControls = () => {
        if (!availableStyles.styles || !availableStyles.styles[selectedStyle]) {
            return <p>Loading style parameters...</p>;
        }

        const styleInfo = availableStyles.styles[selectedStyle];
        
        if (!styleInfo.params || Object.keys(styleInfo.params).length === 0) {
            return <p>No adjustable parameters for this style.</p>;
        }

        return (
            <div className="space-y-4">
                {Object.entries(styleInfo.params).map(([paramName, paramInfo]) => (
                    <div key={paramName}>
                        <div className="flex justify-between">
                            <label className="text-sm font-medium">{paramInfo.description || paramName}</label>
                            <span className="text-xs text-gray-500">
                                {styleParams[paramName] || paramInfo.default}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={paramInfo.min}
                            max={paramInfo.max}
                            step={paramName.includes('intensity') || paramName.includes('weight') ? 0.1 : 1}
                            value={styleParams[paramName] || paramInfo.default}
                            onChange={(e) => setStyleParams(prev => ({
                                ...prev,
                                [paramName]: paramName.includes('intensity') || paramName.includes('weight') 
                                    ? parseFloat(e.target.value) 
                                    : parseInt(e.target.value)
                            }))}
                            className="w-full mt-1"
                        />
                    </div>
                ))}
            </div>
        );
    };

    const renderProcessingOptions = () => {
        if (!availableStyles.processing_options) {
            return null;
        }

        return (
            <div className="space-y-3 mt-4 pt-3 border-t">
                <h3 className="text-sm font-bold">Advanced Processing Options</h3>
                {Object.entries(availableStyles.processing_options).map(([optionName, optionInfo]) => (
                    <div key={optionName} className="flex items-center">
                        <input
                            type="checkbox"
                            id={optionName}
                            checked={processingOptions[optionName]}
                            onChange={(e) => setProcessingOptions(prev => ({
                                ...prev,
                                [optionName]: e.target.checked
                            }))}
                            className="mr-2"
                        />
                        <label htmlFor={optionName} className="text-sm">
                            {optionInfo.description || optionName}
                        </label>
                    </div>
                ))}
            </div>
        );
    };

    const getStyleDescription = () => {
        if (!availableStyles.styles || !availableStyles.styles[selectedStyle]) {
            return '';
        }
        
        return availableStyles.styles[selectedStyle].description || '';
    };

    return (
        <div className="fixed inset-0 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b">
                <button 
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <h1 className="text-2xl font-semibold">Art Style Transfer</h1>
                <div className="w-24"></div>
            </div>

            {/* Main Content */}
            <div className="flex h-[calc(100vh-72px)]">
                {/* Left panel - Images */}
                <div className="flex-1 p-4 overflow-auto">
                    <div className="space-y-6">
                        {/* Original Image */}
                        <div className="border rounded-lg p-4">
                            <h2 className="text-lg font-medium mb-2">Original Image</h2>
                            {currentImage && (
                                <img 
                                    src={currentImage} 
                                    alt="Original" 
                                    className="max-w-full h-auto"
                                />
                            )}
                        </div>

                        {/* Processed Image */}
                        {processedImage && (
                            <div className="border rounded-lg p-4">
                                <h2 className="text-lg font-medium mb-2">Styled Image</h2>
                                <img 
                                    src={processedImage} 
                                    alt="Styled" 
                                    className="max-w-full h-auto"
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = processedImage;
                                            link.download = `styled-${selectedStyle.toLowerCase().replace(' ', '-')}-${Date.now()}.png`;
                                            link.click();
                                        }}
                                        className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-2 text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel - Controls */}
                <div className="w-80 border-l p-4 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Style Selection */}
                        <div>
                            <h2 className="text-lg font-medium mb-2">Select Style</h2>
                            <select
                                value={selectedStyle}
                                onChange={(e) => setSelectedStyle(e.target.value)}
                                className="w-full p-2 border rounded"
                                disabled={isLoadingStyles}
                            >
                                {isLoadingStyles ? (
                                    <option>Loading styles...</option>
                                ) : (
                                    availableStyles.styles && 
                                    Object.keys(availableStyles.styles).map(styleName => (
                                        <option key={styleName} value={styleName}>
                                            {styleName}
                                        </option>
                                    ))
                                )}
                            </select>
                            {getStyleDescription() && (
                                <p className="text-sm text-gray-600 mt-1">{getStyleDescription()}</p>
                            )}
                        </div>

                        {/* Style Controls */}
                        <div>
                            <h2 className="text-lg font-medium mb-4">Style Controls</h2>
                            {renderParameterControls()}
                            
                            <button 
                                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                className="flex items-center gap-2 mt-4 text-sm text-gray-600"
                            >
                                <Sliders className="w-4 h-4" />
                                {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                            </button>
                            
                            {showAdvancedOptions && renderProcessingOptions()}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={handleStyleChange}
                                disabled={isLoading || !currentImage || isLoadingStyles}
                                className="w-full px-4 py-3 bg-[#abf134] text-black rounded hover:bg-[#9ed830] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Apply Style'
                                )}
                            </button>
                        </div>

                        {/* Information Section */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium mb-2">Style Tips</h3>
                            <p className="text-sm text-gray-600">
                                • Adjust parameters to find the perfect look<br />
                                • Advanced options can improve quality<br />
                                • Some styles work better with certain images<br />
                                • Processing large images may take longer<br />
                                • Try combining different styles by applying them sequentially
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtEditor;