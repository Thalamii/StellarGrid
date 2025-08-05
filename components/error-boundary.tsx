"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle } from "lucide-react"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Game Error:', error, errorInfo)
    
    // Report to analytics/monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error reporting service here
      // e.g., Sentry, LogRocket, etc.
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    
    // Clear any corrupted localStorage data
    try {
      const keysToPreserve = ['wordgrid_stats'] // Keep user stats
      const allKeys = Object.keys(localStorage)
      
      allKeys.forEach(key => {
        if (!keysToPreserve.includes(key) && key.startsWith('wordgrid')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('Failed to clean localStorage:', e)
    }
    
    // Force refresh after cleanup
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="neomorphic-large p-8 bg-white">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                Don't worry, your game progress is safe. Let's get you back to playing!
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={this.handleReset}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Game
                </Button>
                
                <p className="text-sm text-gray-500">
                  This will clear temporary data but preserve your stats
                </p>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Error Details (Dev)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
