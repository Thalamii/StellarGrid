"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Target, Trophy, Zap, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/stores/gameStore"
import { useState, useEffect } from "react"

interface DailyStatsProps {
  isPopup?: boolean
}

export function DailyStats({ isPopup = false }: DailyStatsProps) {
  const { stats, statsLoading: loading, loadStats } = useGameStore()
  const [isExpanded, setIsExpanded] = useState(!isPopup) // Auto-expand if used as popup

  // Ensure stats are loaded when component mounts (fallback)
  useEffect(() => {
    if (!loading && !stats) {
      loadStats()
    }
  }, [loadStats, loading, stats])

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Only define statCards after we know stats are loaded
  const statCards = [
    {
      title: "Games Played",
      value: stats?.gamesPlayed?.toString() || "0",
      icon: Target,
      description: "Daily puzzles played",
      color: "text-blue-600"
    },
    {
      title: "Games Won",
      value: stats?.gamesWon?.toString() || "0",
      icon: Trophy,
      description: "Puzzles completed",
      color: "text-green-600"
    },
    {
      title: "Streak",
      value: stats?.streak?.toString() || "0",
      icon: Zap,
      description: "Days in a row",
      color: "text-orange-600"
    }
  ]

  const statsContent = (
    <div className={isPopup ? "space-y-4" : "px-4 pb-4 space-y-4"}>
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Track your progress and performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={isPopup ? "hover:shadow-lg transition-shadow duration-200" : "neomorphic-small hover:shadow-lg transition-shadow duration-200"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stat.value}</div>
                <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )

  // If used as popup, just return the content without the collapsible wrapper
  if (isPopup) {
    return statsContent
  }

  return (
    <div className="neomorphic-large">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-gray-700 dark:text-gray-300 hover:bg-transparent"
      >
        <span className="font-semibold">Daily Stats</span>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {statsContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
