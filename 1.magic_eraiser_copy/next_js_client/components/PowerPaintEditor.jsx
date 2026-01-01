import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, Settings, Wand2, Undo, Redo, Eye, ChevronLeft, ChevronRight, X, Plus, 
  Minus, Menu, Lock, Unlock, MessageSquare, ZoomIn, CheckCircle, ArrowLeft, ArrowRight
} from 'lucide-react';

// Import UI components from s1
import {
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
  SettingsPanel,
  ProcessingOverlay,
  CanvasLockOverlay,
  ZoomModeOverlay,
  Button
} from './PowerPaintEditor_s1';

// Import functions and constants from s2
import {
  MAX_ZOOM_LEVEL,
  TABS_PER_PAGE,
  initializeCanvas,
  resizeCanvas,
  startDrawing,
  draw,
  stopDrawing,
  getCanvasCoordinates,
  loadImageToCanvas,
  backupMaskCanvas,
  restoreMaskCanvas,
  isBrushDisabled,
  handleZoomIn as s2HandleZoomIn,
  handleZoomOut as s2HandleZoomOut,
  getZoomPercentage,
  resetZoom,
  exitZoomMode,
  startPanning,
  handlePanning,
  stopPanning,
  handleSamClick,
  generateSamMask,
  handleInpaint as s2HandleInpaint,
  downloadCurrentImage,
  handleBulkDownload,
  navigateImages as s2NavigateImages,
  handleApproveImage as s2HandleApproveImage,
  handleRecoverImage as s2HandleRecoverImage,
  toggleOriginalView as s2ToggleOriginalView,
  scrollTabIntoView,
  animateScroll,
  createCustomStyles,
  canDrawOnCanvas,
  toggleFitScreen as s2ToggleFitScreen
} from './PowerPaintEditor_s2';

// Import mobile editor component
import PowerPaintMobile from './PowerPaintMobile';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for the mobile component to avoid hydration issues
// const PowerPaintMobile = dynamic(() => import('./PowerPaintMobile'), { ssr: false });

// Device detection function
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    ) ||
    (window.innerWidth <= 768)
  );
};

const PowerPaintEditor = ({ initialImage, onReset }) => {
    // Device type state
    const [isMobile, setIsMobile] = useState(false);
  
    // Main state
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState('brush');
    const [brushSize, setBrushSize] = useState(20);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [samPoints, setSamPoints] = useState([]);
    const advancedSettingsButtonRef = useRef(null);
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

    // Panel navigation system
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

    // Device detection effect - check if mobile
    useEffect(() => {
        const checkDeviceType = () => {
            const mobile = isMobileDevice();
            setIsMobile(mobile);
            
            // Apply mobile-specific settings
            if (mobile) {
                setBrushSize(prev => Math.max(15, prev)); // Larger brush for touch
                setHistoryMinimized(true);
                setLeftPanelExpanded(false);
                setRightPanelExpanded(false);
            }
        };
        
        checkDeviceType();
        
        // Handle window resize
        window.addEventListener('resize', checkDeviceType);
        return () => window.removeEventListener('resize', checkDeviceType);
    }, []);
    
    // URL parameter override for mobile/desktop
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const viewParam = urlParams.get('view');
            
            if (viewParam === 'mobile') {
                setIsMobile(true);
            } else if (viewParam === 'desktop') {
                setIsMobile(false);
            }
        }
    }, []);

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

    // In PowerPaintEditor.jsx, where you already have a useEffect for styles:
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          /* Your existing styles */
          
          /* Settings panel styling */
          #settings-panel h3 {
            font-weight: 500 !important;
            color: #000000 !important;
          }
          
          #settings-panel label {
            font-weight: 500 !important;
            color: #374151 !important;
          }
          
          #settings-model-dropdown select {
            font-weight: 500 !important;
            color: #000000 !important;
          }
          
          #settings-model-dropdown select option {
            font-weight: 400 !important;
            color: #000000 !important;
          }
          
          #settings-panel input[type="number"],
          #settings-panel textarea {
            font-weight: 500 !important;
            color: #000000 !important;
          }
          
          #settings-panel textarea::placeholder {
            color: #6b7280 !important;
            opacity: 1 !important;
          }
          
          #settings-panel input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }
          
          #settings-panel input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Set up canvas when image changes
    useEffect(() => {
        if (!pendingImages[currentImageIndex] || !containerRef.current) return;

        const img = new Image();
        img.onload = () => {
            const context = initializeCanvas(img, containerRef, canvasRef, maskCanvasRef, panelsHidden);

            // Reset zoom states
            setZoomLevel(0);
            setPanPosition({ x: 0, y: 0 });
            setIsZoomed(false);
            setZoomDrawMode(false);

            contextRef.current = context;
            maskContextRef.current = maskCanvasRef.current.getContext('2d');  // FIXED LINE
            
            // Clear mask canvas
            maskContextRef.current.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);

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
    }, [pendingImages, currentImageIndex, panelsHidden]);
    
    // Reset pan position when zoom level changes to 0
    useEffect(() => {
        if (zoomLevel === 0) {
            setPanPosition({ x: 0, y: 0 }); 
        }
    }, [zoomLevel]);

    // Window resize handler
    useEffect(() => {
        const handleResize = () => {
            if (!pendingImages[currentImageIndex]) return;
            resizeCanvas(pendingImages[currentImageIndex], containerRef, canvasRef, maskCanvasRef, panelsHidden);
            
            // Reset zoom
            setZoomLevel(0);
            setPanPosition({ x: 0, y: 0 });
            setIsZoomed(false);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [pendingImages, currentImageIndex, panelsHidden]);

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
            
            // Arrow keys for panel navigation
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
                    handleZoomInClick();
                } else if (isZoomed && e.shiftKey) {
                    // Exit zoom mode
                    handleExitZoomMode();
                }
            }

            // F for fit mode
            if (e.key.toLowerCase() === 'f') {
                e.preventDefault();
                handleToggleFitScreen();
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
                
                handleLoadImageToCanvas(
                    history[historyTabIndex].processedImage,
                    historyTabIndex
                );
                
                setHistoryPageIndex(Math.floor(newIndex / TABS_PER_PAGE));
                
                if (mode === 'original') {
                    setMode('brush');
                    maskCanvasRef.current.style.display = 'block';
                }
                
                // Scroll active tab into view
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
                handleToggleOriginalView();
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
        showDeleteConfirmation, tabToDelete, showContextMenu, showHistory, 
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
                        handleZoomInClick();
                    } else {
                        handleZoomOutClick();
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
            
            handleLoadImageToCanvas(
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
            
            handleLoadImageToCanvas(
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

        handleLoadImageToCanvas(
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

    // Drawing and canvas methods
    const handleStartDrawing = (event) => {
        startDrawing(
            {...event, brushSize}, 
            isCanvasLocked, 
            isZoomed, 
            zoomDrawMode, 
            isDrawing, 
            mode, 
            maskContextRef, 
            maskCanvasRef, 
            zoomLevel, 
            panPosition, 
            lastPoint,
            hasDrawnRef,
            setIsDrawing
        );
    };

    const handleDraw = (event) => {
        draw(
            {...event, brushSize}, 
            isCanvasLocked, 
            isZoomed, 
            zoomDrawMode, 
            isDrawing, 
            mode, 
            maskContextRef, 
            maskCanvasRef, 
            zoomLevel, 
            panPosition, 
            lastPoint,
            hasDrawnRef
        );
    };

    const handleStopDrawing = () => {
        stopDrawing(
            isCanvasLocked, 
            isZoomed, 
            zoomDrawMode, 
            isDrawing, 
            mode, 
            maskContextRef, 
            maskCanvasRef,
            hasDrawnRef,
            setIsDrawing
        );
    };

    const handleCanvasClick = ({ nativeEvent }) => {
        if (mode !== 'sam') return;
        handleSamClick(nativeEvent, maskCanvasRef, maskContextRef, setSamPoints);
    };

    const handleLoadImageToCanvas = (imageSrc, index) => {
        loadImageToCanvas(
            imageSrc, 
            contextRef, 
            canvasRef, 
            maskContextRef, 
            index, 
            setHistoryIndex, 
            setCurrentHistoryItem, 
            history, 
            setLastNonOriginalItem
        );
    };

    // Zoom & Pan methods
    const handleZoomInClick = () => {
        s2HandleZoomIn(zoomLevel, setZoomLevel, MAX_ZOOM_LEVEL, setShowZoomControls, setIsZoomed);
    };

    const handleZoomOutClick = () => {
        s2HandleZoomOut(zoomLevel, setZoomLevel, setPanPosition);
    };

    const handleResetZoom = () => {
        resetZoom(setZoomLevel, setPanPosition);
    };

    const handleExitZoomMode = () => {
        exitZoomMode(setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode, setShowZoomControls);
    };

    const handleStartPanning = (event) => {
        startPanning(event, isZoomed, zoomDrawMode, isDrawing, setIsPanning, setLastPanPos);
    };

    const handlePanMove = (event) => {
        handlePanning(
            event, 
            isPanning, 
            isZoomed, 
            lastPanPos, 
            canvasRef, 
            zoomLevel, 
            setPanPosition, 
            setLastPanPos
        );
    };

    const handleStopPanning = () => {
        stopPanning(setIsPanning);
    };

    // View mode toggles
    const handleToggleOriginalView = () => {
        s2ToggleOriginalView(
            mode, 
            setMode, 
            maskCanvasRef, 
            pendingImages, 
            currentImageIndex, 
            history, 
            setHistoryIndex, 
            setCurrentHistoryItem, 
            handleLoadImageToCanvas
        );
    };

    const handleToggleFitScreen = () => {
        s2ToggleFitScreen(setPanelsHidden, setZoomLevel, setPanPosition, setIsZoomed, setZoomDrawMode);
        
        // Reset current image
        const currentImg = pendingImages[currentImageIndex];
        handleLoadImageToCanvas(currentImg);
    };

    // Image processing methods
    const handleGenerate = async () => {
        await s2HandleInpaint(
            prompt, 
            negativePrompt, 
            modelType, 
            steps, 
            guidanceScale, 
            seed,
            canvasRef, 
            maskCanvasRef, 
            maskContextRef, 
            maskBackupRef,
            contextRef, 
            historyIndex, 
            history, 
            setHistory, 
            setHistoryIndex,
            setCurrentHistoryItem, 
            setLastNonOriginalItem, 
            historyPageIndex,
            setHistoryPageIndex, 
            TABS_PER_PAGE, 
            hasDrawnRef, 
            historyContainerRef,
            scrollTabIntoView, 
            setIsLoading, 
            backupMaskCanvas, 
            restoreMaskCanvas
        );
    };

    // Image management methods
    const navigateImages = (direction) => {
        s2NavigateImages(
            direction, 
            currentImageIndex, 
            pendingImages, 
            setCurrentImageIndex,
            setHistory, 
            setCurrentHistoryItem, 
            setHistoryIndex, 
            mode, 
            setMode, 
            maskCanvasRef
        );
    };

    const handleApproveImage = () => {
        s2HandleApproveImage(
            pendingImages, 
            isLoading, 
            currentHistoryItem,
            setProcessedImages, 
            currentImageIndex, 
            setPendingImages, 
            setCurrentImageIndex,
            setHistory, 
            setCurrentHistoryItem, 
            setHistoryIndex, 
            mode, 
            setMode, 
            maskCanvasRef
        );
    };

    const handleRecoverImage = (imageIndex) => {
        s2HandleRecoverImage(
            imageIndex, 
            processedImages, 
            isLoading,
            setPendingImages, 
            setProcessedImages, 
            pendingImages, 
            setCurrentImageIndex,
            setHistory, 
            setCurrentHistoryItem, 
            setHistoryIndex, 
            mode, 
            setMode,
            maskCanvasRef, 
            activePanel, 
            setLeftPanelActiveIndex
        );
    };

    // Download handlers
    const handleDownload = () => {
        setShowDownloadDialog(true);
    };

    const handleDownloadCurrentImage = () => {
        downloadCurrentImage(canvasRef);
        setShowDownloadDialog(false);
    };

    const handleDownloadAllImages = () => {
        if (processedImages.length === 0) {
            alert('No processed images to download');
            setShowDownloadDialog(false);
            return;
        }
        
        handleBulkDownloadClick();
    };

    const handleBulkDownloadClick = () => {
        if (processedImages.length === 0) return;
        setShowBulkDownloadConfirmation(false);
        handleBulkDownload(processedImages, setIsLoading);
    };

    // Render the mobile version if on a mobile device
    if (isMobile) {
        return (
            <PowerPaintMobile
                initialImage={initialImage}
                onReset={onReset}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                mode={mode}
                setMode={setMode}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                isCanvasLocked={isCanvasLocked}
                setIsCanvasLocked={setIsCanvasLocked}
                samModeActive={mode === 'sam'}
                setSamModeActive={(active) => setMode(active ? 'sam' : 'brush')}
                samPoints={samPoints}
                setSamPoints={setSamPoints}
                prompt={prompt}
                setPrompt={setPrompt}
                negativePrompt={negativePrompt}
                setNegativePrompt={setNegativePrompt}
                modelType={modelType}
                setModelType={setModelType}
                steps={steps}
                setSteps={setSteps}
                guidanceScale={guidanceScale}
                setGuidanceScale={setGuidanceScale}
                seed={seed}
                setSeed={setSeed}
                history={history}
                setHistory={setHistory}
                historyIndex={historyIndex}
                setHistoryIndex={setHistoryIndex}
                currentHistoryItem={currentHistoryItem}
                setCurrentHistoryItem={setCurrentHistoryItem}
                pendingImages={pendingImages}
                setPendingImages={setPendingImages}
                processedImages={processedImages}
                setProcessedImages={setProcessedImages}
                currentImageIndex={currentImageIndex}
                setCurrentImageIndex={setCurrentImageIndex}
                canvasRef={canvasRef}
                maskCanvasRef={maskCanvasRef}
                contextRef={contextRef}
                maskContextRef={maskContextRef}
                maskBackupRef={maskBackupRef}
                hasDrawnRef={hasDrawnRef}
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                toggleOriginalView={handleToggleOriginalView}
                toggleCanvasLock={toggleCanvasLock}
                handleApproveImage={handleApproveImage}
                handleGenerate={handleGenerate}
                handleRecoverImage={handleRecoverImage}
                handleDownloadImage={handleDownloadCurrentImage}
                handleBulkDownload={handleBulkDownloadClick}
                navigateImages={navigateImages}
                startDrawing={handleStartDrawing}
                draw={handleDraw}
                stopDrawing={handleStopDrawing}
                showBrushSizePreview={showBrushSizePreview}
                handleBrushSizeChange={handleBrushSizeChange}
                increaseBrushSize={increaseBrushSize}
                decreaseBrushSize={decreaseBrushSize}
            />
        );
    }
    
    return (
        <div className="fixed inset-0 bg-gray-50 flex overflow-hidden" ref={containerRef}>
            {/* Left Panel - Processed Images */}
            <LeftPanel 
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
                <div className="bg-white shadow-sm py-3 px-4 flex justify-between items-center border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Tooltip text="Back to Upload" preferredPosition="bottom">
                            <Button
                                onClick={onReset}
                                variant="text"
                                size="sm"
                                icon={<ChevronLeft className="w-4 h-4 mr-1" />}
                                label="Back"
                                ariaLabel="Back to Upload"
                            />
                        </Tooltip>
                        <h1 className="text-lg font-medium text-gray-900">InPaint Editor</h1>
                        
                        {pendingImages.length > 0 && (
                            <div className="text-sm text-gray-600 ml-3 py-1 px-2 bg-gray-100 rounded">
                                Image {currentImageIndex + 1} of {pendingImages.length}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Tooltip text="Report a bug or provide feedback" preferredPosition="bottom">
                            <Button
                                onClick={() => setShowFeedbackDialog(true)}
                                variant="icon"
                                size="sm"
                                icon={<MessageSquare className="w-4 h-4" />}
                                ariaLabel="Report a bug or provide feedback"
                            />
                        </Tooltip>
                        
                        <div className="flex items-center gap-2">
                            <Tooltip text="Toggle Canvas Lock (L)" preferredPosition="bottom">
                                <Button
                                    onClick={toggleCanvasLock}
                                    variant="icon"
                                    size="sm"
                                    active={isCanvasLocked}
                                    icon={isCanvasLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                    ariaLabel="Toggle Canvas Lock"
                                    ariaPressed={isCanvasLocked}
                                />
                            </Tooltip>
                            
                            <Tooltip text="Toggle History Panel (H)" preferredPosition="bottom">
                                <Button
                                    onClick={() => {
                                        if (!showHistory) {
                                            setShowHistory(true);
                                            setHistoryMinimized(false);
                                        } else {
                                            setShowHistory(false);
                                        }
                                    }}
                                    variant="icon"
                                    size="sm"
                                    active={showHistory}
                                    icon={
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    }
                                    ariaLabel="Toggle History Panel"
                                    ariaPressed={showHistory}
                                />
                            </Tooltip>
                            
                            <Tooltip text="Toggle Zoom Controls (Z)" preferredPosition="bottom">
                                <Button
                                    onClick={() => {
                                        if (isZoomed) {
                                            handleExitZoomMode();
                                        } else {
                                            handleZoomInClick();
                                        }
                                    }}
                                    variant="icon"
                                    size="sm"
                                    active={isZoomed}
                                    icon={<ZoomIn className="w-4 h-4" />}
                                    ariaLabel="Toggle Zoom Controls"
                                    ariaPressed={isZoomed}
                                />
                            </Tooltip>
                            
                            <Tooltip text="Show Instructions (I)" preferredPosition="bottom">
                              <button 
                                onClick={() => setShowInstructions(!showInstructions)} 
                                className={`p-1.5 rounded-full ${
                                  showInstructions ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                } transition-colors`}
                                aria-label="Show Instructions"
                                aria-pressed={showInstructions}
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                              </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
                
                {/* Canvas Container */}
                <div className={`flex-1 flex items-center justify-center relative p-2 pb-20 ${panelsHidden ? 'px-8' : ''}`}>
                    <div className={`relative overflow-hidden mb-4 ${panelsHidden ? 'max-w-full transition-all duration-300' : ''}`} 
                        style={{ border: "none", outline: "none" }}
                        ref={canvasContainerRef}
                        onMouseDown={(event) => handleStartPanning(event)}
                        onMouseMove={(event) => handlePanMove(event)}
                        onMouseUp={() => handleStopPanning()}
                        onMouseLeave={() => handleStopPanning()}
                        onTouchStart={(event) => handleStartPanning(event)}
                        onTouchMove={(event) => handlePanMove(event)}
                        onTouchEnd={() => handleStopPanning()}
                        onTouchCancel={() => handleStopPanning()}>
                        {/* Canvas wrapper with zoom/pan transformations */}
                        <div className={`${isPanning ? 'pan-handle' : ''} ${isZoomed && !isPanning ? 'zoom-transition' : ''}`}
                            style={{
                                transform: isZoomed ? 
                                    `scale(${1 + (zoomLevel * 0.1)}) translate(${-panPosition.x}px, ${-panPosition.y}px)` : 
                                    'scale(1) translate(0px, 0px)', 
                                transformOrigin: 'center',
                                margin: '0 auto',
                                position: 'relative'
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
                                onMouseDown={mode === 'sam' ? handleCanvasClick : ((!isZoomed || zoomDrawMode) ? handleStartDrawing : undefined)}
                                onMouseMove={(!isZoomed || zoomDrawMode) ? handleDraw : undefined}
                                onMouseUp={(!isZoomed || zoomDrawMode) ? handleStopDrawing : undefined}
                                onMouseLeave={(!isZoomed || zoomDrawMode) ? handleStopDrawing : undefined}
                                onTouchStart={(!isZoomed || zoomDrawMode) ? handleStartDrawing : undefined}
                                onTouchMove={(!isZoomed || zoomDrawMode) ? handleDraw : undefined}
                                onTouchEnd={(!isZoomed || zoomDrawMode) ? handleStopDrawing : undefined}
                                onTouchCancel={(!isZoomed || zoomDrawMode) ? handleStopDrawing : undefined}
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
                                handleZoomIn={handleZoomInClick}
                                handleZoomOut={handleZoomOutClick}
                                handleResetZoom={handleResetZoom}
                                isPanning={isPanning}
                                zoomDrawMode={zoomDrawMode}
                                setZoomDrawMode={setZoomDrawMode}
                                exitZoomMode={handleExitZoomMode}
                            />
                        )}
                        
                        {/* Brush size indicator */}
                        {showBrushSizeIndicator && mode === 'brush' && !isLoading && (isZoomed ? zoomDrawMode : true) && (
                            <BrushSizeIndicator brushSize={brushSize} />
                        )}
                        
                        {/* Context Menu */}
                        {showContextMenu && (
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
                                setShowInstructions={setShowInstructions}
                            />
                        )}
                        
                        {showHistory && (
                            <HistoryPanel
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
                                loadImageToCanvas={handleLoadImageToCanvas}
                                initialImage={pendingImages[currentImageIndex]}
                                handlePrevHistoryPage={handlePrevHistoryPage}
                                handleNextHistoryPage={handleNextHistoryPage}
                                handleDeleteTab={handleDeleteTab}
                                historyContainerRef={historyContainerRef}
                            />
                        )}
                        
                        {showDeleteConfirmation && (
                            <DeleteConfirmationDialog
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
                                downloadCurrentImage={handleDownloadCurrentImage}
                                downloadAllImages={handleDownloadAllImages}
                            />
                        )}
                        
                        {showBulkDownloadConfirmation && (
                            <BulkDownloadConfirmation
                                processedImages={processedImages}
                                setShowBulkDownloadConfirmation={setShowBulkDownloadConfirmation}
                                handleBulkDownload={handleBulkDownloadClick}
                            />
                        )}
                        
                        {showFeedbackDialog && (
                            <FeedbackDialog
                                setShowFeedbackDialog={setShowFeedbackDialog}
                            />
                        )}
                    </div>
                </div>
                
                {/* Bottom toolbar - Desktop only */}
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-gray-200 z-50">
                    <div className="flex flex-col">
                        {/* Main controls */}
                        <div className="flex items-center justify-between px-4 py-3 h-16 border-b border-gray-100">
                            {/* Left side controls */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={handleUndo}
                                        disabled={historyIndex <= 0 || mode === 'original' || isLoading}
                                        variant="secondary"
                                        size="sm"
                                        icon={<Undo className="w-4 h-4 mr-1" />}
                                        label="Undo"
                                        ariaLabel="Undo"
                                        keyboardShortcut="Ctrl+Z"
                                    />
                                    
                                    <Button
                                        onClick={handleRedo}
                                        disabled={historyIndex >= history.length - 1 || mode === 'original' || isLoading}
                                        variant="secondary"
                                        size="sm"
                                        icon={<Redo className="w-4 h-4 mr-1" />}
                                        label="Redo"
                                        ariaLabel="Redo"
                                        keyboardShortcut="Ctrl+Y"
                                    />
                                </div>
                                
                                {/* Model selection */}
                        
                                <div style={{
                                    borderLeft: '1px solid #e5e7eb',
                                    paddingLeft: '0.75rem',
                                    marginLeft: '0.25rem'
                                }}>
                                    <div id="model-dropdown-container" style={{ position: 'relative' }}>
                                        <select
                                            value={modelType}
                                            onChange={(e) => setModelType(e.target.value)}
                                            style={{
                                                fontSize: '0.875rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                padding: '0.375rem 0.5rem',
                                                paddingRight: '2rem',
                                                backgroundColor: '#ffffff',
                                                color: '#000000',
                                                fontWeight: 500,
                                                appearance: 'none',
                                                outline: 'none',
                                                cursor: 'pointer',
                                                width: '100%',
                                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                            }}
                                            aria-label="Select Model"
                                        >
                                            <option value="sdxl" style={{ color: '#000000', fontWeight: 400 }}>SDXL (Best Quality)</option>
                                            <option value="realistic_vision" style={{ color: '#000000', fontWeight: 400 }}>Realistic Vision (Photorealistic)</option>
                                            <option value="deliberate" style={{ color: '#000000', fontWeight: 400 }}>Deliberate (Detailed)</option>
                                        </select>
                                        <div style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none',
                                            color: '#000000'  // Darker arrow color
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Navigation controls */}
                                {pendingImages.length > 1 && (
                                    <div className="flex items-center ml-2 border border-gray-200 rounded overflow-hidden">
                                        <Button
                                            onClick={() => navigateImages('prev')}
                                            variant="plain"
                                            size="sm"
                                            icon={<ChevronLeft className="w-4 h-4" />}
                                            ariaLabel="Previous Image"
                                            tooltip="Previous Image (←)"
                                        />
                                        
                                        <div className="flex items-center border-l border-r border-gray-200 px-2 py-1">
                                            {pendingImages.map((_, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`w-2 h-2 mx-1 rounded-full cursor-pointer transition-colors ${idx === currentImageIndex ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'}`}
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
                                        
                                        <Button
                                            onClick={() => navigateImages('next')}
                                            variant="plain"
                                            size="sm"
                                            icon={<ChevronRight className="w-4 h-4" />}
                                            ariaLabel="Next Image"
                                            tooltip="Next Image (→)"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Middle - Mode and prompt controls */}
                            <div className="flex items-center gap-3 flex-1 justify-center max-w-2xl px-3">
                                {/* Mode toggle button with SAM mode indicator */}
                                <div className="relative">
                                    <Button
                                        onClick={() => setMode(mode === 'brush' ? 'sam' : 'brush')}
                                        variant={mode === 'brush' ? 'primary' : 'success'}
                                        size="md"
                                        label={mode === 'brush' ? 'Switch to SAM Mode' : 'Switch to Brush Mode'}
                                        ariaLabel={mode === 'brush' ? "Switch to SAM Mode" : "Switch to Brush Mode"}
                                        ariaPressed={mode === 'sam'}
                                    />
                                    {mode === 'sam' && (
                                        <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-blue-500 border border-white rounded-full group">
                                            <Wand2 className="h-3 w-3 text-white" />
                                            <div className="absolute hidden group-hover:block bottom-full right-0 mb-1 bg-white text-black text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                                                SAM mode is enabled
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ flex: '1 1 auto' }}>
                                    <div id="prompt-input-container" style={{ position: 'relative', width: '100%' }}>
                                        <input
                                            type="text"
                                            placeholder="Enter prompt..."
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.875rem',
                                                lineHeight: 1.5,
                                                color: '#000000',
                                                fontWeight: 500,
                                                backgroundColor: '#ffffff',
                                                boxSizing: 'border-box',
                                                outline: 'none',
                                                transition: 'none',
                                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                                                e.target.style.borderColor = 'transparent';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.boxShadow = 'none';
                                                e.target.style.borderColor = '#d1d5db';
                                            }}
                                            aria-label="Prompt input"
                                            ref={promptInputRef}
                                        />
                                    </div>
                                </div>
                                
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!prompt || isLoading}
                                    variant="primary"
                                    size="md"
                                    label={isLoading ? 'Processing...' : 'Generate'}
                                    ariaLabel="Generate with AI"
                                />
                            </div>
                            
                            {/* Right side controls */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {pendingImages.length > 0 && (
                                    <Button
                                        onClick={handleApproveImage}
                                        disabled={isLoading}
                                        variant="success"
                                        size="sm"
                                        icon={<CheckCircle className="w-4 h-4 mr-1" />}
                                        label="Approve"
                                        ariaLabel="Approve Image"
                                        tooltip="Approve Image (Y)"
                                    />
                                )}
                                
                                <Button
                                    onClick={handleToggleOriginalView}
                                    disabled={isLoading}
                                    variant="secondary"
                                    active={mode === 'original'}
                                    size="sm"
                                    icon={<Eye className="w-4 h-4 mr-1" />}
                                    label={mode === 'original' ? 'Exit View' : 'Original'}
                                    ariaLabel={mode === 'original' ? 'Exit View' : 'Original'}
                                    tooltip="Toggle Original View (O)"
                                />
                                
                                <Button
                                    onClick={handleDownload}
                                    disabled={isLoading}
                                    variant="primary"
                                    size="sm"
                                    icon={<Download className="w-4 h-4 mr-1" />}
                                    label="Download"
                                    ariaLabel="Download"
                                    tooltip="Download (D)"
                                    />
                                    </div>
                                </div>
                                
                                {/* Drawing controls */}
                                <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center gap-2 ${isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode) ? 'opacity-50' : ''}`}>
                                            <Button
                                                onClick={decreaseBrushSize}
                                                disabled={brushSize <= 1 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                                variant="icon"
                                                size="xs"
                                                icon={<Minus className="w-4 h-4" />}
                                                ariaLabel="Decrease Brush Size"
                                                tooltip="Decrease Brush Size (Shift+-)"
                                            />
                                            
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-700 w-14">Brush: {brushSize}</span>
                                                <input
                                                    type="range" 
                                                    min="1" 
                                                    max="50" 
                                                    value={brushSize}
                                                    onChange={handleBrushSizeChange}
                                                    className="w-28 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                                    disabled={isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                                    aria-label="Brush Size"
                                                    aria-valuemin="1"
                                                    aria-valuemax="50"
                                                    aria-valuenow={brushSize}
                                                />
                                            </div>
                                            
                                            <Button
                                                onClick={increaseBrushSize}
                                                disabled={brushSize >= 50 || isBrushDisabled(mode, isLoading, isCanvasLocked, isZoomed, zoomDrawMode)}
                                                variant="icon"
                                                size="xs"
                                                icon={<Plus className="w-4 h-4" />}
                                                ariaLabel="Increase Brush Size"
                                                tooltip="Increase Brush Size (Shift++)"
                                            />
                                        </div>
                                        
                                        <div className="border-l border-gray-300 pl-3">
                                          <Button
                                            onClick={() => setShowSettings(!showSettings)}
                                            variant="plain"
                                            size="sm"
                                            icon={<Settings className="w-4 h-4 mr-1" />}
                                            label="Advanced Settings"
                                            ariaLabel="Advanced Settings"
                                            active={showSettings}
                                            ref={advancedSettingsButtonRef}
                                          />
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={toggleCanvasLock}
                                            disabled={isLoading}
                                            variant="secondary"
                                            size="sm"
                                            active={isCanvasLocked}
                                            icon={isCanvasLocked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                                            label={isCanvasLocked ? 'Unlock' : 'Lock'}
                                            ariaLabel="Toggle Canvas Lock"
                                            tooltip="Toggle Canvas Lock (L)"
                                        />
                                        
                                        <Button
                                            onClick={handleToggleFitScreen}
                                            disabled={isLoading}
                                            variant="secondary"
                                            size="sm"
                                            active={panelsHidden}
                                            icon={
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                                </svg>
                                            }
                                            label={panelsHidden ? 'Show Panels' : 'Fit Screen'}
                                            ariaLabel={panelsHidden ? "Show Panels" : "Fit Image to Screen"}
                                            tooltip="Fit to Screen (F)"
                                        />
                                        
                                        <Button
                                            onClick={() => {
                                                if (isZoomed) {
                                                    handleExitZoomMode();
                                                } else {
                                                    handleZoomInClick();
                                                }
                                            }}
                                            disabled={isLoading}
                                            variant="secondary"
                                            size="sm"
                                            active={isZoomed}
                                            icon={<ZoomIn className="w-4 h-4 mr-1" />}
                                            label={zoomLevel > 0 ? `${getZoomPercentage(zoomLevel)}%` : 'Zoom'}
                                            ariaLabel="Toggle Zoom"
                                            tooltip="Zoom Controls (Z)"
                                        />
                                    </div>
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
                            setShowSettings={setShowSettings}
                            buttonRef={advancedSettingsButtonRef}
                            hideModelType={true}
                          />
                        )}
                    </div>
                
                    {/* Right Panel - Pending Images */}
                    <RightPanel 
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