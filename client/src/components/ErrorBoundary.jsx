import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId
    });
    
    // Log error to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Log error to external service in production
    this.logErrorToService(error, errorInfo, errorId);
  }

  logErrorToService = (error, errorInfo, errorId) => {
    // In production, you would send this to your error tracking service
    // For now, we'll just log it with more context
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };
    
    console.error('Error Report:', errorData);
    
    // You can integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: errorData });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  }

  handleGoHome = () => {
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId, retryCount } = this.state;
      const isDevelopment = import.meta.env.MODE === 'development';
      
      return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#1E1E1E] rounded-lg p-6 shadow-lg border border-red-500/20">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="text-red-400 w-16 h-16" />
              </div>
              
              <h1 className="text-xl font-bold text-white mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-400 mb-4">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {errorId && (
                <p className="text-xs text-gray-500 mb-6">
                  Error ID: {errorId}
                </p>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {retryCount > 0 && `(${retryCount})`}
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-300"
                >
                  Refresh Page
                </button>
              </div>

              {isDevelopment && error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-[#2A2A2A] rounded text-xs text-red-400 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.toString()}
                    </div>
                    {error.stack && (
                      <div className="mb-2">
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-gray-300 whitespace-pre-wrap">{error.stack}</pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-gray-300 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
