// pages/index.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import ImageUploader from '../components/ImageUploader';
import Editor from '../components/Editor';
import PowerPaintEditor from '../components/PowerPaintEditor';
import OutpaintEditor from '../components/OutpaintEditor';
import EnhanceEditor from '../components/Enhance_editor';
import ColorizationEditor from '../components/dd_editor';
import ArtEditor from '../components/ArtEditor';
import BlurEditor from '../components/BlurEditor';
import BackgroundRemovalEditor from '../components/BackgroundRemovalEditor';
import TokenStore from '../components/TokenStore';
import { LogOut, Coins, RefreshCw, AlertTriangle } from 'lucide-react';
import AuthComponent from '../components/AuthComponent';
import Head from 'next/head';
import AnimatedToolNavigation from '../components/AnimatedToolNavigation';
import ColorChangerEditor from '../components/ColorChangerEditor';
// Constants
const MAX_IMAGES = 10;

export default function Home() {
  const [view, setView] = useState('upload');
  const [currentImage, setCurrentImage] = useState(null);
  const [editorMode, setEditorMode] = useState('normal');
  const [imageQueue, setImageQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTokenStore, setShowTokenStore] = useState(false);
  const [processedImages, setProcessedImages] = useState([]);
  const [limitWarning, setLimitWarning] = useState(false);
  
  // Get auth context with refreshUserData function and verification status
  const { currentUser, logout, refreshUserData, verificationStage } = useAuth();

  // Client-side only code
  useEffect(() => {
    if (currentUser?.id) {
      refreshUserData();
    }
  }, []);

  // Add window focus listener to refresh tokens when the user returns to the tab
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side

    const handleFocus = () => {
      if (currentUser?.id) {
        refreshUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUser, refreshUserData]);

  // Modified handleImageUpload to enforce 10-image limit
  const handleImageUpload = (imageData) => {
    // Reset warning state
    setLimitWarning(false);
    
    // If imageData is an array (multiple images)
    if (Array.isArray(imageData)) {
      console.log("Uploading multiple images:", imageData.length);
      
      // Enforce the 10-image limit
      if (imageData.length > MAX_IMAGES) {
        console.warn(`Limiting to ${MAX_IMAGES} images. ${imageData.length - MAX_IMAGES} images were ignored.`);
        setLimitWarning(true);
        
        // Slice to only use the first 10 images
        const limitedImages = imageData.slice(0, MAX_IMAGES);
        setImageQueue(limitedImages);
        setCurrentImage(limitedImages);
      } else {
        // Use all images if under the limit
        setImageQueue(imageData);
        setCurrentImage(imageData);
      }
    } else {
      // Single image case - no need to enforce limit
      console.log("Uploading single image");
      setCurrentImage(imageData);
      setImageQueue([imageData]);
    }
    
    setCurrentIndex(0);
    setView('editor');
  };

  const handleReset = () => {
    setCurrentImage(null);
    setImageQueue([]);
    setCurrentIndex(0);
    setProcessedImages([]);
    setLimitWarning(false);
    setView('upload');
  };

  // Handle image completion (called when user finishes editing an image)
  const handleImageComplete = (finalImage) => {
    // Update the processed images array with the final edited image
    setProcessedImages(prev => {
      const updated = [...prev];
      updated[currentIndex] = finalImage;
      return updated;
    });

    // Move to the next image if available
    if (currentIndex < imageQueue.length - 1) {
      handleNextImage();
    }
  };

  const handleNextImage = () => {
    if (currentIndex < imageQueue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // If there's already a processed version, use it; otherwise use the original
      const nextImage = processedImages[nextIndex] || imageQueue[nextIndex];
      setCurrentImage(nextImage);
    }
  };

  const handlePreviousImage = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      // If there's already a processed version, use it; otherwise use the original
      const prevImage = processedImages[prevIndex] || imageQueue[prevIndex];
      setCurrentImage(prevImage);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    logout();
    handleReset();
  };

  // Toggle the token store visibility
  const toggleTokenStore = () => {
    // Refresh user data before showing token store
    if (!showTokenStore) {
      refreshUserData();
    }
    setShowTokenStore(!showTokenStore);
  };

  // Manually refresh tokens
  const handleRefreshTokens = async () => {
    await refreshUserData();
  };

  // If user is not logged in or verification is incomplete, show auth component
  if (!currentUser || verificationStage !== 'complete') {
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <title>InPaint - Image Editor</title>
        </Head>
        <div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
          <AuthComponent />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>InPaint - Image Editor</title>
      </Head>
      <div className="min-h-screen bg-white dark:bg-zinc-900 flex flex-col">
        {/* User info, tokens, and logout */}
        <div className="bg-white dark:bg-zinc-800 shadow-sm p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Signed in as: <span className="text-blue-600 dark:text-blue-400">{currentUser.email}</span>
            {currentUser.isGoogleUser && <span className="ml-2 text-xs text-green-500">(Google Account)</span>}
          </div>
          
          {/* Token display and buy button */}
          <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-4">
            <div className="flex items-center gap-1">
              <button 
                onClick={handleRefreshTokens}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Refresh token count"
              >
                <RefreshCw size={14} />
              </button>
              
              <div 
                className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-700 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-600 ml-1"
                onClick={toggleTokenStore}
              >
                <Coins size={16} className="text-yellow-500" />
                <span className="font-medium dark:text-white">{currentUser.tokens || 0}</span>
                <button className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded ml-1 hover:bg-blue-600">
                  Buy
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Warning message when images exceed limit */}
        {limitWarning && view === 'editor' && (
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 flex items-center gap-2">
            <AlertTriangle size={18} />
            <p className="text-sm">Only the first {MAX_IMAGES} images were processed. The maximum allowed is {MAX_IMAGES} images at a time.</p>
          </div>
        )}

        {view === 'upload' ? (
          <div className="flex-1">
            {/* Combined tool navigation component replaces both desktop and mobile menus */}
            <AnimatedToolNavigation editorMode={editorMode} setEditorMode={setEditorMode} />

            {/* Increased top padding from pt-6 to pt-16 for mobile and from md:pt-2 to md:pt-10 for medium screens */}
            <div className="px-4 pt-16 md:pt-10">
  <ImageUploader onImageUpload={handleImageUpload} editorMode={editorMode} />
</div>
          </div>
        ) : (
          <div className="flex-1">
            {editorMode === 'normal' && (
              <Editor 
                initialImage={currentImage} 
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
            {editorMode === 'powerpaint' && (
              <PowerPaintEditor 
                initialImage={currentImage} 
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
            {/* Other editor modes remain unchanged */}
            {editorMode === 'outpaint' && (
              <OutpaintEditor 
                initialImage={currentImage} 
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
            {editorMode === 'enhance' && (
              <EnhanceEditor 
                initialImage={currentImage} 
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
            {editorMode === 'colorize' && (
              <ColorizationEditor 
                initialImage={currentImage} 
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
            {editorMode === 'art' && (
              <ColorChangerEditor 
                initialImage={currentImage} 
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
            {editorMode === 'blur' && (
              <BlurEditor 
                initialImage={currentImage} 
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
            {editorMode === 'background-removal' && (
              <BackgroundRemovalEditor
                initialImage={currentImage}
                onReset={handleReset}
                imageIndex={currentIndex}
                totalImages={imageQueue.length}
                onImageComplete={handleImageComplete}
                onNextImage={handleNextImage}
                onPreviousImage={handlePreviousImage}
                isBulkMode={imageQueue.length > 1}
                onOpenTokenStore={toggleTokenStore}
                userTokens={currentUser.tokens || 0}
                refreshTokens={refreshUserData}
              />
            )}
          </div>
        )}
        
        {/* Token Store Modal */}
        {showTokenStore && <TokenStore onClose={toggleTokenStore} />}
      </div>
    </>
  );
}