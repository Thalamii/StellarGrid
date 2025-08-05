"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Target, Trophy, Zap, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDailyStats } from "@/hooks/use-daily-stats"
import { useState } from "react"

export function DailyStats() {
  const { stats, loading } = useDailyStats()
  const [isExpanded, setIsExpanded] = useState(false)

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Games Played",
      value: stats.gamesPlayed.toString(),
      icon: Target,
      description: "Daily puzzles played",
      color: "text-blue-600"
    },
    {
      title: "Games Won",
      value: stats.gamesWon.toString(),
      icon: Trophy,
      description: "Puzzles completed",
      color: "text-green-600"
    },
    {
      title: "Streak",
      value: stats.streak.toString(),
      icon: Zap,
      description: "Days in a row",
      color: "text-orange-600"
    }
  ]

  return (
    <div className="neomorphic-large bg-gradient-to-br from-gray-50 to-gray-100">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-gray-700 hover:bg-transparent"
      >
        <span className="font-semibold">📊 Daily Stats</span>
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
            <div className="px-4 pb-4 space-y-4">
              <div className="text-center">
                <p className="text-gray-600">Track your progress and performance</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {statCards.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="neomorphic-small hover:shadow-lg transition-shadow duration-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                          {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                        <CardDescription className="text-xs text-gray-500">
                          {stat.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
