import React, { useState, useRef, useEffect } from 'react';
import { Download, ArrowLeft, RotateCcw, Zap, HandMetal } from 'lucide-react';

const BlurEditor = ({ initialImage, onReset }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [error, setError] = useState(null);
    const [blurStrength, setBlurStrength] = useState(45);
    const [mask, setMask] = useState(null);
    const [points, setPoints] = useState([]);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [overlayMask, setOverlayMask] = useState(null);
    const [detectionMode, setDetectionMode] = useState("manual"); // "manual" or "auto"
    const overlayCanvasRef = useRef(null);

    useEffect(() => {
        if (initialImage) {
            const img = new Image();
            img.onload = () => {
                setImageSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
                setCurrentImage(initialImage);

                // Initialize overlay canvas
                if (overlayCanvasRef.current) {
                    overlayCanvasRef.current.width = img.naturalWidth;
                    overlayCanvasRef.current.height = img.naturalHeight;
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
                }
            };
            img.src = initialImage;
        }
    }, [initialImage]);

    const handleImageClick = async (e) => {
        if (isLoading || detectionMode === "auto") return;

        const image = e.target;
        const rect = image.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const relativeX = Math.round((x / rect.width) * imageSize.width);
        const relativeY = Math.round((y / rect.height) * imageSize.height);

        const newPoints = [...points, { left: relativeX, top: relativeY }];
        setPoints(newPoints);

        // Generate preview mask immediately after adding a point
        await generatePreviewMask(newPoints);
    };

    const generatePreviewMask = async (currentPoints) => {
        try {
            const response = await fetch('http://localhost:8000/api/generate-mask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: currentImage,
                    points: currentPoints
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate preview mask');
            }

            const data = await response.json();
            setOverlayMask(data.mask);

            // Draw the overlay
            if (overlayCanvasRef.current) {
                const img = new Image();
                img.onload = () => {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#abf134';
                    
                    // Draw the mask
                    ctx.drawImage(img, 0, 0);
                    ctx.globalCompositeOperation = 'source-in';
                    ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    
                    // Reset composite operation
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                };
                img.src = data.mask;
            }

        } catch (err) {
            console.error('Error generating preview mask:', err);
        }
    };

    const handleGenerateMask = async () => {
        if (detectionMode === "manual" && points.length === 0) return;

        try {
            setIsLoading(true);
            setError(null);

            let response;
            if (detectionMode === "auto") {
                response = await fetch('http://localhost:8000/api/auto-detect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image_data: currentImage
                    })
                });
            } else {
                response = await fetch('http://localhost:8000/api/generate-mask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image_data: currentImage,
                        points: points
                    })
                });
            }

            if (!response.ok) {
                throw new Error(`Failed to generate mask (${detectionMode} mode)`);
            }

            const data = await response.json();
            setMask(data.mask);

            // Draw the overlay with the final mask
            if (overlayCanvasRef.current) {
                const img = new Image();
                img.onload = () => {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#abf134';
                    
                    // Draw the mask
                    ctx.drawImage(img, 0, 0);
                    ctx.globalCompositeOperation = 'source-in';
                    ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    
                    // Reset composite operation
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                };
                img.src = data.mask;
            }

        } catch (err) {
            setError(err.message);
            console.error('Error generating mask:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoBlur = async () => {
        if (!currentImage) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            console.log("Starting auto-blur process");
            console.log("Image data type:", typeof currentImage);
            
            // Make sure image data is a string
            const imageData = typeof currentImage === 'string' ? currentImage : String(currentImage);
            
            const payload = {
                image_data: imageData,
                blur_strength: blurStrength
            };
            
            console.log("Sending request with blur strength:", blurStrength);
            
            const response = await fetch('http://localhost:8000/api/auto-blur', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            console.log("Response status:", response.status);
            
            if (!response.ok) {
                let errorMessage = `Failed to apply auto blur: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    console.error("Error details:", errorData);
                    if (errorData.detail) {
                        errorMessage += ` - ${errorData.detail}`;
                    }
                } catch (e) {}
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log("Received response data");
            
            setProcessedImage(data.blurred_image);
            setMask(data.mask);
            
            // Draw the overlay with the final mask
            if (overlayCanvasRef.current && data.mask) {
                const img = new Image();
                img.onload = () => {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#abf134';
                    
                    // Draw the mask
                    ctx.drawImage(img, 0, 0);
                    ctx.globalCompositeOperation = 'source-in';
                    ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    
                    // Reset composite operation
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                };
                img.src = data.mask;
            }
            
        } catch (err) {
            setError(err.message);
            console.error('Error applying auto blur:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetMask = () => {
        setMask(null);
        setPoints([]);
        setOverlayMask(null);
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
    };

    const handleApplyBlur = async () => {
        if (!mask) return;

        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('http://localhost:8000/api/apply-blur', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: currentImage,
                    mask: mask,
                    blur_strength: blurStrength
                })
            });

            if (!response.ok) {
                throw new Error('Failed to apply blur');
            }

            const data = await response.json();
            setProcessedImage(data.blurred_image);

        } catch (err) {
            setError(err.message);
            console.error('Error applying blur:', err);
        } finally {
            setIsLoading(false);
        }
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
                <h1 className="text-2xl font-semibold">Background Blur</h1>
                <div className="w-24"></div>
            </div>

            {/* Main Content */}
            <div className="flex h-[calc(100vh-72px)]">
                {/* Left panel - Images */}
                <div className="flex-1 p-4 overflow-auto">
                    <div className="space-y-6">
                        {/* Original Image with Points and Overlay */}
                        <div className="border rounded-lg p-4">
                            <h2 className="text-lg font-medium mb-2">
                                Original Image 
                                {detectionMode === "manual" && points.length > 0 ? ` (${points.length} points)` : ''}
                                {detectionMode === "auto" ? ' (Auto Detection)' : ''}
                            </h2>
                            <div className="relative inline-block">
                                {currentImage && (
                                    <>
                                        <img 
                                            src={currentImage} 
                                            alt="Original" 
                                            className={`max-w-full h-auto ${detectionMode === "manual" ? 'cursor-crosshair' : 'cursor-default'}`}
                                            onClick={handleImageClick}
                                            style={{ maxHeight: 'calc(100vh - 300px)' }}
                                        />
                                        <canvas
                                            ref={overlayCanvasRef}
                                            className="absolute top-0 left-0 pointer-events-none"
                                            style={{
                                                width: '100%',
                                                height: '100%'
                                            }}
                                        />
                                        {detectionMode === "manual" && points.map((point, index) => (
                                            <div
                                                key={index}
                                                className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                                                style={{
                                                    left: `${(point.left / imageSize.width) * 100}%`,
                                                    top: `${(point.top / imageSize.height) * 100}%`
                                                }}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Mask Preview */}
                        {mask && (
                            <div className="border rounded-lg p-4">
                                <h2 className="text-lg font-medium mb-2">Generated Mask</h2>
                                <img 
                                    src={mask} 
                                    alt="Mask" 
                                    className="max-w-full h-auto"
                                    style={{ maxHeight: 'calc(100vh - 300px)' }}
                                />
                            </div>
                        )}

                        {/* Processed Image */}
                        {processedImage && (
                            <div className="border rounded-lg p-4">
                                <h2 className="text-lg font-medium mb-2">Blurred Image</h2>
                                <img 
                                    src={processedImage} 
                                    alt="Blurred" 
                                    className="max-w-full h-auto"
                                    style={{ maxHeight: 'calc(100vh - 300px)' }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel - Controls */}
                <div className="w-80 border-l p-4 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Detection Mode Selection */}
                        <div>
                            <h2 className="text-lg font-medium mb-4">Detection Mode</h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        setDetectionMode("manual");
                                        handleResetMask();
                                    }}
                                    className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 ${
                                        detectionMode === "manual" 
                                            ? 'bg-[#abf134] text-black' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                   <HandMetal className="w-4 h-4" />
                                    Manual
                                </button>
                                <button
                                    onClick={() => {
                                        setDetectionMode("auto");
                                        handleResetMask();
                                    }}
                                    className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 ${
                                        detectionMode === "auto" 
                                            ? 'bg-[#abf134] text-black' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    Auto
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-700">
                                {detectionMode === "manual" 
                                    ? "Click on the subject you want to keep in focus. The background will be blurred."
                                    : "Auto-detection will automatically identify the main subject in your image."}
                            </p>
                        </div>

                        {/* Blur Controls */}
                        <div>
                            <h2 className="text-lg font-medium mb-4">Blur Settings</h2>
                            <div>
                                <label className="text-sm font-medium">Blur Strength: {blurStrength}</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="99"
                                    step="2"
                                    value={blurStrength}
                                    onChange={(e) => setBlurStrength(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 text-red-500 p-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            {detectionMode === "auto" ? (
                                <button
                                    onClick={handleAutoBlur}
                                    disabled={isLoading || !currentImage}
                                    className="w-full px-4 py-2 bg-[#abf134] text-black rounded hover:bg-[#9ed830] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Processing...' : 'Auto-Detect & Blur'}
                                    <Zap className="w-4 h-4" />
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleGenerateMask}
                                        disabled={isLoading || points.length === 0}
                                        className="w-full px-4 py-2 bg-[#abf134] text-black rounded hover:bg-[#9ed830] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Processing...' : `Generate Mask${points.length > 0 ? ` (${points.length} points)` : ''}`}
                                    </button>

                                    <button
                                        onClick={handleApplyBlur}
                                        disabled={isLoading || !mask}
                                        className="w-full px-4 py-2 bg-[#abf134] text-black rounded hover:bg-[#9ed830] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Processing...' : 'Apply Blur'}
                                    </button>
                                </>
                            )}
                            
                            {processedImage && (
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = processedImage;
                                        link.download = `blurred-${Date.now()}.png`;
                                        link.click();
                                    }}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Result
                                </button>
                            )}
                        </div>

                        {/* Reset Controls */}
                        <div className="space-y-2">
                            {(points.length > 0 || mask) && (
                                <button
                                    onClick={handleResetMask}
                                    className="w-full px-4 py-2 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset Selection
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlurEditor;