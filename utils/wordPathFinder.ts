// Word Path Finder for Hint System
// Finds the path for each word on the board

export interface Position {
  row: number
  col: number
}

export class WordPathFinder {
  private board: string[][]
  private words: string[]
  private wordPaths: Map<string, Position[]>

  constructor(board: string[][], words: string[]) {
    this.board = board
    this.words = words
    this.wordPaths = new Map()
    this.findAllWordPaths()
  }

  // Find paths for all words
  private findAllWordPaths(): void {
    for (const word of this.words) {
      const path = this.findWordPath(word)
      if (path) {
        this.wordPaths.set(word, path)
      }
    }
  }

  // Find path for a specific word
  private findWordPath(word: string): Position[] | null {
    const upperWord = word.toUpperCase()
    
    // Try starting from each position on the board
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if (this.board[row][col] === upperWord[0]) {
          const path = this.searchPath(upperWord, row, col, [], new Set())
          if (path) return path
        }
      }
    }
    
    return null
  }

  // Recursively search for word path using DFS
  private searchPath(
    word: string, 
    row: number, 
    col: number, 
    currentPath: Position[], 
    visited: Set<string>
  ): Position[] | null {
    // Check bounds
    if (row < 0 || row >= 4 || col < 0 || col >= 4) return null
    
    const posKey = `${row}-${col}`
    if (visited.has(posKey)) return null
    
    // Check if current letter matches
    const currentLetter = this.board[row][col]
    const expectedLetter = word[currentPath.length]
    
    if (currentLetter !== expectedLetter) return null
    
    // Add current position to path
    const newPath = [...currentPath, { row, col }]
    const newVisited = new Set([...visited, posKey])
    
    // Check if word is complete
    if (newPath.length === word.length) {
      return newPath
    }
    
    // Search adjacent positions
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ]
    
    for (const [dr, dc] of directions) {
      const nextRow = row + dr
      const nextCol = col + dc
      
      const result = this.searchPath(word, nextRow, nextCol, newPath, newVisited)
      if (result) return result
    }
    
    return null
  }

  // Get path for a specific word
  getWordPath(word: string): Position[] | null {
    return this.wordPaths.get(word) || null
  }

  // Get all word paths
  getAllWordPaths(): Map<string, Position[]> {
    return new Map(this.wordPaths)
  }

  // Check if a word has a valid path
  hasWordPath(word: string): boolean {
    return this.wordPaths.has(word)
  }

  // Get words that have valid paths
  getWordsWithPaths(): string[] {
    return Array.from(this.wordPaths.keys())
  }

  // Debug: log all found paths
  debugPaths(): void {
    console.log('🔍 Word Paths Found:')
    for (const [word, path] of this.wordPaths.entries()) {
      const pathStr = path.map(p => `(${p.row},${p.col})`).join(' → ')
      console.log(`  ${word}: ${pathStr}`)
    }
    console.log(`Total words with paths: ${this.wordPaths.size}`)
  }
}
