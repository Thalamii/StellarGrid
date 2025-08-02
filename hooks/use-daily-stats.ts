import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

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

  // Load stats from localStorage for anonymous users or Supabase for authenticated users
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (user) {
        // TODO: Load from Supabase when MCP is available
        // For now, fallback to localStorage
        const savedStats = localStorage.getItem(`dailyStats_${today}`);
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      } else {
        // Load from localStorage for anonymous users
        const savedStats = localStorage.getItem(`dailyStats_${today}`);
        if (savedStats) {
          setStats(JSON.parse(savedStats));
        }
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
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

  // Start a new game session
  const startSession = useCallback(() => {
    const session: GameSession = {
      startTime: new Date(),
      completed: false,
      score: 0
    };
    setCurrentSession(session);
    
    // Update games played count
    const newStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1
    };
    saveStats(newStats);
  }, [stats, saveStats]);

  // Complete the current session
  const completeSession = useCallback((finalScore: number, wordsFound: number, targetWords: number) => {
    if (!currentSession) return;

    const endTime = new Date();
    const completionTime = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);
    const isCompleted = wordsFound >= targetWords;

    const updatedSession = {
      ...currentSession,
      endTime,
      completed: isCompleted,
      score: finalScore
    };

    // Calculate new stats
    const newStats = { ...stats };
    
    if (isCompleted) {
      newStats.gamesCompleted += 1;
      newStats.completionTime = completionTime;
      
      // Update best time
      if (!newStats.bestTime || completionTime < newStats.bestTime) {
        newStats.bestTime = completionTime;
      }
      
      // Calculate average completion time
      if (newStats.averageCompletionTime) {
        newStats.averageCompletionTime = Math.floor(
          (newStats.averageCompletionTime + completionTime) / 2
        );
      } else {
        newStats.averageCompletionTime = completionTime;
      }
      
      // Update streak (simplified - just increment for now)
      newStats.streak += 1;
    }
    
    newStats.totalScore += finalScore;
    
    saveStats(newStats);
    setCurrentSession(updatedSession);
  }, [currentSession, stats, saveStats]);

  // Format time helper
  const formatTime = useCallback((seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
