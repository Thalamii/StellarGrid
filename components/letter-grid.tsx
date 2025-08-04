"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react"
import { motion } from "framer-motion"

interface LetterGridProps {
  board: string[][]
  selectedPath: Array<{ row: number; col: number }>
  onPathChange: (path: Array<{ row: number; col: number }>) => void
  onWordComplete: (word: string) => void
  rotation: number
  wordValidationStatus?: "valid" | "invalid" | "duplicate" | null
  gameState?: {
    possibleWords?: string[]
    foundWords: string[]
  }
}

export function LetterGrid({
  board,
  selectedPath,
  onPathChange,
  onWordComplete,
  rotation,
  wordValidationStatus,
}: LetterGridProps) {
  // Core state - simplified state machine approach
  const [isDragging, setIsDragging] = useState(false)
  const [currentPath, setCurrentPath] = useState<Array<{ row: number; col: number }>>([])
  const [trailPositions, setTrailPositions] = useState<Array<{ x: number; y: number }>>([])
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Essential refs for performance and state tracking
  const gridRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const buttonRectsRef = useRef<Map<string, DOMRect>>(new Map())
  
  // Throttling ref for smooth performance
  const throttleFrameRef = useRef<number | null>(null)
  
  // Additional refs needed for tracking state
  const currentPathRef = useRef<Array<{ row: number; col: number }>>([])
  const lastPositionRef = useRef<{ row: number; col: number } | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (throttleFrameRef.current) {
        cancelAnimationFrame(throttleFrameRef.current)
      }
    }
  }, [])

  // Clear path when board rotates
  useEffect(() => {
    setCurrentPath([])
    currentPathRef.current = []
    onPathChange([])
  }, [rotation, onPathChange])

  // Sync currentPathRef with currentPath
  useEffect(() => {
    currentPathRef.current = currentPath
  }, [currentPath])

  // Utility functions needed by handleMouseEnter
  const isAdjacent = (pos1: { row: number; col: number }, pos2: { row: number; col: number }): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row)
    const colDiff = Math.abs(pos1.col - pos2.col)
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)
  }

  const isPositionInPath = (row: number, col: number): boolean => {
    return currentPath.some((pos) => pos.row === row && pos.col === col)
  }

  const getPositionInPath = (row: number, col: number): number => {
    return currentPath.findIndex((pos) => pos.row === row && pos.col === col)
  }

  // Mouse enter handler - moved up to resolve dependency order
  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isDragging) return

      const lastPosition = currentPath[currentPath.length - 1]
      const positionIndex = getPositionInPath(row, col)

      if (positionIndex !== -1) {
        // If we're hovering over a position already in the path
        if (positionIndex === currentPath.length - 2 && currentPath.length > 1) {
          // If it's the second-to-last position, remove the last position (backtrack)
          const newPath = currentPath.slice(0, -1)
          setCurrentPath(newPath)
          onPathChange(newPath)
        }
        return
      }

      // Check if the new position is adjacent to the last position
      if (lastPosition && isAdjacent(lastPosition, { row, col })) {
        // Always allow new adjacent moves - this removes the restrictive direction locking
        const newPath = [...currentPath, { row, col }]
        setCurrentPath(newPath)
        onPathChange(newPath)
      }
    },
    [isDragging, currentPath, onPathChange],
  )

  // Get tile from screen coordinates - simplified version
  const findButtonAtPoint = useCallback((x: number, y: number) => {
    if (!gridRef.current || !isFinite(x) || !isFinite(y)) return null
    
    const elements = document.elementsFromPoint(x, y)
    const tileElement = elements.find(el => el.dataset && el.dataset.row)
    
    if (tileElement) {
      const row = parseInt(tileElement.dataset.row!)
      const col = parseInt(tileElement.dataset.col!)
      return { row, col }
    }
    return null
  }, [])

  // Get coordinates from both mouse and touch events
  const getEventCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    } else if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY }
    }
    return { x: 0, y: 0 }
  }, [])

  // Ultra-fast button rect caching with viewport coordinates
  const cacheButtonRects = useCallback(() => {
    if (!gridRef.current) return
    
    const rects = new Map<string, DOMRect>()
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const button = gridRef.current.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement
        if (button) {
          // Store the actual DOM rect with viewport coordinates
          rects.set(`${row}-${col}`, button.getBoundingClientRect())
        }
      }
    }
    buttonRectsRef.current = rects
  }, [board])

  // Cache button positions immediately on mount and resize
  useLayoutEffect(() => {
    cacheButtonRects()
  }, [cacheButtonRects])

  // Trail position updates with smooth interpolation
  const updateTrailPositions = useCallback((path: Array<{ row: number; col: number }>) => {
    if (!gridRef.current || path.length === 0) {
      setTrailPositions([])
      return
    }

    const gridRect = gridRef.current.getBoundingClientRect()
    const positions = path.map(({ row, col }) => {
      const rect = buttonRectsRef.current.get(`${row}-${col}`)
      if (rect) {
        return {
          x: rect.left + rect.width / 2 - gridRect.left,
          y: rect.top + rect.height / 2 - gridRect.top
        }
      }
      return { x: 0, y: 0 }
    })

    setTrailPositions(positions)
  }, [])

  // Immediate trail updates
  useLayoutEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      updateTrailPositions(currentPath)
    })
  }, [currentPath, updateTrailPositions])

  // Responsive updates
  useEffect(() => {
    if (!gridRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      cacheButtonRects()
      updateTrailPositions(currentPathRef.current)
    })

    resizeObserver.observe(gridRef.current)
    return () => resizeObserver.disconnect()
  }, [cacheButtonRects, updateTrailPositions])


  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      // Force recache button positions to ensure accuracy
      cacheButtonRects()
      
      setIsDragging(true)
      const newPath = [{ row, col }]
      setCurrentPath(newPath)
      currentPathRef.current = newPath
      onPathChange(newPath)
      // Reset last position for clean start
      lastPositionRef.current = { row, col }
    },
    [onPathChange, cacheButtonRects],
  )


  // More flexible direction locking that allows smoother movement
  const getLockedDirection = useCallback((fromPos: { row: number; col: number }, toPos: { row: number; col: number }) => {
    const dx = toPos.col - fromPos.col
    const dy = toPos.row - fromPos.row
    
    // Normalize to get the primary direction (8-directional grid)
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    
    if (absDx === 0) return { dx: 0, dy: dy > 0 ? 1 : -1 } // Vertical
    if (absDy === 0) return { dx: dx > 0 ? 1 : -1, dy: 0 } // Horizontal
    if (absDx === absDy) return { dx: dx > 0 ? 1 : -1, dy: dy > 0 ? 1 : -1 } // Perfect diagonal
    
    // For imperfect diagonals, be more lenient
    const ratio = Math.min(absDx, absDy) / Math.max(absDx, absDy)
    if (ratio > 0.5) { // Allow diagonal if close enough to diagonal ratio
      return { dx: dx > 0 ? 1 : -1, dy: dy > 0 ? 1 : -1 }
    }
    
    // Otherwise choose dominant direction
    if (absDx > absDy) return { dx: dx > 0 ? 1 : -1, dy: 0 } // More horizontal
    return { dx: 0, dy: dy > 0 ? 1 : -1 } // More vertical
  }, [])


  const handleMouseUp = useCallback(() => {
    // Only complete word if we were actually dragging and user lifted finger
    if (isDragging && currentPath.length > 0 && !isCompleting) {
      setIsCompleting(true)
      const word = currentPath.map((pos) => board[pos.row][pos.col]).join("")
      onWordComplete(word)
      
      // Reset completing flag after a brief delay
      setTimeout(() => {
        setIsCompleting(false)
      }, 100)
    }
    
    setIsDragging(false)
    lastPositionRef.current = null // Reset tracking
    
    // Keep trail and highlights visible longer to show validation colors
    setTimeout(() => {
      if (!isCompleting) { // Only clear if not in middle of completion
        setCurrentPath([])
        setTrailPositions([])
        onPathChange([])
      }
    }, 1500) // Increased from 1000ms to 1500ms to see colors better
  }, [isDragging, currentPath, board, onWordComplete, onPathChange, isCompleting])

  // Enhanced global mouse and touch tracking for ultra-smooth movement
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !gridRef.current) return
      
      const buttonPos = findButtonAtPoint(e.clientX, e.clientY)
      
      if (buttonPos) {
        // Prevent duplicate processing using lastPositionRef
        const lastProcessed = lastPositionRef.current
        if (lastProcessed && lastProcessed.row === buttonPos.row && lastProcessed.col === buttonPos.col) {
          return
        }
        
        lastPositionRef.current = { row: buttonPos.row, col: buttonPos.col }
        handleMouseEnter(buttonPos.row, buttonPos.col)
      }
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDragging || !gridRef.current) return
      
      const touch = e.touches[0]
      if (!touch) return
      
      const buttonPos = findButtonAtPoint(touch.clientX, touch.clientY)
      
      if (buttonPos) {
        const lastProcessed = lastPositionRef.current
        if (lastProcessed && lastProcessed.row === buttonPos.row && lastProcessed.col === buttonPos.col) {
          return
        }
        
        lastPositionRef.current = { row: buttonPos.row, col: buttonPos.col }
        handleMouseEnter(buttonPos.row, buttonPos.col)
      }
    }

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp, { passive: false })
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDragging, handleMouseUp, handleMouseEnter, findButtonAtPoint])


  const getSelectionColor = () => {
    if (wordValidationStatus === "valid")
      return {
        bg: "from-green-400 to-green-600",
        ring: "ring-green-300",
        text: "text-green-600",
        hex: "#10b981",
      }
    if (wordValidationStatus === "invalid")
      return {
        bg: "from-red-400 to-red-600",
        ring: "ring-red-300",
        text: "text-red-600",
        hex: "#ef4444",
      }
    if (wordValidationStatus === "duplicate")
      return {
        bg: "from-gray-400 to-gray-600",
        ring: "ring-gray-300",
        text: "text-gray-600",
        hex: "#6b7280",
      }
    return {
      bg: "from-blue-400 to-blue-600",
      ring: "ring-blue-300",
      text: "text-blue-600",
      hex: "#3b82f6",
    }
  }

  const generateConnections = () => {
    if (currentPath.length < 2) return []
    
    const connections = []
    
    for (let i = 0; i < currentPath.length - 1; i++) {
      const current = currentPath[i]
      const next = currentPath[i + 1]
      
      // Calculate connection position and dimensions
      const currentButton = gridRef.current?.querySelector(`[data-row="${current.row}"][data-col="${current.col}"]`) as HTMLElement
      const nextButton = gridRef.current?.querySelector(`[data-row="${next.row}"][data-col="${next.col}"]`) as HTMLElement
      
      if (currentButton && nextButton) {
        const currentRect = currentButton.getBoundingClientRect()
        const nextRect = nextButton.getBoundingClientRect()
        const gridRect = gridRef.current!.getBoundingClientRect()
        
        const currentCenter = {
          x: currentRect.left + currentRect.width / 2 - gridRect.left,
          y: currentRect.top + currentRect.height / 2 - gridRect.top
        }
        
        const nextCenter = {
          x: nextRect.left + nextRect.width / 2 - gridRect.left,
          y: nextRect.top + nextRect.height / 2 - gridRect.top
        }
        
        // Calculate connection rectangle
        const deltaX = nextCenter.x - currentCenter.x
        const deltaY = nextCenter.y - currentCenter.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
        
        connections.push({
          x: currentCenter.x,
          y: currentCenter.y,
          width: distance,
          height: 16, // Thick connection like in reference
          rotation: angle,
          key: `${current.row}-${current.col}-${next.row}-${next.col}`
        })
      }
    }
    
    return connections
  }



  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, row: number, col: number) => {
      e.preventDefault()
      handleMouseDown(row, col)
    },
    [handleMouseDown],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragging) return

      const touch = e.touches[0]
      if (!touch) return

      const buttonPos = findButtonAtPoint(touch.clientX, touch.clientY)
      
      if (buttonPos) {
        // Prevent duplicate processing using lastPositionRef
        const lastProcessed = lastPositionRef.current
        if (lastProcessed && lastProcessed.row === buttonPos.row && lastProcessed.col === buttonPos.col) {
          return
        }
        
        lastPositionRef.current = { row: buttonPos.row, col: buttonPos.col }
        handleMouseEnter(buttonPos.row, buttonPos.col)
      }
    },
    [isDragging, findButtonAtPoint, handleMouseEnter],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault()
      handleMouseUp()
    },
    [handleMouseUp],
  )

  const colors = getSelectionColor()

  return (
    <motion.div
      ref={gridRef}
      className="neomorphic-large p-6 bg-gradient-to-br from-gray-50 to-gray-100 relative"
      animate={{
        x: wordValidationStatus === "invalid" ? [0, -10, 10, -10, 10, 0] : 0
      }}
      transition={{ 
        duration: wordValidationStatus === "invalid" ? 0.5 : 0.3, 
        ease: "easeInOut",
        times: wordValidationStatus === "invalid" ? [0, 0.2, 0.4, 0.6, 0.8, 1] : undefined
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: "none" }}
    >
      {/* Trail Circles - Appear on each selected letter */}
      {trailPositions.map((position, index) => (
        <motion.div
          key={`circle-${currentPath[index]?.row}-${currentPath[index]?.col}-${index}`}
          className="absolute pointer-events-none"
          style={{
            left: position.x - 20, // Center the 40px circle
            top: position.y - 20,
            width: 40,
            height: 40,
            backgroundColor: colors.hex,
            borderRadius: '50%',
            opacity: 0.9,
            zIndex: 5,
            border: '3px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        />
      ))}

      {/* Rectangular Trail Connections */}
      {currentPath.length > 1 && generateConnections().map((connection) => (
        <div
          key={connection.key}
          className="absolute pointer-events-none"
          style={{
            left: connection.x,
            top: connection.y - connection.height / 2,
            width: connection.width,
            height: connection.height,
            backgroundColor: colors.hex,
            transformOrigin: '0 50%',
            transform: `rotate(${connection.rotation}deg)`,
            borderRadius: '8px',
            opacity: 0.8,
            zIndex: 4
          }}
        />
      ))}

      <div className="grid grid-cols-4 gap-3">
        {board.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const isSelected = isPositionInPath(rowIndex, colIndex)
            const positionInPath = getPositionInPath(rowIndex, colIndex)
            const isLastSelected = isSelected && positionInPath === currentPath.length - 1

            return (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                data-row={rowIndex}
                data-col={colIndex}
                className={`
                  relative aspect-square rounded-xl font-bold text-2xl sm:text-3xl
                  transition-all duration-200 select-none touch-manipulation
                  min-h-[60px] min-w-[60px] sm:min-h-[70px] sm:min-w-[70px]
                  ${
                    isSelected
                      ? isLastSelected
                        ? `bg-gradient-to-br ${colors.bg} text-white shadow-lg scale-105` // Full opacity for current target
                        : `bg-gradient-to-br ${colors.bg} text-white shadow-lg scale-105 opacity-75` // Lower opacity for previous selections
                      : "neomorphic-small bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
                  }
                  ${isLastSelected ? `ring-4 ${colors.ring} ring-opacity-50` : ""}
                `}
                onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                onMouseUp={handleMouseUp}
                onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                whileHover={{ scale: isSelected ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  scale: isSelected ? 1.05 : 1,
                  zIndex: isSelected ? 10 : 1,
                }}
              >
                <span>{letter}</span>
                {isSelected && (
                  <motion.div
                    className={`absolute -top-2 -right-2 w-6 h-6 bg-white ${colors.text} rounded-full flex items-center justify-center text-sm font-bold shadow-lg`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {positionInPath + 1}
                  </motion.div>
                )}
              </motion.button>
            )
          }),
        )}
      </div>
    </motion.div>
  )
}
