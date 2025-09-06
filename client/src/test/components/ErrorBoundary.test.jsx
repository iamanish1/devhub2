import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../../components/ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument()
  })

  it('shows error ID when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
  })

  it('has retry functionality', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const retryButton = screen.getByText('Try Again')
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    
    // After retry, the error boundary should reset
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('has go home functionality', () => {
    // Mock window.location.href
    delete window.location
    window.location = { href: '' }
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const goHomeButton = screen.getByText('Go Home')
    expect(goHomeButton).toBeInTheDocument()
    
    fireEvent.click(goHomeButton)
    
    expect(window.location.href).toBe('/')
  })

  it('has refresh page functionality', () => {
    // Mock window.location.reload
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const refreshButton = screen.getByText('Refresh Page')
    expect(refreshButton).toBeInTheDocument()
    
    fireEvent.click(refreshButton)
    
    expect(mockReload).toHaveBeenCalled()
  })

  it('shows error details in development mode', () => {
    // Mock development mode
    const originalMode = import.meta.env.MODE
    import.meta.env.MODE = 'development'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()
    
    // Restore original mode
    import.meta.env.MODE = originalMode
  })

  it('does not show error details in production mode', () => {
    // Mock production mode
    const originalMode = import.meta.env.MODE
    import.meta.env.MODE = 'production'
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument()
    
    // Restore original mode
    import.meta.env.MODE = originalMode
  })
})
