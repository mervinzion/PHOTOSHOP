import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, ArrowLeft, X, Plus, 
  ZoomIn, ZoomOut, Home,
  RotateCcw, RotateCw, Sliders
} from 'lucide-react';

// ===============================
// Style Injector Component
// ===============================
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
      body {
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

// ===============================
// Haptic Feedback Service
// ===============================
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

// ===============================
// Toast Notification Component
// ===============================
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
        <button onClick={onDismiss} style={{ color: 'inherit', backgroundColor: 'transparent', border: 'none' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// ===============================
// Mobile Dialog Component 
// ===============================
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
          <button onClick={onClose} style={{ color: '#6B7280', backgroundColor: 'transparent', border: 'none' }}>
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
              fontSize: '0.875rem',
              backgroundColor: 'transparent'
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

// ===============================
// Mobile Compare Slider
// ===============================
export const CompareSlider = ({ originalImage, processedImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);
  
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
      if (Math.abs(newPosition - sliderPosition) > 5) {
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

// ===============================
// QuickBall (Floating Action Button)
// ===============================
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

// ===============================
// Mobile Zoom Controls
// ===============================
export const MobileZoomControls = ({ zoomLevel, resetZoom, increaseZoom, decreaseZoom, viewMode, activeDisplayImage }) => {
  if (activeDisplayImage && activeDisplayImage.processed && viewMode === 'canvas') return null;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '1rem',
      right: '1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '9999px',
      padding: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 30
    }}>
      <button 
        onClick={decreaseZoom}
        disabled={zoomLevel <= 1}
        style={{
          color: 'white',
          opacity: zoomLevel <= 1 ? 0.5 : 1,
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: 'none'
        }}
      >
        <ZoomOut size={18} />
      </button>
      
      <button
        onClick={resetZoom}
        style={{
          color: 'white',
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: 'none'
        }}
      >
        <Home size={18} />
      </button>
      
      <button
        onClick={increaseZoom}
        disabled={zoomLevel >= 3}
        style={{
          color: 'white',
          opacity: zoomLevel >= 3 ? 0.5 : 1,
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: 'none'
        }}
      >
        <ZoomIn size={18} />
      </button>
    </div>
  );
};

// NEW COMPONENTS FOR UPDATED FEATURES

// ===============================
// Mobile Action Sheet Component
// ===============================
export const MobileActionSheet = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      zIndex: 50
    }} onClick={onClose}>
      <div 
        style={{
          backgroundColor: 'white',
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem',
          padding: '1rem',
          animation: 'slide-up 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: '2rem',
          height: '0.25rem',
          backgroundColor: '#E5E7EB',
          borderRadius: '9999px',
          margin: '0 auto 1rem auto'
        }}></div>
        
        {children}
      </div>
    </div>
  );
};

// ===============================
// Mobile Results Preview Component
// ===============================
export const MobileResultsPreview = ({ 
  processedImage, 
  originalImage,
  onReprocess,
  onRemaster,
  onDownload,
  onClose
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '75vh'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 500
        }}>Result Preview</h3>
        <button 
          onClick={onClose}
          style={{
            color: '#6B7280',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '0.5rem'
          }}
        >
          <X size={20} />
        </button>
      </div>
      
      <div style={{
        flex: 1,
        position: 'relative',
        marginBottom: '1rem',
        backgroundColor: '#F9FAFB',
        borderRadius: '0.5rem',
        overflow: 'hidden'
      }}>
        <CompareSlider 
          originalImage={originalImage}
          processedImage={processedImage}
        />
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <button
          onClick={onDownload}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.875rem',
            backgroundColor: '#abf134',
            color: '#000000',
            borderRadius: '0.5rem',
            fontWeight: 600,
            border: 'none'
          }}
        >
          <Download size={20} />
          Download Result
        </button>
        
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onReprocess}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '0.5rem',
              fontWeight: 600,
              border: 'none'
            }}
          >
            <RotateCcw size={18} />
            Reprocess
          </button>
          
          <button
            onClick={onRemaster}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.875rem',
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              borderRadius: '0.5rem',
              fontWeight: 600,
              border: 'none'
            }}
          >
            <RotateCw size={18} />
            Remaster
          </button>
        </div>
      </div>
    </div>
  );
};

// ===============================
// Mobile Inverse Selection Button
// ===============================
export const InverseSelectionButton = ({ isInverted, onToggle }) => {
  return (
    <button
      onClick={() => {
        onToggle();
        Haptics.impact('medium');
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        backgroundColor: isInverted ? '#EDF2F7' : 'white',
        color: '#4B5563',
        border: '1px solid #E5E7EB',
        borderRadius: '0.375rem',
        fontWeight: 500,
        fontSize: '0.875rem'
      }}
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
      {isInverted ? 'Selection Inverted' : 'Inverse Selection'}
    </button>
  );
};

// ===============================
// Utility Functions
// ===============================

// Convert hex color to RGB array
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