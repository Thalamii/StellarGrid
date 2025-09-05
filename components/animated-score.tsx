"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface AnimatedScoreProps {
  points: number
  word: string
  show: boolean
  onComplete: () => void
  isPuzzleComplete?: boolean
  isBonusWord?: boolean
  isInvalid?: boolean
  isDuplicate?: boolean
  message: string
}

export function AnimatedScore({
  points,
  word,
  show,
  onComplete,
  isPuzzleComplete = false,
  isBonusWord = false,
  isInvalid = false,
  isDuplicate = false,
  message
}: AnimatedScoreProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (show) {
      setMounted(true)
    } else {
      // When show becomes false, immediately hide and call onComplete
      setMounted(false)
      onComplete()
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          className="fixed inset-0 flex items-start justify-center pt-20 pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ exit: { duration: 0 } }} // Instant exit to match validation colors
        >
          <motion.div
            className={`text-white px-6 py-3 rounded-full shadow-lg ${
              isPuzzleComplete 
                ? "bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500" 
                : isInvalid || isDuplicate
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : isBonusWord
                    ? "bg-gradient-to-r from-orange-400 via-yellow-500 to-amber-500"
                    : "bg-gradient-to-r from-green-400 to-blue-500"
            }`}
            initial={{ scale: isPuzzleComplete ? 0 : 0.8, y: isPuzzleComplete ? 20 : 10, opacity: 0 }}
            animate={{ 
              scale: isPuzzleComplete ? [0, 1.2, 1] : 1, // Gentle scale for regular words
              y: isPuzzleComplete ? [20, 0, -5] : 0, // Subtle upward movement for regular words
              opacity: 1,
              rotateX: isPuzzleComplete ? [0, 180, 0] : 0 // No rotation for regular words
            }}
            exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }} // Quick exit
            transition={{ 
              duration: isPuzzleComplete ? 0.8 : 0.3, // Smooth entrance for regular words
              ease: "easeOut"
            }}
          >
            <div className="text-center">
              {!(isInvalid || isDuplicate) && (
                <div className={`font-bold ${
                  isPuzzleComplete ? "text-3xl" : "text-2xl"
                }`}>
                  {isPuzzleComplete ? "🎉 Puzzle Complete! 🎉" : `+${points} points!`}
                </div>
              )}
              <div className={`${
                isInvalid || isDuplicate ? "text-sm font-medium" : "text-sm opacity-90"
              }`}>
                {isInvalid || isDuplicate ? message : (message || word)}
              </div>
            </div>
          </motion.div>

          {/* Fast Confetti effect - only for puzzle complete */}
          {isPuzzleComplete &&
            Array.from({ length: 50 }).map((_, i) => {
              const colors = ["bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-purple-400", "bg-pink-400"]
              const color = colors[i % colors.length]
              const radius = 150 + (i % 3) * 50
              const delay = i * 0.005 // faster start

              return (
                <motion.div
                  key={i}
                  className={`absolute w-3 h-3 ${color} rounded-full`}
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{
                    x: Math.cos(i * (360 / 50) * Math.PI / 180) * radius,
                    y: Math.sin(i * (360 / 50) * Math.PI / 180) * radius,
                    scale: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{
                    duration: 0.8, // matches main animation duration
                    delay: delay,
                    ease: "easeOut"
                  }}
                />
              )
            })
          }
        </motion.div>
      )}
    </AnimatePresence>
  )
}
