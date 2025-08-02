import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface UserProfile {
  id: string
  display_name?: string
  created_at: string
  updated_at: string
  is_anonymous: boolean
  total_games_played: number
  total_words_found: number
  average_completion_rate: number
  current_streak: number
  longest_streak: number
  last_played_date?: string
}

export interface DailyGame {
  id: string
  user_id: string
  game_date: string
  board: string[][]
  found_words: string[]
  rotation_count: number
  score: number
  total_possible_words: number
  completion_rate: number
  completed_at?: string
  created_at: string
  updated_at: string
  session_data?: any
}

export interface GameStatistics {
  id: string
  user_id: string
  date: string
  words_found: number
  total_words: number
  completion_rate: number
  score: number
  time_played_minutes: number
  rotations_used: number
  hints_used: number
  created_at: string
}

export interface DailyStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_completed_date?: string
  streak_start_date?: string
  total_days_played: number
  created_at: string
  updated_at: string
}
