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
   * Migrate localStorage data between versions (only when necessary)
   */
  private static migrateLocalStorageData(fromVersion: string) {
    // Only perform migrations for specific version changes that need them
    const needsMigration = this.shouldMigrate(fromVersion, this.CURRENT_VERSION);
    
    if (!needsMigration) {
      console.log(`ℹ️ No migration needed from ${fromVersion} to ${this.CURRENT_VERSION}`);
      return;
    }

    console.log(`🔧 Migrating from version ${fromVersion} to ${this.CURRENT_VERSION}`);
    
    // Only clear today's game data to avoid breaking ongoing games
    const today = new Date().toISOString().split('T')[0];
    const gameKey = `wordGridGame_${today}`;
    
    if (localStorage.getItem(gameKey)) {
      console.log(`🗑️ Clearing today's game data for compatibility: ${gameKey}`);
      localStorage.removeItem(gameKey);
    }

    // Preserve all user data - stats, settings, etc.
    console.log(`📊 All user stats and settings preserved`);
  }
  
  /**
   * Determine if migration is needed between versions
   */
  private static shouldMigrate(fromVersion: string, toVersion: string): boolean {
    // Only migrate on major changes or specific breaking changes
    // For example, only migrate if major version changes (0.1.x -> 0.2.x)
    if (!fromVersion) return false; // First time user
    
    const fromParts = fromVersion.split('.');
    const toParts = toVersion.split('.');
    
    // Major version change
    if (fromParts[0] !== toParts[0]) return true;
    
    // Minor version change (might need migration)
    if (fromParts[1] !== toParts[1]) return true;
    
    // Patch version change (usually no migration needed)
    return false;
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
