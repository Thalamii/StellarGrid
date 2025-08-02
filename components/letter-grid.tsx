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
  const [isDragging, setIsDragging] = useState(false)
  const [currentPath, setCurrentPath] = useState<Array<{ row: number; col: number }>>([])
  const [trailPositions, setTrailPositions] = useState<Array<{ x: number; y: number }>>([])
  const [fingerTrail, setFingerTrail] = useState<Array<{ x: number; y: number }>>([])
  const [currentFingerPos, setCurrentFingerPos] = useState<{ x: number; y: number } | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentPath(selectedPath)
  }, [selectedPath])

  const updateTrailPositions = useCallback((path: Array<{ row: number; col: number }>) => {
    if (!gridRef.current || path.length === 0) {
      setTrailPositions([])
      return
    }

    const positions: Array<{ x: number; y: number }> = []
    const gridRect = gridRef.current.getBoundingClientRect()

    path.forEach(({ row, col }) => {
      const button = gridRef.current?.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement
      if (button) {
        const buttonRect = button.getBoundingClientRect()
        const x = buttonRect.left + buttonRect.width / 2 - gridRect.left
        const y = buttonRect.top + buttonRect.height / 2 - gridRect.top
        positions.push({ x, y })
      }
    })

    setTrailPositions(positions)
  }, [])

  // Use useLayoutEffect to measure DOM elements after layout but before paint
  useLayoutEffect(() => {
    updateTrailPositions(currentPath)
  }, [currentPath, updateTrailPositions])

  // Add ResizeObserver to handle responsive changes
  useEffect(() => {
    if (!gridRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      updateTrailPositions(currentPath)
    })

    resizeObserver.observe(gridRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [currentPath, updateTrailPositions])

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

  const handleMouseDown = useCallback(
    (row: number, col: number) => {
      setIsDragging(true)
      const newPath = [{ row, col }]
      setCurrentPath(newPath)
      onPathChange(newPath)
    },
    [onPathChange],
  )

  const handleMouseEnter = useCallback(
    (row: number, col: number) => {
      if (!isDragging) return

      const lastPosition = currentPath[currentPath.length - 1]
      const positionIndex = getPositionInPath(row, col)

      // If we're hovering over a position already in the path
      if (positionIndex !== -1) {
        // Only allow backtracking to the immediate previous position
        // and only if we have at least 2 positions in the path
        if (positionIndex === currentPath.length - 2 && currentPath.length >= 2) {
          // Remove the last position (backtrack)
          const newPath = currentPath.slice(0, -1)
          setCurrentPath(newPath)
          onPathChange(newPath)
        }
        // Don't do anything if clicking on other already-selected positions
        return
      }

      // Check if the new position is adjacent to the last position
      if (lastPosition && isAdjacent(lastPosition, { row, col })) {
        const newPath = [...currentPath, { row, col }]
        setCurrentPath(newPath)
        onPathChange(newPath)
      }
    },
    [isDragging, currentPath, onPathChange],
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging && currentPath.length > 0) {
      const word = currentPath.map((pos) => board[pos.row][pos.col]).join("")
      onWordComplete(word)
    }
    setIsDragging(false)

    // Clear finger trail immediately
    setFingerTrail([])
    setCurrentFingerPos(null)
    
    // Keep trail and highlights visible longer to show validation colors
    setTimeout(() => {
      setCurrentPath([])
      setTrailPositions([])
      onPathChange([])
    }, 1500) // Increased from 1000ms to 1500ms to see colors better
  }, [isDragging, currentPath, board, onWordComplete, onPathChange])

  // Add global mouse up event listener to handle mouse up outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp()
      }
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !gridRef.current) return
      
      const element = document.elementFromPoint(e.clientX, e.clientY)
      const button = element?.closest("[data-row]") as HTMLElement
      
      if (button && gridRef.current.contains(button)) {
        const row = Number.parseInt(button.dataset.row || "0")
        const col = Number.parseInt(button.dataset.col || "0")
        handleMouseEnter(row, col)
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('mousemove', handleGlobalMouseMove)

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [isDragging, handleMouseUp, handleMouseEnter])


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
      if (!isDragging || !gridRef.current) return

      const touch = e.touches[0]
      if (!touch) return
      
      // More aggressive touch detection for diagonal movements
      const allButtons = gridRef.current.querySelectorAll('[data-row]')
      let closestButton: HTMLElement | null = null
      let minDistance = Number.MAX_VALUE
      
      // Find the closest button within expanded touch radius
      for (const btn of allButtons) {
        const btnElement = btn as HTMLElement
        const btnRect = btnElement.getBoundingClientRect()
        const btnCenterX = btnRect.left + btnRect.width / 2
        const btnCenterY = btnRect.top + btnRect.height / 2
        const distance = Math.sqrt(
          Math.pow(touch.clientX - btnCenterX, 2) + 
          Math.pow(touch.clientY - btnCenterY, 2)
        )
        
        // Larger touch target: 50px radius for better diagonal detection
        if (distance < 50 && distance < minDistance) {
          minDistance = distance
          closestButton = btnElement
        }
      }

      // Also try direct element detection as fallback
      if (!closestButton) {
        const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
        for (const element of elements) {
          const candidate = element.closest("[data-row]") as HTMLElement
          if (candidate && gridRef.current.contains(candidate)) {
            closestButton = candidate
            break
          }
        }
      }

      if (closestButton) {
        const row = Number.parseInt(closestButton.dataset.row || "0")
        const col = Number.parseInt(closestButton.dataset.col || "0")
        handleMouseEnter(row, col)
      }
    },
    [isDragging, handleMouseEnter],
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
                <div className="relative">
                  <span>{letter}</span>
                  {/* Letter Circle - like in reference */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 pointer-events-none"
                      style={{
                        borderColor: colors.hex,
                        opacity: isLastSelected ? 1 : 0.7
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: isLastSelected ? 1 : 0.7 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
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
