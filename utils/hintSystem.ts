// Simple Path Hint System for WordGrid
// Shows the first two letters of a word with selection highlighting and numbers

export interface PathHint {
  id: string
  word: string
  hintPositions: Array<{ row: number; col: number }>
  message: string
}

export interface HintState {
  dailyHintsUsed: number
  dailyHintsRemaining: number
  usedHintWordIds: string[]
  date: string
}

export class HintSystem {
  private words: string[]
  private foundWords: string[]
  private board: string[][]
  private wordPaths: Map<string, Array<{ row: number; col: number }>>

  constructor(
    words: string[], 
    foundWords: string[], 
    board: string[][], 
    wordPaths: Map<string, Array<{ row: number; col: number }>>
  ) {
    this.words = words
    this.foundWords = foundWords
    this.board = board
    this.wordPaths = wordPaths
  }

  // Get words available for hints (not found yet)
  getAvailableWords(): string[] {
    return this.words.filter(word => !this.foundWords.includes(word))
  }

  // Generate a path hint for a specific word
  generatePathHint(word: string): PathHint | null {
    const path = this.wordPaths.get(word)
    if (!path || path.length < 2) return null

    // Get first two positions
    const hintPositions = path.slice(0, 2)
    const letters = hintPositions.map(pos => this.board[pos.row][pos.col]).join('')
    
    // Create hint message without revealing the full word
    const wordLength = word.length
    const lengthText = wordLength === 4 ? 'four' : 
                      wordLength === 5 ? 'five' : 
                      wordLength === 6 ? 'six' : 
                      wordLength === 7 ? 'seven' : 
                      wordLength === 8 ? 'eight' : 
                      `${wordLength}`

    return {
      id: `hint-${word}`,
      word,
      hintPositions,
      message: `💡 "${letters}..." ${lengthText} letter word`
    }
  }

  // Get a smart hint recommendation
  getRecommendedHint(excludeWords: string[] = []): PathHint | null {
    const availableWords = this.getAvailableWords()
      .filter(word => !excludeWords.includes(word))
    
    if (availableWords.length === 0) return null

    // Group words by preference tiers for randomization
    const preferredWords = availableWords.filter(word => word.length >= 4 && word.length <= 6)
    const otherWords = availableWords.filter(word => word.length < 4 || word.length > 6)
    
    // Shuffle each group randomly
    const shuffledPreferred = this.shuffleArray([...preferredWords])
    const shuffledOthers = this.shuffleArray([...otherWords])
    
    // Try preferred words first (randomly ordered), then others
    const wordsToTry = [...shuffledPreferred, ...shuffledOthers]

    // Try to generate hint for words in random order
    for (const word of wordsToTry) {
      const hint = this.generatePathHint(word)
      if (hint) return hint
    }

    return null
  }
  
  // Simple array shuffle function (Fisher-Yates)
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Get all possible hints for debugging/testing
  getAllAvailableHints(): PathHint[] {
    const hints: PathHint[] = []
    const availableWords = this.getAvailableWords()

    for (const word of availableWords) {
      const hint = this.generatePathHint(word)
      if (hint) hints.push(hint)
    }

    return hints
  }
}

// Hint state management
export class HintStateManager {
  private static readonly STORAGE_KEY = 'wordgrid_hints'
  private static readonly DAILY_HINT_LIMIT = 3

  static getHintState(): HintState {
    if (typeof window === 'undefined') {
      return this.getDefaultState()
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const today = new Date().toISOString().split('T')[0]
        
        // Check if it's a new day
        if (parsed.date !== today) {
          // New day: reset daily hints
          return {
            dailyHintsUsed: 0,
            dailyHintsRemaining: this.DAILY_HINT_LIMIT,
            usedHintWordIds: [],
            date: today
          }
        }
        
        return parsed
      }
    } catch (error) {
      console.error('Error loading hint state:', error)
    }

    return this.getDefaultState()
  }

  static saveHintState(state: HintState): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Error saving hint state:', error)
    }
  }

  static useHint(wordId: string): HintState {
    const currentState = this.getHintState()
    
    if (currentState.dailyHintsRemaining <= 0) {
      throw new Error('No hints remaining for today')
    }

    if (currentState.usedHintWordIds.includes(wordId)) {
      throw new Error('Hint already used for this word')
    }

    const newState: HintState = {
      dailyHintsUsed: currentState.dailyHintsUsed + 1,
      dailyHintsRemaining: currentState.dailyHintsRemaining - 1,
      usedHintWordIds: [...currentState.usedHintWordIds, wordId],
      date: currentState.date
    }
    
    this.saveHintState(newState)
    return newState
  }

  static canUseHint(): boolean {
    const state = this.getHintState()
    return state.dailyHintsRemaining > 0
  }

  private static getDefaultState(): HintState {
    const today = new Date().toISOString().split('T')[0]
    return {
      dailyHintsUsed: 0,
      dailyHintsRemaining: this.DAILY_HINT_LIMIT,
      usedHintWordIds: [],
      date: today
    }
  }
}

export default HintSystem
