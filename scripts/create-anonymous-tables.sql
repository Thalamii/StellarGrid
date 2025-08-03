-- Create user profiles table (modified for anonymous users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_anonymous BOOLEAN DEFAULT true,
  total_games_played INTEGER DEFAULT 0,
  total_words_found INTEGER DEFAULT 0,
  average_completion_rate DECIMAL(5,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_played_date DATE
);

-- Create daily games table (modified for anonymous users)
CREATE TABLE IF NOT EXISTS public.daily_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  game_date DATE NOT NULL,
  board JSONB NOT NULL,
  found_words TEXT[] DEFAULT '{}',
  rotation_count INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  total_possible_words INTEGER NOT NULL,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  session_data JSONB,
  UNIQUE(session_id, game_date)
);

-- Create game statistics table (modified for anonymous users)
CREATE TABLE IF NOT EXISTS public.game_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  date DATE NOT NULL,
  words_found INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  score INTEGER DEFAULT 0,
  time_played_minutes INTEGER DEFAULT 0,
  rotations_used INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(session_id, date)
);

-- Create daily streaks table (modified for anonymous users)
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  streak_start_date DATE,
  total_days_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (allowing anonymous access)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anonymous access (more permissive)
-- User Profiles
CREATE POLICY "Allow anonymous users to view profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous users to insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update profiles" ON public.user_profiles
  FOR UPDATE USING (true);

-- Daily Games  
CREATE POLICY "Allow anonymous users to view games" ON public.daily_games
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous users to insert games" ON public.daily_games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update games" ON public.daily_games
  FOR UPDATE USING (true);

-- Game Statistics
CREATE POLICY "Allow anonymous users to view statistics" ON public.game_statistics
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous users to insert statistics" ON public.game_statistics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update statistics" ON public.game_statistics
  FOR UPDATE USING (true);

-- Daily Streaks
CREATE POLICY "Allow anonymous users to view streaks" ON public.daily_streaks
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous users to insert streaks" ON public.daily_streaks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update streaks" ON public.daily_streaks
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_session_id ON public.user_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_games_session_date ON public.daily_games(session_id, game_date);
CREATE INDEX IF NOT EXISTS idx_game_statistics_session_date ON public.game_statistics(session_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_streaks_session_id ON public.daily_streaks(session_id);
