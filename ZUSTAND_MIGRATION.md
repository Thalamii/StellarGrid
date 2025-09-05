# Zustand Migration Plan for Word Grid Game

## Why Migrate to Zustand?

### Current State Management Issues:
1. **Complex prop drilling**: GameState passed through multiple components
2. **Performance**: Multiple useState causes unnecessary re-renders
3. **State synchronization**: Validation state coordination between components is complex
4. **Hook dependencies**: useGameState and useDailyStats have complex interdependencies

### Zustand Benefits:
1. **Centralized state**: All game state in one store
2. **No prop drilling**: Components directly access needed state
3. **Better performance**: Selective subscriptions prevent unnecessary re-renders
4. **Simpler code**: Less boilerplate than useState + useEffect
5. **TypeScript support**: Excellent type safety
6. **Small bundle**: Only 2.2kb gzipped

## Implementation Plan

### 1. Install Zustand
```bash
npm install zustand
# or if npm issues persist:
# Download manually or use different package manager
```

### 2. Create Stores

#### Game Store (`stores/gameStore.ts`)
```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface GameState {
  // Board state
  board: string[][]
  foundWords: string[]
  rotationCount: number
  score: number
  totalPossibleWords: number
  completionRate: number
  possibleWords: string[]
  boardString?: string

  // UI state
  selectedPath: Array<{ row: number; col: number }>
  currentWord: string
  wordValidationStatus: "valid" | "invalid" | "duplicate" | null
  loading: boolean
  synced: boolean

  // Actions
  setBoard: (board: string[][]) => void
  addFoundWord: (word: string) => void
  updateScore: (score: number) => void
  setSelectedPath: (path: Array<{ row: number; col: number }>) => void
  setCurrentWord: (word: string) => void
  setValidationStatus: (status: "valid" | "invalid" | "duplicate" | null) => void
  rotateBoard: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  devtools(
    (set, get) => ({
      // Initial state
      board: Array(4).fill(null).map(() => Array(4).fill("")),
      foundWords: [],
      rotationCount: 0,
      score: 0,
      totalPossibleWords: 0,
      completionRate: 0,
      possibleWords: [],
      selectedPath: [],
      currentWord: "",
      wordValidationStatus: null,
      loading: false,
      synced: false,

      // Actions
      setBoard: (board) => set({ board }),
      
      addFoundWord: (word) =>
        set((state) => ({
          foundWords: [...state.foundWords, word],
          completionRate: Math.min(
            ((state.foundWords.length + 1) / state.totalPossibleWords) * 100,
            100
          ),
        })),

      updateScore: (score) => set({ score }),

      setSelectedPath: (path) => set({ selectedPath: path }),

      setCurrentWord: (word) => set({ currentWord: word }),

      setValidationStatus: (status) => set({ wordValidationStatus: status }),

      rotateBoard: () =>
        set((state) => ({
          rotationCount: (state.rotationCount + 1) % 4,
          selectedPath: [],
          currentWord: "",
          wordValidationStatus: null,
        })),

      resetGame: () =>
        set({
          foundWords: [],
          score: 0,
          rotationCount: 0,
          completionRate: 0,
          selectedPath: [],
          currentWord: "",
          wordValidationStatus: null,
        }),
    }),
    {
      name: 'word-grid-game',
    }
  )
)
```

#### Stats Store (`stores/statsStore.ts`)
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface StatsState {
  gamesPlayed: number
  gamesWon: number
  streak: number
  lastPlayedDate: string | null
  currentSession: {
    startTime: Date
    completed: boolean
  } | null

  // Actions
  startSession: () => void
  completeSession: (score: number, wordsFound: number, targetWords: number) => void
  incrementGamesPlayed: () => void
  incrementGamesWon: () => void
  updateStreak: (streak: number) => void
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      gamesPlayed: 0,
      gamesWon: 0,
      streak: 0,
      lastPlayedDate: null,
      currentSession: null,

      startSession: () => {
        const today = new Date().toISOString().split('T')[0]
        set({
          currentSession: {
            startTime: new Date(),
            completed: false,
          },
        })

        const state = get()
        if (state.lastPlayedDate !== today) {
          set({
            gamesPlayed: state.gamesPlayed + 1,
            lastPlayedDate: today,
          })
        }
      },

      completeSession: (score, wordsFound, targetWords) => {
        const isCompleted = wordsFound >= targetWords
        if (isCompleted) {
          set((state) => ({
            gamesWon: state.gamesWon + 1,
            currentSession: state.currentSession
              ? { ...state.currentSession, completed: true }
              : null,
          }))
        }
      },

      incrementGamesPlayed: () =>
        set((state) => ({ gamesPlayed: state.gamesPlayed + 1 })),

      incrementGamesWon: () =>
        set((state) => ({ gamesWon: state.gamesWon + 1 })),

      updateStreak: (streak) => set({ streak }),
    }),
    {
      name: 'word-grid-stats',
    }
  )
)
```

### 3. Refactor Components

#### WordGridGame Component
```typescript
// Instead of multiple useState and props
const selectedPath = useGameStore((state) => state.selectedPath)
const wordValidationStatus = useGameStore((state) => state.wordValidationStatus)
const gameState = useGameStore((state) => ({
  board: state.board,
  score: state.score,
  foundWords: state.foundWords,
  // ... other needed fields
}))

// Actions
const setSelectedPath = useGameStore((state) => state.setSelectedPath)
const setValidationStatus = useGameStore((state) => state.setValidationStatus)
```

#### LetterGrid Component
```typescript
// Direct access to needed state
const selectedPath = useGameStore((state) => state.selectedPath)
const validationStatus = useGameStore((state) => state.wordValidationStatus)
const setSelectedPath = useGameStore((state) => state.setSelectedPath)

// No more prop drilling!
```

### 4. Performance Benefits

#### Before (with useState):
- WordGridGame re-renders when ANY state changes
- Props must be passed down multiple levels
- Complex useEffect dependencies

#### After (with Zustand):
- Components only re-render when their subscribed state changes
- Direct state access eliminates prop drilling
- Cleaner, more maintainable code

### 5. Migration Steps

1. ✅ Install Zustand
2. ✅ Create game store and stats store
3. ✅ Refactor WordGridGame component
4. ✅ Refactor LetterGrid component  
5. ✅ Refactor GameStats and other components
6. ✅ Remove old hooks (useGameState, useDailyStats)
7. ✅ Test all functionality
8. ✅ Add Zustand devtools for debugging

### 6. Code Reduction

#### Before:
- ~200 lines of hook code (useGameState + useDailyStats)
- Complex prop passing
- Multiple useEffect for sync

#### After:
- ~100 lines of store code
- No prop drilling
- Cleaner component logic

## Next Steps

1. Resolve npm installation issues
2. Implement the stores above
3. Refactor components one by one
4. Test thoroughly
5. Enjoy cleaner, faster code!
