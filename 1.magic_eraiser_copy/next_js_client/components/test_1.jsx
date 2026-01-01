// test_1.jsx - Focus on the color issue rather than font weight
import React, { useState } from 'react';
import { X } from 'lucide-react';

// The updated panel component focusing on color
const ColorFixPanel = ({ title, onClose }) => {
  return (
    <div 
      className="fixed bg-white rounded-lg shadow-lg border border-gray-100 z-50 w-64"
      style={{ 
        left: `${Math.round(100)}px`, 
        top: `${Math.round(100)}px`,
        transform: 'none',
        transition: 'none',
        animation: 'none',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility'
      }}
    >
      <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* The key issue might be color rather than font-weight */}
          <div className="text-gray-600">Undo</div>
          <div style={{ color: '#000000' }}>Ctrl/Cmd + Z</div>
          
          <div className="text-gray-600">Redo</div>
          <div style={{ color: '#000000' }}>Ctrl/Cmd + Y</div>
          
          <div className="text-gray-600">Toggle History</div>
          <div style={{ color: '#000000' }}>H</div>
          
          <div className="text-gray-600">Lock/Unlock Canvas</div>
          <div style={{ color: '#000000' }}>L</div>
          
          <div className="text-gray-600">Toggle Original View</div>
          <div style={{ color: '#000000' }}>O</div>
        </div>
      </div>
    </div>
  );
};

// Main test component
const TestPanels = () => {
  const [showPanel, setShowPanel] = useState(true);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-6">Color Fix Solution</h1>
        <p className="mb-8 text-gray-600">This focuses on fixing the color rather than font-weight</p>
        
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setShowPanel(!showPanel)}
        >
          {showPanel ? 'Hide Panel' : 'Show Panel'}
        </button>
      </div>
      
      {showPanel && (
        <ColorFixPanel 
          title="Color Fix Solution" 
          onClose={() => setShowPanel(false)} 
        />
      )}
      
      <div className="fixed bottom-4 left-4 p-4 bg-white shadow-lg rounded-lg border border-gray-200 max-w-md">
        <h3 className="font-bold mb-2">Focus on Color</h3>
        <p className="mb-2">Looking at your screenshot more carefully, the issue might be text color rather than font-weight.</p>
        <p>This test applies <code>color: '#000000'</code> to the shortcut keys to make them solid black.</p>
      </div>
    </div>
  );
};

export default TestPanels;