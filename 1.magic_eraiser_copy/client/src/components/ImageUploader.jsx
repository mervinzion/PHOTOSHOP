import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Info } from 'lucide-react';

const ImageUploader = ({ onImageUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [error, setError] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setError('');

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFiles(Array.from(files));
        }
    }, []);

    // Function to calculate file hash using size and name
    const getFileIdentifier = (file) => {
        return `${file.name}-${file.size}-${file.lastModified}`;
    };

    // Check if a file is a duplicate
    const isDuplicateFile = (file) => {
        const newFileId = getFileIdentifier(file);
        return selectedImages.some(img => img.identifier === newFileId);
    };

    const handleFiles = (files) => {
        // Filter only image files
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        // Check file size (10MB limit)
        const validFiles = imageFiles.filter(file => {
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
            if (!isValidSize) {
                setError('One or more files exceed the 10MB limit');
            }
            return isValidSize;
        });

        // Filter out duplicate files
        const uniqueFiles = validFiles.filter(file => {
            const isDuplicate = isDuplicateFile(file);
            if (isDuplicate) {
                setError(prev => prev ? `${prev}, "${file.name}" is already selected` : `"${file.name}" is already selected`);
            }
            return !isDuplicate;
        });

        // Limit to 10 images max
        const totalImages = selectedImages.length + uniqueFiles.length;
        if (totalImages > 10) {
            setError(prev => prev ? `${prev}, maximum 10 images allowed` : 'Maximum 10 images allowed');
            uniqueFiles.splice(10 - selectedImages.length);
        }

        // Read selected files
        uniqueFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImages(prev => [...prev, {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    data: e.target.result,
                    name: file.name,
                    identifier: getFileIdentifier(file)
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (id) => {
        setSelectedImages(prev => prev.filter(image => image.id !== id));
    };

    const handleUpload = () => {
        if (selectedImages.length === 0) {
            setError('Please select at least one image');
            return;
        }
        
        // Extract just the image data from the selectedImages objects
        const imageDataArray = selectedImages.map(img => img.data);
        
        // Pass the array of image data to the parent component
        onImageUpload(imageDataArray);
    };

    // Handle key press events
    useEffect(() => {
        const handleKeyPress = (e) => {
            // If Enter key is pressed and we have images selected
            if (e.key === 'Enter' && selectedImages.length > 0) {
                handleUpload();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [selectedImages]);

    return (
        <div className="flex flex-col items-center justify-center py-6 px-4">
            {/* Always visible action buttons at the top when images are selected */}
            {selectedImages.length > 0 && (
                <div className="w-full max-w-3xl mb-4 flex justify-between items-center sticky top-0 bg-white p-2 z-10 shadow-sm rounded">
                    <h3 className="font-medium">Selected Images ({selectedImages.length}/10)</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setSelectedImages([])}
                            className="text-sm text-red-500 hover:text-red-700 px-3 py-1 border border-red-200 rounded"
                        >
                            Clear All
                        </button>
                        <div className="relative">
                            <button
                                onClick={handleUpload}
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                                className="px-4 py-1 bg-[#abf134] text-black rounded cursor-pointer hover:bg-[#9ed830] text-sm font-medium flex items-center"
                            >
                                Continue
                                <Info className="ml-1 w-4 h-4" />
                            </button>
                            {showTooltip && (
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                    Press Enter to continue
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`relative w-full max-w-3xl border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 transition-colors p-6 ${
                    isDragging ? 'border-[#abf134] bg-[#abf134]/10' : 'border-gray-300'
                }`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {selectedImages.length === 0 ? (
                    <>
                        <Upload className="w-12 h-12 text-gray-400" />
                        <div className="text-center">
                            <p className="text-lg mb-2">Drop your images here</p>
                            <p className="text-sm text-gray-500">or</p>
                            <label className="mt-2 inline-block">
                                <span className="px-4 py-2 bg-[#abf134] text-black rounded cursor-pointer hover:bg-[#9ed830]">
                                    Choose Files
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            handleFiles(Array.from(e.target.files));
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </>
                ) : (
                    <div className="w-full">
                        {/* Scrollable image grid with max height */}
                        <div className="max-h-96 overflow-y-auto pr-2 mb-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {selectedImages.map(image => (
                                    <div key={image.id} className="relative group">
                                        <img 
                                            src={image.data} 
                                            alt={image.name}
                                            className="w-full h-24 object-cover rounded border border-gray-200" 
                                        />
                                        <button
                                            onClick={() => removeImage(image.id)}
                                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Add more button centered below the scrollable grid - hides when max limit reached */}
                        {selectedImages.length < 10 && (
                            <div className="flex justify-center mt-4">
                                <label className="inline-block">
                                    <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded cursor-pointer hover:bg-gray-300 text-sm">
                                        Add More Images
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                handleFiles(Array.from(e.target.files));
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {error && (
                <div className="mt-4 text-red-500 text-sm">
                    {error}
                </div>
            )}
            
            {/* Info text at the bottom */}
            <div className="mt-6 text-center text-sm text-gray-500">
                <p>Supported formats: PNG, JPEG</p>
                <p>Max file size: 10MB per image</p>
                <p>Max 10 images at a time</p>
                <p>Press Enter to continue with selected images</p>
            </div>
            
            {/* Sticky bottom Continue button for mobile users */}
            {selectedImages.length > 0 && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white p-3 border-t shadow-lg">
                    <button
                        onClick={handleUpload}
                        className="w-full px-4 py-2 bg-[#abf134] text-black rounded-lg font-medium"
                    >
                        Continue with {selectedImages.length} Image{selectedImages.length !== 1 ? 's' : ''}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;