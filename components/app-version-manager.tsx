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
        
        // Optional: Show a toast notification to user
        console.log(
          `✨ WordGrid updated to version ${versionInfo.currentVersion}! ` +
          `Some data was refreshed for the best experience.`
        )
        
        // Force reload the page to ensure fresh JavaScript is loaded
        // This happens only once when version changes
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error('Error during version check:', error)
    }
  }, [])

  return null // This component doesn't render anything
}

// Export the AppVersionManager for use in other components if needed
export { AppVersionManager }
