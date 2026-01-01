import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, Sliders, RefreshCw, Upload } from 'lucide-react';

// API base URL
const API_BASE_URL = 'http://localhost:8008';

const ArtEditor = ({ initialImage, onReset }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [error, setError] = useState(null);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [imageId, setImageId] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    
    // Default parameters from the API
    const [sketchParams, setSketchParams] = useState({
        sigma: 5.0,
        blend_factor: 0.9,
        contrast: 1.5,
        line_intensity: 8.0,
        detail_retention: 0.1
    });

    // Define parameter constraints
    const parameterInfo = {
        sigma: {
            min: 1.0,
            max: 20.0,
            step: 0.1,
            description: "Detail Level (Gaussian blur sigma)"
        },
        blend_factor: {
            min: 0.0,
            max: 1.0,
            step: 0.05,
            description: "Blend Factor"
        },
        contrast: {
            min: 0.5,
            max: 3.0,
            step: 0.1,
            description: "Contrast Enhancement"
        },
        line_intensity: {
            min: 1.0,
            max: 20.0,
            step: 0.5,
            description: "Line Intensity/Strength"
        },
        detail_retention: {
            min: 0.0,
            max: 1.0,
            step: 0.05,
            description: "Detail Retention"
        }
    };

    useEffect(() => {
        setCurrentImage(initialImage);
    }, [initialImage]);

    // Step 1: Upload the image to the server
    const handleUpload = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setProcessedImage(null);
            setDownloadUrl(null);

            // Convert base64 to blob
            const response = await fetch(currentImage);
            const blob = await response.blob();

            // Create form data
            const formData = new FormData();
            formData.append('file', blob, 'image.png');

            // Upload to backend
            const uploadResponse = await fetch(`${API_BASE_URL}/upload/`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.detail || 'Upload failed');
            }

            const uploadData = await uploadResponse.json();
            setImageId(uploadData.image_id);
            
            // Proceed to processing
            await handleProcess(uploadData.image_id);

        } catch (err) {
            setError(`Upload error: ${err.message}`);
            console.error('Error during image upload:', err);
            setIsLoading(false);
        }
    };

    // Step 2: Process the uploaded image
    const handleProcess = async (id) => {
        try {
            // Use the passed ID or the state one
            const imageIdToProcess = id || imageId;
            
            if (!imageIdToProcess) {
                throw new Error('No image uploaded yet');
            }

            // Send processing request with parameters
            const processResponse = await fetch(`${API_BASE_URL}/process/${imageIdToProcess}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sketchParams),
            });

            if (!processResponse.ok) {
                const errorData = await processResponse.json();
                throw new Error(errorData.detail || 'Processing failed');
            }

            const processData = await processResponse.json();
            setDownloadUrl(processData.download_url);
            
            // Fetch the processed image
            await handleFetchProcessedImage(processData.download_url);

        } catch (err) {
            setError(`Processing error: ${err.message}`);
            console.error('Error during image processing:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Fetch the processed image
    const handleFetchProcessedImage = async (url) => {
        try {
            const fullUrl = `${API_BASE_URL}${url}`;
            const imageResponse = await fetch(fullUrl);
            
            if (!imageResponse.ok) {
                throw new Error('Failed to fetch processed image');
            }
            
            const imageBlob = await imageResponse.blob();
            const imageObjectUrl = URL.createObjectURL(imageBlob);
            setProcessedImage(imageObjectUrl);
            
        } catch (err) {
            setError(`Error fetching processed image: ${err.message}`);
            console.error('Error fetching processed image:', err);
        }
    };

    // Handle download of the processed image
    const handleDownload = () => {
        if (processedImage) {
            const link = document.createElement('a');
            link.href = processedImage;
            link.download = `pencil-sketch-${Date.now()}.png`;
            link.click();
        }
    };

    // Render parameter controls
    const renderParameterControls = () => {
        return (
            <div className="space-y-4">
                {Object.entries(parameterInfo).map(([paramName, paramInfo]) => (
                    <div key={paramName}>
                        <div className="flex justify-between">
                            <label className="text-sm font-medium">{paramInfo.description}</label>
                            <span className="text-xs text-gray-500">
                                {sketchParams[paramName].toFixed(2)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={paramInfo.min}
                            max={paramInfo.max}
                            step={paramInfo.step}
                            value={sketchParams[paramName]}
                            onChange={(e) => setSketchParams(prev => ({
                                ...prev,
                                [paramName]: parseFloat(e.target.value)
                            }))}
                            className="w-full mt-1"
                        />
                    </div>
                ))}
            </div>
        );
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
                <h1 className="text-2xl font-semibold">Pencil Sketch Creator</h1>
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
                                <h2 className="text-lg font-medium mb-2">Pencil Sketch</h2>
                                <img 
                                    src={processedImage} 
                                    alt="Pencil Sketch" 
                                    className="max-w-full h-auto"
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleDownload}
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
                        {/* Controls Title */}
                        <div>
                            <h2 className="text-lg font-medium mb-2">Pencil Sketch Settings</h2>
                            <p className="text-sm text-gray-600">
                                Adjust the parameters below to customize your pencil sketch effect.
                            </p>
                        </div>

                        {/* Parameter Controls */}
                        <div>
                            <h2 className="text-lg font-medium mb-4">Effect Parameters</h2>
                            {renderParameterControls()}
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={handleUpload}
                                disabled={isLoading || !currentImage}
                                className="w-full px-4 py-3 bg-[#abf134] text-black rounded hover:bg-[#9ed830] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        {imageId ? 'Processing...' : 'Uploading...'}
                                    </>
                                ) : (
                                    imageId ? (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Update Sketch
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Create Sketch
                                        </>
                                    )
                                )}
                            </button>
                            
                            {imageId && processedImage && (
                                <button
                                    onClick={() => handleProcess()}
                                    disabled={isLoading}
                                    className="w-full px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Apply New Parameters
                                </button>
                            )}
                        </div>

                        {/* Information Section */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium mb-2">Pencil Sketch Tips</h3>
                            <p className="text-sm text-gray-600">
                                • Higher sigma value creates a more abstract sketch<br />
                                • Increase contrast for darker, more defined lines<br />
                                • Line intensity controls how pronounced the edges appear<br />
                                • Detail retention preserves original image details<br />
                                • For best results, use high-resolution images with good contrast
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArtEditor;