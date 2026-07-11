import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            padding: '40px 24px',
            maxWidth: '480px',
            margin: '80px auto',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px'
          }}
        >
          <h2 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Something went wrong</h2>
          <p style={{ color: 'var(--text-2)', marginBottom: '24px', fontSize: '14px' }}>
            The application encountered an unexpected runtime error. We have logged the technical details.
          </p>
          <pre 
            style={{
              background: 'var(--bg)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'left',
              color: 'var(--text-2)',
              overflowX: 'auto',
              marginBottom: '24px'
            }}
          >
            {this.state.error?.message}
          </pre>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Reload CivicPulse
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
