"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { saveGameProgress, loadGameProgress, createOrUpdateUserProfile } from "@/lib/actions"

interface GameState {
  board: string[][]
  foundWords: string[]
  rotationCount: number
  score: number
  totalPossibleWords: number
  completionRate: number
  possibleWords?: string[]
  boardString?: string
}

interface DailyBoardResponse {
  success: boolean
  data: {
    date: string
    board: string[][]
    possibleWords: string[]
    targetWords: string[]
    bonusWords: string[]
    totalPossibleWords: number
    totalAllWords: number
    boardString: string
  }
}

export function useGameState(initialState: GameState) {
  const { user } = useAuth()
  const [gameState, setGameState] = useState<GameState>(initialState)
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)
  const [dailyBoard, setDailyBoard] = useState<DailyBoardResponse["data"] | null>(null)

  // Fetch daily board from API
  const fetchDailyBoard = useCallback(async (date: string) => {
    try {
      const response = await fetch(`/api/generate-board?date=${date}`)
      const result: DailyBoardResponse = await response.json()

      if (result.success) {
        setDailyBoard(result.data)
        return result.data
      } else {
        throw new Error("Failed to fetch daily board")
      }
    } catch (error) {
      console.error("Error fetching daily board:", error)
      return null
    }
  }, [])

  // Initialize game
  const initializeGame = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]

      // Fetch daily board first
      const boardData = await fetchDailyBoard(today)
      if (!boardData) {
        throw new Error("Could not fetch daily board")
      }

      if (user) {
        // Authenticated user - load from Supabase
        const result = await loadGameProgress(user.id)
        if (result.success && result.data) {
          setGameState({
            board: result.data.board,
            foundWords: result.data.found_words,
            rotationCount: result.data.rotation_count,
            score: result.data.score,
            totalPossibleWords: result.data.total_possible_words,
            completionRate: result.data.completion_rate,
            possibleWords: boardData.possibleWords,
            boardString: boardData.boardString,
          })
        } else {
          // No saved game, use fresh board
          setGameState({
            board: boardData.board,
            foundWords: [],
            rotationCount: 0,
            score: 0,
            totalPossibleWords: boardData.totalPossibleWords,
            completionRate: 0,
            possibleWords: boardData.possibleWords,
            boardString: boardData.boardString,
          })
        }

        // Ensure user profile exists
        await createOrUpdateUserProfile(user.id)
        setSynced(true)
      } else {
        // Anonymous user - use localStorage
        const existingGame = localStorage.getItem(`wordGridGame_${today}`)
        if (existingGame) {
          const parsed = JSON.parse(existingGame)
          setGameState({
            ...parsed,
            possibleWords: boardData.possibleWords,
            boardString: boardData.boardString,
          })
        } else {
          setGameState({
            board: boardData.board,
            foundWords: [],
            rotationCount: 0,
            score: 0,
            totalPossibleWords: boardData.totalPossibleWords,
            completionRate: 0,
            possibleWords: boardData.possibleWords,
            boardString: boardData.boardString,
          })
        }
      }
    } catch (error) {
      console.error("Failed to initialize game:", error)
    } finally {
      setLoading(false)
    }
  }, [user, fetchDailyBoard])

  // Auto-initialize when component mounts or user changes
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  const saveGameToStorage = useCallback(
    async (state: GameState) => {
      const today = new Date().toISOString().split("T")[0]

      if (user) {
        // Save to Supabase for authenticated users
        try {
          await saveGameProgress(user.id, state)
        } catch (error) {
          console.error("Failed to save to Supabase:", error)
          // Fallback to localStorage
          localStorage.setItem(`wordGridGame_${today}`, JSON.stringify(state))
        }
      } else {
        // Save to localStorage for anonymous users
        localStorage.setItem(`wordGridGame_${today}`, JSON.stringify(state))
      }
    },
    [user],
  )

  const updateGameState = useCallback(
    (updates: Partial<GameState>) => {
      setGameState((prev) => {
        const newState = { ...prev, ...updates }
        // Auto-save
        saveGameToStorage(newState)
        return newState
      })
    },
    [saveGameToStorage],
  )

  return {
    gameState,
    updateGameState,
    loading,
    synced,
    dailyBoard,
    initializeGame,
  }
}
