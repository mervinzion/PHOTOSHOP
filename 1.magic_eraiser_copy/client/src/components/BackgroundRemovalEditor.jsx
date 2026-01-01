import React, { useState, useRef, useEffect } from 'react';
import { Download, ArrowLeft, Settings, RotateCcw, Wand2, Zap } from 'lucide-react';

const BackgroundRemovalEditor = ({ initialImage, onReset }) => {
    const [loadingStates, setLoadingStates] = useState({
        maskGeneration: false,
        backgroundRemoval: false,
        autoDetection: false
    });
    const [currentImage, setCurrentImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [points, setPoints] = useState([]);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState(null);
    const [backgroundType, setBackgroundType] = useState('transparent');
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [backgroundPrompt, setBackgroundPrompt] = useState('');
    const [inpaintingModel, setInpaintingModel] = useState('deliberate_v2');
    const [mask, setMask] = useState(null);
    const [detectionMode, setDetectionMode] = useState('manual'); // 'manual' or 'auto'
    const overlayCanvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (initialImage) {
            const img = new Image();
            img.onload = () => {
                setCurrentImage(initialImage);
                setImageSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });

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

    const handleImageClick = (e) => {
        if (loadingStates.maskGeneration || loadingStates.backgroundRemoval || detectionMode === 'auto') return;

        const image = e.target;
        const rect = image.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const relativeX = Math.round((x / rect.width) * imageSize.width);
        const relativeY = Math.round((y / rect.height) * imageSize.height);

        const newPoints = [...points, { x: relativeX, y: relativeY }];
        setPoints(newPoints);
    };

    const handleAutoDetect = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, autoDetection: true, maskGeneration: true }));
            setError(null);
            setPoints([]);
    
            // Use currentImage directly - it's already a data URL from initialImage
            const response = await fetch('http://localhost:8000/api/auto-detect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: currentImage
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to auto-detect foreground');
            }
    
            const data = await response.json();
            setMask(data.mask);
    
            // Draw the overlay - same code as your existing generateMask
            if (overlayCanvasRef.current) {
                const img = new Image();
                img.onload = () => {
                    const ctx = overlayCanvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#abf134';
                    ctx.drawImage(img, 0, 0);
                    ctx.globalCompositeOperation = 'source-in';
                    ctx.fillRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                };
                img.src = data.mask;
            }
        } catch (err) {
            console.error('Error auto-detecting:', err);
            setError(err.message);
        } finally {
            setLoadingStates(prev => ({ ...prev, autoDetection: false, maskGeneration: false }));
        }
    };

    const handleGenerateMask = async () => {
        if (detectionMode === 'auto') {
            await handleAutoDetect();
            return;
        }

        if (points.length === 0) return;

        try {
            setLoadingStates(prev => ({ ...prev, maskGeneration: true }));
            setError(null);

            const response = await fetch('http://localhost:8000/api/generate-mask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_data: currentImage,
                    points: points
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate mask');
            }

            const data = await response.json();
            setMask(data.mask);

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
            console.error('Error generating mask:', err);
            setError(err.message);
        } finally {
            setLoadingStates(prev => ({ ...prev, maskGeneration: false }));
        }
    };

    const dataURLtoBlob = (dataUrl) => {
        // Log what we received for debugging
        console.log("dataURLtoBlob received:", typeof dataUrl, 
            typeof dataUrl === 'string' ? 
                `String of length ${dataUrl.length} starting with: ${dataUrl.substring(0, 30)}...` : 
                dataUrl);
        
        // Make sure dataUrl is a string
        if (typeof dataUrl !== 'string') {
            console.error('dataUrl is not a string:', dataUrl);
            // Return an empty blob rather than throwing an error
            return new Blob([], { type: 'image/png' });
        }
        
        try {
            // Check if dataUrl contains the data URI scheme
            if (!dataUrl.includes(',')) {
                console.error('Invalid dataUrl format (no comma):', dataUrl.substring(0, 50) + '...');
                return new Blob([], { type: 'image/png' });
            }
            
            const arr = dataUrl.split(',');
            
            // Check if the first part contains a valid MIME type
            const mimeMatch = arr[0].match(/:(.*?);/);
            if (!mimeMatch || !mimeMatch[1]) {
                console.error('Could not extract MIME type from dataUrl');
                return new Blob([], { type: 'image/png' });
            }
            
            const mime = mimeMatch[1];
            
            // Check if we have a valid base64 string
            if (!arr[1]) {
                console.error('No base64 data found in dataUrl');
                return new Blob([], { type: 'image/png' });
            }
            
            // Try to decode the base64 string
            try {
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            } catch (e) {
                console.error('Error decoding base64 data:', e);
                return new Blob([], { type: 'image/png' });
            }
        } catch (e) {
            console.error('Unexpected error in dataURLtoBlob:', e);
            return new Blob([], { type: 'image/png' });
        }
    };

    const createFormData = (dataUrl) => {
        try {
            console.log("createFormData called with:", typeof dataUrl);
            
            // Check if dataUrl is valid
            if (!dataUrl || typeof dataUrl !== 'string') {
                console.error("Invalid dataUrl provided to createFormData:", dataUrl);
                // Return an empty FormData if the dataUrl is invalid
                return new FormData();
            }
            
            const formData = new FormData();
            
            // Try to convert dataUrl to Blob
            try {
                const blob = dataURLtoBlob(dataUrl);
                formData.append('file', blob, 'image.png');
            } catch (e) {
                console.error("Error in dataURLtoBlob:", e);
                // Create an empty blob as fallback
                const emptyBlob = new Blob([], { type: 'image/png' });
                formData.append('file', emptyBlob, 'empty.png');
            }
            
            return formData;
        } catch (e) {
            console.error("Unexpected error in createFormData:", e);
            return new FormData();
        }
    };

    const handleRemoveBackground = async () => {
        if (!mask) return;
    
        try {
            setLoadingStates(prev => ({ ...prev, backgroundRemoval: true }));
            setError(null);
    
            // Create a proper FormData object
            const formData = new FormData();
            
            // Convert the data URL to a Blob
            const response = await fetch(currentImage);
            const blob = await response.blob();
            formData.append('file', blob, 'image.png');
    
            // Upload the image
            const uploadResponse = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });
    
            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }
    
            const { image_id } = await uploadResponse.json();
    
            // Prepare the request body based on background type
            const requestBody = {
                image_id,
                mask_data: mask,
                background_type: backgroundType,
            };
    
            // Add the appropriate background details based on type
            if (backgroundType === 'color') {
                // Debug: Log the color being used
                console.log('Selected color (hex):', backgroundColor);
                
                const rgbColor = hexToRgb(backgroundColor);
                console.log('Converted RGB color:', rgbColor);
                
                // IMPORTANT: Convert RGB to BGR for OpenCV
                // OpenCV uses BGR color order, not RGB
                requestBody.background_color = [
                    rgbColor[2],  // B
                    rgbColor[1],  // G
                    rgbColor[0]   // R
                ];
                
                console.log('Sending BGR color to backend:', requestBody.background_color);
            } else if (backgroundType === 'generative') {
                requestBody.prompt = backgroundPrompt || "beautiful natural background";
                requestBody.inpainting_model = inpaintingModel;
            }
    
            console.log('Sending request with body:', JSON.stringify(requestBody));
    
            // Then process the image with the mask
            const processResponse = await fetch('http://localhost:8000/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
    
            if (!processResponse.ok) {
                const errorData = await processResponse.json().catch(() => ({}));
                console.error('Process error details:', errorData);
                throw new Error('Failed to process image');
            }
    
            const { result_id } = await processResponse.json();
    
            // Finally, get the result
            const resultResponse = await fetch(`http://localhost:8000/result/${result_id}`);
            if (!resultResponse.ok) {
                throw new Error('Failed to get result');
            }
    
            const resultBlob = await resultResponse.blob();
            const resultUrl = URL.createObjectURL(resultBlob);
            setProcessedImage(resultUrl);
    
        } catch (err) {
            setError(err.message);
            console.error('Error removing background:', err);
        } finally {
            setLoadingStates(prev => ({ ...prev, backgroundRemoval: false }));
        }
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    };

    const handleReset = () => {
        setPoints([]);
        setMask(null);
        setProcessedImage(null);
        if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
    };

    const getModelDisplayName = (modelId) => {
        const models = {
            'deliberate_v2': 'Deliberate V2 (Balanced)',
            'realistic_vision_v5': 'Realistic Vision V5 (Photorealistic)'
        };
        return models[modelId] || modelId;
    };

    return (
        <div className="min-h-screen bg-white" ref={containerRef}>
            <div className="text-center py-4">
                <h1 className="text-2xl font-semibold">Background Removal</h1>
            </div>

            <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)]">
                <div className="relative">
                    {(loadingStates.maskGeneration || loadingStates.backgroundRemoval || loadingStates.autoDetection) && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                            <div className="text-white">
                                {loadingStates.autoDetection ? (
                                    <div className="flex flex-col items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                                        <div>Auto-detecting foreground...</div>
                                    </div>
                                ) : loadingStates.backgroundRemoval && backgroundType === 'generative' ? (
                                    <div className="flex flex-col items-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-2"></div>
                                        <div>Generating background with {getModelDisplayName(inpaintingModel)}...</div>
                                        <div className="text-xs mt-2">This may take a moment</div>
                                    </div>
                                ) : (
                                    'Processing...'
                                )}
                            </div>
                        </div>
                    )}
                    {currentImage && (
                        <div className="relative inline-block">
                            <img 
                                src={currentImage} 
                                alt="Original" 
                                className={`max-w-full h-auto ${detectionMode === 'manual' ? 'cursor-crosshair' : 'cursor-default'}`}
                                onClick={handleImageClick}
                            />
                            <canvas
                                ref={overlayCanvasRef}
                                className="absolute top-0 left-0 pointer-events-none"
                                style={{
                                    width: '100%',
                                    height: '100%'
                                }}
                            />
                            {detectionMode === 'manual' && points.map((point, index) => (
                                <div
                                    key={index}
                                    className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        left: `${(point.x / imageSize.width) * 100}%`,
                                        top: `${(point.y / imageSize.height) * 100}%`
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* History display for mask and processed image */}
                <div className="absolute top-4 left-4">
                    <div className="flex gap-2">
                        {mask && (
                            <div className="relative cursor-pointer group">
                                <img
                                    src={mask}
                                    alt="Mask"
                                    className="w-20 h-16 object-cover rounded border border-gray-200"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                                    Mask
                                </div>
                            </div>
                        )}
                        {processedImage && (
                            <div className="relative cursor-pointer group">
                                <img
                                    src={processedImage}
                                    alt="Result"
                                    className="w-20 h-16 object-cover rounded border border-gray-200"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
                                    Result
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="fixed bottom-0 left-0 right-0 py-4 px-6 flex flex-col gap-3 bg-white border-t border-gray-100">
                {/* Detection Mode Options */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="text-sm font-medium text-gray-700">Detection Mode:</div>
                    <div className="flex">
                        <button
                            onClick={() => {
                                setDetectionMode('manual');
                                setPoints([]);
                            }}
                            className={`px-3 py-1 text-sm rounded-l ${
                                detectionMode === 'manual'
                                    ? 'bg-[#abf134] text-black'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Manual (Click Points)
                        </button>
                        <button
                            onClick={() => {
                                setDetectionMode('auto');
                                setPoints([]);
                            }}
                            className={`px-3 py-1 text-sm rounded-r flex items-center gap-1 ${
                                detectionMode === 'auto'
                                    ? 'bg-[#abf134] text-black'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Auto-Detect <Zap className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Background Options Row */}
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label htmlFor="background-type" className="text-sm font-medium text-gray-700">
                            Background:
                        </label>
                        <select
                            id="background-type"
                            value={backgroundType}
                            onChange={(e) => setBackgroundType(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded text-sm"
                        >
                            <option value="transparent">Transparent</option>
                            <option value="color">Solid Color</option>
                            <option value="generative">AI Generated</option>
                        </select>
                    </div>

                    {backgroundType === 'color' && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="background-color" className="text-sm font-medium text-gray-700">
                                Color:
                            </label>
                            <input
                                id="background-color"
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                            />
                        </div>
                    )}

                    {backgroundType === 'generative' && (
                        <>
                            <div className="flex items-center gap-2">
                                <label htmlFor="model-select" className="text-sm font-medium text-gray-700">
                                    AI Model:
                                </label>
                                <select
                                    id="model-select"
                                    value={inpaintingModel}
                                    onChange={(e) => setInpaintingModel(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded text-sm"
                                >
                                    <option value="deliberate_v2">Deliberate V2 (Balanced)</option>
                                    <option value="realistic_vision_v5">Realistic Vision V5 (Photorealistic)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <label htmlFor="background-prompt" className="text-sm font-medium text-gray-700">
                                    Prompt:
                                </label>
                                <input
                                    id="background-prompt"
                                    type="text"
                                    value={backgroundPrompt}
                                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                                    placeholder="Describe the background you want (e.g., sunset beach, mountain landscape)"
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-4 flex-wrap">
                    <button
                        onClick={handleGenerateMask}
                        disabled={
                            loadingStates.maskGeneration || 
                            loadingStates.backgroundRemoval || 
                            (detectionMode === 'manual' && points.length === 0)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded ${
                            loadingStates.maskGeneration || 
                            loadingStates.backgroundRemoval || 
                            (detectionMode === 'manual' && points.length === 0)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#abf134] text-black hover:bg-[#9ed830]'
                        }`}
                    >
                        {loadingStates.maskGeneration 
                            ? 'Processing...' 
                            : detectionMode === 'auto' 
                                ? 'Auto-Detect'
                                : 'Generate Mask'
                        }
                        {detectionMode === 'auto' && <Zap className="w-4 h-4" />}
                    </button>

                    <button
                        onClick={handleRemoveBackground}
                        disabled={
                            loadingStates.maskGeneration || 
                            loadingStates.backgroundRemoval || 
                            !mask || 
                            (backgroundType === 'generative' && !backgroundPrompt)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded ${
                            loadingStates.maskGeneration || 
                            loadingStates.backgroundRemoval || 
                            !mask ||
                            (backgroundType === 'generative' && !backgroundPrompt)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#abf134] text-black hover:bg-[#9ed830]'
                        }`}
                    >
                        {loadingStates.backgroundRemoval 
                            ? 'Processing...' 
                            : backgroundType === 'generative' 
                                ? 'Generate Background' 
                                : 'Remove Background'
                        }
                        {backgroundType === 'generative' && <Wand2 className="w-4 h-4" />}
                    </button>

                    {(points.length > 0 || mask) && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    )}

                    {processedImage && (
                        <button
                            onClick={() => {
                                const link = document.createElement('a');
                                link.href = processedImage;
                                link.download = `processed-${Date.now()}.png`;
                                link.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#abf134] text-black rounded hover:bg-[#9ed830]"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-50 text-red-500 px-4 py-2 rounded">
                    {error}
                </div>
            )}
        </div>
    );
};

export default BackgroundRemovalEditor;