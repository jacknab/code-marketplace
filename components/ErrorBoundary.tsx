'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      
      try {
        // Check if it's a Firestore error we threw
        const errorInfo = JSON.parse(this.state.error?.message || "");
        if (errorInfo.error && errorInfo.operationType) {
          displayMessage = `Database Error: ${errorInfo.error} during ${errorInfo.operationType}. Path: ${errorInfo.path || 'unknown'}`;
        }
      } catch {
        displayMessage = this.state.error?.message || displayMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-app p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-border-main shadow-xl text-center">
            <h2 className="text-2xl font-bold text-text-main mb-4 italic">Error Encountered</h2>
            <p className="text-text-muted mb-6">{displayMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-dark transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
