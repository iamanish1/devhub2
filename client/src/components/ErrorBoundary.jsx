import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Here you could also log to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#1E1E1E] rounded-lg p-6 shadow-lg border border-red-500/20">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-400 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Refresh Page
                </button>
                
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-300"
                >
                  Try Again
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-[#2A2A2A] rounded text-xs text-red-400 overflow-auto max-h-40">
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                    <pre className="mt-2 text-gray-400">
                      {this.state.errorInfo.componentStack}
                    </pre>
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
