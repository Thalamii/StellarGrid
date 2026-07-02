"use client"

import { Trophy, User } from "lucide-react"
import { motion } from "framer-motion"

interface MatchScoreboardProps {
  myScore: number
  myWordsFound: number
  opponentScore: number
  opponentConnected: boolean
  totalWords: number
}

// Side-by-side you-vs-opponent scoreboard, cloning the tile pattern from
// components/game-stats.tsx but for two players instead of one.
export function MatchScoreboard({
  myScore,
  myWordsFound,
  opponentScore,
  opponentConnected,
  totalWords,
}: MatchScoreboardProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div className="neomorphic-small p-4" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-700">You</span>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-800">{myScore}</div>
          <div className="text-sm text-yellow-600">
            {myWordsFound}/{totalWords} words
          </div>
        </div>
      </motion.div>

      <motion.div className="neomorphic-small p-4" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">
            Opponent {opponentConnected ? "" : "(disconnected)"}
          </span>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-800">{opponentScore}</div>
          <div className="text-sm text-purple-600">live score</div>
        </div>
      </motion.div>
    </div>
  )
}
