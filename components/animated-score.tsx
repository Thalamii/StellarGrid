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

export function AnimatedScore({ points, word, show, onComplete, isPuzzleComplete = false, isBonusWord = false, isInvalid = false, isDuplicate = false, message }: AnimatedScoreProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (show) {
      setMounted(true)
      const timer = setTimeout(() => {
        onComplete()
        setMounted(false)
      }, isPuzzleComplete ? 2000 : (isInvalid || isDuplicate) ? 800 : 1000) // Faster for errors
      return () => clearTimeout(timer)
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
            initial={{ scale: 0, y: 50 }}
            animate={{ 
              scale: isPuzzleComplete ? [0, 1.3, 1.1] : (isInvalid || isDuplicate) ? [0, 1.1, 1] : [0, 1.2, 1],
              y: [30, 0, isPuzzleComplete ? -15 : -10],
              rotateX: (isInvalid || isDuplicate) ? [0, -10, 10, 0] : [0, 360, 0]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: isPuzzleComplete ? 1.2 : (isInvalid || isDuplicate) ? 0.6 : 0.8,
              times: [0, 0.6, 1],
              ease: "easeOut"
            }}
          >
            <div className="text-center">
              <div className={`font-bold ${
                isPuzzleComplete ? "text-3xl" : "text-2xl"
              }`}>
                {isPuzzleComplete ? "🎉 Puzzle Complete! 🎉" : 
                 isInvalid || isDuplicate ? "❌" : 
                 `+${points} points!`}
              </div>
              <div className="text-sm opacity-90">
                {message || word}
              </div>
            </div>
          </motion.div>

          {/* Confetti effect - only for valid words */}
          {!(isInvalid || isDuplicate) && Array.from({ length: isPuzzleComplete ? 50 : 12 }).map((_, i) => {
            const colors = isPuzzleComplete 
              ? ["bg-red-400", "bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-purple-400", "bg-pink-400"]
              : ["bg-yellow-400"]
            const color = colors[i % colors.length]
            const radius = isPuzzleComplete ? 150 + (i % 3) * 50 : 100
            const delay = isPuzzleComplete ? (i * 0.02) : 0.3
            
            return (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 ${color} rounded-full`}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0 
                }}
                animate={{
                  x: Math.cos(i * (360 / (isPuzzleComplete ? 50 : 12)) * Math.PI / 180) * radius,
                  y: Math.sin(i * (360 / (isPuzzleComplete ? 50 : 12)) * Math.PI / 180) * radius,
                  scale: [0, 1, 0],
                  rotate: 720
                }}
                transition={{
                  duration: isPuzzleComplete ? 2.5 : 1.5,
                  delay: delay,
                  ease: "easeOut"
                }}
              />
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
