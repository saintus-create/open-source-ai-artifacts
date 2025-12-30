'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex justify-center items-center bg-background min-h-screen">
          <div className="space-y-6 w-full max-w-md">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                We&apos;re sorry, but something unexpected happened. Please try again.
              </AlertDescription>
            </Alert>
            
            <p className="mb-4 text-muted-foreground">
              It&apos;s not you, it&apos;s us. We encountered an unexpected error.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={this.handleRetry}
                className="w-full"
              >
                <RefreshCw className="mr-2 w-4 h-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="text-muted-foreground text-sm cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="bg-muted mt-2 p-4 rounded-md overflow-auto text-sm">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for programmatic error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const resetError = () => setError(null)
  
  const handleError = (error: Error) => {
    setError(error)
    console.error('Handled error:', error)
  }
  
  return { error, handleError, resetError }
}