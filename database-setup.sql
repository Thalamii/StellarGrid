-- Word Grid Game Database Schema
-- Run this in your Supabase SQL Editor

-- 1. User Profiles Table (for anonymous session tracking)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_anonymous BOOLEAN DEFAULT true,
    total_games_played INTEGER DEFAULT 0,
    total_words_found INTEGER DEFAULT 0,
    average_completion_rate NUMERIC DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_played_date DATE
);

-- 2. Daily Games Table (stores each day's game state)
CREATE TABLE IF NOT EXISTS daily_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    game_date DATE NOT NULL,
    board JSONB NOT NULL DEFAULT '[]',
    found_words JSONB NOT NULL DEFAULT '[]',
    rotation_count INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    total_possible_words INTEGER DEFAULT 0,
    completion_rate NUMERIC DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_data JSONB,
    UNIQUE(session_id, game_date)
);

-- 3. Game Statistics Table (detailed stats for each play session)
CREATE TABLE IF NOT EXISTS game_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    date DATE NOT NULL,
    words_found INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    completion_rate NUMERIC DEFAULT 0,
    score INTEGER DEFAULT 0,
    time_played_minutes INTEGER DEFAULT 0,
    rotations_used INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Streaks Table (track consecutive day completions)
CREATE TABLE IF NOT EXISTS daily_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    streak_start_date DATE,
    total_days_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_session_id ON user_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_games_session_date ON daily_games(session_id, game_date);
CREATE INDEX IF NOT EXISTS idx_game_statistics_session_date ON game_statistics(session_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_session_id ON daily_streaks(session_id);

-- Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anonymous access (adjust as needed)
CREATE POLICY "Allow all operations for anonymous users" ON user_profiles
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for anonymous users" ON daily_games
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for anonymous users" ON game_statistics
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for anonymous users" ON daily_streaks
    FOR ALL USING (true);
