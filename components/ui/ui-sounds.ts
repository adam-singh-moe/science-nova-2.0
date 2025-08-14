// Sound effects utility for general UI interactions
export class UISounds {
  private static instance: UISounds
  private audioContext: AudioContext | null = null
  private soundEnabled = true

  private constructor() {
    // Initialize audio context when first used
    this.initAudioContext()
  }

  static getInstance(): UISounds {
    if (!UISounds.instance) {
      UISounds.instance = new UISounds()
    }
    return UISounds.instance
  }

  private initAudioContext() {
    // Only initialize audio context on the client side
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('Web Audio API not supported:', error)
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled
  }

  // Soft, futuristic "blip" for standard button clicks
  playClick() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filterNode = this.audioContext.createBiquadFilter()

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a soft, futuristic blip
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.05)
      oscillator.type = 'sine'
      
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(1200, this.audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.08)
    } catch (error) {
      console.warn('Error playing click sound:', error)
    }
  }

  // Gentle "swoosh" for toggles and switches
  playToggle() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filterNode = this.audioContext.createBiquadFilter()

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a gentle swoosh effect
      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15)
      oscillator.type = 'triangle'
      
      filterNode.type = 'bandpass'
      filterNode.frequency.setValueAtTime(600, this.audioContext.currentTime)
      filterNode.Q.setValueAtTime(2, this.audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.15)
    } catch (error) {
      console.warn('Error playing toggle sound:', error)
    }
  }

  // Positive, sparkling "chime" for successful task completion
  playSuccess() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      // Create multiple oscillators for a sparkling chime effect
      const frequencies = [523, 659, 784, 1047] // C5, E5, G5, C6 - major chord
      
      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext!.createOscillator()
        const gainNode = this.audioContext!.createGain()
        const filterNode = this.audioContext!.createBiquadFilter()

        oscillator.connect(filterNode)
        filterNode.connect(gainNode)
        gainNode.connect(this.audioContext!.destination)

        oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime)
        oscillator.type = 'sine'
        
        filterNode.type = 'lowpass'
        filterNode.frequency.setValueAtTime(2000, this.audioContext!.currentTime)
        
        const delay = index * 0.05 // Stagger the notes
        const startTime = this.audioContext!.currentTime + delay
        
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.06, startTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4)

        oscillator.start(startTime)
        oscillator.stop(startTime + 0.4)
      })
    } catch (error) {
      console.warn('Error playing success sound:', error)
    }
  }

  // Smooth "whoosh" for opening modals or dialogs
  playOpen() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filterNode = this.audioContext.createBiquadFilter()

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a smooth whoosh effect
      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.2)
      oscillator.type = 'sawtooth'
      
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(300, this.audioContext.currentTime)
      filterNode.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2)
      
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.25)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.25)
    } catch (error) {
      console.warn('Error playing open sound:', error)
    }
  }

  // Close sound for modals/dialogs - reverse of open
  playClose() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filterNode = this.audioContext.createBiquadFilter()

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a reverse whoosh effect
      oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.15)
      oscillator.type = 'sawtooth'
      
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(800, this.audioContext.currentTime)
      filterNode.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.15)
      
      gainNode.gain.setValueAtTime(0.04, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.15)
    } catch (error) {
      console.warn('Error playing close sound:', error)
    }
  }

  // Error sound for failed actions
  playError() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a gentle error sound - low frequency
      oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime) // A3
      oscillator.frequency.setValueAtTime(196, this.audioContext.currentTime + 0.1) // G3
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Error playing error sound:', error)
    }
  }

  // Hover sound for interactive elements
  playHover() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filterNode = this.audioContext.createBiquadFilter()

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a subtle hover sound
      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime)
      oscillator.type = 'sine'
      
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(1500, this.audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.05)
    } catch (error) {
      console.warn('Error playing hover sound:', error)
    }
  }
}

export const uiSounds = UISounds.getInstance()
