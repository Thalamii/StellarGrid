"use server"

import { supabase } from "@/lib/supabase"
import type { DailyGame, UserProfile, GameStatistics } from "@/lib/supabase"

interface GameState {
  board: string[][]
  foundWords: string[]
  rotationCount: number
  score: number
  totalPossibleWords: number
  completionRate: number
}

export async function saveGameProgress(sessionId: string, gameState: GameState) {
  try {
    const today = new Date().toISOString().split("T")[0]

    const gameData: Partial<DailyGame> = {
      session_id: sessionId,
      game_date: today,
      board: gameState.board,
      found_words: gameState.foundWords,
      rotation_count: gameState.rotationCount,
      score: gameState.score,
      total_possible_words: gameState.totalPossibleWords,
      completion_rate: gameState.completionRate,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("daily_games")
      .upsert(gameData, {
        onConflict: "session_id,game_date",
      })
      .select()

    if (error) {
      console.error("Error saving game progress:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in saveGameProgress:", error)
    return { success: false, error: "Failed to save game progress" }
  }
}

export async function loadGameProgress(sessionId: string) {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("daily_games")
      .select("*")
      .eq("session_id", sessionId)
      .eq("game_date", today)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error loading game progress:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in loadGameProgress:", error)
    return { success: false, error: "Failed to load game progress" }
  }
}

export async function createOrUpdateUserProfile(sessionId: string, updates: Partial<UserProfile> = {}) {
  try {
    const profileData: Partial<UserProfile> = {
      session_id: sessionId,
      is_anonymous: false,
      total_games_played: 0,
      total_words_found: 0,
      average_completion_rate: 0,
      current_streak: 0,
      longest_streak: 0,
      updated_at: new Date().toISOString(),
      ...updates,
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(profileData, {
        onConflict: "session_id",
      })
      .select()

    if (error) {
      console.error("Error creating/updating user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in createOrUpdateUserProfile:", error)
    return { success: false, error: "Failed to create/update user profile" }
  }
}

export async function getUserProfile(sessionId: string) {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("session_id", sessionId).single()

    if (error && error.code !== "PGRST116") {
      console.error("Error getting user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return { success: false, error: "Failed to get user profile" }
  }
}

export async function saveGameStatistics(sessionId: string, stats: Partial<GameStatistics>) {
  try {
    const statisticsData: Partial<GameStatistics> = {
      session_id: sessionId,
      date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      ...stats,
    }

    const { data, error } = await supabase.from("game_statistics").insert(statisticsData).select()

    if (error) {
      console.error("Error saving game statistics:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Error in saveGameStatistics:", error)
    return { success: false, error: "Failed to save game statistics" }
  }
}
