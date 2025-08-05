"use client"

import { useState, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LetterGrid } from "./letter-grid"
import { GameStats } from "./game-stats"
import { FoundWordsList } from "./found-words-list"
import { AnimatedScore } from "./animated-score"
import { DailyStats } from "./daily-stats"
import { SEOAccordion } from "./seo-accordion"
import { InstallPrompt } from "./install-prompt"
import { useGameState } from "@/hooks/use-game-state"
import { useDailyStats } from "@/hooks/use-daily-stats"

interface GameState {
  board: string[][]
  foundWords: string[]
  rotationCount: number
  score: number
  totalPossibleWords: number
  completionRate: number
  possibleWords?: string[]
}

export function WordGridGame() {
  const { startSession, completeSession } = useDailyStats()
  const [selectedPath, setSelectedPath] = useState<Array<{ row: number; col: number }>>([])
  const [currentWord, setCurrentWord] = useState("")
  const [wordValidationStatus, setWordValidationStatus] = useState<"valid" | "invalid" | "duplicate" | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [showAnimatedScore, setShowAnimatedScore] = useState(false)
  const [lastScoredWord, setLastScoredWord] = useState({ word: "", points: 0, isPuzzleComplete: false, isBonusWord: false, isInvalid: false, isDuplicate: false, message: "" })
  const [puzzleCompleted, setPuzzleCompleted] = useState(false)

  const initialState: GameState = {
    board: Array(4)
      .fill(null)
      .map(() => Array(4).fill("")),
    foundWords: [],
    rotationCount: 0,
    score: 0,
    totalPossibleWords: 0,
    completionRate: 0,
  }

  const { gameState, updateGameState, loading } = useGameState(initialState)

  // Start session when game loads and user makes first move
  const handleGameStart = useCallback(() => {
    if (!gameStarted) {
      startSession()
      setGameStarted(true)
    }
  }, [gameStarted, startSession])

  // Create a Set of possible words for O(1) lookup
  const possibleWordsSet = useMemo(() => {
    if (gameState.possibleWords) {
      return new Set(gameState.possibleWords.map((word) => word.toUpperCase()))
    }
    return new Set<string>()
  }, [gameState.possibleWords])

  const handlePathChange = useCallback(
    (path: Array<{ row: number; col: number }>) => {
      handleGameStart() // Start tracking when user starts playing
      setSelectedPath(path)
      setWordValidationStatus(null)

      if (gameState && path.length > 0) {
        const rotatedBoard = getRotatedBoard(gameState.board, gameState.rotationCount)
        const word = path.map((pos) => rotatedBoard[pos.row][pos.col]).join("")
        setCurrentWord(word)
      } else {
        setCurrentWord("")
      }
    },
    [gameState, handleGameStart],
  )

  const handleWordComplete = useCallback(
    async (word: string) => {
      if (!gameState) return

      const upperWord = word.toUpperCase()

      // Check if word is too short
      if (word.length < 4) {
        setWordValidationStatus("invalid")
        setLastScoredWord({
          word: upperWord,
          points: 0,
          isPuzzleComplete: false,
          isBonusWord: false,
          isInvalid: true,
          isDuplicate: false,
          message: "Too short! Words must be at least 4 letters long"
        })
        setShowAnimatedScore(true)
        setCurrentWord("")
        setSelectedPath([])
        return
      }

      // Check if already found
      if (gameState.foundWords.includes(upperWord)) {
        setWordValidationStatus("duplicate")
        setLastScoredWord({
          word: upperWord,
          points: 0,
          isPuzzleComplete: false,
          isBonusWord: false,
          isInvalid: false,
          isDuplicate: true,
          message: `Already found "${upperWord}"!`
        })
        setShowAnimatedScore(true)
        setCurrentWord("")
        setSelectedPath([])
        return
      }

      // Check if word exists in our possible answers
      if (possibleWordsSet.has(upperWord)) {
        setWordValidationStatus("valid")
        const newFoundWords = [...gameState.foundWords, upperWord]
        const newScore = gameState.score + calculateWordScore(word.length)
        
        // Cap completion rate at 100% even with bonus words
        const rawCompletionRate = (newFoundWords.length / gameState.totalPossibleWords) * 100
        const newCompletionRate = Math.min(rawCompletionRate, 100)
        
        // Check if this completes the puzzle (first time reaching target)
        const wasComplete = gameState.foundWords.length >= gameState.totalPossibleWords
        const isPuzzleComplete = newFoundWords.length >= gameState.totalPossibleWords && !wasComplete
        const isBonusWord = newFoundWords.length > gameState.totalPossibleWords
        
        // Track completion state
        if (isPuzzleComplete) {
          setPuzzleCompleted(true)
        }

        updateGameState({
          foundWords: newFoundWords,
          score: newScore,
          completionRate: newCompletionRate,
        })

        // Show animated score
        let message = ""
        if (isPuzzleComplete) {
          message = "🎉 Amazing! You found all 50 words! 🎉"
        } else if (isBonusWord) {
          message = `🌟 Bonus word! +${calculateWordScore(word.length)} points! 🌟`
        } else {
          message = `Great word! +${calculateWordScore(word.length)} points!`
        }
        
        setLastScoredWord({
          word: upperWord,
          points: calculateWordScore(word.length),
          isPuzzleComplete,
          isBonusWord,
          isInvalid: false,
          isDuplicate: false,
          message
        })
        setShowAnimatedScore(true)

        // Complete session if puzzle is finished (only first time)
        if (isPuzzleComplete) {
          completeSession(newScore, newFoundWords.length, gameState.totalPossibleWords)
        }
      } else {
        setWordValidationStatus("invalid")
        setLastScoredWord({
          word: upperWord,
          points: 0,
          isPuzzleComplete: false,
          isBonusWord: false,
          isInvalid: true,
          isDuplicate: false,
          message: `"${upperWord}" is not a valid word`
        })
        setShowAnimatedScore(true)
      }

      setCurrentWord("")
      setSelectedPath([])
    },
    [gameState, possibleWordsSet, updateGameState, completeSession],
  )

  const handleRotate = useCallback(() => {
    if (!gameState) return

    const newRotationCount = (gameState.rotationCount + 1) % 4

    updateGameState({
      rotationCount: newRotationCount,
    })

    setSelectedPath([])
    setCurrentWord("")
    setWordValidationStatus(null)
  }, [gameState, updateGameState])


  const calculateWordScore = (length: number): number => {
    return length // Points per letter: 4-letter word = 4 points, 5-letter = 5 points, etc.
  }

  const getRotatedBoard = (board: string[][], rotations: number): string[][] => {
    let rotatedBoard = board
    for (let i = 0; i < rotations; i++) {
      rotatedBoard = rotateBoard90(rotatedBoard)
    }
    return rotatedBoard
  }

  const rotateBoard90 = (board: string[][]): string[][] => {
    const n = board.length
    const rotated: string[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(""))

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        rotated[j][n - 1 - i] = board[i][j]
      }
    }

    return rotated
  }

  if (loading || !gameState.board[0][0]) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const rotatedBoard = getRotatedBoard(gameState.board, gameState.rotationCount)

  return (
    <>
      <div className="space-y-6">
        <GameStats
          score={gameState.score}
          wordsFound={gameState.foundWords.length}
          totalWords={gameState.totalPossibleWords}
          completionRate={gameState.completionRate}
        />

        {/* Current Word Display Above Board - Fixed Height Container */}
        <div className="text-center h-[5rem]">
          <motion.div 
            className="text-3xl font-bold text-gray-800 min-h-[2.5rem] flex items-center justify-center"
            key={currentWord}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {currentWord || "..."}
          </motion.div>
          
          {/* Word Length and Points Indicator - Always reserves space */}
          <div className="h-[2.5rem] flex items-center justify-center">
            {currentWord && (
              <motion.div 
                className="text-sm text-gray-600 flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <span className="px-2 py-1 bg-blue-100 rounded-full text-blue-700 font-medium">
                  {currentWord.length} letters
                </span>
                <span className="px-2 py-1 bg-green-100 rounded-full text-green-700 font-medium">
                  {currentWord.length} points
                </span>
              </motion.div>
            )}
          </div>
        </div>

        <LetterGrid
          board={rotatedBoard}
          selectedPath={selectedPath}
          onPathChange={handlePathChange}
          onWordComplete={handleWordComplete}
          rotation={0}
          wordValidationStatus={wordValidationStatus}
        />

        {/* Action Buttons Only */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleRotate}
            variant="outline"
            size="lg"
            className="neomorphic-small bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-0 text-blue-700"
          >
            <RotateCw className="w-5 h-5 mr-2" />
            Rotate
          </Button>
        </div>

        <FoundWordsList words={gameState.foundWords} />
        
        <DailyStats />
        
        <SEOAccordion />
      </div>
      
      <AnimatedScore
        points={lastScoredWord.points}
        word={lastScoredWord.word}
        show={showAnimatedScore}
        isPuzzleComplete={lastScoredWord.isPuzzleComplete}
        isBonusWord={lastScoredWord.isBonusWord}
        isInvalid={lastScoredWord.isInvalid}
        isDuplicate={lastScoredWord.isDuplicate}
        message={lastScoredWord.message}
        onComplete={() => setShowAnimatedScore(false)}
      />
      
      <InstallPrompt wordsFound={gameState.foundWords.length} />
    </>
  )
}
