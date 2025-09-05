"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MousePointer, RotateCw, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface GameInstructionsProps {
  isPopup?: boolean
}

export function GameInstructions({ isPopup = false }: GameInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(!isPopup) // Auto-expand if used as popup

  const instructionsContent = (
    <div className={isPopup ? "space-y-4" : "px-4 pb-4 space-y-4"}>
      <div className="flex items-center space-x-3">
        <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200">Objective</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Find as many valid words as possible by dragging across letters in the grid.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <MousePointer className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200">Drag to Build Words</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click and drag across adjacent letters to form words. Each letter can only be used once per word.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <MousePointer className="w-5 h-5 text-purple-500 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200">Reverse Selection</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Drag back to the previous letter to undo your last selection and change direction.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <RotateCw className="w-5 h-5 text-orange-500 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200">Rotate Freely</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Rotate the board as many times as you want to find new word combinations from different angles.
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Target className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-gray-800 dark:text-gray-200">Word Requirements</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Words must be at least 4 letters long and exist in the dictionary.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-3 rounded-lg border-l-4 border-yellow-400">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Scoring</h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Earn 1 point per letter in each valid word you find
        </p>
      </div>
    </div>
  )

  // If used as popup, just return the content without the collapsible wrapper
  if (isPopup) {
    return instructionsContent
  }

  return (
    <div className="neomorphic-large">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="w-full p-4 flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-transparent"
      >
        <span className="font-semibold">How to Play</span>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {instructionsContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
