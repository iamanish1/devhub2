import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    MODE: 'test',
    VITE_API_URL: 'http://localhost:8000',
    VITE_SOCKET_SERVER: 'http://localhost:8000',
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef',
    VITE_RAZORPAY_KEY_ID: 'test-razorpay-key'
  },
  writable: true
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
globalThis.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
globalThis.sessionStorage = sessionStorageMock

// Mock fetch
globalThis.fetch = vi.fn()

// Mock console methods in test environment
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks()
  
  // Suppress console errors and warnings in tests unless explicitly testing them
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterEach(() => {
  // Restore console methods after each test
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})
