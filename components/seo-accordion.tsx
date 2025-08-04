"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function SEOAccordion() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const sections = [
    {
      id: "what-is-wordgrid",
      title: "What is WordGrid?",
      content: "WordGrid is a captivating daily word puzzle game that follows the Boggle and Squardle format. Connect letters in a 4x4 grid to discover hidden words, with a new puzzle delivered every day."
    },
    {
      id: "more-than-squardle", 
      title: "More Than Just Squardle",
      content: "Enjoy the excitement of WordGrid, your go-to source for a daily word challenge. Experience features like unlimited board rotations and engaging gameplay."
    },
    {
      id: "key-features",
      title: "Key Features", 
      content: (
        <div className="space-y-3">
          <div><strong>Daily Fresh Puzzles</strong> - Engage in a new 4x4 word grid challenge with 50 target words every day.</div>
          <div><strong>Unlimited Rotations</strong> - Rotate the board to find new word connections and patterns.</div>
          <div><strong>Progress Tracking</strong> - Keep up with your daily improvements and build streaks.</div>
          <div><strong>Mobile Optimized</strong> - Seamless drag-and-drop controls for an enhanced mobile experience.</div>
        </div>
      )
    },
    {
      id: "master-word-squares",
      title: "Master Word Squares Games",
      content: "Focus on frequent word endings like -ING, -ED, or -ER. Utilize the rotation feature to uncover different patterns and look for extended words to increase your score. Practice daily to improve efficiency in spotting words."
    },
    {
      id: "why-choose-wordgrid",
      title: "Why Choose WordGrid?",
      content: "WordGrid combines the timeless Boggle-style play with innovative features. Experience a clean interface and strategic gameplay, enriched by daily challenges. It's perfect for those seeking brain-training fun and vocabulary enhancement."
    }
  ]

  return (
    <div className="neomorphic-large bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4">
        <h2 className="font-bold text-lg text-gray-800 mb-4 text-center">
          📚 About WordGrid - Daily Square Words Game
        </h2>
        
        <div className="space-y-2">
          {sections.map((section) => (
            <Card key={section.id} className="neomorphic-small overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="font-semibold text-gray-700">{section.title}</span>
                {expandedSection === section.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSection === section.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="text-gray-600 leading-relaxed">
                        {typeof section.content === 'string' ? (
                          <p>{section.content}</p>
                        ) : (
                          section.content
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Perfect for vocabulary building, brain training, and daily mental exercise.
          </p>
        </div>
      </div>
    </div>
  )
}
