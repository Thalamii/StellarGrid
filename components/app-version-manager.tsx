'use client'

import { useEffect } from 'react'
import { AppVersionManager } from '@/lib/app-version'

export function AppVersionManagerComponent() {
  useEffect(() => {
    // Run version check when component mounts
    try {
      const versionInfo = AppVersionManager.checkForUpdates()
      
      if (versionInfo.isNewVersion) {
        AppVersionManager.handleMigration(versionInfo.previousVersion)
        
        // Show update notification (no forced reload)
        console.log(
          `✨ WordGrid updated to version ${versionInfo.currentVersion}! ` +
          `Enhanced performance and features available.`
        )
        
        // Let natural caching and service worker handle updates
        // No forced reload - much better for user experience
      }
    } catch (error) {
      console.error('Error during version check:', error)
    }
  }, [])

  return null // This component doesn't render anything
}

// Export the AppVersionManager for use in other components if needed
export { AppVersionManager }
