import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateEnvironment, getEnvVar, isDevelopment, isProduction } from '../../utils/envValidation'

describe('envValidation', () => {
  let originalEnv

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...import.meta.env }
    
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv)
    
    // Restore console methods
    console.error.mockRestore()
    console.warn.mockRestore()
  })

  describe('validateEnvironment', () => {
    it('should return valid when all required env vars are set', () => {
      // Set all required environment variables
      Object.assign(import.meta.env, {
        VITE_API_URL: 'http://localhost:8000',
        VITE_SOCKET_SERVER: 'http://localhost:8000',
        VITE_FIREBASE_API_KEY: 'test-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef',
        VITE_RAZORPAY_KEY_ID: 'test-razorpay-key'
      })

      const result = validateEnvironment()
      
      expect(result.isValid).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('should return invalid when required env vars are missing', () => {
      // Clear all environment variables
      Object.keys(import.meta.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          delete import.meta.env[key]
        }
      })

      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.missing.length).toBeGreaterThan(0)
      expect(console.error).toHaveBeenCalled()
    })

    it('should identify specific missing variables', () => {
      // Set only some required variables
      Object.assign(import.meta.env, {
        VITE_API_URL: 'http://localhost:8000',
        VITE_SOCKET_SERVER: 'http://localhost:8000',
        // Missing Firebase variables
        // Missing Razorpay variable
      })

      const result = validateEnvironment()
      
      expect(result.isValid).toBe(false)
      expect(result.missing.some(item => item.key === 'VITE_FIREBASE_API_KEY')).toBe(true)
      expect(result.missing.some(item => item.key === 'VITE_RAZORPAY_KEY_ID')).toBe(true)
    })

    it('should warn about missing optional variables in development', () => {
      import.meta.env.MODE = 'development'
      
      // Clear optional variables
      delete import.meta.env.VITE_APP_NAME
      delete import.meta.env.VITE_APP_VERSION

      const result = validateEnvironment()
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(console.warn).toHaveBeenCalled()
    })

    it('should not warn about missing optional variables in production', () => {
      import.meta.env.MODE = 'production'
      
      // Clear optional variables
      delete import.meta.env.VITE_APP_NAME
      delete import.meta.env.VITE_APP_VERSION

      const result = validateEnvironment()
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('getEnvVar', () => {
    it('should return environment variable value', () => {
      import.meta.env.VITE_TEST_VAR = 'test-value'
      
      const result = getEnvVar('VITE_TEST_VAR')
      
      expect(result).toBe('test-value')
    })

    it('should return default value when env var is not set', () => {
      delete import.meta.env.VITE_TEST_VAR
      
      const result = getEnvVar('VITE_TEST_VAR', 'default-value')
      
      expect(result).toBe('default-value')
    })

    it('should return null when env var is not set and no default provided', () => {
      delete import.meta.env.VITE_TEST_VAR
      
      const result = getEnvVar('VITE_TEST_VAR')
      
      expect(result).toBe(null)
      expect(console.warn).toHaveBeenCalledWith('Environment variable VITE_TEST_VAR is not set')
    })

    it('should return null for empty string values', () => {
      import.meta.env.VITE_TEST_VAR = ''
      
      const result = getEnvVar('VITE_TEST_VAR')
      
      expect(result).toBe(null)
    })

    it('should return null for whitespace-only values', () => {
      import.meta.env.VITE_TEST_VAR = '   '
      
      const result = getEnvVar('VITE_TEST_VAR')
      
      expect(result).toBe(null)
    })
  })

  describe('environment mode helpers', () => {
    it('should detect development mode', () => {
      import.meta.env.MODE = 'development'
      
      expect(isDevelopment()).toBe(true)
      expect(isProduction()).toBe(false)
    })

    it('should detect production mode', () => {
      import.meta.env.MODE = 'production'
      
      expect(isDevelopment()).toBe(false)
      expect(isProduction()).toBe(true)
    })
  })
})
