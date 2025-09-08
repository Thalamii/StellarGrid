// Sound Manager for WordGrid Game
// Handles loading and playing MP3 sound effects

interface SoundConfig {
  [key: string]: {
    path: string
    volume?: number
  }
}

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled = true
  private globalVolume = 0.7
  private initialized = false

  private soundConfig: SoundConfig = {
    'word-valid': {
      path: '/word-valid.mp3',
      volume: 0.8
    },
    'word-invalid': {
      path: '/word-invalid.mp3',
      volume: 0.6
    },
    'letter-select': {
      path: '/letter-select.mp3',
      volume: 0.4
    },
    'board-rotate': {
      path: '/board-rotate.mp3',
      volume: 0.7
    },
    'puzzle-complete': {
      path: '/puzzle-complete.mp3',
      volume: 0.9
    },
    'hint-activate': {
      path: '/hint-activate.mp3',
      volume: 0.7
    }
  }

  constructor() {
    // Initialize on first user interaction to respect autoplay policies
    if (typeof window !== 'undefined') {
      this.initializeOnUserInteraction()
    }
  }

  private initializeOnUserInteraction() {
    const initHandler = () => {
      if (!this.initialized) {
        this.loadAllSounds()
        this.initialized = true
      }
      // Remove listeners after first initialization
      document.removeEventListener('click', initHandler)
      document.removeEventListener('keydown', initHandler)
      document.removeEventListener('touchstart', initHandler)
    }

    document.addEventListener('click', initHandler, { once: true })
    document.addEventListener('keydown', initHandler, { once: true })
    document.addEventListener('touchstart', initHandler, { once: true })
  }

  private loadAllSounds() {
    Object.entries(this.soundConfig).forEach(([name, config]) => {
      this.loadSound(name, config.path, config.volume)
    })
    console.log('🔊 Sound manager initialized with', Object.keys(this.soundConfig).length, 'sounds')
  }

  private loadSound(name: string, path: string, volume = 1.0) {
    try {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = this.globalVolume * volume
      
      // Handle loading errors gracefully
      audio.onerror = (e) => {
        console.warn(`Failed to load sound: ${name} from ${path}`, e)
      }
      
      audio.oncanplaythrough = () => {
        console.log(`✅ Loaded sound: ${name}`)
      }
      
      this.sounds.set(name, audio)
    } catch (error) {
      console.warn(`Error creating audio for ${name}:`, error)
    }
  }

  async play(soundName: string, forcePlay = false) {
    if (!this.enabled && !forcePlay) return
    
    const sound = this.sounds.get(soundName)
    if (!sound) {
      console.warn(`Sound not found: ${soundName}`)
      return
    }

    try {
      // Reset to beginning and play
      sound.currentTime = 0
      await sound.play()
    } catch (error) {
      // Autoplay was probably blocked, fail silently
      console.warn(`Failed to play sound: ${soundName}`, error)
    }
  }

  // Specific game sound methods for easy integration
  async playWordValid() {
    await this.play('word-valid')
  }

  async playWordInvalid() {
    await this.play('word-invalid')
  }

  async playLetterSelect() {
    await this.play('letter-select')
  }

  async playBoardRotate() {
    await this.play('board-rotate')
  }

  async playPuzzleComplete() {
    await this.play('puzzle-complete')
  }

  async playHintActivate() {
    await this.play('hint-activate')
  }

  setVolume(volume: number) {
    this.globalVolume = Math.max(0, Math.min(1, volume))
    
    // Update volume of all loaded sounds
    Object.entries(this.soundConfig).forEach(([name, config]) => {
      const audio = this.sounds.get(name)
      if (audio) {
        audio.volume = this.globalVolume * (config.volume || 1.0)
      }
    })
  }

  toggle() {
    this.enabled = !this.enabled
    console.log('🔊 Sound', this.enabled ? 'enabled' : 'disabled')
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }

  getVolume() {
    return this.globalVolume
  }

  // Preload a specific sound (useful for critical sounds)
  preloadSound(soundName: string) {
    const sound = this.sounds.get(soundName)
    if (sound) {
      sound.load()
    }
  }

  // Get list of available sounds
  getAvailableSounds() {
    return Array.from(this.sounds.keys())
  }

  // Test sound playback (useful for settings)
  async testSound(soundName: string = 'letter-select') {
    await this.play(soundName, true) // Force play even if disabled
  }
}

// Create singleton instance
export const soundManager = new SoundManager()

// Export for easy access
export default soundManager
