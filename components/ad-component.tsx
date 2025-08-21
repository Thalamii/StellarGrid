"use client"

import { useEffect, useRef } from 'react'

interface AdComponentProps {
  className?: string
}

export function AdComponent({ className }: AdComponentProps) {
  const adContainerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    // Only load the ad script once
    if (scriptLoadedRef.current || !adContainerRef.current) return

    try {
      // Set up the ad options
      ;(window as any).atOptions = {
        'key': 'a063a148873a7165bbb1e88930449b1b',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      }

      // Create and append the ad script
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = '//www.highperformanceformat.com/a063a148873a7165bbb1e88930449b1b/invoke.js'
      script.async = true
      
      // Add error handling
      script.onerror = () => {
        console.warn('Ad script failed to load')
      }

      // Append the script to the ad container
      adContainerRef.current.appendChild(script)
      scriptLoadedRef.current = true

    } catch (error) {
      console.warn('Failed to load ad:', error)
    }
  }, [])

  return (
    <div 
      className={`flex justify-center items-center ${className || ''}`}
      ref={adContainerRef}
    >
      {/* Ad will be inserted here by the script */}
    </div>
  )
}
