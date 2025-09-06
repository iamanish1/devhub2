import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLoadingState, useMultipleLoadingStates, useDebouncedLoading } from '../../hooks/useLoadingState'

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useLoadingState())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toBe(null)
  })

  it('should initialize with custom state', () => {
    const { result } = renderHook(() => useLoadingState(true))
    
    expect(result.current.isLoading).toBe(true)
  })

  it('should start and stop loading', () => {
    const { result } = renderHook(() => useLoadingState())
    
    act(() => {
      result.current.startLoading()
    })
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
    
    act(() => {
      result.current.stopLoading('test data')
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe('test data')
  })

  it('should handle errors', () => {
    const { result } = renderHook(() => useLoadingState())
    const testError = new Error('Test error')
    
    act(() => {
      result.current.startLoading()
    })
    
    act(() => {
      result.current.stopLoading(null, testError)
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(testError)
  })

  it('should execute async function successfully', async () => {
    const { result } = renderHook(() => useLoadingState())
    const mockAsyncFn = vi.fn().mockResolvedValue('success')
    
    let asyncResult
    await act(async () => {
      asyncResult = await result.current.executeAsync(mockAsyncFn, { context: 'test' })
    })
    
    expect(mockAsyncFn).toHaveBeenCalled()
    expect(asyncResult).toBe('success')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBe('success')
    expect(result.current.error).toBe(null)
  })

  it('should handle async function errors', async () => {
    const { result } = renderHook(() => useLoadingState())
    const testError = new Error('Async error')
    const mockAsyncFn = vi.fn().mockRejectedValue(testError)
    
    await act(async () => {
      try {
        await result.current.executeAsync(mockAsyncFn, { context: 'test' })
      } catch (error) {
        // Expected to throw
      }
    })
    
    expect(mockAsyncFn).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(testError)
  })

  it('should timeout after 30 seconds', () => {
    const { result } = renderHook(() => useLoadingState())
    
    act(() => {
      result.current.startLoading()
    })
    
    expect(result.current.isLoading).toBe(true)
    
    // Fast-forward time by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000)
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error.message).toBe('Request timed out. Please try again.')
  })

  it('should reset state', () => {
    const { result } = renderHook(() => useLoadingState())
    
    act(() => {
      result.current.startLoading()
    })
    
    act(() => {
      result.current.stopLoading('test data', new Error('test error'))
    })
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.data).toBe(null)
  })
})

describe('useMultipleLoadingStates', () => {
  it('should initialize multiple states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates(['state1', 'state2']))
    
    expect(result.current.states.state1.isLoading).toBe(false)
    expect(result.current.states.state2.isLoading).toBe(false)
  })

  it('should manage individual states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates(['state1', 'state2']))
    
    act(() => {
      result.current.startLoading('state1')
    })
    
    expect(result.current.states.state1.isLoading).toBe(true)
    expect(result.current.states.state2.isLoading).toBe(false)
    
    act(() => {
      result.current.stopLoading('state1', 'data1')
    })
    
    expect(result.current.states.state1.isLoading).toBe(false)
    expect(result.current.states.state1.data).toBe('data1')
  })

  it('should reset all states', () => {
    const { result } = renderHook(() => useMultipleLoadingStates(['state1', 'state2']))
    
    act(() => {
      result.current.startLoading('state1')
      result.current.startLoading('state2')
    })
    
    act(() => {
      result.current.resetAllStates()
    })
    
    expect(result.current.states.state1.isLoading).toBe(false)
    expect(result.current.states.state2.isLoading).toBe(false)
  })
})

describe('useDebouncedLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce loading indicator', () => {
    const { result } = renderHook(() => useDebouncedLoading(300))
    
    act(() => {
      result.current.startLoading()
    })
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.showLoading).toBe(false)
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    expect(result.current.showLoading).toBe(true)
  })

  it('should stop loading immediately', () => {
    const { result } = renderHook(() => useDebouncedLoading(300))
    
    act(() => {
      result.current.startLoading()
    })
    
    act(() => {
      vi.advanceTimersByTime(150)
    })
    
    act(() => {
      result.current.stopLoading()
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.showLoading).toBe(false)
  })
})
