// Updated App.jsx with direct token fetching
import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Editor from './components/Editor';
import PowerPaintEditor from './components/PowerPaintEditor';
import OutpaintEditor from './components/OutpaintEditor';
import EnhanceEditor from './components/Enhance_editor';
import ColorizationEditor from './components/dd_editor';
import ArtEditor from './components/ArtEditor';
import BlurEditor from './components/BlurEditor';
import BackgroundRemovalEditor from './components/BackgroundRemovalEditor';
import TokenStore from './components/TokenStore';
import { ArrowLeft, ChevronLeft, ChevronRight, LogOut, Coins, RefreshCw } from 'lucide-react';
import AuthComponent from './components/AuthComponent';
import { AuthProvider, useAuth } from './components/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Your Google Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "Replace_with_your_client_id.apps.googleusercontent.com";

// Wrap the main App component with AuthProvider and GoogleOAuthProvider
export default function AppWithAuth() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function App() {
  const [view, setView] = useState('upload');
  const [currentImage, setCurrentImage] = useState(null);
  const [editorMode, setEditorMode] = useState('normal');
  const [imageQueue, setImageQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Add state for TokenStore visibility
  const [showTokenStore, setShowTokenStore] = useState(false);
  
  // Track the processed images (with their edits)
  const [processedImages, setProcessedImages] = useState([]);
  
  // Get auth context with refreshUserData function
  const { currentUser, logout, refreshUserData } = useAuth();

  // Refresh user data (including tokens) every time the component mounts
  // and when the user returns to the app
  useEffect(() => {
    if (currentUser?.id) {
      refreshUserData();
    }
  }, []);

  // Add window focus listener to refresh tokens when the user returns to the tab
  useEffect(() => {
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

  const handleImageUpload = (imageData) => {
    // If imageData is an array (multiple images)
    if (Array.isArray(imageData)) {
      console.log("Uploading multiple images:", imageData.length);
      setImageQueue(imageData);
      setCurrentImage(imageData);  // Pass the entire array to Editor
    } else {
      // Single image case
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

  // If user is not logged in, show auth component
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <AuthComponent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* User info, tokens, and logout */}
      <div className="bg-white shadow-sm p-3 flex justify-between items-center">
        <div className="text-sm font-medium text-gray-600">
          Signed in as: <span className="text-blue-600">{currentUser.email}</span>
          {currentUser.isGoogleUser && <span className="ml-2 text-xs text-green-500">(Google Account)</span>}
        </div>
        
        {/* Token display and buy button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button 
              onClick={handleRefreshTokens}
              className="text-gray-400 hover:text-gray-600"
              title="Refresh token count"
            >
              <RefreshCw size={14} />
            </button>
            
            <div 
              className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-200 ml-1"
              onClick={toggleTokenStore}
            >
              <Coins size={16} className="text-yellow-500" />
              <span className="font-medium">{currentUser.tokens || 0}</span>
              <button className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded ml-1 hover:bg-blue-600">
                Buy
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {view === 'upload' ? (
        <div>
          {/* Mode Selection */}
          <div className="flex justify-center pt-8 pb-6 overflow-x-auto">
            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
              <button
                onClick={() => setEditorMode('normal')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'normal'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Normal Mode
              </button>
              <button
                onClick={() => setEditorMode('powerpaint')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'powerpaint'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                PowerPaint Mode
              </button>
              <button
                onClick={() => setEditorMode('outpaint')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'outpaint'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Outpaint Mode
              </button>
              <button
                onClick={() => setEditorMode('enhance')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'enhance'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Enhance Mode
              </button>
              <button
                onClick={() => setEditorMode('colorize')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'colorize'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Colorize Mode
              </button>
              <button
                onClick={() => setEditorMode('art')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'art'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Art Mode
              </button>
              <button
                onClick={() => setEditorMode('blur')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'blur'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Blur Mode
              </button>
              <button
                onClick={() => setEditorMode('background-removal')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  editorMode === 'background-removal'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Remove Background
              </button>
            </div>
          </div>
          <ImageUploader onImageUpload={handleImageUpload} />
        </div>
      ) : (
        <>
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
            <ArtEditor 
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
        </>
      )}
      
      {/* Token Store Modal */}
      {showTokenStore && <TokenStore onClose={toggleTokenStore} />}
    </div>
  );
}