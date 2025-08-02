// Trie Node implementation for efficient word validation
export class TrieNode {
  children: Map<string, TrieNode>
  eow: boolean // End of word

  constructor() {
    this.children = new Map()
    this.eow = false
  }

  addWord(word: string) {
    let curr = this
    for (let i = 0; i < word.length; i++) {
      const letter = word[i]
      if (curr.children.get(letter) == null) {
        curr.children.set(letter, new TrieNode())
      }
      curr = curr.children.get(letter)!
      if (i == word.length - 1) {
        curr.eow = true
      }
    }
  }

  check(word: string): boolean {
    let curr = this
    for (const letter of word) {
      if (curr.children.get(letter) == null) {
        return false
      }
      curr = curr.children.get(letter)!
    }
    return curr.eow
  }
}

// Board class for word finding using DFS
export class Board {
  board: string[][]
  size: number
  answers: Set<string>

  constructor(boardStr: string) {
    this.validate(boardStr)
    const arr = boardStr.split("-")
    this.board = []
    for (const item of arr) {
      this.board.push(item.split(""))
    }
    this.size = arr.length
    this.answers = new Set()
  }

  validate(boardStr: string) {
    // Split the string into individual rows
    const arr = boardStr.split("-")
    // Check whether each row has the same length
    for (const item of arr) {
      if (item.length !== arr.length) {
        throw new Error("Board does not represent a square. Please re-check your input")
      }
    }
    // Check whether the size is valid
    if (arr.length < 3) {
      throw new Error("Minimum board size is 3")
    }
  }

  dfs(address: number[], wordSoFar: string, pathSoFar: Set<number>, trie: TrieNode) {
    // Check whether this letter makes a valid prefix
    const newTrie = trie.children.get(this.board[address[0]][address[1]])
    if (newTrie == null) {
      return
    }
    // Check whether this letter is EOW
    const updatedWord = wordSoFar + this.board[address[0]][address[1]]
    if (newTrie.eow && updatedWord.length >= 3) {
      this.answers.add(updatedWord)
    }
    pathSoFar.add(this.encode(address))
    for (const nb of this.getNBs(address)) {
      // For each neighbouring letter...
      if (!pathSoFar.has(this.encode(nb))) {
        // If the nb is not in the path
        this.dfs(nb, updatedWord, pathSoFar, newTrie)
      }
    }
    pathSoFar.delete(this.encode(address))
  }

  encode(address: number[]): number {
    return this.size * address[0] + address[1] + 1
  }

  getNBs(address: number[]): number[][] {
    const dirs = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ]
    const arr = []
    for (const dir of dirs) {
      const x = address[0] + dir[0]
      const y = address[1] + dir[1]
      if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
        arr.push([x, y])
      }
    }
    return arr
  }
}

// Boggle dice configuration (16 dice, each with 6 faces)
const BOGGLE_DICE = [
  "AAEEGN",
  "ABBJOO",
  "ACHOPS",
  "AFFKPS",
  "AOOTTW",
  "CIMOTU",
  "DEILRX",
  "DELRVY",
  "DISTTY",
  "EEGHNW",
  "EEINSU",
  "EHRTVW",
  "EIOSST",
  "ELRTTY",
  "HIMNQU",
  "HLNNRZ",
]

// Generate date-based seed
function generateDateSeed(dateString: string): number {
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

// Shuffle array using seeded random
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]
  let currentSeed = seed

  for (let i = shuffled.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const j = Math.floor((currentSeed / 233280) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

// Generate daily board
export async function generateDailyBoard(dateString: string): Promise<string[][]> {
  const seed = generateDateSeed(dateString)
  let currentSeed = seed

  // Shuffle dice
  const shuffledDice = shuffleArray(BOGGLE_DICE, currentSeed)

  // Roll each die
  const letters: string[] = []
  for (let i = 0; i < 16; i++) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const dieIndex = Math.floor((currentSeed / 233280) * 6)
    let letter = shuffledDice[i][dieIndex]

    // Handle special Q case - convert to single character for board consistency
    if (letter === "Q") {
      letter = "Q" // Keep as single Q, handle QU logic in word validation
    }

    letters.push(letter)
  }

  // Arrange in 4x4 grid
  const board: string[][] = []
  for (let i = 0; i < 4; i++) {
    const row: string[] = []
    for (let j = 0; j < 4; j++) {
      row.push(letters[i * 4 + j])
    }
    board.push(row)
  }

  return board
}

// Helper function to convert 2D board array to string format for Board class
export function boardToString(board: string[][]): string {
  // Convert each row to a string, then join with dashes
  return board.map((row) => row.join("")).join("-")
}

// Validate word on board
export function validateWord(word: string, board: string[][], path: Array<{ row: number; col: number }>): boolean {
  if (path.length === 0) return false

  // Check if path forms the word
  const pathWord = path.map((pos) => board[pos.row][pos.col]).join("")
  if (pathWord.toUpperCase() !== word.toUpperCase()) return false

  // Check if path is valid (adjacent cells)
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1]
    const curr = path[i]
    const rowDiff = Math.abs(prev.row - curr.row)
    const colDiff = Math.abs(prev.col - curr.col)

    // Must be adjacent (including diagonally)
    if (rowDiff > 1 || colDiff > 1 || (rowDiff === 0 && colDiff === 0)) {
      return false
    }
  }

  // Check for duplicate positions
  const positions = new Set()
  for (const pos of path) {
    const key = `${pos.row},${pos.col}`
    if (positions.has(key)) return false
    positions.add(key)
  }

  return true
}

// Find all possible words on a board
export function findAllWords(board: string[][]): string[] {
  // This would require the full dictionary to be loaded
  // For now, return empty array as this is handled by the Board class
  return []
}
