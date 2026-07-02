import { type NextRequest, NextResponse } from "next/server"
import { words3 } from "@/utils/words3"
import { obfuscateWords } from "@/utils/wordObfuscation"
import {
  generateBoardForDate,
  getWordDistribution,
  checkLengthRequirements,
  type LengthRequirements,
  DEFAULT_LENGTH_REQUIREMENTS,
} from "@/lib/boardGenerator"

// Add these lines after your imports
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

// Keep original function for backward compatibility
function generateBoardWithMinWords(dateString: string, minWords: number = 50): { board: string[][], wordCount: number, attempts: number, allWords: string[] } {
  const result = generateBoardForDate(dateString, words3, minWords, DEFAULT_LENGTH_REQUIREMENTS)
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
  return generateBoardForDate(dateString, words3, minWords, lengthRequirements)
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

    // Split words into target and bonus
    const targetWords = allWords.slice(0, 50)
    const bonusWords = allWords.slice(50)
    
    // Obfuscate word lists to make casual cheating harder
    const obfuscatedPossibleWords = obfuscateWords(allWords, date)
    const obfuscatedTargetWords = obfuscateWords(targetWords, date)
    const obfuscatedBonusWords = obfuscateWords(bonusWords, date)
    
    // Debug: Log obfuscation status (remove in production)
    console.log(`Obfuscation test for ${date}:`, {
      originalWordCount: allWords.length,
      obfuscatedLength: obfuscatedPossibleWords.length,
      isObfuscated: obfuscatedPossibleWords !== JSON.stringify(allWords)
    })
    
    const response = NextResponse.json({
      success: true,
      data: {
        date,
        board,
        possibleWords: obfuscatedPossibleWords,
        targetWords: obfuscatedTargetWords,
        bonusWords: obfuscatedBonusWords,
        totalPossibleWords: Math.min(wordCount, 50),
        totalAllWords: wordCount,
        boardString: board.flat().join(""),
        // Optional: Provide word count hints
        wordHints: {
          totalWords: wordCount,
          targetWords: targetWords.length,
          bonusWords: bonusWords.length,
          distribution: distribution
        },
        // Keep generation stats for debugging
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
