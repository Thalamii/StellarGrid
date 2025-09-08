"use client"

import { useState, useEffect } from "react"
import { Calendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PreviousDayBoard } from "./previous-day-board"
import { deobfuscateWords } from "@/utils/wordObfuscation"
import { motion, AnimatePresence } from "framer-motion"
import { useGameStore } from "@/stores/gameStore"

interface PreviousDayData {
  date: string
  board: string[][]
  possibleWords: string[]
  targetWords: string[]
  bonusWords: string[]
  totalPossibleWords: number
  totalAllWords: number
  boardString: string
}

interface PreviousDayPopupProps {
  children: React.ReactNode
}

export function PreviousDayPopup({ children }: PreviousDayPopupProps) {
  const { user } = useGameStore()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PreviousDayData | null>(null)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [currentOffset, setCurrentOffset] = useState(1) // 1 = yesterday, 2 = day before, etc.
  const [userFoundWords, setUserFoundWords] = useState<string[]>([])

  const fetchPreviousDayData = async (daysAgo: number = 1) => {
    setLoading(true)
    setError(null)
    setSelectedWord(null)
    setUserFoundWords([])

    try {
      // Calculate the target date
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - daysAgo)
      const dateString = targetDate.toISOString().split('T')[0]

      const response = await fetch(`/api/generate-board?date=${dateString}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch board data')
      }

      if (result.success) {
        // Deobfuscate the data
        const deobfuscatedData = {
          ...result.data,
          possibleWords: typeof result.data.possibleWords === 'string' 
            ? deobfuscateWords(result.data.possibleWords, result.data.date)
            : result.data.possibleWords || [],
          targetWords: typeof result.data.targetWords === 'string'
            ? deobfuscateWords(result.data.targetWords, result.data.date)
            : result.data.targetWords || [],
          bonusWords: typeof result.data.bonusWords === 'string'
            ? deobfuscateWords(result.data.bonusWords, result.data.date)
            : result.data.bonusWords || []
        }

        setData(deobfuscatedData)
        
        // Fetch user's found words for this date
        fetchUserFoundWords(dateString)
      } else {
        throw new Error('Failed to fetch board data')
      }
    } catch (err) {
      console.error('Error fetching previous day data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserFoundWords = (dateString: string) => {
    try {
      // Try to get found words from localStorage for anonymous users
      const savedGame = localStorage.getItem(`wordGridGame_${dateString}`)
      if (savedGame) {
        const parsed = JSON.parse(savedGame)
        setUserFoundWords(parsed.foundWords || [])
      } else {
        setUserFoundWords([])
      }
      
      // TODO: For authenticated users, fetch from Supabase
      // This would require an API endpoint to get historical game data
    } catch (error) {
      console.warn('Error fetching user found words:', error)
      setUserFoundWords([])
    }
  }

  // Fetch data when dialog opens or offset changes
  useEffect(() => {
    if (isOpen) {
      fetchPreviousDayData(currentOffset)
    }
  }, [isOpen, currentOffset])

  const handleWordClick = (word: string) => {
    setSelectedWord(selectedWord === word ? null : word)
  }

  const goToPreviousDay = () => {
    setCurrentOffset(prev => Math.min(3, prev + 1)) // Limit to 3 days back
  }

  const goToNextDay = () => {
    setCurrentOffset(prev => Math.max(1, prev - 1))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    date.setHours(0, 0, 0, 0) // Reset time to start of day
    
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "Yesterday"
    if (diffDays === 2) return "2 days ago"
    if (diffDays === 3) return "3 days ago"
    return `${diffDays} days ago`
  }

  // Group words by length for better organization
  const groupWordsByLength = (words: string[]) => {
    const grouped: { [key: number]: string[] } = {}
    words.forEach(word => {
      const length = word.length
      if (!grouped[length]) grouped[length] = []
      grouped[length].push(word)
    })
    
    // Sort each group alphabetically and return sorted by length
    Object.keys(grouped).forEach(key => {
      grouped[parseInt(key)].sort()
    })
    
    return grouped
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-4 flex flex-col">
        <DialogHeader>
          {/* Centered Date Navigation */}
          {data && (
            <div className="flex items-center justify-center gap-3 py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousDay}
                  disabled={currentOffset >= 3}
                  className="h-10 w-10 p-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              <span className="text-lg font-semibold min-w-[120px] text-center">
                {formatDate(data.date)}
              </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextDay}
                  disabled={currentOffset <= 1}
                  className="h-10 w-10 p-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
          )}
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mt-2">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">
                Loading puzzle...
              </span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                Error: {error}
              </div>
              <Button onClick={() => fetchPreviousDayData(currentOffset)} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {data && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 -mt-1">
              {/* Board Section - Smaller, properly positioned */}
              <div className="lg:col-span-1">
                <div className="scale-75 origin-top mt-1">
                  <PreviousDayBoard
                    board={data.board}
                    allWords={data.possibleWords}
                    selectedWord={selectedWord}
                  />
                </div>
              </div>

              {/* Words Section - Moved closer to board */}
              <div className="lg:col-span-2 -mt-8">
                <div className="mb-1">
                  <h3 className="text-sm font-semibold text-center mb-0.5">
                    All Words ({data.possibleWords.length})
                  </h3>
                  {userFoundWords.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium text-center mb-0.5">
                      You found {userFoundWords.length} of {data.possibleWords.length}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Click word to see path • <span className="text-green-600 dark:text-green-400">Green = found</span>
                  </p>
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1 pb-6">
                  {Object.entries(groupWordsByLength(data.possibleWords))
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([length, words]) => (
                      <div key={length} className="space-y-1">
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1 py-0.5 bg-gray-50 dark:bg-gray-800/50 rounded">
                          {length} Letters ({words.length})
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                          {words.map((word) => {
                            const isUserFound = userFoundWords.includes(word.toUpperCase())
                            const isSelected = selectedWord === word
                            
                            return (
                              <motion.button
                                key={word}
                                onClick={() => handleWordClick(word)}
                                className={`
                                  text-xs px-1.5 py-0.5 rounded text-left transition-all
                                  ${isSelected
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ring-1 ring-blue-300 dark:ring-blue-700'
                                    : isUserFound
                                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                  }
                                `}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{word}</span>
                                  {isUserFound && (
                                    <span className="text-green-600 dark:text-green-400 text-xs ml-1">✓</span>
                                  )}
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
