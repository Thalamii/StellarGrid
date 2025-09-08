"use client"

import { Settings, Sun, Moon, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { useGameStore } from "@/stores/gameStore"

export function SettingsPopup() {
  const { theme, setTheme } = useTheme()
  const { soundEnabled, toggleSound, soundVolume, setSoundVolume } = useGameStore()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="neomorphic-small w-10 h-10 p-0 border-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Theme Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Appearance
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Theme
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="h-8 px-3"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="h-8 px-3"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sound Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Audio
            </h3>
            
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sound Effects
              </span>
              <Button
                variant={soundEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={toggleSound}
                className="h-8 px-3"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-1" />
                    On
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-1" />
                    Off
                  </>
                )}
              </Button>
            </div>

            {/* Volume Slider */}
            {soundEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Volume
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${soundVolume * 100}%, #e5e7eb ${soundVolume * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
