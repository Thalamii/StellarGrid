"use client"

import { Button } from "@/components/ui/button"
import { RotateCw } from "lucide-react"
import { motion } from "framer-motion"

interface WordInputProps {
  currentWord: string
  onRotate: () => void
  isValid: boolean
  isAlreadyFound: boolean
}

export function WordInput({ currentWord, onRotate, isValid, isAlreadyFound }: WordInputProps) {
  const getStatusMessage = () => {
    if (!currentWord) return "Drag across letters to form words"
    if (currentWord.length < 3) return "Need at least 3 letters"
    if (isAlreadyFound) return "Already found!"
    if (isValid) return "Great word!"
    return "Keep going..."
  }

  const getStatusColor = () => {
    if (!currentWord) return "text-gray-500"
    if (currentWord.length < 3) return "text-orange-500"
    if (isAlreadyFound) return "text-yellow-600"
    if (isValid) return "text-green-600"
    return "text-blue-500"
  }

  return (
    <div className="space-y-4">
      {/* Current Word Display */}
      <motion.div 
        className="text-3xl font-bold text-gray-800 mb-2 min-h-[2.5rem] flex items-center justify-center"
        key={currentWord}
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {currentWord || "..."}
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onRotate}
          variant="outline"
          size="lg"
          className="neomorphic-small bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-0 text-blue-700"
        >
          <RotateCw className="w-5 h-5 mr-2" />
          Rotate
        </Button>
      </div>
    </div>
  )
}
