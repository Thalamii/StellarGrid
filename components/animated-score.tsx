"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface AnimatedScoreProps {
  score: number
  word: string
  show: boolean
  onComplete: () => void
  isPuzzleComplete?: boolean
}

export function AnimatedScore({ score, word, show, onComplete, isPuzzleComplete = false }: AnimatedScoreProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (show) {
      setMounted(true)
      const timer = setTimeout(() => {
        onComplete()
        setMounted(false)
      }, isPuzzleComplete ? 2000 : 1000) // Much faster - 1 second for normal, 2 for puzzle complete
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`text-white px-6 py-3 rounded-full shadow-lg ${
              isPuzzleComplete 
                ? "bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500" 
                : "bg-gradient-to-r from-green-400 to-blue-500"
            }`}
            initial={{ scale: 0, y: 50 }}
            animate={{ 
              scale: isPuzzleComplete ? [0, 1.3, 1.1] : [0, 1.2, 1],
              y: [50, 0, isPuzzleComplete ? -30 : -20],
              rotateX: [0, 360, 0]
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: isPuzzleComplete ? 1.2 : 0.8,
              times: [0, 0.6, 1],
              ease: "easeOut"
            }}
          >
            <div className="text-center">
              <div className={`font-bold ${
                isPuzzleComplete ? "text-3xl" : "text-2xl"
              }`}>
                {isPuzzleComplete ? "🎉 Puzzle Complete! 🎉" : `+${score} points!`}
              </div>
              <div className="text-sm opacity-90">
                {isPuzzleComplete ? "Amazing work! You found all 50 words!" : word}
              </div>
            </div>
          </motion.div>

          {/* Confetti effect */}
          {Array.from({ length: isPuzzleComplete ? 50 : 12 }).map((_, i) => {
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
