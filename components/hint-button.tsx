"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGameStore } from "@/stores/gameStore"

export function HintButton() {
  const { currentHint, hintState, getHint } = useGameStore()
  const [showMessage, setShowMessage] = useState(false)

  const handleGetHint = () => {
    if (hintState.dailyHintsRemaining <= 0) {
      setShowMessage(true)
      setTimeout(() => setShowMessage(false), 4000)
      return
    }

    getHint()
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleGetHint}
          variant="outline"
          size="lg"
          className="neomorphic-small border-0 text-amber-700 dark:text-amber-300"
          disabled={hintState.dailyHintsRemaining <= 0}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Hint ({hintState.dailyHintsRemaining})
        </Button>
      </div>

      {/* Hint Message */}
      <AnimatePresence>
        {currentHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-4 right-4 bottom-20 p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-2 border-blue-300 dark:border-blue-600 rounded-xl shadow-lg z-50 max-w-sm mx-auto"
          >
            <p className="text-sm sm:text-base text-blue-900 dark:text-blue-100 font-semibold text-center break-words">
              {currentHint.message}
            </p>
            <div className="mt-2 h-1 bg-blue-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Hints Remaining Message */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl shadow-lg z-10"
          >
            <p className="text-sm text-red-800 font-medium text-center">
              No hints remaining for today! Come back tomorrow for more.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
