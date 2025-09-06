import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log component-specific errors
    console.error('Component Error:', {
      component: this.props.componentName || 'Unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  }

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state;
      const { fallback: FallbackComponent, componentName } = this.props;
      
      // Use custom fallback if provided
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error} onRetry={this.handleRetry} />;
      }
      
      // Default fallback UI
      return (
        <div className="bg-[#1E1E1E] border border-red-500/20 rounded-lg p-4 m-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-red-400 w-5 h-5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">
                {componentName ? `${componentName} Error` : 'Component Error'}
              </h3>
              <p className="text-gray-400 text-sm">
                This component encountered an error and couldn't render properly.
              </p>
            </div>
          </div>
          
          <button
            onClick={this.handleRetry}
            className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry {retryCount > 0 && `(${retryCount})`}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
