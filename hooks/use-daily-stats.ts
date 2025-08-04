import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSessionId } from '@/lib/anonymous-session';
import { supabase } from '@/lib/supabase';
import type { UserProfile, DailyStreak, GameStatistics, DailyGame } from '@/lib/supabase';

interface DailyStats {
  completionTime: number | null; // in seconds
  streak: number;
  averageCompletionTime: number | null; // in seconds
  gamesPlayed: number;
  gamesCompleted: number;
  bestTime: number | null;
  totalScore: number;
}

interface GameSession {
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  score: number;
}

export function useDailyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({
    completionTime: null,
    streak: 0,
    averageCompletionTime: null,
    gamesPlayed: 0,
    gamesCompleted: 0,
    bestTime: null,
    totalScore: 0
  });
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Load comprehensive stats from database
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessionId = getSessionId();
      
      // Load user profile for overall stats
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      // Load streak data
      const { data: streakData } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      // Load today's game for completion time
      const { data: todaysGame } = await supabase
        .from('daily_games')
        .select('*')
        .eq('session_id', sessionId)
        .eq('game_date', today)
        .single();
      
      // Load game statistics for averages and best times
      const { data: gameStats } = await supabase
        .from('game_statistics')
        .select('*')
        .eq('session_id', sessionId)
        .order('date', { ascending: false });
      
      // Calculate stats from database data
      const completionTime = todaysGame?.completed_at 
        ? Math.floor((new Date(todaysGame.completed_at).getTime() - new Date(todaysGame.created_at).getTime()) / 1000)
        : null;
      
      const completedGames = gameStats?.filter(stat => stat.completion_rate >= 100) || [];
      const averageTime = completedGames.length > 0 
        ? Math.floor(completedGames.reduce((sum, stat) => sum + stat.time_played_minutes * 60, 0) / completedGames.length)
        : null;
      
      const bestTime = completedGames.length > 0 
        ? Math.min(...completedGames.map(stat => stat.time_played_minutes * 60))
        : null;
      
      setStats({
        completionTime,
        streak: streakData?.current_streak || 0,
        averageCompletionTime: averageTime,
        gamesPlayed: profile?.total_games_played || 0,
        gamesCompleted: completedGames.length,
        bestTime,
        totalScore: gameStats?.reduce((sum, stat) => sum + stat.score, 0) || 0
      });
      
    } catch (error) {
      console.error('Error loading daily stats:', error);
      // Fallback to localStorage for offline mode
      const today = new Date().toISOString().split('T')[0];
      const savedStats = localStorage.getItem(`dailyStats_${today}`);
      if (savedStats) {
        console.log('Loading stats from localStorage:', savedStats);
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
      } else {
        console.log('No localStorage stats found, using default values');
        // Set default stats if no localStorage data exists
        setStats({
          completionTime: null,
          streak: 0,
          averageCompletionTime: null,
          gamesPlayed: 0,
          gamesCompleted: 0,
          bestTime: null,
          totalScore: 0
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save stats
  const saveStats = useCallback(async (newStats: DailyStats) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (user) {
        // TODO: Save to Supabase when MCP is available
        // For now, fallback to localStorage
        localStorage.setItem(`dailyStats_${today}`, JSON.stringify(newStats));
      } else {
        // Save to localStorage for anonymous users
        localStorage.setItem(`dailyStats_${today}`, JSON.stringify(newStats));
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Error saving daily stats:', error);
    }
  }, [user]);

  // Check if today's game already exists
  const checkTodaysGame = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessionId = getSessionId();
      
      const { data, error } = await supabase
        .from('daily_games')
        .select('*')
        .eq('session_id', sessionId)
        .eq('game_date', today)
        .single();
      
      // If table doesn't exist or other database errors, return null
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.log('Database not available, using localStorage mode');
        return null;
      }
      
      return data;
    } catch (error) {
      console.log('Database error, falling back to localStorage:', error);
      return null;
    }
  }, []);

  // Start a new game session (only count unique daily games)
  const startSession = useCallback(async () => {
    console.log('🎮 Starting new game session...');
    const session: GameSession = {
      startTime: new Date(),
      completed: false,
      score: 0
    };
    setCurrentSession(session);
    
    const today = new Date().toISOString().split('T')[0];
    const sessionId = getSessionId();
    
    try {
      // Check if this is the first time playing today's puzzle
      const existingGame = await checkTodaysGame();
      
      // Only proceed with database operations if we got a response (not null)
      if (existingGame === null) {
        // Database not available or error occurred, use localStorage fallback
        const localStorageKey = `gameSession_${sessionId}_${today}`;
        const existingLocalGame = localStorage.getItem(localStorageKey);
        
        if (!existingLocalGame) {
          // Mark this game as started in localStorage
          localStorage.setItem(localStorageKey, JSON.stringify({ started: true, date: today }));
          
          // Get current stats from localStorage or use empty initial state
          const savedStats = localStorage.getItem(`dailyStats_${today}`);
          const currentStats = savedStats ? JSON.parse(savedStats) : {
            completionTime: null,
            streak: 0,
            averageCompletionTime: null,
            gamesPlayed: 0,
            gamesCompleted: 0,
            bestTime: null,
            totalScore: 0
          };
          
          const newStats = {
            ...currentStats,
            gamesPlayed: (currentStats.gamesPlayed || 0) + 1
          };
          
          console.log('Incrementing localStorage games played:', currentStats.gamesPlayed, '->', newStats.gamesPlayed);
          
          // Save to localStorage
          localStorage.setItem(`dailyStats_${today}`, JSON.stringify(newStats));
          setStats(newStats);
        } else {
          console.log('Game already started today (localStorage mode)');
        }
        return;
      }
      
      if (!existingGame) {
        // This is a new daily game - increment games played in database
        
        // Create or update user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('session_id', sessionId)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.log('Database not available for profiles, using localStorage');
          return;
        }
        
        if (profile) {
          // Update existing profile
          await supabase
            .from('user_profiles')
            .update({
              total_games_played: profile.total_games_played + 1,
              last_played_date: today,
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId);
        } else {
          // Create new profile
          await supabase
            .from('user_profiles')
            .insert({
              session_id: sessionId,
              total_games_played: 1,
              last_played_date: today,
              is_anonymous: true
            });
        }
        
        // Refresh stats to show updated games played
        loadStats();
      }
    } catch (error) {
      console.error('Error in startSession, falling back to localStorage:', error);
      
      // Fallback to localStorage
      const localStorageKey = `gameSession_${sessionId}_${today}`;
      const existingLocalGame = localStorage.getItem(localStorageKey);
      
      if (!existingLocalGame) {
        // Mark this game as started in localStorage
        localStorage.setItem(localStorageKey, JSON.stringify({ started: true, date: today }));
        
        // Get current stats from localStorage or use empty initial state
        const savedStats = localStorage.getItem(`dailyStats_${today}`);
        const currentStats = savedStats ? JSON.parse(savedStats) : {
          completionTime: null,
          streak: 0,
          averageCompletionTime: null,
          gamesPlayed: 0,
          gamesCompleted: 0,
          bestTime: null,
          totalScore: 0
        };
        
        const newStats = {
          ...currentStats,
          gamesPlayed: (currentStats.gamesPlayed || 0) + 1
        };
        
        console.log('Catch block: Incrementing localStorage games played:', currentStats.gamesPlayed, '->', newStats.gamesPlayed);
        
        // Save to localStorage
        localStorage.setItem(`dailyStats_${today}`, JSON.stringify(newStats));
        setStats(newStats);
      } else {
        console.log('Catch block: Game already started today (localStorage mode)');
      }
    }
  }, [checkTodaysGame, loadStats]);

  // Update the streak logic fully
  const completeSession = useCallback(async (finalScore: number, wordsFound: number, targetWords: number) => {
    if (!currentSession) return;

    const endTime = new Date();
    const completionTime = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);
    const isCompleted = wordsFound >= targetWords;

    console.log('🏁 Completing session:', {
      finalScore,
      wordsFound,
      targetWords,
      completionTime: `${completionTime}s`,
      isCompleted
    });

    const updatedSession = {
      ...currentSession,
      endTime,
      completed: isCompleted,
      score: finalScore
    };

    const sessionId = getSessionId();
    const today = new Date().toISOString().split('T')[0];
    
    // Always update localStorage stats regardless of database availability
    const savedStats = localStorage.getItem(`dailyStats_${today}`);
    const currentStats = savedStats ? JSON.parse(savedStats) : {
      completionTime: null,
      streak: 0,
      averageCompletionTime: null,
      gamesPlayed: 0,
      gamesCompleted: 0,
      bestTime: null,
      totalScore: 0
    };
    
    const newStats = {
      ...currentStats,
      completionTime: isCompleted ? completionTime : currentStats.completionTime,
      gamesCompleted: isCompleted ? (currentStats.gamesCompleted || 0) + 1 : currentStats.gamesCompleted,
      streak: isCompleted ? Math.max((currentStats.streak || 0), 1) : currentStats.streak,
      totalScore: (currentStats.totalScore || 0) + finalScore,
      bestTime: isCompleted ? 
        (currentStats.bestTime ? Math.min(currentStats.bestTime, completionTime) : completionTime) : 
        currentStats.bestTime,
      averageCompletionTime: isCompleted ? 
        (currentStats.averageCompletionTime ? 
          Math.floor(((currentStats.averageCompletionTime * (currentStats.gamesCompleted || 0)) + completionTime) / ((currentStats.gamesCompleted || 0) + 1)) :
          completionTime) :
        currentStats.averageCompletionTime
    };
    
    console.log('💾 Updating localStorage stats:', newStats);
    localStorage.setItem(`dailyStats_${today}`, JSON.stringify(newStats));
    setStats(newStats);
    
    try {
      if (isCompleted) {
      // Update streak in daily_streaks
      const { data: streakData } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      if (streakData) {
        // Continue streak
        if (streakData.last_completed_date === today) {
          // Same day completion, do nothing
        } else if(new Date(streakData.last_completed_date).getTime() === 
          (new Date().getTime() - 1000*60*60*24)) {
          // Consecutive day, increment streak
          await supabase
            .from('daily_streaks')
            .update({
              current_streak: streakData.current_streak + 1,
              last_completed_date: today,
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId);
        } else {
          // Break in streak, reset streak
          await supabase
            .from('daily_streaks')
            .update({
              current_streak: 1,
              streak_start_date: today,
              last_completed_date: today,
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId);
        }
      } else {
        // No streak data, start a new streak
        await supabase
          .from('daily_streaks')
          .insert({
            session_id: sessionId,
            current_streak: 1,
            streak_start_date: today,
            last_completed_date: today
          });
      }

      // Save today's completion to daily_games
      await supabase
        .from('daily_games')
        .upsert({
          session_id: sessionId,
          game_date: today,
          board: [], // Will be filled by game logic
          found_words: [],
          rotation_count: 0,
          score: finalScore,
          total_possible_words: targetWords,
          completion_rate: 100,
          completed_at: endTime.toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: "session_id,game_date" }
      );
    }

    // Save game statistics
    await supabase
      .from('game_statistics')
      .insert({
        session_id: sessionId,
        date: today,
        words_found: isCompleted ? wordsFound : 0,
        total_words: targetWords,
        completion_rate: isCompleted ? 100 : 0,
        score: finalScore,
        time_played_minutes: Math.floor(completionTime / 60),
        rotations_used: 0, // Assume logic has count for rotations
        hints_used: 0, // Assume logic has count for hints
        created_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error saving completion to database, but localStorage stats already updated:', error);
    } finally {
      // Always update the current session state regardless of database errors
      setCurrentSession(updatedSession);
    }

  }, [currentSession, loadStats]);

  // Format time helper
  const formatTime = useCallback((seconds: number | null): string => {
    if (!seconds || seconds <= 0) return '--:--';
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    currentSession,
    loading,
    startSession,
    completeSession,
    formatTime,
    refreshStats: loadStats
  };
}
