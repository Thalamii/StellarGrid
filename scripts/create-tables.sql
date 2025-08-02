-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  is_anonymous BOOLEAN DEFAULT false,
  total_games_played INTEGER DEFAULT 0,
  total_words_found INTEGER DEFAULT 0,
  average_completion_rate DECIMAL(5,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_played_date DATE
);

-- Create daily games table
CREATE TABLE IF NOT EXISTS public.daily_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
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
  UNIQUE(user_id, game_date)
);

-- Create game statistics table
CREATE TABLE IF NOT EXISTS public.game_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  words_found INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  score INTEGER DEFAULT 0,
  time_played_minutes INTEGER DEFAULT 0,
  rotations_used INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, date)
);

-- Create daily streaks table
CREATE TABLE IF NOT EXISTS public.daily_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  streak_start_date DATE,
  total_days_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for daily_games
CREATE POLICY "Users can view own games" ON public.daily_games
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games" ON public.daily_games
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games" ON public.daily_games
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for game_statistics
CREATE POLICY "Users can view own statistics" ON public.game_statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statistics" ON public.game_statistics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON public.game_statistics
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for daily_streaks
CREATE POLICY "Users can view own streaks" ON public.daily_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.daily_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.daily_streaks
  FOR UPDATE USING (auth.uid() = user_id);
