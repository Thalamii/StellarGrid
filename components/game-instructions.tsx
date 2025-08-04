"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, MousePointer, RotateCw, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

export function GameInstructions() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="neomorphic-large bg-gradient-to-br from-gray-50 to-gray-100">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="w-full p-4 flex items-center justify-between text-gray-700 hover:bg-transparent"
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
            <div className="px-4 pb-4 space-y-4">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-800">Objective</h4>
                  <p className="text-sm text-gray-600">
                    Find as many valid words as possible by dragging across letters in the grid.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MousePointer className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-800">Drag to Build Words</h4>
                  <p className="text-sm text-gray-600">
                    Click and drag across adjacent letters to form words. Each letter can only be used once per word.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MousePointer className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-800">Reverse Selection</h4>
                  <p className="text-sm text-gray-600">
                    Drag back to the previous letter to undo your last selection and change direction.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <RotateCw className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-800">Rotate Freely</h4>
                  <p className="text-sm text-gray-600">
                    Rotate the board as many times as you want to find new word combinations from different angles.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-800">Word Requirements</h4>
                  <p className="text-sm text-gray-600">
                    Words must be at least 4 letters long and exist in the dictionary.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-medium text-yellow-800 mb-1">Scoring</h4>
                <p className="text-sm text-yellow-700">
                  Earn 1 point per letter in each valid word you find
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
