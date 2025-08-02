"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FoundWordsListProps {
  words: string[]
}

export function FoundWordsList({ words }: FoundWordsListProps) {
  const getWordColor = (word: string): string => {
    const length = word.length
    if (length >= 7) return "from-purple-100 to-purple-200 text-purple-800"
    if (length >= 6) return "from-blue-100 to-blue-200 text-blue-800"
    if (length >= 5) return "from-green-100 to-green-200 text-green-800"
    if (length >= 4) return "from-yellow-100 to-yellow-200 text-yellow-800"
    return "from-gray-100 to-gray-200 text-gray-800"
  }

  if (words.length === 0) {
    return (
      <div className="neomorphic-large p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Found Words</h3>
        <div className="text-center text-gray-500 py-8">
          <p>No words found yet.</p>
          <p className="text-sm mt-2">Start dragging across letters to find words!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="neomorphic-large p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Found Words ({words.length})</h3>
      <ScrollArea className="h-48">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <AnimatePresence>
            {words.map((word, index) => (
              <motion.div
                key={word}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`neomorphic-small p-2 rounded-lg bg-gradient-to-r ${getWordColor(word)} text-center font-medium text-sm`}
              >
                <div className="flex items-center justify-between">
                  <span>{word}</span>
                  <span className="text-xs opacity-70 ml-1">+{word.length}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
