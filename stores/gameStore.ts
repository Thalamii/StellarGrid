import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { saveGameProgress, loadGameProgress, createOrUpdateUserProfile } from '@/lib/actions'
import { deobfuscateWords } from '@/utils/wordObfuscation'
import { HintSystem, HintStateManager, PathHint, HintState } from '@/utils/hintSystem'
import { WordPathFinder } from '@/utils/wordPathFinder'

// Types
interface GameState {
  board: string[][]
  foundWords: string[]
  rotationCount: number
  score: number
  totalPossibleWords: number
  completionRate: number
  possibleWords?: string[]
  boardString?: string
  // Hint system data
  currentHint?: PathHint | null
  hintState?: HintState
}

interface DailyStats {
  gamesPlayed: number
  gamesWon: number
  streak: number
  lastPlayedDate: string | null
}

interface GameSession {
  startTime: Date
  endTime?: Date
  completed: boolean
}

interface DailyBoardResponse {
  success: boolean
  data: {
    date: string
    board: string[][]
    possibleWords: string[] | string // Can be array or obfuscated string
    targetWords: string[] | string   // Can be array or obfuscated string
    bonusWords: string[] | string    // Can be array or obfuscated string
    totalPossibleWords: number
    totalAllWords: number
    boardString: string
  }
}

interface GameStore {
  // Game State
  gameState: GameState
  loading: boolean
  synced: boolean
  dailyBoard: DailyBoardResponse['data'] | null
  
  // Daily Stats
  stats: DailyStats
  currentSession: GameSession | null
  statsLoading: boolean
  
  // User context
  user: any // From auth
  
  // Hint System
  hintSystem: HintSystem | null
  currentHint: PathHint | null
  hintState: HintState
  
  // Actions
  setUser: (user: any) => void
  updateGameState: (updates: Partial<GameState>) => void
  initializeGame: () => Promise<void>
  fetchDailyBoard: (date: string) => Promise<DailyBoardResponse['data'] | null>
  
  // Stats actions
  loadStats: () => void
  startSession: () => void
  completeSession: (finalScore: number, wordsFound: number, targetWords: number) => void
  refreshStats: () => void
  
  // Hint actions
  getHint: () => void
  clearHint: () => void
  initializeHintSystem: () => void
}

// Utility functions
const STATS_KEY = 'wordgrid_stats'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache

let statsCache: { data: DailyStats; timestamp: number } | null = null

// Helper function to deobfuscate board data
function deobfuscateBoardData(boardData: DailyBoardResponse['data']): DailyBoardResponse['data'] {
  try {
    // If possibleWords is a string, it's obfuscated - decode it
    if (typeof boardData.possibleWords === 'string') {
      const deobfuscatedPossibleWords = deobfuscateWords(boardData.possibleWords, boardData.date)
      const deobfuscatedTargetWords = typeof boardData.targetWords === 'string' 
        ? deobfuscateWords(boardData.targetWords, boardData.date)
        : boardData.targetWords || []
      const deobfuscatedBonusWords = typeof boardData.bonusWords === 'string'
        ? deobfuscateWords(boardData.bonusWords, boardData.date)
        : boardData.bonusWords || []
      
      return {
        ...boardData,
        possibleWords: deobfuscatedPossibleWords,
        targetWords: deobfuscatedTargetWords,
        bonusWords: deobfuscatedBonusWords
      }
    }
    
    // If it's already an array, return as-is (backward compatibility)
    return boardData
  } catch (error) {
    console.error('Failed to deobfuscate board data:', error)
    // Return original data if deobfuscation fails
    return boardData
  }
}

function isConsecutiveDay(lastDate: string, currentDate: string): boolean {
  const last = new Date(lastDate)
  const current = new Date(currentDate)
  const diffTime = current.getTime() - last.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 1
}

function getFromCache(): DailyStats | null {
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
    return statsCache.data
  }
  return null
}

function setCache(data: DailyStats): void {
  statsCache = { data: { ...data }, timestamp: Date.now() }
}

export const useGameStore = create<GameStore>()(subscribeWithSelector((set, get) => ({
  // Initial state
  gameState: {
    board: Array(4).fill(null).map(() => Array(4).fill("")),
    foundWords: [],
    rotationCount: 0,
    score: 0,
    totalPossibleWords: 0,
    completionRate: 0
  },
  loading: false,
  synced: false,
  dailyBoard: null,
  
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    streak: 0,
    lastPlayedDate: null
  },
  currentSession: null,
  statsLoading: false,
  
  user: null,
  
  // Hint System
  hintSystem: null,
  currentHint: null,
  hintState: HintStateManager.getHintState(),
  
  // Actions
  setUser: (user) => {
    set({ user })
    // Re-initialize when user changes
    get().initializeGame()
  },
  
  fetchDailyBoard: async (date: string) => {
    try {
      const response = await fetch(`/api/generate-board?date=${date}`)
      const result: DailyBoardResponse = await response.json()
      
      if (result.success) {
        // Deobfuscate the board data before storing
        const deobfuscatedData = deobfuscateBoardData(result.data)
        set({ dailyBoard: deobfuscatedData })
        return deobfuscatedData
      } else {
        throw new Error('Failed to fetch daily board')
      }
    } catch (error) {
      console.error('Error fetching daily board:', error)
      return null
    }
  },
  
  initializeGame: async () => {
    set({ loading: true })
    try {
      const today = new Date().toISOString().split('T')[0]
      const { user } = get()
      
      // Fetch daily board first
      const boardData = await get().fetchDailyBoard(today)
      if (!boardData) {
        throw new Error('Could not fetch daily board')
      }
      
      if (user) {
        // Authenticated user - load from Supabase
        const result = await loadGameProgress(user.id)
        if (result.success && result.data) {
          set({
            gameState: {
              board: result.data.board,
              foundWords: result.data.found_words,
              rotationCount: result.data.rotation_count,
              score: result.data.score,
              totalPossibleWords: result.data.total_possible_words,
              completionRate: result.data.completion_rate,
              possibleWords: boardData.possibleWords,
              boardString: boardData.boardString,
            }
          })
        } else {
          // No saved game, use fresh board
          set({
            gameState: {
              board: boardData.board,
              foundWords: [],
              rotationCount: 0,
              score: 0,
              totalPossibleWords: boardData.totalPossibleWords,
              completionRate: 0,
              possibleWords: boardData.possibleWords,
              boardString: boardData.boardString,
            }
          })
        }
        
        // Ensure user profile exists
        await createOrUpdateUserProfile(user.id)
        set({ synced: true })
      } else {
        // Anonymous user - use localStorage
        const existingGame = localStorage.getItem(`wordGridGame_${today}`)
        if (existingGame) {
          const parsed = JSON.parse(existingGame)
          set({
            gameState: {
              ...parsed,
              possibleWords: boardData.possibleWords,
              boardString: boardData.boardString,
            }
          })
        } else {
          set({
            gameState: {
              board: boardData.board,
              foundWords: [],
              rotationCount: 0,
              score: 0,
              totalPossibleWords: boardData.totalPossibleWords,
              completionRate: 0,
              possibleWords: boardData.possibleWords,
              boardString: boardData.boardString,
            }
          })
        }
      }
    } catch (error) {
      console.error('Failed to initialize game:', error)
    } finally {
      set({ loading: false })
    }
  },
  
  updateGameState: (updates) => {
    const { user, gameState } = get()
    const newState = { ...gameState, ...updates }
    
    set({ gameState: newState })
    
    // Auto-save
    const today = new Date().toISOString().split('T')[0]
    
    if (user) {
      // Save to Supabase for authenticated users
      saveGameProgress(user.id, newState).catch((error) => {
        console.error('Failed to save to Supabase:', error)
        // Fallback to localStorage
        localStorage.setItem(`wordGridGame_${today}`, JSON.stringify(newState))
      })
    } else {
      // Save to localStorage for anonymous users
      localStorage.setItem(`wordGridGame_${today}`, JSON.stringify(newState))
    }
  },
  
  // Stats actions
  loadStats: () => {
    // Check cache first
    const cachedStats = getFromCache()
    if (cachedStats) {
      set({ stats: cachedStats })
      return
    }
    
    set({ statsLoading: true })
    try {
      const savedStats = localStorage.getItem(STATS_KEY)
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats)
        set({ stats: parsedStats })
        setCache(parsedStats)
      } else {
        // Initialize default stats
        const defaultStats: DailyStats = {
          gamesPlayed: 0,
          gamesWon: 0,
          streak: 0,
          lastPlayedDate: null
        }
        set({ stats: defaultStats })
        setCache(defaultStats)
        localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats))
      }
    } catch (error) {
      console.error('Error loading stats from localStorage:', error)
      // Reset to default if corrupted
      const defaultStats: DailyStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        streak: 0,
        lastPlayedDate: null
      }
      set({ stats: defaultStats })
      setCache(defaultStats)
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats))
      } catch (e) {
        console.warn('Failed to save default stats to localStorage:', e)
      }
    } finally {
      set({ statsLoading: false })
    }
  },
  
  startSession: () => {
    const { stats } = get()
    const today = new Date().toISOString().split('T')[0]
    const session: GameSession = {
      startTime: new Date(),
      completed: false
    }
    set({ currentSession: session })
    
    // Check if this is a new day and update streak accordingly
    if (stats.lastPlayedDate !== today) {
      let newStreak = stats.streak
      
      if (stats.lastPlayedDate === null) {
        // First time playing
        newStreak = 1
      } else if (isConsecutiveDay(stats.lastPlayedDate, today)) {
        // Consecutive day, increment streak
        newStreak = stats.streak + 1
      } else {
        // Gap in playing, reset streak to 1
        newStreak = 1
      }
      
      const newStats: DailyStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        streak: newStreak,
        lastPlayedDate: today
      }
      
      // Save stats
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(newStats))
        set({ stats: newStats })
        setCache(newStats)
      } catch (error) {
        console.error('Error saving stats to localStorage:', error)
        // Still update state even if localStorage fails
        set({ stats: newStats })
        setCache(newStats)
      }
    }
  },
  
  completeSession: (finalScore: number, wordsFound: number, targetWords: number) => {
    const { currentSession, stats } = get()
    if (!currentSession) return
    
    const isCompleted = wordsFound >= targetWords
    const today = new Date().toISOString().split('T')[0]
    
    const updatedSession = {
      ...currentSession,
      endTime: new Date(),
      completed: isCompleted
    }
    
    // Only increment games won if puzzle is completed and we haven't already won today
    if (isCompleted && stats.lastPlayedDate === today) {
      const newStats: DailyStats = {
        ...stats,
        gamesWon: stats.gamesWon + 1
      }
      
      // Save stats
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(newStats))
        set({ stats: newStats })
        setCache(newStats)
      } catch (error) {
        console.error('Error saving stats to localStorage:', error)
        // Still update state even if localStorage fails
        set({ stats: newStats })
        setCache(newStats)
      }
    }
    
    set({ currentSession: updatedSession })
  },
  
  refreshStats: () => {
    get().loadStats()
  },
  
  // Hint System Actions
  initializeHintSystem: () => {
    const { gameState, dailyBoard } = get()
    
    if (!gameState.possibleWords || !dailyBoard) {
      console.warn('Cannot initialize hint system - missing data')
      return
    }
    
    try {
      // Find paths for all words
      const pathFinder = new WordPathFinder(gameState.board, gameState.possibleWords)
      const wordPaths = pathFinder.getAllWordPaths()
      
      // Initialize hint system
      const hintSystem = new HintSystem(
        gameState.possibleWords,
        gameState.foundWords,
        gameState.board,
        wordPaths
      )
      
      set({ 
        hintSystem,
        hintState: HintStateManager.getHintState()
      })
      
      console.log(`💡 Hint system initialized with ${wordPaths.size} word paths`)
    } catch (error) {
      console.error('Error initializing hint system:', error)
    }
  },
  
  getHint: () => {
    const { hintSystem, hintState, gameState } = get()
    
    if (!hintSystem) {
      console.warn('Hint system not initialized')
      get().initializeHintSystem()
      return
    }
    
    if (!HintStateManager.canUseHint()) {
      console.warn('No hints remaining for today')
      return
    }
    
    try {
      // Reinitialize hint system with current found words
      if (!gameState.possibleWords) {
        console.warn('No possible words available')
        return
      }
      
      const pathFinder = new WordPathFinder(gameState.board, gameState.possibleWords)
      const wordPaths = pathFinder.getAllWordPaths()
      
      const updatedHintSystem = new HintSystem(
        gameState.possibleWords,
        gameState.foundWords,
        gameState.board,
        wordPaths
      )
      
      // Get a recommended hint from updated system
      const hint = updatedHintSystem.getRecommendedHint(hintState.usedHintWordIds)
      
      if (!hint) {
        console.warn('No hints available')
        return
      }
      
      // Use the hint
      const newHintState = HintStateManager.useHint(hint.word)
      
      set({ 
        currentHint: hint,
        hintState: newHintState,
        hintSystem: updatedHintSystem
      })
      
      console.log('💡 Hint provided:', hint.message)
      
      // Auto-clear hint after 3 seconds
      setTimeout(() => {
        const currentState = get()
        if (currentState.currentHint?.id === hint.id) {
          get().clearHint()
        }
      }, 3000)
      
    } catch (error) {
      console.error('Error getting hint:', error)
    }
  },
  
  clearHint: () => {
    set({ currentHint: null })
  }
})))

// Initialize stats and game when store is created
if (typeof window !== 'undefined') {
  const store = useGameStore.getState()
  store.loadStats()
  store.initializeGame()
}
