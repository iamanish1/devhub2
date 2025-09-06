
import { useEffect } from 'react'
import AppRoutes from "./routes/Routes"
import { AuthProvider } from "./context/AuthContext"
import { PaymentProvider } from "./context/PaymentContext"
import ErrorBoundary from "./components/ErrorBoundary"
import { Toaster } from 'react-hot-toast'
import { initializePerformanceMonitoring } from './utils/performanceMonitoring'
import { mobileForms } from './utils/mobileOptimization'

function App() {
  useEffect(() => {
    // Initialize performance monitoring
    initializePerformanceMonitoring()
    
    // Initialize mobile optimizations
    mobileForms.preventZoom()
    
    // Cleanup on unmount
    return () => {
      mobileForms.restoreZoom()
    }
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PaymentProvider>
          <AppRoutes/>   
        </PaymentProvider>
      </AuthProvider>
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
