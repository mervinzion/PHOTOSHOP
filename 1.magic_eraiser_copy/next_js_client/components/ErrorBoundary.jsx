// components/ErrorBoundary.jsx
import React, { Component } from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    // Simple retry - reload the page
    window.location.reload();
  }

  handleGoHome = () => {
    // Navigate to home/login page
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a network error
      const isNetworkError = this.state.error && (
        this.state.error.message.includes("Failed to fetch") ||
        this.state.error.message.includes("NetworkError") ||
        this.state.error.message.includes("Cannot connect to") ||
        this.state.error.message.includes("Network error")
      );

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-zinc-900">
          <div className="w-full max-w-md p-6 rounded-xl shadow-lg bg-white dark:bg-zinc-800">
            <div className="text-center mb-6">
              {isNetworkError ? (
                <div className="w-12 h-12 mx-auto mb-4 text-red-500">
                  <WifiOff size={48} />
                </div>
              ) : (
                <div className="w-12 h-12 mx-auto mb-4 text-amber-500">
                  <AlertTriangle size={48} />
                </div>
              )}
              
              <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {isNetworkError ? "Connection Error" : "Something went wrong"}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {isNetworkError 
                  ? "We couldn't connect to the server. Please check your internet connection or try again later."
                  : this.state.error?.message || "An unexpected error occurred."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Go to Login
                </button>
              </div>
            </div>
            
            {/* Show error details in development environment only */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-100 dark:bg-zinc-700 rounded-md overflow-auto max-h-64 text-xs">
                <details>
                  <summary className="font-medium cursor-pointer mb-2 text-gray-600 dark:text-gray-300">
                    Error Details (Development Only)
                  </summary>
                  <p className="text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {this.state.error?.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <p className="text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;