import { useState, useEffect, useCallback } from 'react';

interface DailyStats {
  gamesPlayed: number;
  gamesWon: number;
  streak: number;
  lastPlayedDate: string | null;
}

interface GameSession {
  startTime: Date;
  endTime?: Date;
  completed: boolean;
}

const STATS_KEY = 'wordgrid_stats';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

let statsCache: { data: DailyStats; timestamp: number } | null = null;

function isConsecutiveDay(lastDate: string, currentDate: string): boolean {
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  const diffTime = current.getTime() - last.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

function getFromCache(): DailyStats | null {
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
    return statsCache.data;
  }
  return null;
}

function setCache(data: DailyStats): void {
  statsCache = { data: { ...data }, timestamp: Date.now() };
}

export function useDailyStats() {
  const [stats, setStats] = useState<DailyStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    streak: 0,
    lastPlayedDate: null
  });
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Optimized stats loading with caching
  const loadStats = useCallback(() => {
    // Check cache first
    const cachedStats = getFromCache();
    if (cachedStats) {
      setStats(cachedStats);
      return;
    }

    setLoading(true);
    try {
      const savedStats = localStorage.getItem(STATS_KEY);
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
        setCache(parsedStats);
      } else {
        // Initialize default stats
        const defaultStats: DailyStats = {
          gamesPlayed: 0,
          gamesWon: 0,
          streak: 0,
          lastPlayedDate: null
        };
        setStats(defaultStats);
        setCache(defaultStats);
        localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('Error loading stats from localStorage:', error);
      // Reset to default if corrupted
      const defaultStats: DailyStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        streak: 0,
        lastPlayedDate: null
      };
      setStats(defaultStats);
      setCache(defaultStats);
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(defaultStats));
      } catch (e) {
        console.warn('Failed to save default stats to localStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Optimized stats saving with caching
  const saveStats = useCallback((newStats: DailyStats) => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
      setStats(newStats);
      setCache(newStats);
    } catch (error) {
      console.error('Error saving stats to localStorage:', error);
      // Still update state even if localStorage fails
      setStats(newStats);
      setCache(newStats);
    }
  }, []);

  // Start a new game session
  const startSession = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const session: GameSession = {
      startTime: new Date(),
      completed: false
    };
    setCurrentSession(session);

    // Check if this is a new day and update streak accordingly
    if (stats.lastPlayedDate !== today) {
      let newStreak = stats.streak;
      
      if (stats.lastPlayedDate === null) {
        // First time playing
        newStreak = 1;
      } else if (isConsecutiveDay(stats.lastPlayedDate, today)) {
        // Consecutive day, increment streak
        newStreak = stats.streak + 1;
      } else {
        // Gap in playing, reset streak to 1
        newStreak = 1;
      }

      const newStats: DailyStats = {
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
        streak: newStreak,
        lastPlayedDate: today
      };
      
      saveStats(newStats);
    }
  }, [stats, saveStats]);

  // Complete a game session
  const completeSession = useCallback((finalScore: number, wordsFound: number, targetWords: number) => {
    if (!currentSession) return;

    const isCompleted = wordsFound >= targetWords;
    const today = new Date().toISOString().split('T')[0];

    const updatedSession = {
      ...currentSession,
      endTime: new Date(),
      completed: isCompleted
    };

    // Only increment games won if puzzle is completed and we haven't already won today
    if (isCompleted && stats.lastPlayedDate === today) {
      const newStats: DailyStats = {
        ...stats,
        gamesWon: stats.gamesWon + 1
      };
      saveStats(newStats);
    }

    setCurrentSession(updatedSession);
  }, [currentSession, stats, saveStats]);

  // Initialize stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    currentSession,
    loading,
    startSession,
    completeSession,
    refreshStats: loadStats
  };
}
