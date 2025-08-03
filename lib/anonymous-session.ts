// Anonymous session management utilities

/**
 * Generate a unique session ID for anonymous users
 * Uses browser fingerprinting and random elements
 */
export function generateSessionId(): string {
  // Get browser fingerprint components
  const navigator = window.navigator;
  const screen = window.screen;
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    // Add more browser-specific data
  ].join('|');

  // Create hash of fingerprint
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Add random component and timestamp to ensure uniqueness
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  
  return `anon_${Math.abs(hash)}_${timestamp}_${randomPart}`;
}

/**
 * Get or create session ID from localStorage
 */
export function getSessionId(): string {
  const STORAGE_KEY = 'wordgrid_session_id';
  const LAST_SEEN_KEY = 'wordgrid_last_seen';
  
  // Try to get existing session ID
  let sessionId = localStorage.getItem(STORAGE_KEY);
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  
  // Check if this is a returning user after clearing browser data
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (!sessionId || (lastSeen && (now - parseInt(lastSeen)) > oneDay * 5)) {
    // Generate new session ID if:
    // 1. No session exists (new user or cleared data)
    // 2. Last seen more than 5 days ago (inactive user)
    sessionId = generateSessionId();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  // Update last seen timestamp
  localStorage.setItem(LAST_SEEN_KEY, now.toString());
  
  return sessionId;
}

/**
 * Clear session data (useful for reset/new game)
 */
export function clearSession(): void {
  const STORAGE_KEY = 'wordgrid_session_id';
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get session info for debugging
 */
export function getSessionInfo(): {
  sessionId: string;
  created: string | null;
  fingerprint: string;
} {
  const sessionId = getSessionId();
  
  // Extract timestamp from session ID
  const parts = sessionId.split('_');
  const timestampHex = parts[2];
  const created = timestampHex ? new Date(parseInt(timestampHex, 36)).toISOString() : null;
  
  // Generate current fingerprint
  const navigator = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    navigator.userAgent.substring(0, 50) + '...',
    navigator.language,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}bit`,
  ].join(' | ');
  
  return {
    sessionId,
    created,
    fingerprint
  };
}
