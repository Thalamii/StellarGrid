import { type NextRequest, NextResponse } from "next/server"
import { words3 } from "@/utils/words3"

// Add these lines after your imports
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

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

// Word length requirements
interface LengthRequirements {
  [length: number]: number
}

const DEFAULT_LENGTH_REQUIREMENTS: LengthRequirements = {
  6: 5,  // At least 5 six-letter words
  7: 5,  // At least 5 seven-letter words
  8: 5   // At least 5 eight-letter words
}

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
  // Use a more robust hash function that creates better distribution
  let hash = 0x811c9dc5 // FNV offset basis
  
  for (let i = 0; i < dateString.length; i++) {
    hash ^= dateString.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0 // FNV prime, unsigned 32-bit
  }
  
  // Additional mixing to ensure different dates produce very different seeds
  hash = ((hash >>> 16) ^ hash) * 0x85ebca6b
  hash = ((hash >>> 13) ^ hash) * 0xc2b2ae35
  hash = (hash >>> 16) ^ hash
  
  return Math.abs(hash) + 1 // Ensure positive and non-zero
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

// Check if word length requirements are met
function checkLengthRequirements(words: string[], requirements: LengthRequirements): boolean {
  const lengthCounts: { [length: number]: number } = {}
  
  // Count words by length
  words.forEach(word => {
    const len = word.length
    lengthCounts[len] = (lengthCounts[len] || 0) + 1
  })
  
  // Check if all requirements are met
  for (const [length, required] of Object.entries(requirements)) {
    const lengthNum = parseInt(length)
    const count = lengthCounts[lengthNum] || 0
    if (count < required) {
      return false
    }
  }
  
  return true
}

// Get word distribution by length
function getWordDistribution(words: string[]): { [length: number]: number } {
  const distribution: { [length: number]: number } = {}
  
  words.forEach(word => {
    const len = word.length
    distribution[len] = (distribution[len] || 0) + 1
  })
  
  return distribution
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

// Keep original function for backward compatibility
function generateBoardWithMinWords(dateString: string, minWords: number = 50): { board: string[][], wordCount: number, attempts: number, allWords: string[] } {
  const result = generateBoardWithRequirements(dateString, minWords, DEFAULT_LENGTH_REQUIREMENTS)
  // Return original format without distribution
  return {
    board: result.board,
    wordCount: result.wordCount,
    attempts: result.attempts,
    allWords: result.allWords
  }
}

function generateBoardWithRequirements(
  dateString: string, 
  minWords: number = 50, 
  lengthRequirements: LengthRequirements = DEFAULT_LENGTH_REQUIREMENTS
): { board: string[][], wordCount: number, attempts: number, allWords: string[], distribution: { [length: number]: number } } {
  const baseSeed = generateDateSeed(dateString)
  let attempts = 0
  const maxAttempts = 200 // Balanced for better results without timeout risk
  
  // Build trie once
  const trie = new TrieNode()
  words3.forEach((word) => trie.addWord(word))
  
  let bestBoard: string[][] | null = null
  let bestWords: string[] = []
  let bestDistribution: { [length: number]: number } = {}
  let bestScore = 0
  
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
    const distribution = getWordDistribution(allWords)
    
    // Calculate a score based on how well this board meets our requirements
    let score = wordCount
    if (checkLengthRequirements(allWords, lengthRequirements)) {
      score += 1000 // Big bonus for meeting length requirements
    } else {
      // Partial score for getting closer to length requirements
      for (const [length, required] of Object.entries(lengthRequirements)) {
        const lengthNum = parseInt(length)
        const count = distribution[lengthNum] || 0
        score += Math.min(count, required) * 10
      }
    }
    
    if (score > bestScore) {
      bestScore = score
      bestBoard = board
      bestWords = allWords
      bestDistribution = distribution
    }
    
    // Early exit if we found a perfect board
    if (wordCount >= minWords && checkLengthRequirements(allWords, lengthRequirements)) {
      return { board, wordCount, attempts, allWords, distribution }
    }
  }
  
  // Return the best board found, even if it doesn't meet all criteria
  if (bestBoard) {
    console.warn(`Best board found after ${maxAttempts} attempts:`, {
      totalWords: bestWords.length,
      distribution: bestDistribution,
      meetsLengthRequirements: checkLengthRequirements(bestWords, lengthRequirements)
    })
    return { 
      board: bestBoard, 
      wordCount: bestWords.length, 
      attempts: maxAttempts, 
      allWords: bestWords,
      distribution: bestDistribution
    }
  }
  
  // Ultimate fallback
  console.error(`Failed to generate any valid board after ${maxAttempts} attempts`)
  const fallbackBoard = generateBoard(dateString)
  const solver = new BoardSolver(fallbackBoard, trie)
  solver.findAllWords()
  const fallbackWords = Array.from(solver.answers).sort()
  
  return { 
    board: fallbackBoard, 
    wordCount: solver.answers.size, 
    attempts: maxAttempts, 
    allWords: fallbackWords,
    distribution: getWordDistribution(fallbackWords)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
    const minWords = parseInt(searchParams.get("minWords") || "50")
    
    // Parse custom length requirements from URL if provided
    const customRequirements: LengthRequirements = { ...DEFAULT_LENGTH_REQUIREMENTS }
    const req6 = searchParams.get("req6")
    const req7 = searchParams.get("req7")
    const req8 = searchParams.get("req8")
    
    if (req6) customRequirements[6] = parseInt(req6)
    if (req7) customRequirements[7] = parseInt(req7)
    if (req8) customRequirements[8] = parseInt(req8)

    // Generate board with both minimum word count and length requirements
    // Use new function but provide fallback for compatibility
    let result
    const enableLengthRequirements = searchParams.get("enableLengthReq") === "true"
    
    if (enableLengthRequirements) {
      result = generateBoardWithRequirements(date, minWords, customRequirements)
    } else {
      // Use original function for backward compatibility
      const originalResult = generateBoardWithMinWords(date, minWords)
      result = {
        ...originalResult,
        distribution: getWordDistribution(originalResult.allWords)
      }
    }
    
    const { board, wordCount, attempts, allWords, distribution } = result
    
    const meetsLengthRequirements = enableLengthRequirements ? checkLengthRequirements(allWords, customRequirements) : null
    
    console.log(`Generated board for ${date} with ${wordCount} words in ${attempts} attempt(s)`)
    console.log('Word distribution:', distribution)
    console.log('Meets length requirements:', meetsLengthRequirements)

    const allPossibleWords = allWords
    
    // Take first 50 words as target, rest as bonus
    const targetWords = allPossibleWords.slice(0, 50)
    const bonusWords = allPossibleWords.slice(50)

    const response = NextResponse.json({
      success: true,
      data: {
        date,
        board,
        possibleWords: allPossibleWords,
        targetWords: targetWords,
        bonusWords: bonusWords,
        totalPossibleWords: Math.min(targetWords.length, 50),
        totalAllWords: allPossibleWords.length,
        boardString: board.flat().join(""),
        wordDistribution: distribution,
        lengthRequirements: customRequirements,
        meetsLengthRequirements,
        generationStats: {
          attempts,
          totalWordsFound: wordCount,
          meetsMinimum: wordCount >= minWords,
          meetsLengthRequirements,
          distribution
        }
      },
    })

    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error("Error generating board:", error)
    return NextResponse.json({ success: false, error: "Failed to generate board" }, { status: 500 })
  }
    }
