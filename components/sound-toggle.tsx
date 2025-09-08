"use client"

import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGameStore } from "@/stores/gameStore"

export function SoundToggle() {
  const { soundEnabled, toggleSound } = useGameStore()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSound}
      className="neomorphic-small w-10 h-10 p-0 border-0 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
      aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
      title={soundEnabled ? "Mute sound" : "Unmute sound"}
    >
      {soundEnabled ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </Button>
  )
}
