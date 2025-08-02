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

export async function saveGameProgress(userId: string, gameState: GameState) {
  try {
    const today = new Date().toISOString().split("T")[0]

    const gameData: Partial<DailyGame> = {
      user_id: userId,
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
        onConflict: "user_id,game_date",
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

export async function loadGameProgress(userId: string) {
  try {
    const today = new Date().toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("daily_games")
      .select("*")
      .eq("user_id", userId)
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

export async function createOrUpdateUserProfile(userId: string, updates: Partial<UserProfile> = {}) {
  try {
    const profileData: Partial<UserProfile> = {
      id: userId,
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
        onConflict: "id",
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

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

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

export async function saveGameStatistics(userId: string, stats: Partial<GameStatistics>) {
  try {
    const statisticsData: Partial<GameStatistics> = {
      user_id: userId,
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
