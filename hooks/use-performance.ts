"use client"

import { useCallback, useEffect, useRef } from 'react'

interface PerformanceMetrics {
  renderTime: number
  interactionDelay: number
  memoryUsage?: number
}

interface PerformanceHookReturn {
  measureRender: (componentName: string) => () => void
  measureInteraction: (actionName: string) => () => void
  getMetrics: () => PerformanceMetrics | null
}

export function usePerformance(): PerformanceHookReturn {
  const metricsRef = useRef<Map<string, number>>(new Map())
  const renderStartRef = useRef<number>(0)

  const measureRender = useCallback((componentName: string) => {
    renderStartRef.current = performance.now()
    
    return () => {
      const renderTime = performance.now() - renderStartRef.current
      metricsRef.current.set(`render_${componentName}`, renderTime)
      
      // Warn about slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [])

  const measureInteraction = useCallback((actionName: string) => {
    const startTime = performance.now()
    
    return () => {
      const interactionTime = performance.now() - startTime
      metricsRef.current.set(`interaction_${actionName}`, interactionTime)
      
      // Warn about slow interactions
      if (process.env.NODE_ENV === 'development' && interactionTime > 100) {
        console.warn(`Slow interaction: ${actionName} took ${interactionTime.toFixed(2)}ms`)
      }
    }
  }, [])

  const getMetrics = useCallback((): PerformanceMetrics | null => {
    const metrics = metricsRef.current
    if (metrics.size === 0) return null

    // Calculate averages
    const renderTimes = Array.from(metrics.entries())
      .filter(([key]) => key.startsWith('render_'))
      .map(([, value]) => value)
    
    const interactionTimes = Array.from(metrics.entries())
      .filter(([key]) => key.startsWith('interaction_'))
      .map(([, value]) => value)

    const avgRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
      : 0

    const avgInteractionTime = interactionTimes.length > 0
      ? interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length
      : 0

    // Get memory usage if available
    let memoryUsage: number | undefined
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024) // Convert to MB
    }

    return {
      renderTime: avgRenderTime,
      interactionDelay: avgInteractionTime,
      memoryUsage
    }
  }, [])

  // Monitor FPS and long tasks
  useEffect(() => {
    if (typeof window === 'undefined') return

    let frameCount = 0
    let lastTime = performance.now()
    
    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        if (process.env.NODE_ENV === 'development' && fps < 30) {
          console.warn(`Low FPS detected: ${fps}fps`)
        }
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }

    const rafId = requestAnimationFrame(measureFPS)

    // Monitor long tasks if supported
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`)
            }
          }
        })
        
        observer.observe({ entryTypes: ['longtask'] })
        
        return () => {
          observer.disconnect()
          cancelAnimationFrame(rafId)
        }
      } catch (e) {
        // PerformanceObserver not supported
        return () => cancelAnimationFrame(rafId)
      }
    }

    return () => cancelAnimationFrame(rafId)
  }, [])

  return {
    measureRender,
    measureInteraction,
    getMetrics
  }
}
