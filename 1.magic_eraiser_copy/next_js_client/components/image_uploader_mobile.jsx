import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';

// STRICT constants - same as desktop version
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Mobile-optimized animation variants
const mainVariant = {
  initial: { x: 0, y: 0, scale: 1 },
  animate: { y: -10, opacity: 0.95, scale: 1.05 },
  tap: { scale: 0.98 },
};

// Function to get the display name of the current tool mode
const getToolDisplayName = (mode) => {
  switch(mode) {
    case 'normal': return 'Magic Eraser';
    case 'powerpaint': return 'Inpaint';
    case 'outpaint': return 'Outpaint';
    case 'enhance': return 'Enhance';
    case 'colorize': return 'Colorize';
    case 'art': return 'Recolor';
    case 'blur': return 'Blur';
    case 'background-removal': return 'Remove BG';
    default: return 'Select Mode';
  }
};

// Function to get tool accent color (subtle version for indicators)
const getToolAccentColor = (id) => {
  switch(id) {
    case 'normal': return 'border-blue-500 text-blue-700 dark:text-blue-400';
    case 'powerpaint': return 'border-purple-500 text-purple-700 dark:text-purple-400';
    case 'outpaint': return 'border-pink-500 text-pink-700 dark:text-pink-400';
    case 'enhance': return 'border-green-500 text-green-700 dark:text-green-400';
    case 'colorize': return 'border-amber-500 text-amber-700 dark:text-amber-400';
    case 'art': return 'border-red-500 text-red-700 dark:text-red-400';
    case 'blur': return 'border-indigo-500 text-indigo-700 dark:text-indigo-400';
    case 'background-removal': return 'border-cyan-600 text-cyan-700 dark:text-cyan-400';
    default: return 'border-gray-500 text-gray-700 dark:text-gray-400';
  }
};

// Simplified grid pattern background for mobile
function GridPattern() {
  const columns = 21; // Fewer columns for mobile
  const rows = 9; // Fewer rows for mobile
  return (
    <div className="flex bg-gray-100 dark:bg-zinc-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-5 h-5 sm:w-6 sm:h-6 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-zinc-950"
                  : "bg-gray-50 dark:bg-zinc-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}

const ImageUploaderMobile = ({ onImageUpload, editorMode = 'normal' }) => {
    // Use a ref to track image count as a safeguard
    const imageCountRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [isTapping, setIsTapping] = useState(false);
    
    // Get the current tool display name
    const currentToolName = getToolDisplayName(editorMode);
    const toolAccentClass = getToolAccentColor(editorMode);
    
    // Force the image count to never exceed MAX_IMAGES
    useEffect(() => {
        if (selectedImages.length > MAX_IMAGES) {
            console.warn(`Limiting displayed images to ${MAX_IMAGES}`);
            setWarning(`Only the first ${MAX_IMAGES} images will be used`);
            
            setSelectedImages(prev => prev.slice(0, MAX_IMAGES));
            imageCountRef.current = MAX_IMAGES;
        } else {
            imageCountRef.current = selectedImages.length;
            if (warning && selectedImages.length <= MAX_IMAGES) {
                setWarning('');
            }
        }
    }, [selectedImages, warning]);
    
    // Additional cleanup on unmount
    useEffect(() => {
        return () => {
            setSelectedImages([]);
            imageCountRef.current = 0;
        };
    }, []);

    // Drag and drop handlers (maintained for tablet support)
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

    // Calculate file identifier
    const getFileIdentifier = (file) => {
        return `${file.name}-${file.size}-${file.lastModified}`;
    };

    // Check if a file is a duplicate
    const isDuplicateFile = (file) => {
        const newFileId = getFileIdentifier(file);
        return selectedImages.some(img => img.identifier === newFileId);
    };

    // Handle file uploads with strict enforcement
    const handleFiles = (files) => {
        // HARD LIMIT: Exit immediately if we're at max
        if (imageCountRef.current >= MAX_IMAGES) {
            setError(`Maximum ${MAX_IMAGES} images already selected.`);
            return;
        }
        
        // Filter only image files
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        // Check file size limit
        const validFiles = imageFiles.filter(file => {
            const isValidSize = file.size <= MAX_FILE_SIZE;
            if (!isValidSize) {
                setError(prev => prev ? `${prev}, One or more files exceed the 10MB limit` : 'One or more files exceed the 10MB limit');
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

        // Calculate how many more images we can add
        const remainingSlots = MAX_IMAGES - imageCountRef.current;
        
        // HARD LIMIT: Ensure we don't exceed MAX_IMAGES
        if (uniqueFiles.length > remainingSlots) {
            setError(`Maximum ${MAX_IMAGES} images allowed. Only adding ${remainingSlots} more.`);
            uniqueFiles.splice(remainingSlots);
        }

        // If no valid files after filtering, return
        if (uniqueFiles.length === 0) return;

        // Process files in a batch to avoid race conditions
        const newImages = [];
        let processedCount = 0;
        
        uniqueFiles.forEach(file => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // Add to our temporary array
                if (newImages.length < remainingSlots) {
                    newImages.push({
                        id: Date.now() + Math.random().toString(36).substr(2, 9),
                        data: e.target.result,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        identifier: getFileIdentifier(file)
                    });
                }
                
                // When all files are processed, update state ONCE
                processedCount++;
                if (processedCount === uniqueFiles.length) {
                    // Final safety check - never exceed MAX_IMAGES
                    setSelectedImages(prev => {
                        const updatedImages = [...prev, ...newImages];
                        // Always slice to enforce limit
                        const limitedImages = updatedImages.slice(0, MAX_IMAGES);
                        // Update our ref
                        imageCountRef.current = limitedImages.length;
                        return limitedImages;
                    });
                }
            };
            
            reader.readAsDataURL(file);
        });
    };

    // Remove an image safely
    const removeImage = (id) => {
        setSelectedImages(prev => {
            const updated = prev.filter(image => image.id !== id);
            // Update our ref
            imageCountRef.current = updated.length;
            return updated;
        });
        setError('');
    };

    // Handle the final image upload
    const handleUpload = () => {
        if (selectedImages.length === 0) {
            setError('Please select at least one image');
            return;
        }
        
        // Always enforce limit before uploading
        const safeImages = selectedImages.slice(0, MAX_IMAGES);
        const imageDataArray = safeImages.map(img => img.data);
        
        // Pass the array of image data to the parent component
        if (imageDataArray.length === 1) {
            onImageUpload(imageDataArray[0]);
        } else {
            onImageUpload(imageDataArray);
        }
    };

    // Handle Enter key press
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' && selectedImages.length > 0) {
                handleUpload();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [selectedImages]);

    // Create an image input ref
    const fileInputRef = useRef(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    // Dropzone hook (maintained for tablet support)
    const { getRootProps } = useDropzone({
        multiple: true,
        noClick: true,
        onDrop: handleFiles,
        onDropRejected: (error) => {
            console.log(error);
        },
    });

    // GUARANTEED safe image array for display
    const safeImages = selectedImages.slice(0, MAX_IMAGES);

    return (
        <div className="flex flex-col items-center justify-center w-full pb-20">
            {/* Warning banner when exceeding limit */}
            {warning && (
                <div className="w-full mb-2 flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{warning}</span>
                </div>
            )}
            
            {/* Action buttons at the top when images are selected */}
            <div className="w-full mb-4 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-800 p-2 z-10 shadow-sm rounded">
                <div className="flex items-center">
                    {/* Tool indicator - subtle, professional design */}
                    <div className={`px-2 py-0.5 text-xs font-medium ${toolAccentClass} border-l-2 ml-1`}>
                        {currentToolName}
                    </div>
                </div>
                
                {safeImages.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {safeImages.length}/{MAX_IMAGES}
                        </span>
                        <button 
                            onClick={() => {
                                setSelectedImages([]);
                                imageCountRef.current = 0;
                            }}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-0.5 border border-red-200 dark:border-red-700 rounded"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile-optimized uploader area */}
            <div 
                className="w-full" 
                {...getRootProps()}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => {}}
            >
                <motion.div
                    className="p-4 block rounded-lg w-full relative overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800"
                    whileTap="tap"
                    animate={isDragging ? "animate" : isTapping ? "tap" : "initial"}
                    variants={mainVariant}
                >
                    <input
                        ref={fileInputRef}
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
                    
                    {/* Background pattern - more subtle */}
                    <div className="absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
                        <GridPattern />
                    </div>
                    
                    {/* Main content */}
                    <div className="relative z-10">
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-center relative z-10">
                                <h3 className="font-medium text-gray-800 dark:text-gray-200 text-base mb-1">
                                    {safeImages.length === 0 ? "Add Images" : 
                                     safeImages.length < MAX_IMAGES ? "Add more images" : "Ready to continue"}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {safeImages.length === 0 ? "Upload from your gallery" : 
                                     safeImages.length < MAX_IMAGES ? `You can add up to ${MAX_IMAGES - safeImages.length} more` : "Maximum images selected"}
                                </p>
                            </div>
                            
                            {/* Image upload options - Mobile optimized */}
                            {safeImages.length < MAX_IMAGES && (
                                <div className="w-full mt-5 flex justify-center">
                                    {/* Choose from gallery */}
                                    <motion.button 
                                        onClick={handleClick}
                                        whileTap={{ scale: 0.97 }}
                                        className="px-4 py-2 bg-[#abf134] text-black rounded flex items-center justify-center shadow-sm text-sm font-medium"
                                    >
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        <span>Choose Images</span>
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
            
            {/* Error message */}
            {error && (
                <div className="mt-3 text-red-500 text-xs">
                    {error}
                </div>
            )}
            
            {/* Mobile-optimized image grid for previewing selected images */}
            {safeImages.length > 0 && (
                <div className="w-full mt-3">
                    <div className="grid grid-cols-3 gap-2">
                        {safeImages.map((image) => (
                            <motion.div 
                                key={image.id} 
                                className="relative aspect-square"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                <img 
                                    src={image.data} 
                                    alt={image.name}
                                    className="w-full h-full object-cover rounded border border-gray-200 dark:border-gray-700" 
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(image.id);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full z-10 border border-white shadow-sm"
                                >
                                    <X size={14} />
                                </button>
                                
                                {/* File info on bottom - more subtle */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white rounded-b flex flex-col justify-end p-1 text-[10px]">
                                    <p className="truncate">{image.name}</p>
                                    <p>{(image.size / (1024 * 1024)).toFixed(1)} MB</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Simplified info text */}
            <div className="mt-3 text-center text-[10px] text-gray-400">
                <p>PNG, JPEG • Max: 10MB • {MAX_IMAGES} images max</p>
            </div>
            
            {/* Fixed bottom continue button - refined styling */}
            {safeImages.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 p-3 border-t shadow-md z-50">
                    <button
                        onClick={handleUpload}
                        className="w-full px-4 py-2.5 bg-[#abf134] text-black rounded-md font-medium text-sm flex items-center justify-center"
                    >
                        Continue with {safeImages.length} Image{safeImages.length !== 1 ? 's' : ''}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageUploaderMobile;