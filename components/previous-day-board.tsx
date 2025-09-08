"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { WordPathFinder } from "@/utils/wordPathFinder"

interface PreviousDayBoardProps {
  board: string[][]
  allWords: string[]
  selectedWord: string | null
  onWordPathFound?: (path: Array<{ row: number; col: number }>) => void
}

export function PreviousDayBoard({ 
  board, 
  allWords, 
  selectedWord, 
  onWordPathFound 
}: PreviousDayBoardProps) {
  const [highlightedPath, setHighlightedPath] = useState<Array<{ row: number; col: number }>>([])
  
  // Create word path finder for this board
  const wordPathFinder = useMemo(() => {
    if (!board || !allWords) return null
    return new WordPathFinder(board, allWords)
  }, [board, allWords])

  // Update highlighted path when selected word changes
  useEffect(() => {
    if (!wordPathFinder || !selectedWord) {
      setHighlightedPath([])
      return
    }

    const path = wordPathFinder.getWordPath(selectedWord)
    if (path) {
      setHighlightedPath(path)
      onWordPathFound?.(path)
    } else {
      setHighlightedPath([])
    }
  }, [selectedWord, wordPathFinder, onWordPathFound])

  const isPositionHighlighted = (row: number, col: number): boolean => {
    return highlightedPath.some(pos => pos.row === row && pos.col === col)
  }

  const getPositionIndex = (row: number, col: number): number => {
    return highlightedPath.findIndex(pos => pos.row === row && pos.col === col)
  }

  if (!board || board.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No board data available</div>
      </div>
    )
  }

  return (
    <div className="neomorphic-large p-4 relative max-w-sm mx-auto">
      <div className="grid grid-cols-4 gap-2">
        {board.map((row, rowIndex) =>
          row.map((letter, colIndex) => {
            const isHighlighted = isPositionHighlighted(rowIndex, colIndex)
            const positionIndex = getPositionIndex(rowIndex, colIndex)
            const isFirst = positionIndex === 0
            const isLast = positionIndex === highlightedPath.length - 1

            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  relative aspect-square rounded-lg font-bold text-lg sm:text-xl
                  flex items-center justify-center select-none
                  ${
                    isHighlighted
                      ? isFirst || isLast
                        ? "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md scale-105 ring-1 ring-green-300/50"
                        : "bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md scale-105 opacity-90"
                      : "neomorphic-small text-gray-700 dark:text-gray-300"
                  }
                `}
                animate={{
                  scale: isHighlighted ? 1.05 : 1,
                  zIndex: isHighlighted ? 10 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <span>{letter}</span>
                {isHighlighted && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-white text-green-600 rounded-full flex items-center justify-center text-xs font-bold shadow-md"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {positionIndex + 1}
                  </motion.div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

    </div>
  )
}
