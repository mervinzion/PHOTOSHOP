import React from 'react';
import { X, Split, Maximize, Scissors, Crop, Check } from 'lucide-react';

// Utility functions for image processing and visualization
export const imageUtils = {
    // Helper function to draw diagonal pattern
    drawDiagonalPattern: (ctx, x, y, width, height) => {
        const patternSize = 12;
        const lineWidth = 1;
        
        ctx.strokeStyle = '#afc8ff'; // Light blue for diagonals
        ctx.lineWidth = lineWidth;
        
        // Draw diagonal lines
        for (let i = -height; i < width + height; i += patternSize) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i + height, y + height);
            ctx.stroke();
        }
    },
    
    // Create enhanced preview for outpainting
    createEnhancedOutpaintPreview: (img, originalWidth, originalHeight, extendWidth, extendHeight, selectedRatio, aspectRatioOptions, setEnhancedPreview) => {
        // Initialize dimensions
        let newWidth, newHeight, x, y;
        
        // Calculate dimensions based on selected ratio or extend values
        if (selectedRatio !== 'Custom' && aspectRatioOptions[selectedRatio]) {
            const targetRatio = aspectRatioOptions[selectedRatio];
            const currentRatio = originalWidth / originalHeight;
            
            if (currentRatio < targetRatio) {
                // Need to extend width
                newWidth = Math.ceil(originalHeight * targetRatio);
                newHeight = originalHeight;
                // Center horizontally
                x = Math.floor((newWidth - originalWidth) / 2);
                y = 0;
            } else {
                // Need to extend height
                newWidth = originalWidth;
                newHeight = Math.ceil(originalWidth / targetRatio);
                // Center vertically
                x = 0;
                y = Math.floor((newHeight - originalHeight) / 2);
            }
        } else {
            // Use manual extend values
            newWidth = originalWidth + extendWidth;
            newHeight = originalHeight + extendHeight;
            // Center the image
            x = Math.floor(extendWidth / 2);
            y = Math.floor(extendHeight / 2);
        }
        
        // Create canvas for the enhanced preview
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw background for outpainted area
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        // Draw grid pattern on outpainted area
        ctx.strokeStyle = '#c2d1f0';
        ctx.lineWidth = 1;
        const gridSize = 20;
        
        // Draw grid lines
        for (let i = 0; i < newWidth; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, newHeight);
            ctx.stroke();
        }
        for (let i = 0; i < newHeight; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(newWidth, i);
            ctx.stroke();
        }
        
        // Add gradient overlays and diagonal patterns to outpainted areas
        const addGradientAndPattern = (areaX, areaY, areaWidth, areaHeight, isHorizontal) => {
            // Clip to the area
            ctx.save();
            ctx.beginPath();
            ctx.rect(areaX, areaY, areaWidth, areaHeight);
            ctx.clip();
            
            // Draw diagonal pattern
            imageUtils.drawDiagonalPattern(ctx, areaX, areaY, areaWidth, areaHeight);
            ctx.restore();
            
            // Add gradient overlay
            ctx.save();
            let gradient;
            
            if (isHorizontal) {
                gradient = ctx.createLinearGradient(areaX, areaY, areaX + areaWidth, areaY);
            } else {
                gradient = ctx.createLinearGradient(areaX, areaY, areaX, areaY + areaHeight);
            }
            
            gradient.addColorStop(0, 'rgba(173, 216, 230, 0.2)');
            gradient.addColorStop(1, 'rgba(173, 216, 230, 0.05)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(areaX, areaY, areaWidth, areaHeight);
            ctx.restore();
        };
        
        // Apply patterns to different areas
        if (x > 0) {
            // Left side
            addGradientAndPattern(0, 0, x, newHeight, true);
        }
        
        if (y > 0) {
            // Top side
            addGradientAndPattern(0, 0, newWidth, y, false);
        }
        
        if (x + originalWidth < newWidth) {
            // Right side
            const rightX = x + originalWidth;
            const width = newWidth - rightX;
            addGradientAndPattern(rightX, 0, width, newHeight, true);
        }
        
        if (y + originalHeight < newHeight) {
            // Bottom side
            const bottomY = y + originalHeight;
            const height = newHeight - bottomY;
            addGradientAndPattern(0, bottomY, newWidth, height, false);
        }
        
        // Draw the original image
        ctx.drawImage(img, x, y);
        
        // Add border around original image
        ctx.strokeStyle = 'rgba(171, 241, 52, 1)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, originalWidth, originalHeight);
        
        // Add "AI Generated" text to the outpainted areas
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        
        // Helper function to add text with background
        const addTextWithBackground = (text, posX, posY) => {
            // Measure text width
            const textWidth = ctx.measureText(text).width;
            
            // Draw semi-transparent background for text
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(posX - textWidth/2 - 5, posY - 14, textWidth + 10, 20);
            
            // Draw text
            ctx.fillStyle = '#555555';
            ctx.fillText(text, posX, posY);
        };
        
        // Add text based on where outpainting will occur
        if (x > 0) {
            // Left side
            addTextWithBackground('AI Generated', x/2, newHeight/2);
        }
        
        if (x + originalWidth < newWidth) {
            // Right side
            addTextWithBackground('AI Generated', x + originalWidth + (newWidth - x - originalWidth)/2, newHeight/2);
        }
        
        if (y > 0) {
            // Top side
            addTextWithBackground('AI Generated', newWidth/2, y/2);
        }
        
        if (y + originalHeight < newHeight) {
            // Bottom side
            addTextWithBackground('AI Generated', newWidth/2, y + originalHeight + (newHeight - y - originalHeight)/2);
        }
        
        // Add "Preview Only" badge
        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 100, 24, 12);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Preview Only', 60, 26);
        ctx.restore();
        
        // Convert to data URL
        const previewDataUrl = canvas.toDataURL('image/png');
        setEnhancedPreview(previewDataUrl);
        
        // Return dimensions for reference
        return {
            width: newWidth,
            height: newHeight,
            originalWidth,
            originalHeight,
            offsetX: x,
            offsetY: y
        };
    },

    // Helper function to create a mock preview - CLIENT SIDE ONLY
    createMockPreview: (img, originalWidth, originalHeight, extendWidth, extendHeight, setPreview) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to include the extended area
        canvas.width = originalWidth + extendWidth;
        canvas.height = originalHeight + extendHeight;
        
        // Fill the background with a light gray
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a grid pattern in the extended area
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 1;
        const gridSize = 20;
        
        // Draw vertical grid lines
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Calculate the position to place the original image
        // Center the original image in the extended canvas
        const x = Math.floor(extendWidth / 2);
        const y = Math.floor(extendHeight / 2);
        
        // Draw the original image
        ctx.drawImage(img, x, y);
        
        // Draw a border around the original image
        ctx.strokeStyle = '#abf134';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, originalWidth, originalHeight);
        
        // Create a second canvas for the mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        
        // Fill the mask area (the extended area) with white
        maskCtx.fillStyle = '#ffffff';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Fill the original image area with black (indicating no mask)
        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(x, y, originalWidth, originalHeight);
        
        // Convert both canvases to base64
        const backgroundData = canvas.toDataURL('image/png');
        const maskData = maskCanvas.toDataURL('image/png');
        
        // Set the preview
        setPreview({
            background: backgroundData,
            mask: maskData
        });
    },

    // Function to generate a preview of what the crop would look like
    generateCropPreview: (currentImage, selectedRatio, aspectRatioOptions, pendingStateUpdatesRef, setCropPreview, setShowCropPreview) => {
        if (!currentImage || selectedRatio === 'Custom' || pendingStateUpdatesRef.current) return;
        
        pendingStateUpdatesRef.current = true;
        const targetRatio = aspectRatioOptions[selectedRatio];
        
        const img = new Image();
        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const currentRatio = imgWidth / imgHeight;
            
            // Calculate dimensions for crop preview
            let previewCropArea = { x: 0, y: 0, width: 0, height: 0 };
            
            if (currentRatio > targetRatio) {
                // Image is wider than target ratio, maintain height
                previewCropArea.height = imgHeight;
                previewCropArea.width = imgHeight * targetRatio;
                // Center horizontally
                previewCropArea.x = (imgWidth - previewCropArea.width) / 2;
                previewCropArea.y = 0;
            } else {
                // Image is taller than target ratio, maintain width
                previewCropArea.width = imgWidth;
                previewCropArea.height = imgWidth / targetRatio;
                // Center vertically
                previewCropArea.x = 0;
                previewCropArea.y = (imgHeight - previewCropArea.height) / 2;
            }
            
            // Create a canvas to generate the preview
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions to the crop size
            canvas.width = previewCropArea.width;
            canvas.height = previewCropArea.height;
            
            // Draw the cropped portion to the canvas
            ctx.drawImage(
                img,
                previewCropArea.x, previewCropArea.y, previewCropArea.width, previewCropArea.height,
                0, 0, previewCropArea.width, previewCropArea.height
            );
            
            // Convert to base64
            const croppedPreviewData = canvas.toDataURL('image/png');
            
            // Update state in a batch
            setTimeout(() => {
                setCropPreview(croppedPreviewData);
                setShowCropPreview(true);
                pendingStateUpdatesRef.current = false;
            }, 50);
        };
        
        img.src = currentImage;
    },

    // Generate outpaint preview for comparison WITHOUT percentage calculations
    generateOutpaintPreviewForComparison: (img, currentWidth, currentHeight, dimensions, targetRatio) => {
        // Create canvas for outpaint preview visualization
        const outpaintCanvas = document.createElement('canvas');
        const outpaintCtx = outpaintCanvas.getContext('2d');
        
        // Use pre-calculated dimensions
        const newWidth = dimensions.width;
        const newHeight = dimensions.height;
        
        // Set canvas dimensions
        outpaintCanvas.width = newWidth;
        outpaintCanvas.height = newHeight;
        
        // Draw background to indicate outpainted area
        outpaintCtx.fillStyle = '#f8f8f8';
        outpaintCtx.fillRect(0, 0, newWidth, newHeight);
        
        // Draw grid pattern on outpainted area
        outpaintCtx.strokeStyle = '#c2d1f0';
        outpaintCtx.lineWidth = 1.5;
        const gridSize = 20;
        
        // Draw grid lines
        for (let x = 0; x < newWidth; x += gridSize) {
            outpaintCtx.beginPath();
            outpaintCtx.moveTo(x, 0);
            outpaintCtx.lineTo(x, newHeight);
            outpaintCtx.stroke();
        }
        for (let y = 0; y < newHeight; y += gridSize) {
            outpaintCtx.beginPath();
            outpaintCtx.moveTo(0, y);
            outpaintCtx.lineTo(newWidth, y);
            outpaintCtx.stroke();
        }
        
        // Calculate position to place the original image
        let x = 0;
        let y = 0;
        if (currentWidth / currentHeight < targetRatio) {
            // Extended width - center horizontally
            x = Math.floor((newWidth - currentWidth) / 2);
        } else {
            // Extended height - center vertically
            y = Math.floor((newHeight - currentHeight) / 2);
        }
        
        // Draw the original image centered
        outpaintCtx.drawImage(img, x, y);
        
        // Add more visible border to show original image bounds
        outpaintCtx.strokeStyle = 'rgba(171, 241, 52, 1)';
        outpaintCtx.lineWidth = 3;
        outpaintCtx.strokeRect(x, y, currentWidth, currentHeight);
        
        // Add "AI Generated" text to the outpainted areas with better visibility
        outpaintCtx.font = 'bold 14px Arial';
        outpaintCtx.fillStyle = '#888888';
        outpaintCtx.textAlign = 'center';
        
        // Add semi-transparent highlight behind text for better readability
        const addTextWithBackground = (text, posX, posY) => {
            // Measure text width
            const textWidth = outpaintCtx.measureText(text).width;
            
            // Draw semi-transparent background for text
            outpaintCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            outpaintCtx.fillRect(posX - textWidth/2 - 5, posY - 12, textWidth + 10, 20);
            
            // Draw text
            outpaintCtx.fillStyle = '#555555';
            outpaintCtx.fillText(text, posX, posY);
        };
        
        if (currentWidth / currentHeight < targetRatio) {
            // Text on left and right sides
            const centerY = Math.floor(newHeight / 2);
            addTextWithBackground('AI Generated', Math.floor(x / 2), centerY);
            addTextWithBackground('AI Generated', x + currentWidth + Math.floor(x / 2), centerY);
        } else {
            // Text on top and bottom
            const centerX = Math.floor(newWidth / 2);
            addTextWithBackground('AI Generated', centerX, Math.floor(y / 2));
            addTextWithBackground('AI Generated', centerX, y + currentHeight + Math.floor(y / 2));
        }
        
        // Add diagonal pattern to AI-generated areas
        outpaintCtx.save();
        if (currentWidth / currentHeight < targetRatio) {
            // Left side
            outpaintCtx.beginPath();
            outpaintCtx.rect(0, 0, x, newHeight);
            outpaintCtx.clip();
            imageUtils.drawDiagonalPattern(outpaintCtx, 0, 0, x, newHeight);
            
            // Right side
            outpaintCtx.beginPath();
            outpaintCtx.rect(x + currentWidth, 0, x, newHeight);
            outpaintCtx.clip();
            imageUtils.drawDiagonalPattern(outpaintCtx, x + currentWidth, 0, x, newHeight);
        } else {
            // Top
            outpaintCtx.beginPath();
            outpaintCtx.rect(0, 0, newWidth, y);
            outpaintCtx.clip();
            imageUtils.drawDiagonalPattern(outpaintCtx, 0, 0, newWidth, y);
            
            // Bottom
            outpaintCtx.beginPath();
            outpaintCtx.rect(0, y + currentHeight, newWidth, y);
            outpaintCtx.clip();
            imageUtils.drawDiagonalPattern(outpaintCtx, 0, y + currentHeight, newWidth, y);
        }
        outpaintCtx.restore();
        
        // Get outpaint preview as data URL
        const outpaintPreview = outpaintCanvas.toDataURL('image/png');
        
        // Return dimensions without percentage calculations
        return {
            outpaintPreview,
            dimensions: {
                width: newWidth,
                height: newHeight,
                originalWidth: currentWidth,
                originalHeight: currentHeight
            }
        };
    },

    // Helper function to create a mock outpainted result
    createMockOutpaintedResult: (img, extendWidth, extendHeight, setHistory, setCurrentImage) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // Set canvas dimensions to include the extended area
        canvas.width = originalWidth + extendWidth;
        canvas.height = originalHeight + extendHeight;
        
        // Fill the entire canvas with a color similar to the edge pixels of the original image
        // This creates a simple "outpainted" effect
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate position to center the original image
        const x = Math.floor(extendWidth / 2);
        const y = Math.floor(extendHeight / 2);
        
        // Draw the original image
        ctx.drawImage(img, x, y);
        
        // Add some fake "AI generated" content in the extended areas
        // This is just for visual representation
        ctx.fillStyle = '#e0e0e0';
        
        // Draw some random shapes in the extended areas to simulate AI generation
        for (let i = 0; i < 50; i++) {
            // Random positions within the extended areas
            let randomX, randomY;
            
            // Decide which extended area to draw in (left, right, top, bottom)
            const area = Math.floor(Math.random() * 4);
            
            switch (area) {
                case 0: // Left
                    randomX = Math.random() * x;
                    randomY = Math.random() * canvas.height;
                    break;
                case 1: // Right
                    randomX = x + originalWidth + Math.random() * (canvas.width - x - originalWidth);
                    randomY = Math.random() * canvas.height;
                    break;
                case 2: // Top
                    randomX = Math.random() * canvas.width;
                    randomY = Math.random() * y;
                    break;
                case 3: // Bottom
                    randomX = Math.random() * canvas.width;
                    randomY = y + originalHeight + Math.random() * (canvas.height - y - originalHeight);
                    break;
                default:
                    randomX = 0;
                    randomY = 0;
            }
            
            // Draw different shapes randomly
            const shapeType = Math.floor(Math.random() * 3);
            const size = 5 + Math.random() * 20;
            
            ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
            
            switch (shapeType) {
                case 0: // Circle
                    ctx.beginPath();
                    ctx.arc(randomX, randomY, size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 1: // Rectangle
                    ctx.fillRect(randomX - size/2, randomY - size/2, size, size);
                    break;
                case 2: // Triangle
                    ctx.beginPath();
                    ctx.moveTo(randomX, randomY - size/2);
                    ctx.lineTo(randomX - size/2, randomY + size/2);
                    ctx.lineTo(randomX + size/2, randomY + size/2);
                    ctx.closePath();
                    ctx.fill();
                    break;
                default:
                    break;
            }
        }
        
        // Convert canvas to base64
        const outpaintedImageData = canvas.toDataURL('image/png');
        
        // Add to history
        const newHistoryItem = {
            id: Date.now(),
            image: outpaintedImageData,
            isOriginal: false
        };
        
        setHistory(prev => [...prev, newHistoryItem]);
        setCurrentImage(outpaintedImageData);
    }
};

// Crop-related functionality
export const cropUtils = {
    // Handle crop start event
    handleCropStart: (e, cropMode, cropContainerRef, cropArea, canvasScale, setResizeHandle, setIsDragging, 
                    setDragStart, setCropArea, setAutoAspectRatioCrop) => {
        if (!cropMode) return;

        // Prevent default behavior to avoid image dragging
        e.preventDefault();

        const container = cropContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert screen coordinates to original image coordinates
        const imageX = x / canvasScale;
        const imageY = y / canvasScale;

        // Check if we're clicking on a resize handle
        const handleSize = 10 / canvasScale; // Adjust handle size based on canvas scale
        const handles = [
            { name: 'topLeft', x: cropArea.x, y: cropArea.y },
            { name: 'topRight', x: cropArea.x + cropArea.width, y: cropArea.y },
            { name: 'bottomLeft', x: cropArea.x, y: cropArea.y + cropArea.height },
            { name: 'bottomRight', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height },
            { name: 'top', x: cropArea.x + cropArea.width / 2, y: cropArea.y },
            { name: 'right', x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height / 2 },
            { name: 'bottom', x: cropArea.x + cropArea.width / 2, y: cropArea.y + cropArea.height },
            { name: 'left', x: cropArea.x, y: cropArea.y + cropArea.height / 2 }
        ];

        for (const handle of handles) {
            if (Math.abs(imageX - handle.x) < handleSize && Math.abs(imageY - handle.y) < handleSize) {
                setResizeHandle(handle.name);
                setIsDragging(true);
                setDragStart({ x: imageX, y: imageY });
                setAutoAspectRatioCrop(false); // Disable auto aspect ratio when manually adjusting
                return;
            }
        }

        // Check if we're inside the crop area (for moving)
        if (
            imageX >= cropArea.x && 
            imageX <= cropArea.x + cropArea.width && 
            imageY >= cropArea.y && 
            imageY <= cropArea.y + cropArea.height
        ) {
            setResizeHandle('move');
            setIsDragging(true);
            setDragStart({ x: imageX, y: imageY });
            return;
        }

        // Otherwise, create a new selection
        setCropArea({
            x: imageX,
            y: imageY,
            width: 0,
            height: 0
        });
        setIsDragging(true);
        setDragStart({ x: imageX, y: imageY });
        setResizeHandle('bottomRight');
        setAutoAspectRatioCrop(false); // Disable auto aspect ratio when creating new selection
    },

    // Handle crop move event
    handleCropMove: (e, isDragging, cropMode, cropContainerRef, canvasScale, cropImageRef, cropArea, 
                  resizeHandle, dragStart, selectedRatio, autoAspectRatioCrop, aspectRatioOptions, 
                  setDragStart, setCropArea, setResizeHandle) => {
        if (!isDragging || !cropMode) return;

        // Prevent default behavior to avoid image dragging
        e.preventDefault();

        const container = cropContainerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert screen coordinates to original image coordinates
        const imageX = x / canvasScale;
        const imageY = y / canvasScale;

        const img = cropImageRef.current;
        const imgWidth = img ? img.naturalWidth : 0;
        const imgHeight = img ? img.naturalHeight : 0;

        // Constrain coordinates to the image boundaries
        const constrainedX = Math.max(0, Math.min(imageX, imgWidth));
        const constrainedY = Math.max(0, Math.min(imageY, imgHeight));

        // Get current target aspect ratio
        const targetRatio = selectedRatio !== 'Custom' && autoAspectRatioCrop
            ? aspectRatioOptions[selectedRatio]
            : null;

        if (resizeHandle === 'move') {
            // Move the entire selection
            const dx = constrainedX - dragStart.x;
            const dy = constrainedY - dragStart.y;

            let newX = cropArea.x + dx;
            let newY = cropArea.y + dy;

            // Keep the selection within bounds
            newX = Math.max(0, Math.min(newX, imgWidth - cropArea.width));
            newY = Math.max(0, Math.min(newY, imgHeight - cropArea.height));

            setCropArea({
                ...cropArea,
                x: newX,
                y: newY
            });

            setDragStart({ x: constrainedX, y: constrainedY });
            return;
        }

        let newCropArea = { ...cropArea };

        // Handle normal resizing without aspect ratio constraint
        if (!targetRatio) {
            switch (resizeHandle) {
                case 'topLeft':
                    newCropArea.width += newCropArea.x - constrainedX;
                    newCropArea.height += newCropArea.y - constrainedY;
                    newCropArea.x = constrainedX;
                    newCropArea.y = constrainedY;
                    break;
                case 'topRight':
                    newCropArea.width = constrainedX - newCropArea.x;
                    newCropArea.height += newCropArea.y - constrainedY;
                    newCropArea.y = constrainedY;
                    break;
                case 'bottomLeft':
                    newCropArea.width += newCropArea.x - constrainedX;
                    newCropArea.height = constrainedY - newCropArea.y;
                    newCropArea.x = constrainedX;
                    break;
                case 'bottomRight':
                    newCropArea.width = constrainedX - newCropArea.x;
                    newCropArea.height = constrainedY - newCropArea.y;
                    break;
                case 'top':
                    newCropArea.height += newCropArea.y - constrainedY;
                    newCropArea.y = constrainedY;
                    break;
                case 'right':
                    newCropArea.width = constrainedX - newCropArea.x;
                    break;
                case 'bottom':
                    newCropArea.height = constrainedY - newCropArea.y;
                    break;
                case 'left':
                    newCropArea.width += newCropArea.x - constrainedX;
                    newCropArea.x = constrainedX;
                    break;
                default:
                    break;
            }
        } else {
            // Handle resizing with aspect ratio constraint
            let newWidth, newHeight;
            
            switch (resizeHandle) {
                case 'topLeft':
                case 'bottomRight':
                    // Calculate new width and height based on the cursor position
                    newWidth = resizeHandle === 'topLeft' 
                        ? cropArea.width + (cropArea.x - constrainedX)
                        : constrainedX - cropArea.x;
                    
                    // Adjust height based on aspect ratio
                    newHeight = newWidth / targetRatio;
                    
                    // Update crop area
                    if (resizeHandle === 'topLeft') {
                        newCropArea.x = cropArea.x + cropArea.width - newWidth;
                        newCropArea.y = cropArea.y + cropArea.height - newHeight;
                    }
                    newCropArea.width = newWidth;
                    newCropArea.height = newHeight;
                    break;
                    
                case 'topRight':
                case 'bottomLeft':
                    // Calculate new width and height based on the cursor position
                    newWidth = resizeHandle === 'topRight' 
                        ? constrainedX - cropArea.x
                        : cropArea.width + (cropArea.x - constrainedX);
                    
                    // Adjust height based on aspect ratio
                    newHeight = newWidth / targetRatio;
                    
                    // Update crop area
                    if (resizeHandle === 'topRight') {
                        newCropArea.y = cropArea.y + cropArea.height - newHeight;
                    } else {
                        newCropArea.x = cropArea.x + cropArea.width - newWidth;
                    }
                    newCropArea.width = newWidth;
                    newCropArea.height = newHeight;
                    break;
                    
                case 'top':
                case 'bottom':
                    // Calculate new height based on the cursor position
                    newHeight = resizeHandle === 'top'
                        ? cropArea.height + (cropArea.y - constrainedY)
                        : constrainedY - cropArea.y;
                    
                    // Adjust width based on aspect ratio
                    newWidth = newHeight * targetRatio;
                    
                    // Update crop area
                    if (resizeHandle === 'top') {
                        newCropArea.y = cropArea.y + cropArea.height - newHeight;
                    }
                    // Center the width adjustment
                    newCropArea.x = cropArea.x + (cropArea.width - newWidth) / 2;
                    newCropArea.width = newWidth;
                    newCropArea.height = newHeight;
                    break;
                    
                case 'left':
                case 'right':
                    // Calculate new width based on the cursor position
                    newWidth = resizeHandle === 'left'
                        ? cropArea.width + (cropArea.x - constrainedX)
                        : constrainedX - cropArea.x;
                    
                    // Adjust height based on aspect ratio
                    newHeight = newWidth / targetRatio;
                    
                    // Update crop area
                    if (resizeHandle === 'left') {
                        newCropArea.x = cropArea.x + cropArea.width - newWidth;
                    }
                    // Center the height adjustment
                    newCropArea.y = cropArea.y + (cropArea.height - newHeight) / 2;
                    newCropArea.width = newWidth;
                    newCropArea.height = newHeight;
                    break;
                    
                default:
                    break;
            }
        }

        // Ensure width and height are positive
        if (newCropArea.width < 0) {
            newCropArea.x += newCropArea.width;
            newCropArea.width = Math.abs(newCropArea.width);

            // Switch handles horizontally
            if (resizeHandle === 'topLeft') {
                setResizeHandle('topRight');
            } else if (resizeHandle === 'bottomLeft') {
                setResizeHandle('bottomRight');
            } else if (resizeHandle === 'topRight') {
                setResizeHandle('topLeft');
            } else if (resizeHandle === 'bottomRight') {
                setResizeHandle('bottomLeft');
            } else if (resizeHandle === 'left') {
                setResizeHandle('right');
            } else if (resizeHandle === 'right') {
                setResizeHandle('left');
            }
        }

        if (newCropArea.height < 0) {
            newCropArea.y += newCropArea.height;
            newCropArea.height = Math.abs(newCropArea.height);

            // Switch handles vertically
            if (resizeHandle === 'topLeft') {
                setResizeHandle('bottomLeft');
            } else if (resizeHandle === 'topRight') {
                setResizeHandle('bottomRight');
            } else if (resizeHandle === 'bottomLeft') {
                setResizeHandle('topLeft');
            } else if (resizeHandle === 'bottomRight') {
                setResizeHandle('topRight');
            } else if (resizeHandle === 'top') {
                setResizeHandle('bottom');
            } else if (resizeHandle === 'bottom') {
                setResizeHandle('top');
            }
        }

        // Constrain the crop area to the image boundaries
        newCropArea.x = Math.max(0, newCropArea.x);
        newCropArea.y = Math.max(0, newCropArea.y);
        newCropArea.width = Math.min(newCropArea.width, imgWidth - newCropArea.x);
        newCropArea.height = Math.min(newCropArea.height, imgHeight - newCropArea.y);

        setCropArea(newCropArea);
    },

    // Apply crop to image
    applyCrop: (currentImage, cropArea, setHistory, setCurrentImage, setCropMode, setAutoAspectRatioCrop) => {
        if (!currentImage || !cropArea.width || !cropArea.height) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas dimensions to the crop size
            canvas.width = cropArea.width;
            canvas.height = cropArea.height;

            // Draw the cropped portion to the canvas
            ctx.drawImage(
                img,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, cropArea.width, cropArea.height
            );

            // Convert to base64
            const croppedImageData = canvas.toDataURL('image/png');

            // Add to history
            const newHistoryItem = {
                id: Date.now(),
                image: croppedImageData,
                isOriginal: false
            };

            setHistory(prev => [...prev, newHistoryItem]);
            setCurrentImage(croppedImageData);
            setCropMode(false);
            setAutoAspectRatioCrop(true); // Reset to auto mode for next time
        };

        img.src = currentImage;
    },

    // Set optimal crop area based on aspect ratio
    setOptimalCropArea: (currentImage, cropMode, selectedRatio, aspectRatioOptions, setCropTransitioning, 
                       setCropArea, updateCanvasDimensions) => {
        if (!currentImage || !cropMode) return;
        
        setCropTransitioning(true); // Start transition
        
        const img = new Image();
        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;
            const currentRatio = imgWidth / imgHeight;
            
            // Get target aspect ratio
            const targetRatio = selectedRatio !== 'Custom' ? aspectRatioOptions[selectedRatio] : currentRatio;
            
            let newWidth, newHeight, newX, newY;
            
            // Calculate dimensions while preserving as much of the image as possible
            if (currentRatio > targetRatio) {
                // Image is wider than target ratio, maintain height
                newHeight = imgHeight;
                newWidth = imgHeight * targetRatio;
                // Center horizontally
                newX = (imgWidth - newWidth) / 2;
                newY = 0;
            } else {
                // Image is taller than target ratio, maintain width
                newWidth = imgWidth;
                newHeight = imgWidth / targetRatio;
                // Center vertically
                newX = 0;
                newY = (imgHeight - newHeight) / 2;
            }
            
            // Set the new crop area with integer values to avoid blurry rendering
            setCropArea({
                x: Math.round(newX),
                y: Math.round(newY),
                width: Math.round(newWidth),
                height: Math.round(newHeight)
            });
            
            // Update canvas dimensions
            updateCanvasDimensions();
            
            // Allow a slight delay for the transition to complete
            setTimeout(() => {
                setCropTransitioning(false);
            }, 350); // Match this with the CSS transition duration
        };
        img.src = currentImage;
    },

    // Reset crop to original size
    resetCropToOriginal: (currentImage, cropMode, setCropTransitioning, setCropArea, setSelectedRatio,
                        setAutoAspectRatioCrop, updateCanvasDimensions) => {
        if (!currentImage || !cropMode) return;
        
        setCropTransitioning(true);
        
        const img = new Image();
        img.onload = () => {
            setCropArea({
                x: 0,
                y: 0,
                width: img.width,
                height: img.height
            });
            
            // Reset to custom ratio since we're using the full image
            setSelectedRatio('Custom');
            setAutoAspectRatioCrop(false);
            
            // Update canvas dimensions
            updateCanvasDimensions();
            
            setTimeout(() => {
                setCropTransitioning(false);
            }, 350);
        };
        img.src = currentImage;
    }
};

// Calculate extension dimensions for aspect ratio (without percentage calculations)
export const calculateExtensionDimensions = (imgWidth, imgHeight, targetRatio) => {
    const currentRatio = imgWidth / imgHeight;
    let newExtendWidth = 0;
    let newExtendHeight = 0;
    
    if (currentRatio < targetRatio) {
        // Need to extend width
        const newWidth = Math.ceil(imgHeight * targetRatio);
        newExtendWidth = Math.ceil((newWidth - imgWidth) / 64) * 64;
    } else {
        // Need to extend height
        const newHeight = Math.ceil(imgWidth / targetRatio);
        newExtendHeight = Math.ceil((newHeight - imgHeight) / 64) * 64;
    }
    
    return {
        width: imgWidth + newExtendWidth,
        height: imgHeight + newExtendHeight,
        extendWidth: newExtendWidth,
        extendHeight: newExtendHeight
    };
};

// Calculate percentage of AI-generated content
export const calculateAIContentPercentage = (originalWidth, originalHeight, newWidth, newHeight) => {
  if (!originalWidth || !originalHeight || !newWidth || !newHeight) return 0;
  
  const originalArea = originalWidth * originalHeight;
  const newArea = newWidth * newHeight;
  const generatedArea = newArea - originalArea;
  
  // Calculate percentage of generated content
  const generatedPercentage = (generatedArea / newArea) * 100;
  
  // Return rounded percentage
  return Math.round(generatedPercentage);
};