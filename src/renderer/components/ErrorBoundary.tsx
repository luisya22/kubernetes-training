import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error details for debugging
    this.logError(error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    // In production, this could send to an error tracking service
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error Details:', errorDetails);
  }

  handleReset = () => {
    // Call parent's onReset if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    // Reload the entire application
    window.location.reload();
  };

  private getErrorCategory(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('kubernetes') || message.includes('cluster')) {
      return 'kubernetes';
    }
    if (message.includes('docker')) {
      return 'docker';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('axios')) {
      return 'network';
    }
    if (message.includes('validation')) {
      return 'validation';
    }
    
    return 'unknown';
  }

  private getRecoverySuggestions(error: Error): string[] {
    const category = this.getErrorCategory(error);
    
    switch (category) {
      case 'kubernetes':
        return [
          'Ensure your Kubernetes cluster is running',
          'Verify kubectl is configured: kubectl cluster-info',
          'Check your kubeconfig file'
        ];
      
      case 'docker':
        return [
          'Ensure Docker is running',
          'Verify Docker daemon: docker ps',
          'Restart Docker Desktop if needed'
        ];
      
      case 'network':
        return [
          'Check your internet connection',
          'Verify firewall settings',
          'Try again in a moment'
        ];
      
      case 'validation':
        return [
          'Review the validation requirements',
          'Check that all prerequisites are met',
          'Try the validation again'
        ];
      
      default:
        return [
          'Try refreshing the application',
          'Check the console for more details',
          'Contact support if the issue persists'
        ];
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const suggestions = this.state.error ? this.getRecoverySuggestions(this.state.error) : [];
      const showReloadOption = this.state.errorCount > 1;

      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#f44336', marginBottom: '20px' }}>
            Something went wrong
          </h2>
          
          <div style={{
            backgroundColor: '#ffebee',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
            
            {suggestions.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  💡 Suggestions:
                </p>
                <ul style={{ marginLeft: '20px' }}>
                  {suggestions.map((suggestion, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px', fontWeight: 'bold' }}>
                  Stack Trace (Development Only)
                </summary>
                <pre style={{
                  backgroundColor: '#fff',
                  padding: '10px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                  maxHeight: '300px'
                }}>
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Try Again
            </button>
            
            {showReloadOption && (
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Reload Application
              </button>
            )}
          </div>
          
          {showReloadOption && (
            <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
              Multiple errors detected. Reloading may help resolve the issue.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

