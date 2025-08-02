"use client"

import { Trophy, Target, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

interface GameStatsProps {
  score: number
  wordsFound: number
  totalWords: number
  completionRate: number
}

export function GameStats({ score, wordsFound, totalWords, completionRate }: GameStatsProps) {
  const getStarRating = (rate: number): number => {
    if (rate >= 90) return 5
    if (rate >= 75) return 4
    if (rate >= 50) return 3
    if (rate >= 25) return 2
    return 1
  }

  const stars = getStarRating(completionRate)

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Score */}
      <motion.div
        className="neomorphic-small p-4 bg-gradient-to-br from-yellow-50 to-yellow-100"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center mb-2">
          <Trophy className="w-6 h-6 text-yellow-600" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-800">{score}</div>
          <div className="text-sm text-yellow-600">Points</div>
        </div>
      </motion.div>

      {/* Words Found */}
      <motion.div
        className="neomorphic-small p-4 bg-gradient-to-br from-blue-50 to-blue-100"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center mb-2">
          <Target className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-800">
            {wordsFound}/{totalWords}
          </div>
          <div className="text-sm text-blue-600">Words</div>
        </div>
      </motion.div>

      {/* Completion Rate */}
      <motion.div
        className="neomorphic-small p-4 bg-gradient-to-br from-green-50 to-green-100"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-800">{Math.round(completionRate)}%</div>
          <div className="text-sm text-green-600">Complete</div>
        </div>
      </motion.div>

    </div>
  )
}
