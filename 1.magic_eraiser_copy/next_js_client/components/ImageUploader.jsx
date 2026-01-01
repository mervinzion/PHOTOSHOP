import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { cn } from '../lib/utils';
import ImageUploaderMobile from './image_uploader_mobile';

// STRICT constants
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MOBILE_BREAKPOINT = 768; // px - standard tablet breakpoint

// Animation variants
const mainVariant = {
  initial: { x: 0, y: 0, scale: 1 },
  animate: { x: 20, y: -20, opacity: 0.9, scale: 1.1 },
  drag: { scale: 1.05, boxShadow: "0 5px 15px rgba(0,0,0,0.1)" },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

// Grid pattern background
function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-zinc-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-8 h-8 sm:w-10 sm:h-10 flex shrink-0 rounded-[2px] ${
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

// Wrapper component that handles responsive switching
const ImageUploader = ({ onImageUpload, editorMode = 'normal' }) => {
    // State to track if using mobile view
    const [isMobile, setIsMobile] = useState(false);

    // Setup viewport width detection
    useEffect(() => {
        // Function to check if viewport is mobile width
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        // Initial check
        checkIfMobile();

        // Add event listener for resize
        window.addEventListener('resize', checkIfMobile);

        // Cleanup
        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    // Render appropriate component based on screen size
    // Now passing editorMode to the mobile component
    return isMobile ?
        <ImageUploaderMobile onImageUpload={onImageUpload} editorMode={editorMode} /> :
        <ImageUploaderDesktop onImageUpload={onImageUpload} />;
};

// Desktop version of the component
const ImageUploaderDesktop = ({ onImageUpload }) => {
    // Use a ref to track image count as a safeguard
    const imageCountRef = useRef(0);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImages, setSelectedImages] = useState([]);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [showTooltip, setShowTooltip] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // Force the image count to never exceed MAX_IMAGES
    useEffect(() => {
        // Ensure we never exceed MAX_IMAGES
        if (selectedImages.length > MAX_IMAGES) {
            console.warn(`Limiting displayed images to ${MAX_IMAGES}`);
            setWarning(`Only the first ${MAX_IMAGES} images will be used`);

            // Strictly enforce the limit by slicing the array
            setSelectedImages(prev => prev.slice(0, MAX_IMAGES));
            imageCountRef.current = MAX_IMAGES;
        } else {
            imageCountRef.current = selectedImages.length;
            if (warning && selectedImages.length <= MAX_IMAGES) {
                setWarning('');
            }
        }
    }, [selectedImages, warning]);

    // Additional cleanup on mount
    useEffect(() => {
        return () => {
            // Clean up on unmount
            setSelectedImages([]);
            imageCountRef.current = 0;
        };
    }, []);

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

    const { getRootProps } = useDropzone({
        multiple: true,
        noClick: true,
        onDrop: handleFiles,
        onDropRejected: (error) => {
            console.log(error);
        },
    });

    // Get size class based on number of images
    const getImageSizeClass = (side) => {
        if (side === 'left') {
            const count = Math.min(selectedImages.length, 5);
            if (count === 0) return '';
            if (count === 1) return 'w-32 h-32';
            if (count === 2) return 'w-28 h-28';
            if (count === 3) return 'w-24 h-24';
            if (count === 4) return 'w-20 h-20';
            return 'w-16 h-16';
        } else { // right side
            const count = Math.max(0, Math.min(selectedImages.length - 5, 5));
            if (count === 0) return '';
            if (count === 1) return 'w-32 h-32';
            if (count === 2) return 'w-28 h-28';
            if (count === 3) return 'w-24 h-24';
            if (count === 4) return 'w-20 h-20';
            return 'w-16 h-16';
        }
    };

    // GUARANTEED safe image arrays for display
    const safeImages = selectedImages.slice(0, MAX_IMAGES);
    const leftImages = safeImages.slice(0, Math.min(5, safeImages.length));
    const rightImages = safeImages.length > 5 ? safeImages.slice(5, MAX_IMAGES) : [];

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
            {/* Warning banner when exceeding limit */}
            {warning && (
                <div className="w-full mb-2 flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{warning}</span>
                </div>
            )}

            {/* Action buttons at the top when images are selected */}
            {safeImages.length > 0 && (
                <div className="w-full mb-4 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-800 p-2 z-10 shadow-sm rounded">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                        Selected Images ({safeImages.length}/{MAX_IMAGES})
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setSelectedImages([]);
                                imageCountRef.current = 0;
                            }}
                            className="text-sm text-red-500 hover:text-red-700 px-3 py-1 border border-red-200 dark:border-red-700 rounded"
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
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-20">
                                    Press Enter to continue
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Animated file uploader area */}
            <div
                className="w-full"
                {...getRootProps()}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleClick}
            >
                <motion.div
                    className="p-6 sm:p-10 block rounded-lg cursor-pointer w-full relative overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#abf134]"
                    whileHover="animate"
                    animate={isDragging ? "drag" : isHovering ? "animate" : "initial"}
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

                    {/* Background pattern */}
                    <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
                        <GridPattern />
                    </div>

                    {/* Main content */}
                    <div className="relative z-10">
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-center relative z-10">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg mb-1">
                                    {safeImages.length === 0 ? "Drop your images here" :
                                     safeImages.length < MAX_IMAGES ? "Add more images" : "Ready to continue"}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {safeImages.length === 0 ? "or click to upload (PNG, JPEG)" :
                                     safeImages.length < MAX_IMAGES ? `You can add up to ${MAX_IMAGES - safeImages.length} more` : "Maximum images selected"}
                                </p>
                            </div>

                            {/* Three-column layout with fixed positions */}
                            <div className="w-full mt-6 relative">
                                <div className="flex items-center justify-between">
                                    {/* Left side images */}
                                    <div className="w-2/5 flex flex-wrap justify-start gap-2 min-h-[150px]">
                                        {leftImages.map((image, idx) => (
                                           <motion.div
                                           key={image.id}
                                           className={`relative group ${getImageSizeClass('left')}`}
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
                                               className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-white"
                                           >
                                               <X size={14} />
                                           </button>

                                           {/* File info on hover - only at the bottom with no full overlay */}
                                           <motion.div
                                               className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-b flex flex-col justify-end p-2 text-xs"
                                               initial={{ opacity: 0 }}
                                               animate={{ opacity: 0 }}
                                               whileHover={{ opacity: 1 }}
                                           >
                                               <p className="truncate">{image.name}</p>
                                               <p>{(image.size / (1024 * 1024)).toFixed(2)} MB</p>
                                           </motion.div>
                                       </motion.div>
                                        ))}
                                    </div>

                                    {/* Center section with upload arrow - only visible when less than MAX_IMAGES */}
                                    <div className="w-1/5 flex justify-center">
                                        {safeImages.length < MAX_IMAGES ? (
                                            <>
                                                <motion.div
                                                    layoutId="file-upload"
                                                    variants={mainVariant}
                                                    initial="initial"
                                                    animate={isDragging || isHovering ? "animate" : "initial"}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 300,
                                                        damping: 20,
                                                    }}
                                                    className="relative z-40 bg-white dark:bg-zinc-800 flex items-center justify-center h-24 w-24 rounded-md shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                                                >
                                                    {isDragging ? (
                                                        <motion.p
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="text-gray-600 dark:text-gray-300 flex flex-col items-center"
                                                        >
                                                            Drop it
                                                            <Upload className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-1" />
                                                        </motion.p>
                                                    ) : (
                                                        <Upload className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                                                    )}
                                                </motion.div>

                                                <motion.div
                                                    variants={secondaryVariant}
                                                    initial="initial"
                                                    animate={isDragging || isHovering ? "animate" : "initial"}
                                                    className="absolute opacity-0 border border-dashed border-[#abf134] inset-0 z-30 bg-transparent flex items-center justify-center h-24 w-24 mx-auto rounded-md"
                                                ></motion.div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                                                    Maximum<br/>images<br/>selected
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right side images */}
                                    <div className="w-2/5 flex flex-wrap justify-end gap-2 min-h-[150px]">
                                        {rightImages.map((image, idx) => (
                                            <motion.div
                                                key={image.id}
                                                className={`relative group ${getImageSizeClass('right')}`}
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
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-white"
                                                >
                                                    <X size={14} />
                                                </button>

                                                {/* File info on hover - only at the bottom with no full overlay */}
                                                <motion.div
                                                    className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-b flex flex-col justify-end p-2 text-xs"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0 }}
                                                    whileHover={{ opacity: 1 }}
                                                >
                                                    <p className="truncate">{image.name}</p>
                                                    <p>{(image.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </motion.div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Choose Files button or Add More button */}
                                {safeImages.length === 0 ? (
                                    <div className="flex justify-center mt-6">
                                        <label className="inline-block">
                                            <span className="px-4 py-2 bg-[#abf134] text-black rounded cursor-pointer hover:bg-[#9ed830] text-sm">
                                                Choose Files
                                            </span>
                                        </label>
                                    </div>
                                ) : safeImages.length < MAX_IMAGES && (
                                    <div className="flex justify-center mt-6">
                                        <label className="inline-block">
                                            <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">
                                                Add More Images
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {error && (
                <div className="mt-4 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {/* Info text at the bottom */}
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Supported formats: PNG, JPEG</p>
                <p>Max file size: 10MB per image</p>
                <p>Max {MAX_IMAGES} images at a time</p>
                <p>Press Enter to continue with selected images</p>
            </div>

            {/* Sticky bottom Continue button for mobile users */}
            {safeImages.length > 0 && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 p-3 border-t shadow-lg">
                    <button
                        onClick={handleUpload}
                        className="w-full px-4 py-2 bg-[#abf134] text-black rounded-lg font-medium"
                    >
                        Continue with {safeImages.length} Image{safeImages.length !== 1 ? 's' : ''}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
