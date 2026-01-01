import React, { useEffect, useState, useRef } from 'react';
import { 
  Download, ArrowLeft, RotateCcw, Wand2, Zap, HandMetal, 
  Info, ToggleLeft, ToggleRight, Plus, X, ChevronDown, 
  ChevronUp, Settings, Image as ImageIcon, ZoomIn, ZoomOut, Home, RotateCw
} from 'lucide-react';

// Style Injector Component to ensure our styles aren't overridden
export const StyleInjector = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #app-title,
      #mode-label,
      #blur-strength-label,
      #completed-images-title,
      #no-images-text,
      #download-button,
      #mode-toggle-button,
      #instruction-text,
      #processing-title,
      #settings-title,
      #queue-title,
      .section-title {
        font-weight: 500 !important;
        color: #000000 !important;
      }
      
      #mode-toggle-button *,
      #download-button * {
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      /* Mobile-specific styles */
      body.mobile-view {
        overscroll-behavior: none;
        touch-action: none;
      }
      
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      /* Animations */
      .slide-up {
        animation: slide-up 0.3s ease-out;
      }
      
      .fade-in {
        animation: fade-in 0.3s ease-out;
      }
      
      @keyframes slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  return null;
};

// Haptic Feedback Service for mobile
export const Haptics = {
  Duration: {
    SHORT: 50,
    MEDIUM: 100,
    LONG: 200,
    PATTERN_SUCCESS: [30, 30, 30],
    PATTERN_ERROR: [100, 50, 100],
  },
  
  impact(intensity = 'medium') {
    if (!navigator.vibrate) return;
    
    switch(intensity) {
      case 'light':
        navigator.vibrate(this.Duration.SHORT);
        break;
      case 'heavy':
        navigator.vibrate(this.Duration.LONG);
        break;
      case 'medium':
      default:
        navigator.vibrate(this.Duration.MEDIUM);
        break;
    }
  },
  
  notification(type = 'success') {
    if (!navigator.vibrate) return;
    
    switch(type) {
      case 'error':
        navigator.vibrate(this.Duration.PATTERN_ERROR);
        break;
      case 'success':
      default:
        navigator.vibrate(this.Duration.PATTERN_SUCCESS);
        break;
    }
  }
};

// Toast notification component for mobile
export const MobileToast = ({ message, type = 'info', onDismiss, autoHideDuration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, autoHideDuration);
    
    return () => clearTimeout(timer);
  }, [onDismiss, autoHideDuration]);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '0',
      right: '0',
      margin: '0 auto',
      width: '90%',
      padding: '0.75rem 1rem',
      backgroundColor: type === 'error' ? '#FEE2E2' : type === 'success' ? '#D1FAE5' : '#DBEAFE',
      border: `1px solid ${type === 'error' ? '#F87171' : type === 'success' ? '#34D399' : '#60A5FA'}`,
      borderRadius: '0.375rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      zIndex: 60,
      animation: 'slide-up 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: type === 'error' ? '#B91C1C' : type === 'success' ? '#065F46' : '#1E40AF'
        }}>{message}</p>
        <button onClick={onDismiss} style={{ color: 'inherit' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Mobile dialog component
export const MobileDialog = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        width: '90%',
        maxWidth: '24rem',
        overflow: 'hidden',
        animation: 'slide-up 0.3s ease-out'
      }}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 500
          }}>{title}</h3>
          <button onClick={onClose} style={{ color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{
          padding: '1rem',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}>
          {children}
        </div>
        
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #D1D5DB',
              borderRadius: '0.375rem',
              color: '#374151',
              fontSize: '0.875rem'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onClose();
              Haptics.impact('medium');
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#abf134',
              color: '#000000',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// QuickBall (Floating Action Button) for mobile
export const QuickBall = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ right: '1rem', bottom: '5rem' });
  const [menuRadius, setMenuRadius] = useState(80);
  
  // Adjust size based on screen dimensions
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      
      // Calculate safe radius
      let safeRadius = 80; // Default
      
      if (windowWidth < 330) safeRadius = 60;
      else if (windowWidth < 380) safeRadius = 70;
      
      setMenuRadius(safeRadius);
      
      // Adjust position
      setPosition({
        right: windowWidth < 330 ? '0.75rem' : '1rem',
        bottom: '5rem'
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div style={{ 
      position: 'fixed', 
      right: position.right, 
      bottom: position.bottom, 
      zIndex: 40 
    }}>
      {/* Action buttons positioned in circle */}
      {isOpen && actions.map((action, index) => (
        <button 
          key={index}
          onClick={() => {
            action.handler();
            setIsOpen(false);
            Haptics.impact('light');
          }}
          style={{
            position: 'absolute',
            transform: `translate(
              ${Math.sin(index * (2 * Math.PI / actions.length)) * menuRadius}px, 
              ${-Math.cos(index * (2 * Math.PI / actions.length)) * menuRadius}px
            )`,
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#374151',
            transition: 'transform 0.2s',
            border: '1px solid #E5E7EB'
          }}
        >
          {action.icon}
        </button>
      ))}
      
      {/* Main QuickBall button */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          Haptics.impact('medium');
        }}
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '9999px',
          backgroundColor: '#abf134',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000000',
          border: 'none'
        }}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
      
      {/* Backdrop to close when clicking outside */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Mobile-optimized compare slider
export const CompareSlider = ({ originalImage, processedImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = React.useRef(null);
  
  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      // Calculate percentage
      let newPosition = ((e.touches[0].clientX - containerRect.left) / containerWidth) * 100;
      
      // Clamp to valid range
      newPosition = Math.max(0, Math.min(100, newPosition));
      
      // Update slider position
      setSliderPosition(newPosition);
      
      // Haptic feedback for increments
      if (Math.abs(newPosition - sliderPosition) > 5 && navigator.vibrate) {
        Haptics.impact('light');
      }
    }
  };
  
  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        touchAction: 'none'
      }}
      onTouchMove={handleTouchMove}
    >
      {/* Original image */}
      <img 
        src={originalImage} 
        alt="Original"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
      
      {/* Processed image - clipped */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
        }}
      >
        <img 
          src={processedImage} 
          alt="Processed"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
      
      {/* Slider handle */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          left: `${sliderPosition}%`,
          width: '40px',
          height: '100%',
          transform: 'translateX(-20px)',
          pointerEvents: 'none',
          zIndex: 30
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '40px',
          backgroundColor: 'white',
          borderRadius: '9999px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.125rem'
        }}>
          <ArrowLeft size={14} />
          <ArrowLeft size={14} style={{ transform: 'scaleX(-1)' }} />
        </div>
      </div>
    </div>
  );
};

// Utility function for converting hex to RGB (used by both mobile and desktop)
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255]; // Default to white if invalid hex
};

// Drawing utility functions
export const drawingUtils = {
  drawPoint: (ctx, x, y, size) => {
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#abf134';
    ctx.fill();
    ctx.closePath();
  },

  drawLine: (ctx, startX, startY, endX, endY, size) => {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#abf134';
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();
  }
};

// Error message component
export const ErrorMessage = ({ error, onDismiss }) => {
  if (!error) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      backgroundColor: '#FEE2E2',
      border: '1px solid #F87171',
      color: '#B91C1C',
      padding: '0.75rem 1rem',
      borderRadius: '0.25rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      {error}
      <button 
        style={{
          marginLeft: '0.75rem',
          color: '#B91C1C'
        }}
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
};

// Desktop download dropdown component
export const DownloadDropdown = ({ 
  showMenu, 
  activeDisplayImage, 
  handleDownload, 
  onClose 
}) => {
  if (!showMenu) return null;
  
  return (
    <div style={{
      position: 'absolute',
      right: 0,
      marginTop: '0.5rem',
      width: '12rem',
      backgroundColor: 'white',
      borderRadius: '0.375rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50
    }}>
      <div style={{ padding: '0.25rem 0' }}>
        <button
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: '#374151',
            cursor: !activeDisplayImage || !activeDisplayImage.processed ? 'not-allowed' : 'pointer',
            opacity: !activeDisplayImage || !activeDisplayImage.processed ? 0.5 : 1
          }}
          onClick={() => handleDownload('selected')}
          disabled={!activeDisplayImage || !activeDisplayImage.processed}
          onMouseOver={(e) => {
            if (activeDisplayImage && activeDisplayImage.processed) {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Download Selected
        </button>
        <button
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: '#374151',
            cursor: 'pointer'
          }}
          onClick={() => handleDownload('all')}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          Download All
        </button>
      </div>
      
      {/* Backdrop to close when clicking outside */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1
        }}
        onClick={onClose}
      />
    </div>
  );
};

// Completed image thumbnail component
export const CompletedImageThumbnail = ({ 
  image, 
  isActive, 
  onSelect, 
  onDelete 
}) => {
  return (
    <div 
      key={image.id} 
      style={{
        border: isActive ? '1px solid #abf134' : '1px solid #E5E7EB',
        borderRadius: '0.25rem',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        boxShadow: isActive ? '0 0 0 2px rgba(171, 241, 52, 0.2)' : 'none'
      }}
      onMouseOver={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = '#D1D5DB';
        }
      }}
      onMouseOut={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = '#E5E7EB';
        }
      }}
    >
      <div 
        style={{ 
          position: 'relative',
          height: '120px',
          width: '100%'
        }}
        onClick={() => onSelect(image)}
      >
        <img 
          src={image.processed || image.original} 
          alt="Completed" 
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        {/* Display background type badge */}
        <div style={{
          position: 'absolute',
          top: '0.25rem',
          left: '0.25rem',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          fontSize: '0.75rem',
          padding: '0 0.375rem',
          borderRadius: '0.125rem'
        }}>
          {image.backgroundType === 'transparent' ? 'Transparent' : 
           image.backgroundType === 'color' ? 'Color' : 'AI Gen'}
        </div>
      </div>
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(image.id);
        }}
        style={{
          position: 'absolute',
          top: '0.25rem',
          right: '0.25rem',
          width: '1.5rem',
          height: '1.5rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(31, 41, 55, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          opacity: 0,
          transition: 'opacity 0.2s, background-color 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = 1;
          e.currentTarget.style.backgroundColor = '#DC2626';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.opacity = 0;
          e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.6)';
        }}
      >
        <span style={{ fontSize: '0.75rem' }}>×</span>
      </button>
    </div>
  );
};

// Queue image thumbnail component
export const QueueImageThumbnail = ({ image, index }) => {
  return (
    <div 
      key={image.id}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '0.25rem',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <div style={{ 
        position: 'relative',
        height: '120px',
        width: '100%'
      }}>
        <img 
          src={image.original} 
          alt={`Queue ${index + 1}`} 
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        {/* Display background type badge */}
        <div style={{
          position: 'absolute',
          top: '0.25rem',
          left: '0.25rem',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          fontSize: '0.75rem',
          padding: '0 0.375rem',
          borderRadius: '0.125rem'
        }}>
          {image.backgroundType === 'transparent' ? 'Transparent' : 
           image.backgroundType === 'color' ? 'Color' : 'AI Gen'}
        </div>
      </div>
    </div>
  );
};

// Custom hook for debouncing values (extracted from BackgroundRemovalEditor)
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// NEW COMPONENTS EXTRACTED FROM BackgroundRemovalEditor

// Desktop Header Component
export const DesktopHeader = ({ onReset, showDownloadMenu, setShowDownloadMenu, completedImages, handleDownload, activeDisplayImage }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <button 
        onClick={onReset}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          color: '#4B5563',
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
        Back
      </button>
      
      {/* Title with direct HTML */}
      <h1 id="app-title" style={{
        fontSize: '1.5rem',
        lineHeight: '2rem',
        fontWeight: 500,
        color: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>Background Removal</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Download button with direct HTML */}
        <div style={{ position: 'relative' }}>
          <button
            id="download-button"
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={completedImages.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              color: '#4B5563',
              borderRadius: '0.25rem',
              cursor: completedImages.length === 0 ? 'not-allowed' : 'pointer',
              opacity: completedImages.length === 0 ? 0.5 : 1,
              fontWeight: 500,
              fontSize: '0.875rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}
            onMouseOver={(e) => {
              if (completedImages.length > 0) {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Download style={{ width: '1rem', height: '1rem' }} />
            Download
          </button>
          
          {/* Use DownloadDropdown component */}
          <DownloadDropdown 
            showMenu={showDownloadMenu}
            activeDisplayImage={activeDisplayImage}
            handleDownload={handleDownload}
            onClose={() => setShowDownloadMenu(false)}
          />
        </div>
      </div>
    </div>
  );
};

// Mode Toggle Bar Component
export const ModeToggleBar = ({ viewMode, toggleViewMode, showDownloadMenu, setShowDownloadMenu }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1rem',
      borderBottom: '1px solid #E5E7EB',
      backgroundColor: '#F9FAFB'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Mode toggle button with direct HTML */}
        <button
          id="mode-toggle-button"
          onClick={toggleViewMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid #E5E7EB',
            backgroundColor: 'white',
            cursor: 'pointer',
            color: '#000000',
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}
        >
          {viewMode === 'live' ? (
            <>
              <ToggleLeft style={{ height: '1rem', width: '1rem' }} />
              Live Mode
            </>
          ) : (
            <>
              <ToggleRight style={{ height: '1rem', width: '1rem' }} />
              Canvas Mode
            </>
          )}
        </button>
      </div>
      
      <div style={{ 
        fontSize: '0.875rem', 
        color: '#6B7280' 
      }}>
        {viewMode === 'live' 
          ? 'Select image from completed images' 
          : 'Compare results. Not satisfied? Reprocess or remaster.'}
      </div>
      
      {/* Close dropdown when clicking outside */}
      {showDownloadMenu && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40
          }}
          onClick={() => setShowDownloadMenu(false)}
        />
      )}
    </div>
  );
};

// Left Panel Component (Completed Images)
export const CompletedImagesPanel = ({ completedImages, activeDisplayImage, handleSelectCompleted, handleDeleteImage }) => {
  return (
    <div style={{
      width: '16rem',
      borderRight: '1px solid #E5E7EB',
      overflowY: 'auto',
      padding: '1rem'
    }}>
      {/* Title with direct HTML */}
      <h2 id="completed-images-title" style={{
        textTransform: 'uppercase',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#000000',
        marginBottom: '0.75rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>COMPLETED IMAGES</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {completedImages.map(img => (
          <CompletedImageThumbnail
            key={img.id}
            image={img}
            isActive={activeDisplayImage && activeDisplayImage.id === img.id}
            onSelect={handleSelectCompleted}
            onDelete={handleDeleteImage}
          />
        ))}
        
        {completedImages.length === 0 && (
          <div id="no-images-text" style={{
            color: '#000000',
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '2rem 0',
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            No processed images yet
          </div>
        )}
      </div>
    </div>
  );
};

// Desktop Image Canvas Slider Component
export const DesktopImageSlider = ({ sliderPosition, handleSliderMouseDown }) => {
  return (
    <>
      {/* Slider Line */}
      <div 
        style={{ 
          position: 'absolute',
          width: '0.125rem',
          backgroundColor: 'white',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          left: `${sliderPosition}%`,
          pointerEvents: 'none',
          top: 0,
          height: '100%',
          zIndex: 30
        }}
      />
      
      {/* Slider Handle - this is what user interacts with */}
      <div 
        style={{ 
          position: 'absolute',
          left: `${sliderPosition}%`,
          width: '20px',
          transform: 'translateX(-10px)',
          pointerEvents: 'auto',
          top: 0,
          height: '100%',
          zIndex: 40,
          cursor: 'ew-resize'
        }}
        onMouseDown={handleSliderMouseDown}
      >
        {/* Sleek minimal slider handle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '1.25rem',
          height: '1.25rem',
          backgroundColor: 'white',
          borderRadius: '9999px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #D1D5DB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '0.125rem',
            height: '0.75rem',
            backgroundColor: '#9CA3AF',
            borderRadius: '9999px'
          }}></div>
        </div>
      </div>
    </>
  );
};

// Settings Panel Component
export const SettingsPanel = ({ 
  currentImageBeingProcessed, 
  detectionMode, 
  handleToggleDetectionMode, 
  brushSize, 
  setBrushSize,
  backgroundType,
  backgroundColor,
  backgroundPrompt,
  inpaintingModel,
  handleUpdateBackgroundSettings,
  isSelectionInverted
}) => {
  return (
    <div style={{
      padding: '1rem',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <h2 id="settings-title" className="section-title" style={{
        textTransform: 'uppercase',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#000000',
        marginBottom: '0.75rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>SETTINGS</h2>
      
      {/* Detection Mode Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#000000',
          marginBottom: '0.5rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          Detection Mode
        </label>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem' 
        }}>
          <button
            onClick={() => handleToggleDetectionMode("manual")}
            style={{
              flex: 1,
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '0.25rem',
              border: '1px solid #E5E7EB',
              backgroundColor: detectionMode === "manual" ? '#abf134' : 'white',
              color: detectionMode === "manual" ? '#000000' : '#4B5563',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <HandMetal style={{ width: '1rem', height: '1rem' }} />
            Manual
          </button>
          <button
            onClick={() => handleToggleDetectionMode("auto")}
            style={{
              flex: 1,
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '0.25rem',
              border: '1px solid #E5E7EB',
              backgroundColor: detectionMode === "auto" ? '#abf134' : 'white',
              color: detectionMode === "auto" ? '#000000' : '#4B5563',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <Zap style={{ width: '1rem', height: '1rem' }} />
            Auto
          </button>
        </div>
      </div>
      
      {/* Brush Size Control - Only shown for manual mode */}
      {detectionMode === "manual" && currentImageBeingProcessed && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#000000',
            marginBottom: '0.25rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            Brush Size: {brushSize}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{
              width: '100%'
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.75rem', 
            color: '#6B7280',
            marginTop: '0.25rem'
          }}>
            <span>Small</span>
            <span>Medium</span>
            <span>Large</span>
          </div>
        </div>
      )}
      
      {/* Background Type Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#000000',
          marginBottom: '0.5rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          Background Type
        </label>
        <select
          value={currentImageBeingProcessed ? 
            currentImageBeingProcessed.backgroundType || backgroundType : 
            backgroundType}
          onChange={(e) => handleUpdateBackgroundSettings('type', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            border: '1px solid #E5E7EB',
            fontSize: '0.875rem',
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            color: '#000000',
            marginBottom: '0.5rem',
            appearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M10.293%203.293%206%207.586%201.707%203.293A1%201%200%20%200%20.293%204.707l5%205a1%201%200%20%200%201.414%200l5-5a1%201%200%201%200-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '0.75rem',
            paddingRight: '2rem'
          }}
        >
          <option value="transparent" style={{fontWeight: 500, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'}}>Transparent</option>
          <option value="color" style={{fontWeight: 500, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'}}>Solid Color</option>
          <option value="generative" style={{fontWeight: 500, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'}}>AI Generated</option>
        </select>
        
        {/* Background Color Picker (only shown for color type) */}
        {(currentImageBeingProcessed?.backgroundType || backgroundType) === 'color' && (
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#000000',
              marginBottom: '0.5rem',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              Background Color
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <input
                type="color"
                value={currentImageBeingProcessed ? 
                  currentImageBeingProcessed.backgroundColor || backgroundColor : 
                  backgroundColor}
                onChange={(e) => {
                  if (currentImageBeingProcessed?.isRemastered) {
                    // Special handling for remastered images would be implemented in the parent component
                    handleUpdateBackgroundSettings('color', e.target.value);
                  } else {
                    handleUpdateBackgroundSettings('color', e.target.value);
                  }
                }}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}
              />
              <span style={{
                fontSize: '0.875rem',
                color: '#4B5563'
              }}>
                {currentImageBeingProcessed ? 
                  currentImageBeingProcessed.backgroundColor || backgroundColor : 
                  backgroundColor}
              </span>
            </div>
          </div>
        )}
        
        {/* AI Generation Options (only shown for generative type) */}
        {(currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && (
          <>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#000000',
                marginBottom: '0.5rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                AI Model
              </label>
              <select
                value={currentImageBeingProcessed ? 
                  currentImageBeingProcessed.inpaintingModel || inpaintingModel : 
                  inpaintingModel}
                onChange={(e) => handleUpdateBackgroundSettings('model', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#000000',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M10.293%203.293%206%207.586%201.707%203.293A1%201%200%20%200%20.293%204.707l5%205a1%201%200%20%200%201.414%200l5-5a1%201%200%201%200-1.414-1.414z%22%2F%3E%3C%2Fsvg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '0.75rem',
                  paddingRight: '2rem'
                }}
              >
                <option value="deliberate_v2" style={{fontWeight: 500, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'}}>Deliberate V2 (Balanced)</option>
                <option value="realistic_vision_v5" style={{fontWeight: 500, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'}}>Realistic Vision V5 (Photorealistic)</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#000000',
                marginBottom: '0.5rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                Background Prompt
              </label>
              <input
                type="text"
                value={currentImageBeingProcessed ? 
                  currentImageBeingProcessed.backgroundPrompt || backgroundPrompt : 
                  backgroundPrompt}
                onChange={(e) => handleUpdateBackgroundSettings('prompt', e.target.value)}
                placeholder="Describe the background you want"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #E5E7EB',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </>
        )}
      </div>
      
      {/* Instructions based on detection mode */}
      <div style={{
        padding: '0.75rem',
        backgroundColor: '#EBF5FF',
        borderRadius: '0.25rem'
      }}>
        <p id="instruction-text" style={{
          fontSize: '0.875rem',
          color: '#1E40AF',
          fontWeight: 500,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          {detectionMode === "manual" 
            ? isSelectionInverted
              ? "Inverted mode: Paint areas you want to REMOVE. The rest will be kept."
              : "Draw on the image to mark the subject you want to keep. The background will be removed."
            : "Auto-detection will automatically identify the main subject in your image."}
        </p>
      </div>
    </div>
  );
};

// Queue Panel Component
export const QueuePanel = ({ pendingImages }) => {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '1rem'
    }}>
      <h2 id="queue-title" className="section-title" style={{
        textTransform: 'uppercase',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#000000',
        marginBottom: '0.75rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        REMAINING QUEUE ({pendingImages.length > 0 ? pendingImages.length - 1 : 0})
      </h2>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        {pendingImages.slice(1).map((img, index) => (
          <QueueImageThumbnail 
            key={img.id}
            image={img}
            index={index}
          />
        ))}
        
        {(pendingImages.length <= 1) && (
          <div style={{
            color: '#9CA3AF',
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '2rem 0'
          }}>
            No more images in queue
          </div>
        )}
      </div>
    </div>
  );
};

// Action Buttons Component
export const ActionButtonsPanel = ({ 
  currentImageBeingProcessed, 
  activeDisplayImage, 
  isProcessing,
  handleGenerateMask,
  handleRemoveBackground,
  handleInvertSelection,
  handleResetMask,
  handleRedoImage,
  handleRemasterImage,
  mask,
  detectionMode,
  backgroundType,
  backgroundPrompt,
  isSelectionInverted,
  points,
  viewMode
}) => {
  return (
    <div style={{
      padding: '1rem',
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}>
      {/* Show processing controls when an image is being processed */}
      {currentImageBeingProcessed && !activeDisplayImage && (
        <>
          <button
            onClick={handleGenerateMask}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              backgroundColor: isProcessing ? '#F3F4F6' : '#abf134',
              color: isProcessing ? '#9CA3AF' : '#000000',
              borderRadius: '0.25rem',
              fontWeight: 500,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#9ed830';
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#abf134';
              }
            }}
          >
            {isProcessing 
              ? 'Processing...' 
              : detectionMode === 'auto' 
                ? 'Auto-Detect Subject' 
                : 'Generate Mask'
            }
            {detectionMode === 'auto' && <Zap style={{ width: '1rem', height: '1rem' }} />}
          </button>
          
          <button
            onClick={handleRemoveBackground}
            disabled={
              isProcessing || 
              !mask || 
              ((currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && 
              !(currentImageBeingProcessed?.backgroundPrompt || backgroundPrompt))
            }
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              backgroundColor: !mask || 
                isProcessing ||
                ((currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && 
                !(currentImageBeingProcessed?.backgroundPrompt || backgroundPrompt))
                ? '#F3F4F6' 
                : '#abf134',
              color: !mask || 
                isProcessing ||
                ((currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && 
                !(currentImageBeingProcessed?.backgroundPrompt || backgroundPrompt))
                ? '#9CA3AF' 
                : '#000000',
              borderRadius: '0.25rem',
              fontWeight: 500,
              cursor: !mask || 
                isProcessing ||
                ((currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && 
                !(currentImageBeingProcessed?.backgroundPrompt || backgroundPrompt))
                ? 'not-allowed' 
                : 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => {
              if (mask && 
                !isProcessing &&
                !((currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && 
                !(currentImageBeingProcessed?.backgroundPrompt || backgroundPrompt))) {
                e.currentTarget.style.backgroundColor = '#9ed830';
              }
            }}
            onMouseOut={(e) => {
              if (mask && 
                !isProcessing &&
                !((currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && 
                !(currentImageBeingProcessed?.backgroundPrompt || backgroundPrompt))) {
                e.currentTarget.style.backgroundColor = '#abf134';
              }
            }}
          >
            {isProcessing 
              ? 'Processing...' 
              : (currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' 
                ? 'Generate Background' 
                : 'Remove Background'
            }
            {(currentImageBeingProcessed?.backgroundType || backgroundType) === 'generative' && 
              <Wand2 style={{ width: '1rem', height: '1rem' }} />
            }
          </button>

          {detectionMode === "manual" && (
            <button
              onClick={handleInvertSelection}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#4B5563',
                backgroundColor: isSelectionInverted ? '#EDF2F7' : 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = isSelectionInverted ? '#E2E8F0' : '#F9FAFB'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = isSelectionInverted ? '#EDF2F7' : 'transparent'}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0" />
                <path d="M12 2a10 10 0 0 1 8 8" />
                <path d="M12 2v10l-8-8" />
              </svg>
              {isSelectionInverted ? 'Selection Inverted' : 'Inverse Selection'}
            </button>
          )}

          {(points.length > 0 || mask) && (
            <button
              onClick={handleResetMask}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#4B5563',
                backgroundColor: 'transparent',
                border: '1px solid #E5E7EB',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <RotateCcw style={{ width: '1rem', height: '1rem' }} />
              Reset Selection
            </button>
          )}
        </>
      )}
      
      {/* Show REDO and REMASTER buttons when viewing a completed image in canvas mode */}
      {activeDisplayImage && viewMode === 'canvas' && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem', 
          padding: '1rem',
          backgroundColor: '#F9FAFB',
          borderRadius: '0.25rem'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#000000',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            Not satisfied or want to enhance further?
          </h3>
          
          {/* Reprocess button (uses original image) */}
          <div>
            <button
              onClick={handleRedoImage}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: '#abf134',
                color: '#000000',
                borderRadius: '0.25rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#9ed830';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#abf134';
              }}
            >
              <RotateCcw style={{ width: '1rem', height: '1rem' }} />
              Reprocess (Original)
            </button>
            
            <p style={{
              fontSize: '0.75rem',
              color: '#6B7280',
              marginTop: '0.25rem',
              textAlign: 'center'
            }}>
              Start over with the original image
            </p>
          </div>
          
          {/* Remaster button (uses processed image) */}
          <div>
            <button
              onClick={handleRemasterImage}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: '#E0F2FE',
                color: '#0369A1',
                borderRadius: '0.25rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#BAE6FD';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#E0F2FE';
              }}
            >
              <RotateCw style={{ width: '1rem', height: '1rem' }} />
              Remaster (Processed)
            </button>
            
            <p style={{
              fontSize: '0.75rem',
              color: '#6B7280',
              marginTop: '0.25rem',
              textAlign: 'center'
            }}>
              Continue with the already processed image
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Current Processing Image Component
export const CurrentProcessingImage = ({ currentImageBeingProcessed }) => {
  if (!currentImageBeingProcessed) return null;
  
  return (
    <div style={{
      padding: '1rem',
      borderBottom: '1px solid #E5E7EB',
      backgroundColor: '#FAFAFA'
    }}>
      <h2 id="processing-title" className="section-title" style={{
        textTransform: 'uppercase',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#000000',
        marginBottom: '0.75rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }}>CURRENTLY PROCESSING</h2>
      
      <div style={{
        border: '1px solid #E5E7EB',
        borderRadius: '0.25rem',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'relative',
          height: '100px',
          width: '100%'
        }}>
          <img
            src={currentImageBeingProcessed.original}
            alt="Current image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to create success toast notification
export const showSuccessToast = (message) => {
  // Create a div for the success toast notification
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '1rem';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = '#D1FAE5';
  toast.style.color = '#065F46';
  toast.style.padding = '0.75rem 1rem';
  toast.style.borderRadius = '0.375rem';
  toast.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
  toast.style.zIndex = '60';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '0.5rem';
  toast.style.fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
  toast.style.width = 'auto';
  toast.style.maxWidth = '90%';
  
  // Add checkmark icon for success
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;
  
  // Add to the DOM
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
};