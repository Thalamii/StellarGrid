-- Function to clean up inactive anonymous users
CREATE OR REPLACE FUNCTION cleanup_inactive_anonymous_users(inactive_days INTEGER DEFAULT 5)
RETURNS TABLE (
  deleted_profiles INTEGER,
  deleted_games INTEGER, 
  deleted_statistics INTEGER,
  deleted_streaks INTEGER
) AS $$
DECLARE
  profile_count INTEGER := 0;
  games_count INTEGER := 0;
  stats_count INTEGER := 0;
  streaks_count INTEGER := 0;
  cutoff_date DATE;
BEGIN
  -- Calculate cutoff date
  cutoff_date := CURRENT_DATE - INTERVAL '1 day' * inactive_days;
  
  -- Find inactive session_ids (no activity in X days)
  WITH inactive_sessions AS (
    SELECT DISTINCT session_id 
    FROM user_profiles 
    WHERE last_played_date < cutoff_date 
       OR last_played_date IS NULL AND created_at::date < cutoff_date
  )
  
  -- Delete from daily_streaks
  DELETE FROM daily_streaks 
  WHERE session_id IN (SELECT session_id FROM inactive_sessions);
  
  GET DIAGNOSTICS streaks_count = ROW_COUNT;
  
  -- Delete from game_statistics  
  WITH inactive_sessions AS (
    SELECT DISTINCT session_id 
    FROM user_profiles 
    WHERE last_played_date < cutoff_date 
       OR last_played_date IS NULL AND created_at::date < cutoff_date
  )
  DELETE FROM game_statistics 
  WHERE session_id IN (SELECT session_id FROM inactive_sessions);
  
  GET DIAGNOSTICS stats_count = ROW_COUNT;
  
  -- Delete from daily_games
  WITH inactive_sessions AS (
    SELECT DISTINCT session_id 
    FROM user_profiles 
    WHERE last_played_date < cutoff_date 
       OR last_played_date IS NULL AND created_at::date < cutoff_date
  )
  DELETE FROM daily_games 
  WHERE session_id IN (SELECT session_id FROM inactive_sessions);
  
  GET DIAGNOSTICS games_count = ROW_COUNT;
  
  -- Delete from user_profiles (do this last due to potential references)
  DELETE FROM user_profiles 
  WHERE last_played_date < cutoff_date 
     OR last_played_date IS NULL AND created_at::date < cutoff_date;
  
  GET DIAGNOSTICS profile_count = ROW_COUNT;
  
  -- Return counts
  RETURN QUERY SELECT profile_count, games_count, stats_count, streaks_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run cleanup daily at 2 AM UTC
-- Note: This requires the pg_cron extension to be enabled
SELECT cron.schedule(
  'cleanup-inactive-users',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$SELECT cleanup_inactive_anonymous_users(5);$$
);

-- Alternative: Manual cleanup query (if you prefer to run it manually)
-- You can run this periodically instead of using cron:
/*
SELECT cleanup_inactive_anonymous_users(5);
*/

-- View to check what would be cleaned up (before running cleanup)
CREATE OR REPLACE VIEW inactive_users_preview AS
SELECT 
  session_id,
  last_played_date,
  created_at,
  total_games_played,
  CASE 
    WHEN last_played_date IS NOT NULL THEN CURRENT_DATE - last_played_date
    ELSE CURRENT_DATE - created_at::date
  END as days_inactive
FROM user_profiles 
WHERE (last_played_date < CURRENT_DATE - INTERVAL '5 days' 
       OR last_played_date IS NULL AND created_at::date < CURRENT_DATE - INTERVAL '5 days')
ORDER BY days_inactive DESC;
