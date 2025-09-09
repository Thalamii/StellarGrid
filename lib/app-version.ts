// App version management for cache busting and localStorage migration
export class AppVersionManager {
  private static readonly VERSION_KEY = 'wordgrid_app_version';
  private static readonly CURRENT_VERSION = process.env.npm_package_version || '0.1.1';
  
  /**
   * Check if the app has been updated and handle migration if needed
   */
  static checkForUpdates(): {
    isNewVersion: boolean;
    previousVersion: string | null;
    currentVersion: string;
  } {
    if (typeof window === 'undefined') {
      return {
        isNewVersion: false,
        previousVersion: null,
        currentVersion: this.CURRENT_VERSION
      };
    }

    const storedVersion = localStorage.getItem(this.VERSION_KEY);
    const isNewVersion = storedVersion !== this.CURRENT_VERSION;

    if (isNewVersion) {
      console.log(`🔄 App updated from ${storedVersion || 'unknown'} to ${this.CURRENT_VERSION}`);
      
      // Store the new version
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      
      return {
        isNewVersion: true,
        previousVersion: storedVersion,
        currentVersion: this.CURRENT_VERSION
      };
    }

    return {
      isNewVersion: false,
      previousVersion: storedVersion,
      currentVersion: this.CURRENT_VERSION
    };
  }

  /**
   * Handle migration from old version to new version
   */
  static handleMigration(previousVersion: string | null) {
    if (!previousVersion) {
      // First time user, no migration needed
      return;
    }

    console.log(`🔧 Migrating from version ${previousVersion} to ${this.CURRENT_VERSION}`);

    try {
      // Add version-specific migration logic here
      this.migrateLocalStorageData(previousVersion);
    } catch (error) {
      console.error('Migration failed:', error);
      // If migration fails, clear potentially incompatible data
      this.clearGameData();
    }
  }

  /**
   * Migrate localStorage data between versions
   */
  private static migrateLocalStorageData(fromVersion: string) {
    // Example migration logic - customize based on your needs
    
    // For now, let's clear game data but preserve stats on any version change
    // This ensures users see the latest game logic while keeping their progress
    
    const today = new Date().toISOString().split('T')[0];
    const gameKeys = [
      `wordGridGame_${today}`,
      // Add more game-specific keys that should be cleared
    ];

    gameKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        console.log(`🗑️ Clearing potentially incompatible game data: ${key}`);
        localStorage.removeItem(key);
      }
    });

    // Preserve important user data like stats
    const preserveKeys = [
      'wordgrid_daily_stats',
      'wordgrid_sound_enabled',
      'wordgrid_sound_volume',
      'wordgrid_anonymous_session_id'
    ];

    console.log(`📊 Preserving user data: ${preserveKeys.join(', ')}`);
  }

  /**
   * Clear all game data (emergency reset)
   */
  static clearGameData() {
    console.warn('🚨 Clearing all game data due to migration failure');
    
    const keysToRemove: string[] = [];
    
    // Find all localStorage keys that start with our app prefixes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('wordGridGame_') ||
        key.startsWith('wordgrid_hint_') ||
        key.includes('wordgrid')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Force a fresh start (for testing)
   */
  static forceUpdate() {
    localStorage.removeItem(this.VERSION_KEY);
    this.clearGameData();
    window.location.reload();
  }

  /**
   * Get current app version
   */
  static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }

  /**
   * Check if localStorage data might be stale
   */
  static isDataStale(): boolean {
    const result = this.checkForUpdates();
    return result.isNewVersion;
  }
}

// Auto-initialize version checking
if (typeof window !== 'undefined') {
  // Run version check on load
  const versionInfo = AppVersionManager.checkForUpdates();
  
  if (versionInfo.isNewVersion) {
    AppVersionManager.handleMigration(versionInfo.previousVersion);
    
    // Show update notification (optional)
    console.log(`✨ WordGrid updated to version ${versionInfo.currentVersion}! Fresh start for optimal experience.`);
  }
}
