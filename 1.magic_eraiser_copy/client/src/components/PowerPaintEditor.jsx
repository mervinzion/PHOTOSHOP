import React, { useState, useRef, useEffect } from 'react';
// Update the import at the top of PowerPaintEditor.jsx
import { 
    Download, Settings, Wand2, Undo, Redo, Eye, ChevronLeft, ChevronRight, X, Plus, 
    Minus, Menu, Lock, Unlock, MessageSquare, ZoomIn, CheckCircle
  } from 'lucide-react';

// Import supporting components and utilities
import {
  // Constants
  MAX_ZOOM_LEVEL,
  TABS_PER_PAGE,
  
  // Utility functions
  getZoomPercentage,
  getCanvasCoordinates,
  backupMaskCanvas,
  restoreMaskCanvas,
  isBrushDisabled,
  loadImageToCanvas,
  createCustomStyles,
  scrollTabIntoView,
  
  // Component renderers
  Tooltip,
  LeftPanel,
  RightPanel,
  ZoomControls,
  BrushSizeIndicator,
  ContextMenu,
  HistoryPanel,
  DeleteConfirmationDialog,
  DownloadDialog,
  BulkDownloadConfirmation,
  InstructionsModal,
  FeedbackDialog,
  MobileMenu,
  SettingsPanel,
  ProcessingOverlay,
  CanvasLockOverlay,
  ZoomModeOverlay
} from './PowerPaintEditor_s1';

const PowerPaintEditor = ({ initialImage, onReset }) => {
    // Main state
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState('brush');
    const [brushSize, setBrushSize] = useState(20);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [samPoints, setSamPoints] = useState([]);
    
    // History state
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [currentHistoryItem, setCurrentHistoryItem] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [historyMinimized, setHistoryMinimized] = useState(true);
    const [historyPageIndex, setHistoryPageIndex] = useState(0);
    const [lastNonOriginalItem, setLastNonOriginalItem] = useState(null);

    // Panel visibility and state
    const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
    const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
    const [panelsHidden, setPanelsHidden] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showDownloadDialog, setShowDownloadDialog] = useState(false);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [tabToDelete, setTabToDelete] = useState(null);
    
    // UI interaction state
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [isDraggingContextMenu, setIsDraggingContextMenu] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showBrushSizeIndicator, setShowBrushSizeIndicator] = useState(false);
    const [isCanvasLocked, setIsCanvasLocked] = useState(false);

    // Zoom state
    const [zoomLevel, setZoomLevel] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
    const [showZoomControls, setShowZoomControls] = useState(false);
    const [zoomDrawMode, setZoomDrawMode] = useState(false);

    // Panel navigation system - NEW FEATURE
    const [activePanel, setActivePanel] = useState(null); // 'left', 'right', or null
    const [leftPanelActiveIndex, setLeftPanelActiveIndex] = useState(0);

    // Model settings
    const [modelType, setModelType] = useState('sdxl');
    const [steps, setSteps] = useState(30);
    const [guidanceScale, setGuidanceScale] = useState(8.5);
    const [seed, setSeed] = useState(42);
    const [negativePrompt, setNegativePrompt] = useState('');

    // Processed and pending images management
    const [processedImages, setProcessedImages] = useState([]);
    const [pendingImages, setPendingImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showBulkDownloadConfirmation, setShowBulkDownloadConfirmation] = useState(false);

    // Refs
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const maskCanvasRef = useRef(null);
    const contextRef = useRef(null);
    const maskContextRef = useRef(null);
    const maskBackupRef = useRef(null);
    const contextMenuRef = useRef(null);
    const brushIndicatorTimeoutRef = useRef(null);
    const hasDrawnRef = useRef(false);
    const historyContainerRef = useRef(null);
    const canvasContainerRef = useRef(null);
    const lastPoint = useRef({ x: 0, y: 0 });
    const promptInputRef = useRef(null);

    // Initialize with images
    useEffect(() => {
        if (initialImage) {
            if (Array.isArray(initialImage)) {
                console.log("Initializing with multiple images:", initialImage.length);
                setPendingImages(initialImage);
            } else {
                console.log("Initializing with single image");
                setPendingImages([initialImage]);
            }
            setCurrentImageIndex(0);
            
            // Initialize right panel as active if we have pending images
            setActivePanel('right');
        }
    }, [initialImage]);

    // Set up canvas when image changes
    useEffect(() => {
        if (!pendingImages[currentImageIndex] || !containerRef.current) return;

        const img = new Image();
        img.onload = () => {
            const container = containerRef.current;
            const canvas = canvasRef.current;
            const maskCanvas = maskCanvasRef.current;

            if (!container || !canvas || !maskCanvas) return;

            // Get actual container dimensions
            const containerRect = container.getBoundingClientRect();
            
            // Calculate available space, accounting for panels
            const containerWidth = containerRect.width - (isMobile ? 20 : panelsHidden ? 40 : 460); 
            const containerHeight = containerRect.height - (isMobile ? 120 : 120);

            // Calculate scale to fit image
            const scale = Math.min(
                containerWidth / img.width,
                containerHeight / img.height
            ) * (isMobile ? 0.9 : panelsHidden ? 0.98 : 0.95);

            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // Set canvas dimensions
            [canvas, maskCanvas].forEach(c => {
                c.style.width = `${scaledWidth}px`;
                c.style.height = `${scaledHeight}px`;
                c.width = img.width;
                c.height = img.height;

                const ctx = c.getContext('2d');
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                c.style.maxWidth = '100%';
                c.style.margin = '0 auto';
            });

            // Draw initial image
            const context = canvas.getContext('2d');
            context.drawImage(img, 0, 0, img.width, img.height);

            // Reset zoom states
            setZoomLevel(0);
            setPanPosition({ x: 0, y: 0 });
            setIsZoomed(false);
            setZoomDrawMode(false);

            contextRef.current = context;
            maskContextRef.current = maskCanvas.getContext('2d');
            
            // Clear mask canvas
            maskContextRef.current.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

            // Initialize history
            const initialHistoryItem = {
                id: 'original',
                processedImage: pendingImages[currentImageIndex],
                isOriginal: true
            };
            setHistory([initialHistoryItem]);
            setCurrentHistoryItem(initialHistoryItem);
            setHistoryIndex(0);
        };
        img.src = pendingImages[currentImageIndex];
    }, [pendingImages, currentImageIndex, isMobile, panelsHidden]);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 992); // Increase breakpoint for better tablet support
            if (window.innerWidth < 992) {
                setShowHistory(false);
                setLeftPanelExpanded(false);
                setRightPanelExpanded(false);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => { window.removeEventListener('resize', checkMobile); };
    }, []);

    // Reset pan position when zoom level changes to 0
    useEffect(() => {
        if (zoomLevel === 0) {
            setPanPosition({ x: 0, y: 0 }); 
        }
    }, [zoomLevel]);

    // Window resize handler
    useEffect(() => {
        const handleResize = () => {
            if (!pendingImages[currentImageIndex] || !containerRef.current || !canvasRef.current) return;
            
            const img = new Image();
            img.onload = () => {
                const container = containerRef.current;
                const canvas = canvasRef.current;
                const maskCanvas = maskCanvasRef.current;

                if (!container || !canvas || !maskCanvas) return;

                // Get container dimensions
                const containerRect = container.getBoundingClientRect();
                
                // Calculate available space
                const containerWidth = containerRect.width - (isMobile ? 40 : panelsHidden ? 80 : 480);
                const containerHeight = containerRect.height - (isMobile ? 220 : 180);

                // Calculate scale
                const scale = Math.min(
                    containerWidth / img.width,
                    containerHeight / img.height
                ) * (isMobile ? 0.75 : panelsHidden ? 0.90 : 0.85);

                // Set canvas dimensions
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;

                [canvas, maskCanvas].forEach(c => {
                    c.style.width = `${scaledWidth}px`;
                    c.style.height = `${scaledHeight}px`;
                });
                
                // Reset zoom
                setZoomLevel(0);
                setPanPosition({ x: 0, y: 0 });
                setIsZoomed(false);
            };
            img.src = pendingImages[currentImageIndex];
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pendingImages, currentImageIndex, isMobile, panelsHidden]);

    // Update history page index when adding new items
    useEffect(() => {
        if (history.length > 0) {
            const nonOriginalItems = history.filter(item => !item.isOriginal);
            const currentItemIndex = nonOriginalItems.findIndex(item => 
                currentHistoryItem && item.id === currentHistoryItem.id
            );
            
            if (currentItemIndex >= 0) {
                setHistoryPageIndex(Math.floor(currentItemIndex / TABS_PER_PAGE));
            }
        }
    }, [history, currentHistoryItem]);

    // Custom CSS for scrollbar
    useEffect(() => {
        const style = createCustomStyles();
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    // Keyboard shortcuts and panel navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Skip shortcuts when typing in an input or dialog is open
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || 
                showDeleteConfirmation || showDownloadDialog || showSettings) {
                return;
            }
            
            // Y to approve image
            if (e.key.toLowerCase() === 'y' && !isLoading) {
                e.preventDefault();
                handleApproveImage();
            }
            
            // NEW FEATURE: Arrow keys for panel navigation
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                // Skip if panels are hidden or if typing
                if (panelsHidden) return;
                
                e.preventDefault();
                const isUp = e.key === 'ArrowUp';
                
                // If no panel is active, activate left or right panel
                if (!activePanel) {
                    if (processedImages.length > 0) {
                        setActivePanel('left');
                    } else if (pendingImages.length > 0) {
                        setActivePanel('right');
                    }
                    return;
                }
                
                // Handle up/down navigation within active panel
                if (activePanel === 'left' && leftPanelExpanded) {
                    if (processedImages.length > 0) {
                        if (isUp) {
                            // Navigate up in left panel
                            setLeftPanelActiveIndex(prev => (prev > 0 ? prev - 1 : processedImages.length - 1));
                        } else {
                            // Navigate down in left panel
                            setLeftPanelActiveIndex(prev => (prev < processedImages.length - 1 ? prev + 1 : 0));
                        }
                    }
                } else if (activePanel === 'right' && rightPanelExpanded) {
                    if (pendingImages.length > 0) {
                        if (isUp) {
                            // Navigate up in right panel
                            setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : pendingImages.length - 1));
                        } else {
                            // Navigate down in right panel
                            setCurrentImageIndex(prev => (prev < pendingImages.length - 1 ? prev + 1 : 0));
                        }
                        
                        // Update history for the new image
                        const initialHistoryItem = {
                            id: 'original',
                            processedImage: pendingImages[currentImageIndex],
                            isOriginal: true
                        };
                        setHistory([initialHistoryItem]);
                        setCurrentHistoryItem(initialHistoryItem);
                        setHistoryIndex(0);
                        
                        if (mode === 'original') {
                            setMode('brush');
                            maskCanvasRef.current.style.display = 'block';
                        }
                    }
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Skip if fullscreen mode
                if (panelsHidden) return;
                
                const isLeft = e.key === 'ArrowLeft';
                
                // Switch between panels
                if (activePanel) {
                    if (isLeft && activePanel === 'right' && leftPanelExpanded && processedImages.length > 0) {
                        // Switch from right to left panel
                        e.preventDefault();
                        setActivePanel('left');
                        return;
                    } else if (!isLeft && activePanel === 'left' && rightPanelExpanded && pendingImages.length > 0) {
                        // Switch from left to right panel
                        e.preventDefault();
                        setActivePanel('right');
                        return;
                    }
                }
                
                // If no panel switch happened, handle image navigation in right panel
                if (!e.defaultPrevented && pendingImages.length > 1 && !isLoading &&
                    (activePanel === 'right' || !activePanel)) {
                    e.preventDefault();
                    navigateImages(isLeft ? 'prev' : 'next');
                }
            }
            
            // B for bulk download
            if (e.key.toLowerCase() === 'b' && !isLoading && processedImages.length > 0) {
                e.preventDefault();
                setShowBulkDownloadConfirmation(true);
            }

            // Ctrl/Cmd + Z (Undo)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }
            
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y (Redo)
            if ((e.ctrlKey || e.metaKey) && ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')) {
                e.preventDefault();
                handleRedo();
            }
            
            // H for history panel
            if (e.key.toLowerCase() === 'h') {
                e.preventDefault();
                if (!showHistory) {
                    setShowHistory(true);
                    setHistoryMinimized(false);
                } else {
                    setShowHistory(false);
                }
            }
            
            // L for canvas lock
            if (e.key.toLowerCase() === 'l') {
                e.preventDefault();
                toggleCanvasLock();
            }
            
            // +/- for brush size
            if ((e.key === '+' || e.key === '=') && e.shiftKey) {
                e.preventDefault();
                increaseBrushSize();
            }
            if ((e.key === '-' || e.key === '_') && e.shiftKey) {
                e.preventDefault();
                decreaseBrushSize();
            }

            // Z for zoom controls
            if (e.key.toLowerCase() === 'z') {
                e.preventDefault();
                
                if (isZoomed && !e.shiftKey) {
                    // Toggle draw/pan mode
                    setZoomDrawMode(prev => {
                        const newDrawMode = !prev;
                        setShowZoomControls(!newDrawMode);
                        return newDrawMode;
                    });
                } else if (!isZoomed) {
                    // Enter zoom mode
                    handleZoomIn();
                } else if (isZoomed && e.shiftKey) {
                    // Exit zoom mode
                    exitZoomMode();
                }
            }

            // F for fit mode
            if (e.key.toLowerCase() === 'f') {
                e.preventDefault();
                toggleFitScreen();
            }

            // T for tab navigation
            if (e.key.toLowerCase() === 't' && !isLoading && history.length > 0) {
                e.preventDefault();
                if (!showHistory) {
                    setShowHistory(true);
                    setHistoryMinimized(false);
                    return;
                }
                
                const navigableTabs = history.filter(item => !item.isOriginal);
                if (navigableTabs.length === 0) return;
                
                let newIndex;
                if (e.shiftKey) {
                    // Navigate backward
                    const currentIdx = navigableTabs.findIndex(item => 
                        currentHistoryItem && item.id === currentHistoryItem.id
                    );
                    newIndex = currentIdx <= 0 ? navigableTabs.length - 1 : currentIdx - 1;
                } else {
                    // Navigate forward
                    const currentIdx = navigableTabs.findIndex(item => 
                        currentHistoryItem && item.id === currentHistoryItem.id
                    );
                    newIndex = currentIdx === -1 || currentIdx === navigableTabs.length - 1 ? 0 : currentIdx + 1;
                }
                
                const historyTabIndex = history.findIndex(item => item.id === navigableTabs[newIndex].id);
                setHistoryIndex(historyTabIndex);
                setCurrentHistoryItem(history[historyTabIndex]);
                
                loadImageToCanvas(
                    history[historyTabIndex].processedImage,
                    historyTabIndex
                );
                
                setHistoryPageIndex(Math.floor(newIndex / TABS_PER_PAGE));
                
                if (mode === 'original') {
                    setMode('brush');
                    maskCanvasRef.current.style.display = 'block';
                }
                
                // Scroll active tab into view - NEW FEATURE
                scrollTabIntoView(historyContainerRef, navigableTabs[newIndex].id);
            }

            // X to delete current tab
            if (e.key.toLowerCase() === 'x' && !isLoading && currentHistoryItem && !currentHistoryItem.isOriginal) {
                e.preventDefault();
                if (!showHistory) {
                    setShowHistory(true);
                    setHistoryMinimized(false);
                    return;
                }
                
                setTabToDelete(currentHistoryItem.id);
                setShowDeleteConfirmation(true);
            }

            // O for original view toggle
            if (e.key.toLowerCase() === 'o' && !isLoading) {
                e.preventDefault();
                toggleOriginalView();
            }
            
            // I for instructions
            if (e.key.toLowerCase() === 'i' && !isLoading) {
                e.preventDefault();
                setShowInstructions(prev => !prev);
            }
            
            // D for download
            if (e.key.toLowerCase() === 'd' && !isLoading) {
                e.preventDefault();
                setShowDownloadDialog(true);
            }
            
            // S for shortcuts menu
            if (e.key.toLowerCase() === 's' && !isLoading) {
                e.preventDefault();
                setShowContextMenu(prev => !prev);
                if (!showContextMenu) {
                    setContextMenuPosition({
                        x: window.innerWidth / 2,
                        y: window.innerHeight / 2
                    });
                }
            }
            
            // Enter to apply action on active panel item
            if (e.key === 'Enter' && activePanel && !isLoading) {
                e.preventDefault();
                if (activePanel === 'left' && processedImages.length > 0) {
                    // Handle action on selected processed image (e.g., recover)
                    handleRecoverImage(leftPanelActiveIndex);
                } else if (activePanel === 'right' && pendingImages.length > 0) {
                    // Image is already selected, focus on prompt input
                    if (promptInputRef.current) {
                        promptInputRef.current.focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => { window.removeEventListener('keydown', handleKeyDown); };
    }, [
        history, historyIndex, brushSize, mode, isLoading, currentHistoryItem, 
        showDeleteConfirmation, tabToDelete, showContextMenu, isMobile, showHistory, 
        zoomLevel, showZoomControls, isZoomed, processedImages, pendingImages, currentImageIndex,
        panelsHidden, showSettings, showDownloadDialog, activePanel, leftPanelActiveIndex,
        leftPanelExpanded, rightPanelExpanded
    ]);

    // Add mouse wheel support for brush size or zoom
    useEffect(() => {
        const handleWheel = (e) => {
            if (e.shiftKey) {
                e.preventDefault();
                if (isZoomed && !zoomDrawMode) {
                    // Zoom control
                    if (e.deltaY < 0) {
                        handleZoomIn();
                    } else {
                        handleZoomOut();
                    }
                } else {
                    // Brush size control
                    if (e.deltaY < 0) {
                        increaseBrushSize();
                    } else {
                        decreaseBrushSize();
                    }
                }
            }
        };

        const canvas = maskCanvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (canvas) {
                canvas.removeEventListener('wheel', handleWheel);
            }
        };
    }, [brushSize, isZoomed, zoomLevel, zoomDrawMode]);

    // Handle right-click context menu
    useEffect(() => {
        const handleContextMenu = (e) => {
            if (isMobile) return;
            e.preventDefault();
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
        };

        const handleClickOutside = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setShowContextMenu(false);
            }
        };

        const handleMouseMove = (e) => {
            if (isDraggingContextMenu) {
                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;
                const constrainedX = Math.min(Math.max(0, newX), window.innerWidth - 270);
                const constrainedY = Math.min(Math.max(0, newY), window.innerHeight - 400);
                setContextMenuPosition({ x: constrainedX, y: constrainedY });
            }
        };

        const handleMouseUp = () => { setIsDraggingContextMenu(false); };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isMobile, isDraggingContextMenu, dragOffset]);

    // UI Action Handlers
    const toggleCanvasLock = () => {
        setIsCanvasLocked(prev => !prev);
    };

    const showBrushSizePreview = (size) => {
        setShowBrushSizeIndicator(true);
        if (brushIndicatorTimeoutRef.current) {
            clearTimeout(brushIndicatorTimeoutRef.current);
        }
        brushIndicatorTimeoutRef.current = setTimeout(() => {
            setShowBrushSizeIndicator(false);
        }, 1000);
    };
    
    const increaseBrushSize = () => {
        setBrushSize(prev => {
            const newSize = Math.min(prev + 5, 50);
            showBrushSizePreview(newSize);
            return newSize;
        });
    };
    
    const decreaseBrushSize = () => {
        setBrushSize(prev => {
            const newSize = Math.max(prev - 5, 1);
            showBrushSizePreview(newSize);
            return newSize;
        });
    };
    
    const handleBrushSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setBrushSize(newSize);
        showBrushSizePreview(newSize);
    };

    // History navigation
    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCurrentHistoryItem(history[newIndex]);
            
            loadImageToCanvas(
                history[newIndex].processedImage,
                newIndex
            );
            
            if (mode === 'original') {
                setMode('brush');
                maskCanvasRef.current.style.display = 'block';
            }
            
            const nonOriginalItems = history.filter(item => !item.isOriginal);
            const currentNonOriginalIndex = nonOriginalItems.findIndex(item => 
                item.id === history[newIndex].id
            );
            
            if (currentNonOriginalIndex >= 0) {
                setHistoryPageIndex(Math.floor(currentNonOriginalIndex / TABS_PER_PAGE));
            }
            
            if (!history[newIndex].isOriginal) {
                setLastNonOriginalItem(history[newIndex]);
            }
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setCurrentHistoryItem(history[newIndex]);
            
            loadImageToCanvas(
                history[newIndex].processedImage,
                newIndex
            );
            
            if (mode === 'original') {
                setMode('brush');
                maskCanvasRef.current.style.display = 'block';
            }
            
            const nonOriginalItems = history.filter(item => !item.isOriginal);
            const currentNonOriginalIndex = nonOriginalItems.findIndex(item => 
                item.id === history[newIndex].id
            );
            
            if (currentNonOriginalIndex >= 0) {
                setHistoryPageIndex(Math.floor(currentNonOriginalIndex / TABS_PER_PAGE));
            }
            
            if (!history[newIndex].isOriginal) {
                setLastNonOriginalItem(history[newIndex]);
            }
        }
    };

    const handlePrevHistoryPage = () => {
        if (historyPageIndex > 0) {
            setHistoryPageIndex(historyPageIndex - 1);
        }
    };

    const handleNextHistoryPage = () => {
        const nonOriginalItems = history.filter(item => !item.isOriginal);
        const totalPages = Math.ceil(nonOriginalItems.length / TABS_PER_PAGE);

        if (historyPageIndex < totalPages - 1) {
            setHistoryPageIndex(historyPageIndex + 1);
        }
    };

    const handleDeleteTab = (tabId) => {
        if (!showHistory) {
            setShowHistory(true);
            setHistoryMinimized(false);
            return;
        }

        setTabToDelete(tabId);
        setShowDeleteConfirmation(true);
    };

    const handleConfirmDelete = () => {
        if (!tabToDelete) return;

        const tabIndex = history.findIndex(item => item.id === tabToDelete);
        if (tabIndex === -1 || history[tabIndex].isOriginal) {
            setShowDeleteConfirmation(false);
            setTabToDelete(null);
            return;
        }

        const newHistory = history.filter(item => item.id !== tabToDelete);

        let newHistoryIndex = historyIndex;
        if (tabIndex < historyIndex) {
            newHistoryIndex--;
        } else if (tabIndex === historyIndex) {
            newHistoryIndex = Math.max(0, historyIndex - 1);
        }

        setHistory(newHistory);
        setHistoryIndex(newHistoryIndex);
        setCurrentHistoryItem(newHistory[newHistoryIndex]);

        if (tabToDelete === lastNonOriginalItem?.id) {
            const newLastNonOriginal = newHistory.slice().reverse().find(item => !item.isOriginal);
            setLastNonOriginalItem(newLastNonOriginal || null);
        }

        loadImageToCanvas(
            newHistory[newHistoryIndex].processedImage,
            newHistoryIndex
        );

        const nonOriginalItems = newHistory.filter(item => !item.isOriginal);
        const currentItemIndex = nonOriginalItems.findIndex(item => 
            item.id === newHistory[newHistoryIndex].id
        );

        if (currentItemIndex >= 0) {
            setHistoryPageIndex(Math.floor(currentItemIndex / TABS_PER_PAGE));
        } else if (nonOriginalItems.length === 0) {
            setHistoryPageIndex(0);
        } else {
            const totalPages = Math.ceil(nonOriginalItems.length / TABS_PER_PAGE);
            if (historyPageIndex >= totalPages) {
                setHistoryPageIndex(totalPages - 1);
            }
        }

        setShowDeleteConfirmation(false);
        setTabToDelete(null);
    };

    const toggleOriginalView = () => {
        if (mode === 'brush') {
            setMode('original');
            maskCanvasRef.current.style.display = 'none';
            loadImageToCanvas(
                pendingImages[currentImageIndex]
            );
        } else {
            setMode('brush');
            maskCanvasRef.current.style.display = 'block';
            
            const nonOriginalItems = history.filter(item => !item.isOriginal);
            
            if (nonOriginalItems.length > 0) {
                const lastEditedItem = nonOriginalItems[nonOriginalItems.length - 1];
                const lastEditIndex = history.findIndex(item => item.id === lastEditedItem.id);
                
                setHistoryIndex(lastEditIndex);
                setCurrentHistoryItem(lastEditedItem);
                loadImageToCanvas(
                    lastEditedItem.processedImage,
                    lastEditIndex
                );
                
                const lastEditedItemIndex = nonOriginalItems.length - 1;
                setHistoryPageIndex(Math.floor(lastEditedItemIndex / TABS_PER_PAGE));
            }
        }
    };

    // Zoom Controls
    const handleZoomIn = () => {
        setZoomLevel(prev => {
            const newLevel = Math.min(prev + 1, MAX_ZOOM_LEVEL);
            if (newLevel > 0 && prev === 0) {
                setShowZoomControls(true);
            }
            return newLevel;
        });
        if (!isZoomed) {
            setIsZoomed(true);
        }
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => {
            const newLevel = Math.max(prev - 1, 0);
            if (newLevel === 0) {
                setPanPosition({ x: 0, y: 0 });
            }
            return newLevel;
        });
    };

    const handleResetZoom = () => {
        setZoomLevel(0);
        setPanPosition({ x: 0, y: 0 });
    };

    const exitZoomMode = () => {
        setZoomLevel(0);
        setPanPosition({ x: 0, y: 0 });
        setIsZoomed(false);
        setZoomDrawMode(false);
        setShowZoomControls(false);
    };

    const startPanning = (event) => {
        if (!isZoomed || zoomDrawMode || isDrawing) return;

        let nativeEvent;
        if (event.type === 'touchstart') {
            nativeEvent = event.touches[0];
            event.preventDefault();
        } else {
            nativeEvent = event;
            if (nativeEvent.button !== 0) return;
        }

        setIsPanning(true);
        setLastPanPos({
            x: nativeEvent.clientX,
            y: nativeEvent.clientY
        });
    };

    const handlePanning = (event) => {
        if (!isPanning || !isZoomed) return;

        let nativeEvent;
        if (event.type === 'touchmove') {
            nativeEvent = event.touches[0];
            event.preventDefault();
        } else {
            nativeEvent = event;
        }

        const deltaX = nativeEvent.clientX - lastPanPos.x;
        const deltaY = nativeEvent.clientY - lastPanPos.y;

        setLastPanPos({
            x: nativeEvent.clientX,
            y: nativeEvent.clientY
        });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const zoomFactor = 1 + (zoomLevel * 0.1);

        const maxPanX = (rect.width * (zoomFactor - 1)) / (2 * zoomFactor);
        const maxPanY = (rect.height * (zoomFactor - 1)) / (2 * zoomFactor);

        setPanPosition(prev => {
            const newX = Math.max(-maxPanX, Math.min(maxPanX, prev.x - deltaX / zoomFactor));
            const newY = Math.max(-maxPanY, Math.min(maxPanY, prev.y - deltaY / zoomFactor));
            return { x: newX, y: newY };
        });
    };

    const stopPanning = () => {
        setIsPanning(false);
    };

    // Fit to screen toggle
    const toggleFitScreen = () => {
        setPanelsHidden(prev => !prev);
        setZoomLevel(0);
        setPanPosition({ x: 0, y: 0 });
        setIsZoomed(false);
        setZoomDrawMode(false);
        
        // Reset current image
        const currentImg = pendingImages[currentImageIndex];
        loadImageToCanvas(
            currentImg
        );
    };

    // Download handlers
    const handleDownload = () => {
        setShowDownloadDialog(true);
    };

    const downloadCurrentImage = () => {
        const currentCanvasState = canvasRef.current.toDataURL('image/png');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const link = document.createElement('a');
        link.download = `powerpaint-${timestamp}.png`;
        link.href = currentCanvasState;
        link.click();
        setShowDownloadDialog(false);
    };

    const downloadAllImages = () => {
        if (processedImages.length === 0) {
            alert('No processed images to download');
            setShowDownloadDialog(false);
            return;
        }
        
        handleBulkDownload();
    };

    const handleBulkDownload = () => {
        if (processedImages.length === 0) return;
        setShowBulkDownloadConfirmation(false);
        
        const downloadAll = async () => {
            try {
                setIsLoading(true);
                processedImages.forEach((img, index) => {
                    const link = document.createElement('a');
                    link.download = `processed-image-${index}.png`;
                    link.href = img.processedImage;
                    link.click();
                    setTimeout(() => {}, 200);
                });
            } catch (error) {
                console.error('Error downloading images:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        downloadAll();
    };

    const handleApproveImage = () => {
        if (pendingImages.length === 0 || isLoading) return;
        
        const currentProcessedImage = currentHistoryItem && !currentHistoryItem.isOriginal 
            ? currentHistoryItem.processedImage 
            : pendingImages[currentImageIndex];
            
        setProcessedImages(prev => [...prev, {
            originalImage: pendingImages[currentImageIndex],
            processedImage: currentProcessedImage,
            timestamp: Date.now()
        }]);
        
        const newPendingImages = [...pendingImages];
        newPendingImages.splice(currentImageIndex, 1);
        setPendingImages(newPendingImages);
        
        if (currentImageIndex >= newPendingImages.length) {
            setCurrentImageIndex(Math.max(0, newPendingImages.length - 1));
        }
        
        if (newPendingImages.length > 0) {
            const initialHistoryItem = {
                id: 'original',
                processedImage: newPendingImages[Math.min(currentImageIndex, newPendingImages.length - 1)],
                isOriginal: true
            };
            setHistory([initialHistoryItem]);
            setCurrentHistoryItem(initialHistoryItem);
            setHistoryIndex(0);
            
            if (mode === 'original') {
                setMode('brush');
                if (maskCanvasRef.current) {
                    maskCanvasRef.current.style.display = 'block';
                }
            }
        }
    };

    const navigateImages = (direction) => {
        if (pendingImages.length <= 1) return;
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentImageIndex + 1) % pendingImages.length;
        } else {
            newIndex = (currentImageIndex - 1 + pendingImages.length) % pendingImages.length;
        }
        
        setCurrentImageIndex(newIndex);
        
        const initialHistoryItem = {
            id: 'original',
            processedImage: pendingImages[newIndex],
            isOriginal: true
        };
        setHistory([initialHistoryItem]);
        setCurrentHistoryItem(initialHistoryItem);
        setHistoryIndex(0);
        
        if (mode === 'original') {
            setMode('brush');
            if (maskCanvasRef.current) {
                maskCanvasRef.current.style.display = 'block';
            }
        }
    };

    const handleRecoverImage = (imageIndex) => {
        if (processedImages.length === 0 || isLoading) return;
        
        // Get the image to recover
        const imageToRecover = processedImages[imageIndex];
        
        // Add the original image back to pending images
        setPendingImages(prev => [...prev, imageToRecover.originalImage]);
        
        // Remove from processed images
        const newProcessedImages = [...processedImages];
        newProcessedImages.splice(imageIndex, 1);
        setProcessedImages(newProcessedImages);
        
        // If we just recovered the only processed image, switch to the new pending image
        if (newProcessedImages.length === 0 && pendingImages.length === 0) {
            // Reset to newly added image
            setCurrentImageIndex(0);
            
            // Reset history for the new image
            const initialHistoryItem = {
                id: 'original',
                processedImage: imageToRecover.originalImage,
                isOriginal: true
            };
            setHistory([initialHistoryItem]);
            setCurrentHistoryItem(initialHistoryItem);
            setHistoryIndex(0);
            
            // Exit original view if active
            if (mode === 'original') {
                setMode('brush');
                if (maskCanvasRef.current) {
                    maskCanvasRef.current.style.display = 'block';
                }
            }
        }
        
        // Update left panel active index if needed
        if (activePanel === 'left') {
            if (imageIndex >= newProcessedImages.length) {
                setLeftPanelActiveIndex(Math.max(0, newProcessedImages.length - 1));
            }
        }
    };

    // Drawing Functions
    const startDrawing = (event) => {
        if (isCanvasLocked) return;
        if (isZoomed && !zoomDrawMode) return;
        if (isDrawing) return;
        
        let nativeEvent;
        if (event.type === 'touchstart') {
            nativeEvent = event.touches[0];
            event.preventDefault();
        } else {
            nativeEvent = event;
            if (nativeEvent.button !== 0) return;
        }
        
        if (mode === 'original') return;
        if (!maskContextRef.current) return;
        
        const { x, y } = getCanvasCoordinates(nativeEvent.clientX, nativeEvent.clientY, maskCanvasRef, zoomLevel, panPosition);
        lastPoint.current = { x, y };
        
        // Draw a point
        maskContextRef.current.beginPath();
        maskContextRef.current.arc(x, y, brushSize, 0, Math.PI * 2);
        maskContextRef.current.fillStyle = 'rgba(255, 0, 0, 0.2)';
        maskContextRef.current.fill();
        
        hasDrawnRef.current = true;
        setIsDrawing(true);
    };

    const draw = (event) => {
        if (isCanvasLocked) return;
        if (isZoomed && !zoomDrawMode) return;
        if (!isDrawing || !maskContextRef.current) return;
        if (mode === 'original') return;
        
        let nativeEvent;
        if (event.type === 'touchmove') {
            nativeEvent = event.touches[0];
            event.preventDefault();
        } else {
            nativeEvent = event;
        }

        const { x, y } = getCanvasCoordinates(nativeEvent.clientX, nativeEvent.clientY, maskCanvasRef, zoomLevel, panPosition);
        
        // Draw a line segment
        maskContextRef.current.beginPath();
        maskContextRef.current.moveTo(lastPoint.current.x, lastPoint.current.y);
        maskContextRef.current.lineTo(x, y);
        maskContextRef.current.lineWidth = brushSize * 2;
        maskContextRef.current.strokeStyle = 'rgba(255, 0, 0, 0.2)';
        maskContextRef.current.stroke();
        
        hasDrawnRef.current = true;
        lastPoint.current = { x, y };
    };

    const stopDrawing = () => {
        if (isCanvasLocked) return;
        if (isZoomed && !zoomDrawMode) return;
        if (isDrawing) {
            setIsDrawing(false);
        } else {
            return;
        }
        
        if (mode === 'original' || !maskContextRef.current) return;
        
        // We want to keep track that the user has drawn something, but not process it yet
        const maskData = maskContextRef.current.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        
        let hasContent = false;
        for (let i = 0; i < maskData.data.length; i += 4) {
            if (maskData.data[i] > 0) { 
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) return;
        hasDrawnRef.current = true;
        
        // No automatic processing here - this will now happen only when handleInpaint is called
    };

    // SAM Functions
    const handleCanvasClick = ({ nativeEvent }) => {
        if (mode !== 'sam') return;

        const canvas = maskCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (nativeEvent.clientX - rect.left) * scaleX / canvas.width;
        const y = (nativeEvent.clientY - rect.top) * scaleY / canvas.height;

        setSamPoints(prev => [...prev, { x, y }]);

        const ctx = maskContextRef.current;
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(x * canvas.width, y * canvas.height, 5, 0, 2 * Math.PI);
        ctx.fill();
    };

    const generateSamMask = async () => {
        if (samPoints.length === 0) return;

        try {
            setIsLoading(true);
            const imageDataUrl = canvasRef.current.toDataURL('image/png');

            const response = await fetch('http://localhost:8000/api/sam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    points: samPoints,
                    image: imageDataUrl
                })
            });

            if (!response.ok) throw new Error('SAM API call failed');

            const data = await response.json();

            const img = new Image();
            img.onload = () => {
                maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
                maskContextRef.current.drawImage(img, 0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
            };
            img.src = `data:image/png;base64,${data.mask}`;

            setSamPoints([]);
        } catch (error) {
            console.error('Error generating SAM mask:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Function to handle inpainting
    const handleInpaint = async () => {
        if (!prompt) {
            alert("Please enter a prompt before generating.");
            return;
        }
        
        // Check if there's any content in the mask
        const maskData = maskContextRef.current.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
        let hasContent = false;
        for (let i = 0; i < maskData.data.length; i += 4) {
            if (maskData.data[i] > 0) { 
                hasContent = true;
                break;
            }
        }
        
        if (!hasContent) {
            alert("Please paint an area to modify before generating.");
            return;
        }
    
        try {
            maskBackupRef.current = backupMaskCanvas(maskCanvasRef, maskContextRef);
            setIsLoading(true);
            const imageDataUrl = canvasRef.current.toDataURL('image/png');
            const maskDataUrl = maskCanvasRef.current.toDataURL('image/png');
    
            // Create request payload with explicit type conversion
            const payload = {
                model_type: modelType,
                prompt,
                negative_prompt: negativePrompt,
                steps: parseInt(steps), // Ensure it's an integer
                guidance_scale: parseFloat(guidanceScale), // Ensure it's a float
                seed,
                image: imageDataUrl,
                mask: maskDataUrl
            };
    
            console.log('Sending inpaint request with steps:', payload.steps);
    
            const response = await fetch('http://localhost:8000/api/inpaint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Inpainting failed: ${errorText}`);
            }
    
            const data = await response.json();
    
            const img = new Image();
            img.onload = () => {
                contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                contextRef.current.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
    
                // Create history item with the processed image
                const newHistoryItem = {
                    id: Date.now(),
                    processedImage: `data:image/png;base64,${data.processed_image}`,
                    isOriginal: false
                };
    
                // If we have history after the current point, remove it
                if (historyIndex < history.length - 1) {
                    setHistory(prev => prev.slice(0, historyIndex + 1));
                }
    
                // Add the new item and update the index
                setHistory(prev => [...prev, newHistoryItem]);
                setHistoryIndex(prev => prev + 1);
                setCurrentHistoryItem(newHistoryItem);
                setLastNonOriginalItem(newHistoryItem);
    
                // Update page index for pagination
                const nonOriginalItems = [...history, newHistoryItem].filter(item => !item.isOriginal);
                const newItemIndex = nonOriginalItems.length - 1;
                setHistoryPageIndex(Math.floor(newItemIndex / TABS_PER_PAGE));
    
                // Clear the mask after successful inpainting
                maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
                
                // Reset drawn state
                hasDrawnRef.current = false;
                
                // Scroll the new tab into view - NEW FEATURE
                setTimeout(() => {
                    scrollTabIntoView(historyContainerRef, newHistoryItem.id);
                }, 100);
            };
            img.src = `data:image/png;base64,${data.processed_image}`;
    
        } catch (error) {
            console.error('Error during inpainting:', error);
            alert(`Error: ${error.message}`);
            // Restore the mask canvas if there's an error
            restoreMaskCanvas(maskContextRef, maskBackupRef.current);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-gray-100 flex overflow-hidden" ref={containerRef}>
            {/* Left Panel - Processed Images */}
            <LeftPanel 
                isMobile={isMobile}
                leftPanelExpanded={leftPanelExpanded}
                setLeftPanelExpanded={setLeftPanelExpanded}
                processedImages={processedImages}
                setShowBulkDownloadConfirmation={setShowBulkDownloadConfirmation}
                panelsHidden={panelsHidden}
                handleRecoverImage={handleRecoverImage}
                activePanel={activePanel}
                leftPanelActiveIndex={leftPanelActiveIndex}
                setActivePanel={setActivePanel}
            />
            
            {/* Main content area with canvas */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Top navbar */}
                <div className="bg-white shadow-sm py-3.5 px-5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Tooltip text="Back to Upload" preferredPosition="bottom">
                            <button 
                                onClick={onReset} 
                                className="text-gray-700 hover:text-gray-900 flex items-center text-sm"
                                aria-label="Back to Upload"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />Back
                            </button>
                        </Tooltip>
                        <h1 className="text-base font-medium text-gray-900">PowerPaint Editor</h1>
                        
                        {pendingImages.length > 0 && (
                            <div className="text-sm text-gray-600 ml-4">
                                Image {currentImageIndex + 1} of {pendingImages.length}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Tooltip text="Report a bug or provide feedback" preferredPosition="bottom">
                            <button 
                                className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100" 
                                onClick={() => setShowFeedbackDialog(true)}
                                aria-label="Report a bug or provide feedback"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </button>
                        </Tooltip>
                        
                        {!isMobile && (
                            <div className="flex items-center gap-2">
                                <Tooltip text="Toggle Canvas Lock (L)" preferredPosition="bottom">
                                    <button 
                                        onClick={toggleCanvasLock} 
                                        className={`p-1.5 rounded-full ${isCanvasLocked ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                        aria-label="Toggle Canvas Lock"
                                        aria-pressed={isCanvasLocked}
                                    >
                                        {isCanvasLocked ? (<Lock className="w-4 h-4 text-gray-700" />) : (<Unlock className="w-4 h-4 text-gray-700" />)}
                                    </button>
                                </Tooltip>
                                
                                <Tooltip text="Toggle History Panel (H)" preferredPosition="bottom">
                                    <button 
                                        onClick={() => {
                                            if (!showHistory) {
                                                setShowHistory(true);
                                                setHistoryMinimized(false);
                                            } else {
                                                setShowHistory(false);
                                            }
                                        }} 
                                        className={`p-1.5 rounded-full ${showHistory ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                        aria-label="Toggle History Panel"
                                        aria-pressed={showHistory}
                                    >
                                        <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    </button>
                                </Tooltip>
                                
                                <Tooltip text="Toggle Zoom Controls (Z)" preferredPosition="bottom">
                                    <button 
                                        onClick={() => {
                                            if (isZoomed) {
                                                exitZoomMode();
                                            } else {
                                                handleZoomIn();
                                            }
                                        }} 
                                        className={`p-1.5 rounded-full ${isZoomed ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                        aria-label="Toggle Zoom Controls"
                                        aria-pressed={isZoomed}
                                    >
                                        <ZoomIn className="w-4 h-4 text-gray-700" />
                                    </button>
                                </Tooltip>
                                
                                <Tooltip text="Show Instructions (I)" preferredPosition="bottom">
                                    <button 
                                        onClick={() => setShowInstructions(!showInstructions)} 
                                        className={`p-1.5 rounded-full ${showInstructions ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                        aria-label="Show Instructions"
                                        aria-pressed={showInstructions}
                                    >
                                        <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M12 7V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <circle cx="12" cy="16" r="1" fill="currentColor"/>
                                        </svg>
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                        
                        {isMobile && (
                            <div className="flex items-center gap-2">
                                <Tooltip text="Menu" preferredPosition="bottom">
                                    <button 
                                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                                        className="p-1.5 rounded-full text-gray-700 hover:bg-gray-100"
                                        aria-label="Menu"
                                        aria-expanded={isMobileMenuOpen}
                                    >
                                        <Menu className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Mobile menu dropdown */}
                {isMobile && isMobileMenuOpen && (
                    <MobileMenu
                        toggleCanvasLock={toggleCanvasLock}
                        isCanvasLocked={isCanvasLocked}
                        showHistory={showHistory}
                        setShowHistory={setShowHistory}
                        setHistoryMinimized={setHistoryMinimized}
                        showZoomControls={showZoomControls}
                        setShowZoomControls={setShowZoomControls}
                        showInstructions={showInstructions}
                        setShowInstructions={setShowInstructions}
                        handleDownload={handleDownload}
                        toggleOriginalView={toggleOriginalView}
                        mode={mode}
                        setIsMobileMenuOpen={setIsMobileMenuOpen}
                        isLoading={isLoading}
                    />
                )}
                
                {/* Canvas Container */}
                <div className={`flex-1 flex items-center justify-center relative p-2 pb-20 ${panelsHidden ? 'px-8' : ''}`}>
                    <div className={`relative overflow-hidden mb-4 ${panelsHidden ? 'max-w-full transition-all duration-300' : ''}`} 
                        style={{ border: "none", outline: "none" }}
                        ref={canvasContainerRef}
                        onMouseDown={(event) => startPanning(event)}
                        onMouseMove={(event) => handlePanning(event)}
                        onMouseUp={() => stopPanning()}
                        onMouseLeave={() => stopPanning()}
                        onTouchStart={(event) => startPanning(event)}
                        onTouchMove={(event) => handlePanning(event)}
                        onTouchEnd={() => stopPanning()}
                        onTouchCancel={() => stopPanning()}>
                        {/* Canvas wrapper with zoom/pan transformations */}
                        <div className={`${isPanning ? 'pan-handle' : ''} ${isZoomed && !isPanning ? 'zoom-transition' : ''}`}
                            style={{
                                transform: isZoomed ? 
                                    `scale(${1 + (zoomLevel * 0.1)}) translate(${-panPosition.x}px, ${-panPosition.y}px)` : 
                                    'scale(1) translate(0px, 0px)', 
                                transformOrigin: 'center',
                                margin: '0 auto'
                            }}>
                            <canvas 
                                ref={canvasRef} 
                                className="rounded-lg shadow-md" 
                                style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", display: "block" }}
                                aria-label="Image canvas"
                            />
                            <canvas
                                ref={maskCanvasRef} 
                                className="absolute top-0 left-0 rounded-lg"
                                onMouseDown={mode === 'sam' ? handleCanvasClick : ((!isZoomed || zoomDrawMode) ? startDrawing : undefined)}
                                onMouseMove={(!isZoomed || zoomDrawMode) ? draw : undefined}
                                onMouseUp={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                                onMouseLeave={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                                onTouchStart={(!isZoomed || zoomDrawMode) ? startDrawing : undefined}
                                onTouchMove={(!isZoomed || zoomDrawMode) ? draw : undefined}
                                onTouchEnd={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                                onTouchCancel={(!isZoomed || zoomDrawMode) ? stopDrawing : undefined}
                                onContextMenu={(e) => e.preventDefault()}
                                style={{ 
                                    cursor: isCanvasLocked ? 'not-allowed' : 
                                            (isZoomed && isPanning) ? 'grabbing' :
                                            (isZoomed && !zoomDrawMode) ? 'grab' :
                                            mode === 'brush' ? 'crosshair' : 'pointer', 
                                    boxShadow: "none", display: "block", pointerEvents: isLoading ? 'none' : 'auto'
                                }}
                                aria-label="Mask canvas"
                            />
                        </div>
                        
                        {/* Canvas Lock Overlay */}
                        {isCanvasLocked && <CanvasLockOverlay />}
                        
                        {/* Zoom mode overlay */}
                        {isZoomed && <ZoomModeOverlay isPanning={isPanning} zoomDrawMode={zoomDrawMode} />}
                        
                        {/* Zoom controls */}
                        {showZoomControls && (
                            <ZoomControls
                                zoomLevel={zoomLevel}
                                maxZoomLevel={MAX_ZOOM_LEVEL}
                                getZoomPercentage={getZoomPercentage}
                                handleZoomIn={handleZoomIn}
                                handleZoomOut={handleZoomOut}
                                handleResetZoom={handleResetZoom}
                                isPanning={isPanning}
                                zoomDrawMode={zoomDrawMode}
                                setZoomDrawMode={setZoomDrawMode}
                                exitZoomMode={exitZoomMode}
                            />
                        )}
                        
                        {/* Brush size indicator */}
                        {showBrushSizeIndicator && mode === 'brush' && !isLoading && (isZoomed ? zoomDrawMode : true) && (
                            <BrushSizeIndicator brushSize={brushSize} />
                        )}
                        
                        {/* Context Menu */}
                        {showContextMenu && !isMobile && (
                            <ContextMenu
                                contextMenuRef={contextMenuRef}
                                contextMenuPosition={contextMenuPosition}
                                isDraggingContextMenu={isDraggingContextMenu}
                                setDragOffset={setDragOffset}
                                setIsDraggingContextMenu={setIsDraggingContextMenu}
                                setShowContextMenu={setShowContextMenu}
                            />
                        )}
                        
                        {/* Processing overlay */}
                        {isLoading && <ProcessingOverlay message="Processing..." />}
                        
                        {/* Modals */}
                        {showInstructions && (
                            <InstructionsModal
                                isMobile={isMobile}
                                setShowInstructions={setShowInstructions}
                            />
                        )}
                        
                        {showHistory && (
                            <HistoryPanel
                                isMobile={isMobile}
                                historyMinimized={historyMinimized}
                                setHistoryMinimized={setHistoryMinimized}
                                setShowHistory={setShowHistory}
                                history={history}
                                mode={mode}
                                historyPageIndex={historyPageIndex}
                                tabsPerPage={TABS_PER_PAGE}
                                currentHistoryItem={currentHistoryItem}
                                setMode={setMode}
                                maskCanvasRef={maskCanvasRef}
                                setHistoryIndex={setHistoryIndex}
                                setCurrentHistoryItem={setCurrentHistoryItem}
                                setLastNonOriginalItem={setLastNonOriginalItem}
                                loadImageToCanvas={(imageSrc, index) => loadImageToCanvas(imageSrc, contextRef, canvasRef, maskContextRef, index, setHistoryIndex, setCurrentHistoryItem, history, setLastNonOriginalItem)}
                                initialImage={pendingImages[currentImageIndex]}
                                handlePrevHistoryPage={handlePrevHistoryPage}
                                handleNextHistoryPage={handleNextHistoryPage}
                                handleDeleteTab={handleDeleteTab}
                                historyContainerRef={historyContainerRef}
                            />
                        )}
                        
                        {showDeleteConfirmation && (
                            <DeleteConfirmationDialog
                                isMobile={isMobile}
                                setShowDeleteConfirmation={setShowDeleteConfirmation}
                                setTabToDelete={setTabToDelete}
                                handleConfirmDelete={handleConfirmDelete}
                            />
                        )}
                        
                        {showDownloadDialog && (
                            <DownloadDialog
                                setShowDownloadDialog={setShowDownloadDialog}
                                canvasRef={canvasRef}
                                processedImages={processedImages}
                                downloadCurrentImage={downloadCurrentImage}
                                downloadAllImages={downloadAllImages}
                            />
                        )}
                        
                        {showBulkDownloadConfirmation && (
                            <BulkDownloadConfirmation
                                processedImages={processedImages}
                                setShowBulkDownloadConfirmation={setShowBulkDownloadConfirmation}
                                handleBulkDownload={handleBulkDownload}
                            />
                        )}
                        
                        {showFeedbackDialog && (
                            <FeedbackDialog
                                setShowFeedbackDialog={setShowFeedbackDialog}
                            />
                        )}
                    </div>
                </div>
                
                {/* Bottom toolbar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md px-4 py-3 z-50 border-t border-gray-200">
                    {/* Desktop toolbar */}
                    <div className="hidden md:flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Tooltip text="Undo (Ctrl/Cmd+Z)" preferredPosition="top">
                                <button
                                    onClick={handleUndo}
                                    disabled={historyIndex <= 0 || mode === 'original' || isLoading}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                        historyIndex <= 0 || mode === 'original' || isLoading
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    aria-label="Undo"
                                >
                                    <Undo className="w-4 h-4" />Undo
                                </button>
                            </Tooltip>
                    
                            <Tooltip text="Redo (Ctrl/Cmd+Y)" preferredPosition="top">
                                <button
                                    onClick={handleRedo}
                                    disabled={historyIndex >= history.length - 1 || mode === 'original' || isLoading}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                        historyIndex >= history.length - 1 || mode === 'original' || isLoading
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    aria-label="Redo"
                                >
                                    <Redo className="w-4 h-4" />Redo
                                </button>
                            </Tooltip>
                            
                            {/* Navigation controls */}
                            {pendingImages.length > 1 && (
                                <div className="flex items-center ml-2 bg-white border border-gray-200 rounded-md px-1">
                                    <Tooltip text="Previous Image (←)" preferredPosition="top">
                                        <button
                                            onClick={() => navigateImages('prev')}
                                            className="p-1.5 rounded text-gray-700 hover:bg-gray-100"
                                            aria-label="Previous Image"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                    
                                    <div className="flex items-center px-2 py-1">
                                        {pendingImages.map((_, idx) => (
                                            <div 
                                                key={idx}
                                                className={`w-2 h-2 mx-1 rounded-full cursor-pointer ${idx === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                                                onClick={() => {
                                                    setCurrentImageIndex(idx);
                                                    const initialHistoryItem = {
                                                        id: 'original',
                                                        processedImage: pendingImages[idx],
                                                        isOriginal: true
                                                    };
                                                    setHistory([initialHistoryItem]);
                                                    setCurrentHistoryItem(initialHistoryItem);
                                                    setHistoryIndex(0);
                                                    
                                                    if (mode === 'original') {
                                                        setMode('brush');
                                                        if (maskCanvasRef.current) {
                                                            maskCanvasRef.current.style.display = 'block';
                                                        }
                                                    }
                                                }}
                                                aria-label={`Select image ${idx + 1}`}
                                                role="button"
                                                tabIndex={0}
                                                aria-pressed={idx === currentImageIndex}
                                            ></div>
                                        ))}
                                    </div>
                                    
                                    <Tooltip text="Next Image (→)" preferredPosition="top">
                                        <button
                                            onClick={() => navigateImages('next')}
                                            className="p-1.5 rounded text-gray-700 hover:bg-gray-100"
                                            aria-label="Next Image"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Tooltip text={mode === 'sam' ? "Switch to Brush Mode" : "Switch to SAM Mode"} preferredPosition="top">
                                <button
                                    onClick={() => setMode(mode === 'brush' ? 'sam' : 'brush')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded font-medium ${mode === 'sam' ? 'bg-[#abf134] text-black' : 'bg-white border border-gray-200 text-gray-800'}`}
                                    aria-label={mode === 'sam' ? "Switch to Brush Mode" : "Switch to SAM Mode"}
                                    aria-pressed={mode === 'sam'}
                                >
                                    <Wand2 className="w-4 h-4" />
                                    {mode === 'sam' ? 'SAM Mode' : 'Brush Mode'}
                                </button>
                            </Tooltip>
    
                            {mode === 'sam' && samPoints.length > 0 && (
                                <Tooltip text="Generate mask from selected points" preferredPosition="top">
                                    <button
                                        onClick={generateSamMask}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#abf134] text-black rounded hover:bg-[#9ed830]"
                                        aria-label="Generate Mask"
                                    >
                                        Generate Mask
                                    </button>
                                </Tooltip>
                            )}
                            
                            <div className={`flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-md ${mode === 'sam' ? 'opacity-50' : ''}`}>
                                <Tooltip text="Decrease Brush Size (-)" preferredPosition="top">
                                    <button
                                        onClick={decreaseBrushSize}
                                        disabled={brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                        className={`p-1 rounded ${brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
                                        aria-label="Decrease Brush Size"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                                <div className={`flex items-center gap-1.5 ${isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'opacity-50' : ''}`}>
                                    <span className="text-sm text-gray-700">Brush</span>
                                    <input
                                        type="range" min="1" max="50" value={brushSize} onChange={handleBrushSizeChange}
                                        className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        disabled={isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                        aria-label="Brush Size"
                                        aria-valuemin="1"
                                        aria-valuemax="50"
                                        aria-valuenow={brushSize}
                                    />
                                    <span className="text-sm text-gray-700 w-6 text-center">{brushSize}</span>
                                </div>
                                <Tooltip text="Increase Brush Size (+)" preferredPosition="top">
                                    <button
                                        onClick={increaseBrushSize}
                                        disabled={brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                        className={`p-1 rounded ${brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
                                        aria-label="Increase Brush Size"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>
    
                            <Tooltip text="Model Selection" preferredPosition="top">
                                <select
                                    value={modelType}
                                    onChange={(e) => setModelType(e.target.value)}
                                    className="px-4 py-2 border border-gray-200 rounded w-60"
                                    aria-label="Select Model"
                                >
                                    <option value="sdxl">SDXL (Best Quality)</option>
                                    <option value="realistic_vision">Realistic Vision (Photorealistic)</option>
                                    <option value="deliberate">Deliberate (Detailed)</option>
                                </select>
                            </Tooltip>
    
                            <Tooltip text="Advanced Settings" preferredPosition="top">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-2 hover:bg-gray-100 rounded ${showSettings ? 'bg-gray-200' : ''}`}
                                    aria-label="Advanced Settings"
                                    aria-pressed={showSettings}
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </Tooltip>
    
                            <input
                                type="text"
                                placeholder="Enter prompt..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded w-80 focus-ring"
                                aria-label="Prompt input"
                                ref={promptInputRef}
                            />
    
                            <Tooltip text="Generate with AI" preferredPosition="top">
                                <button
                                    onClick={handleInpaint}
                                    disabled={!prompt || isLoading}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded font-medium ${prompt ? 'bg-[#abf134] text-black hover:bg-[#9ed830]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    aria-label="Generate with AI"
                                >
                                    {isLoading ? 'Processing...' : 'Generate'}
                                </button>
                            </Tooltip>
                        </div>
    
                        <div className="flex items-center gap-3">
                            {/* Approve button */}
                            {pendingImages.length > 0 && (
                                <Tooltip text="Approve Image (Y)" preferredPosition="top">
                                    <button
                                        onClick={handleApproveImage}
                                        disabled={isLoading}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium ${
                                        isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                                        }`}
                                        aria-label="Approve Image"
                                    >
                                        <CheckCircle className="w-4 h-4" />Approve
                                    </button>
                                </Tooltip>
                            )}
                            
                            {/* Fit button */}
                            <Tooltip text={panelsHidden ? "Show Panels (F)" : "Fit Image to Screen (F)"} preferredPosition="top">
                                <button
                                    onClick={toggleFitScreen}
                                    disabled={isLoading}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                        isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                                        panelsHidden ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    aria-label={panelsHidden ? "Show Panels" : "Fit Image to Screen"}
                                    aria-pressed={panelsHidden}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                    </svg>
                                    {panelsHidden ? 'Show Panels' : 'Fit Screen'}
                                </button>
                            </Tooltip>
                    
                            <Tooltip text="Zoom Controls (Z)" preferredPosition="top">
                                <button
                                    onClick={() => {
                                        if (isZoomed) {
                                            exitZoomMode();
                                        } else {
                                            handleZoomIn();
                                        }
                                    }}
                                    disabled={isLoading}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                        isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                                        zoomLevel > 0 ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    aria-label="Toggle Zoom"
                                    aria-pressed={isZoomed}
                                >
                                    <ZoomIn className="w-4 h-4" />
                                    {zoomLevel > 0 ? `${getZoomPercentage(zoomLevel)}%` : 'Zoom'}
                                </button>
                            </Tooltip>
                    
                            <Tooltip text="Toggle Original View (O)" preferredPosition="top">
                                <button
                                    onClick={toggleOriginalView}
                                    disabled={isLoading}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                        isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                                        mode === 'original' ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    aria-label="Toggle Original View"
                                    aria-pressed={mode === 'original'}
                                >
                                    <Eye className="w-4 h-4" />
                                    {mode === 'original' ? 'Exit View' : 'Original'}
                                </button>
                            </Tooltip>
                    
                            <Tooltip text="Toggle Canvas Lock (L)" preferredPosition="top">
                                <button
                                    onClick={toggleCanvasLock}
                                    disabled={isLoading}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
                                        isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                                        isCanvasLocked ? 'bg-blue-50 text-blue-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                    }`}
                                    aria-label="Toggle Canvas Lock"
                                    aria-pressed={isCanvasLocked}
                                >
                                    {isCanvasLocked ? (<Lock className="w-4 h-4" />) : (<Unlock className="w-4 h-4" />)}
                                    {isCanvasLocked ? 'Unlock' : 'Lock'}
                                </button>
                            </Tooltip>
                    
                            <Tooltip text="Download (D)" preferredPosition="top">
                                <button
                                    onClick={handleDownload}
                                    disabled={isLoading}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium ${
                                        isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                    aria-label="Download"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                    
                    {/* Mobile toolbar - simplified and more visible */}
                    <div className="flex md:hidden justify-between items-center h-16 px-1">
                        <div className="flex items-center gap-1">
                            <Tooltip text="Undo" preferredPosition="top">
                                <button
                                    onClick={handleUndo}
                                    disabled={historyIndex <= 0 || mode === 'original' || isLoading}
                                    className={`p-2 rounded-full ${
                                        historyIndex <= 0 || mode === 'original' || isLoading ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white'
                                    }`}
                                    aria-label="Undo"
                                >
                                    <Undo className="w-5 h-5" />
                                </button>
                            </Tooltip>
    
                            <Tooltip text="Redo" preferredPosition="top">
                                <button
                                    onClick={handleRedo}
                                    disabled={historyIndex >= history.length - 1 || mode === 'original' || isLoading}
                                    className={`p-2 rounded-full ${
                                        historyIndex >= history.length - 1 || mode === 'original' || isLoading ? 'bg-gray-100 text-gray-400' : 'bg-blue-500 text-white'
                                    }`}
                                    aria-label="Redo"
                                >
                                    <Redo className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            
                            {/* Navigation for mobile */}
                            {pendingImages.length > 1 && (
                                <div className="flex items-center ml-1">
                                    <Tooltip text="Previous Image" preferredPosition="top">
                                        <button
                                            onClick={() => navigateImages('prev')}
                                            className="p-2 rounded-full text-gray-700"
                                            aria-label="Previous Image"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                    <div className="text-xs text-gray-500">
                                        {currentImageIndex + 1}/{pendingImages.length}
                                    </div>
                                    <Tooltip text="Next Image" preferredPosition="top">
                                        <button
                                            onClick={() => navigateImages('next')}
                                            className="p-2 rounded-full text-gray-700"
                                            aria-label="Next Image"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
    
                        <div className="flex items-center">
                            <Tooltip text={mode === 'sam' ? "Switch to Brush Mode" : "Switch to SAM Mode"} preferredPosition="top">
                                <button
                                    onClick={() => setMode(mode === 'brush' ? 'sam' : 'brush')}
                                    className={`p-2 rounded-full ${mode === 'sam' ? 'bg-[#abf134] text-black' : 'bg-white border border-gray-300 text-gray-700'}`}
                                    aria-label={mode === 'sam' ? "Switch to Brush Mode" : "Switch to SAM Mode"}
                                    aria-pressed={mode === 'sam'}
                                >
                                    <Wand2 className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            
                            <Tooltip text="Decrease Brush Size" preferredPosition="top">
                                <button
                                    onClick={decreaseBrushSize}
                                    disabled={brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                    className={`p-2 ${brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700'}`}
                                    aria-label="Decrease Brush Size"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            <div className={`${isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'opacity-50' : ''}`}>
                                <input
                                    type="range" min="1" max="50" value={brushSize} onChange={handleBrushSizeChange}
                                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none"
                                    disabled={isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                    aria-label="Brush Size"
                                    aria-valuemin="1"
                                    aria-valuemax="50"
                                    aria-valuenow={brushSize}
                                />
                            </div>
                            <Tooltip text="Increase Brush Size" preferredPosition="top">
                                <button
                                    onClick={increaseBrushSize}
                                    disabled={brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                    className={`p-2 ${brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'text-gray-400' : 'text-gray-700'}`}
                                    aria-label="Increase Brush Size"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            
                            {/* Mobile Approve button */}
                            {pendingImages.length > 0 && (
                                <Tooltip text="Approve Image" preferredPosition="top">
                                    <button
                                        onClick={handleApproveImage}
                                        disabled={isLoading}
                                        className={`p-2 rounded-full ml-1 ${isLoading ? 'bg-gray-100 text-gray-400' : 'bg-green-500 text-white'}`}
                                        aria-label="Approve Image"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                </Tooltip>
                            )}
                        </div>
    
                        <div className="flex items-center gap-2">
                            {/* Updated fit button for mobile */}
                            <Tooltip text={panelsHidden ? "Show Panels" : "Hide Panels"} preferredPosition="top">
                                <button
                                    onClick={toggleFitScreen}
                                    disabled={isLoading}
                                    className={`p-2 rounded-full ${
                                        isLoading ? 'bg-gray-100 text-gray-400' : 
                                        panelsHidden ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
                                    }`}
                                    aria-label={panelsHidden ? "Show Panels" : "Hide Panels"}
                                    aria-pressed={panelsHidden}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                    </svg>
                                </button>
                            </Tooltip>
                        
                            <Tooltip text="Zoom Controls" preferredPosition="top">
                                <button
                                    onClick={() => {
                                        if (isZoomed) {
                                            exitZoomMode();
                                        } else {
                                            handleZoomIn();
                                        }
                                    }}
                                    disabled={isLoading}
                                    className={`p-2 rounded-full ${
                                        isLoading ? 'bg-gray-100 text-gray-400' : 
                                        zoomLevel > 0 ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
                                    }`}
                                    aria-label="Zoom Controls"
                                    aria-pressed={isZoomed}
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            
                            <Tooltip text={isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'} preferredPosition="top">
                                <button
                                    onClick={toggleCanvasLock}
                                    disabled={isLoading}
                                    className={`p-2 rounded-full ${
                                        isLoading ? 'bg-gray-100 text-gray-400' : 
                                        isCanvasLocked ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
                                    }`}
                                    aria-label={isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'}
                                    aria-pressed={isCanvasLocked}
                                >
                                    {isCanvasLocked ? (<Lock className="w-5 h-5" />) : (<Unlock className="w-5 h-5" />)}
                                </button>
                            </Tooltip>
                            
                            <Tooltip text={mode === 'original' ? 'Exit View' : 'Original'} preferredPosition="top">
                                <button
                                    onClick={toggleOriginalView}
                                    disabled={isLoading}
                                    className={`p-2 rounded-full ${
                                        isLoading ? 'bg-gray-100 text-gray-400' : 
                                        mode === 'original' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
                                    }`}
                                    aria-label={mode === 'original' ? 'Exit View' : 'Original'}
                                    aria-pressed={mode === 'original'}
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
                
                {/* Settings Panel */}
                {showSettings && (
                    <SettingsPanel
                        modelType={modelType}
                        setModelType={setModelType}
                        steps={steps}
                        setSteps={setSteps}
                        guidanceScale={guidanceScale}
                        setGuidanceScale={setGuidanceScale}
                        seed={seed}
                        setSeed={setSeed}
                        negativePrompt={negativePrompt}
                        setNegativePrompt={setNegativePrompt}
                    />
                )}
            </div>

            {/* Right Panel - Pending Images */}
            <RightPanel 
                isMobile={isMobile}
                rightPanelExpanded={rightPanelExpanded}
                setRightPanelExpanded={setRightPanelExpanded}
                pendingImages={pendingImages}
                currentImageIndex={currentImageIndex}
                setCurrentImageIndex={setCurrentImageIndex}
                setHistory={setHistory}
                setCurrentHistoryItem={setCurrentHistoryItem}
                setHistoryIndex={setHistoryIndex}
                mode={mode}
                setMode={setMode}
                maskCanvasRef={maskCanvasRef}
                panelsHidden={panelsHidden}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
            />
        </div>
    );
};

export default PowerPaintEditor;