import { type NextRequest, NextResponse } from "next/server"
import { words3 } from "@/utils/words3"

// Boggle dice configuration
const BOGGLE_DICE = [
  ["R", "I", "F", "O", "B", "X"],
  ["I", "F", "E", "H", "E", "Y"],
  ["D", "E", "N", "O", "W", "S"],
  ["U", "T", "O", "K", "N", "D"],
  ["H", "M", "S", "R", "A", "O"],
  ["L", "U", "P", "E", "T", "S"],
  ["A", "C", "I", "T", "O", "A"],
  ["Y", "L", "G", "K", "U", "E"],
  ["Q", "B", "M", "J", "O", "A"],
  ["E", "H", "I", "S", "P", "N"],
  ["V", "E", "T", "I", "G", "N"],
  ["B", "A", "L", "I", "Y", "T"],
  ["E", "Z", "A", "V", "N", "D"],
  ["R", "A", "L", "E", "S", "C"],
  ["U", "W", "I", "L", "R", "G"],
  ["P", "A", "C", "E", "M", "D"],
]

class TrieNode {
  children: Map<string, TrieNode>
  isEndOfWord: boolean

  constructor() {
    this.children = new Map()
    this.isEndOfWord = false
  }

  addWord(word: string) {
    let current = this
    for (const char of word.toUpperCase()) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode())
      }
      current = current.children.get(char)!
    }
    current.isEndOfWord = true
  }
}

class BoardSolver {
  board: string[][]
  trie: TrieNode
  answers: Set<string>

  constructor(board: string[][], trie: TrieNode) {
    this.board = board
    this.trie = trie
    this.answers = new Set()
  }

  findAllWords() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.dfs(i, j, "", new Set(), this.trie)
      }
    }
  }

  dfs(row: number, col: number, word: string, visited: Set<string>, trieNode: TrieNode) {
    if (row < 0 || row >= 4 || col < 0 || col >= 4) return

    const key = `${row},${col}`
    if (visited.has(key)) return

    const char = this.board[row][col]
    if (!trieNode.children.has(char)) return

    const newWord = word + char
    const newTrieNode = trieNode.children.get(char)!
    const newVisited = new Set(visited)
    newVisited.add(key)

    if (newTrieNode.isEndOfWord && newWord.length >= 3) {
      this.answers.add(newWord)
    }

    // Check all 8 directions
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ]

    for (const [dr, dc] of directions) {
      this.dfs(row + dr, col + dc, newWord, newVisited, newTrieNode)
    }
  }
}

function generateDateSeed(dateString: string): number {
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash | 0 // Convert to 32-bit signed integer
  }
  return Math.abs(hash)
}

// Stateful Linear Congruential Generator for deterministic seeded random
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed % 2147483647
    if (this.seed <= 0) this.seed += 2147483646
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max)
  }
}

function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]
  const rng = new SeededRandom(seed)
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateBoard(dateString: string): string[][] {
  const seed = generateDateSeed(dateString)
  const shuffledDice = shuffleArray(BOGGLE_DICE, seed)
  const rng = new SeededRandom(seed + 1000) // Different seed for dice rolling

  const board: string[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(""))

  for (let i = 0; i < 16; i++) {
    const die = shuffledDice[i]
    const faceIndex = rng.nextInt(6)
    const letter = die[faceIndex] // Keep Q as just Q, not QU

    const row = Math.floor(i / 4)
    const col = i % 4
    board[row][col] = letter
  }

  return board
}

function generateBoardWithMinWords(dateString: string, minWords: number = 50): { board: string[][], wordCount: number, attempts: number, allWords: string[] } {
  const baseSeed = generateDateSeed(dateString)
  let attempts = 0
  const maxAttempts = 100 // Prevent infinite loops
  
  // Build trie once
  const trie = new TrieNode()
  words3.forEach((word) => trie.addWord(word))
  
  while (attempts < maxAttempts) {
    attempts++
    // Use base seed + attempts to get different boards while keeping date deterministic
    const seedVariant = baseSeed + attempts
    const shuffledDice = shuffleArray(BOGGLE_DICE, seedVariant)
    
    const board: string[][] = Array(4)
      .fill(null)
      .map(() => Array(4).fill(""))
    
    const rng = new SeededRandom(seedVariant + 1000)
    for (let i = 0; i < 16; i++) {
      const die = shuffledDice[i]
      const faceIndex = rng.nextInt(6)
      const letter = die[faceIndex]
      
      const row = Math.floor(i / 4)
      const col = i % 4
      board[row][col] = letter
    }
    
    // Test this board
    const solver = new BoardSolver(board, trie)
    solver.findAllWords()
    const wordCount = solver.answers.size
    const allWords = Array.from(solver.answers).sort()
    
    if (wordCount >= minWords) {
      return { board, wordCount, attempts, allWords }
    }
  }
  
  // Fallback: return the last generated board even if it doesn't meet criteria
  console.warn(`Could not generate board with ${minWords}+ words after ${maxAttempts} attempts`)
  const fallbackSeed = baseSeed + maxAttempts
  const shuffledDice = shuffleArray(BOGGLE_DICE, fallbackSeed)
  
  const board: string[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(""))
  
  const fallbackRng = new SeededRandom(fallbackSeed + 1000)
  for (let i = 0; i < 16; i++) {
    const die = shuffledDice[i]
    const faceIndex = fallbackRng.nextInt(6)
    const letter = die[faceIndex]
    
    const row = Math.floor(i / 4)
    const col = i % 4
    board[row][col] = letter
  }
  
  const solver = new BoardSolver(board, trie)
  solver.findAllWords()
  const allWords = Array.from(solver.answers).sort()
  
  return { board, wordCount: solver.answers.size, attempts, allWords }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
    const minWords = parseInt(searchParams.get("minWords") || "50") // Allow customization via URL param

    // Generate board with minimum word count guarantee
    const { board, wordCount, attempts, allWords } = generateBoardWithMinWords(date, minWords)
    console.log(`Generated board for ${date} with ${wordCount} words in ${attempts} attempt(s)`)

    const allPossibleWords = allWords
    
    // Take first 50 words as target, rest as bonus
    const targetWords = allPossibleWords.slice(0, 50)
    const bonusWords = allPossibleWords.slice(50)

    return NextResponse.json({
      success: true,
      data: {
        date,
        board,
        possibleWords: allPossibleWords, // All words for validation
        targetWords: targetWords, // First 50 words for completion
        bonusWords: bonusWords, // Additional words for bonus points
        totalPossibleWords: Math.min(targetWords.length, 50), // Ensure exactly 50 for completion
        totalAllWords: allPossibleWords.length, // Total for stats
        boardString: board.flat().join(""),
        generationStats: {
          attempts,
          totalWordsFound: wordCount,
          meetsMinimum: wordCount >= minWords
        }
      },
    })
  } catch (error) {
    console.error("Error generating board:", error)
    return NextResponse.json({ success: false, error: "Failed to generate board" }, { status: 500 })
  }
}
