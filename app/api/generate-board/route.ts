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
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateBoard(dateString: string): string[][] {
  const seed = generateDateSeed(dateString)
  const shuffledDice = shuffleArray(BOGGLE_DICE, seed)

  const board: string[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(""))

  for (let i = 0; i < 16; i++) {
    const die = shuffledDice[i]
    const faceIndex = Math.floor(seededRandom(seed + i + 100) * 6)
    const letter = die[faceIndex] // Keep Q as just Q, not QU

    const row = Math.floor(i / 4)
    const col = i % 4
    board[row][col] = letter
  }

  return board
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Generate board
    const board = generateBoard(date)

    // Build trie from dictionary
    const trie = new TrieNode()
    words3.forEach((word) => trie.addWord(word))

    // Find all possible words
    const solver = new BoardSolver(board, trie)
    solver.findAllWords()

    const allPossibleWords = Array.from(solver.answers).sort()
    
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
        totalPossibleWords: targetWords.length, // 50 for completion calculation
        totalAllWords: allPossibleWords.length, // Total for stats
        boardString: board.flat().join(""),
      },
    })
  } catch (error) {
    console.error("Error generating board:", error)
    return NextResponse.json({ success: false, error: "Failed to generate board" }, { status: 500 })
  }
}
