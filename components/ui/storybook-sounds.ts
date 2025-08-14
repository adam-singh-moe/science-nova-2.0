// Sound effects utility for storybook
export class StorybookSounds {
  private static instance: StorybookSounds
  private audioContext: AudioContext | null = null
  private soundEnabled = true
  private ambientLoop: OscillatorNode | null = null
  private ambientGainNode: GainNode | null = null

  private constructor() {
    // Initialize audio context when first used
    this.initAudioContext()
  }

  static getInstance(): StorybookSounds {
    if (!StorybookSounds.instance) {
      StorybookSounds.instance = new StorybookSounds()
    }
    return StorybookSounds.instance
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

  // Generate page turn sound effect
  playPageTurn() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a swoosh sound effect
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3)
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Error playing sound:', error)
    }
  }

  // Generate word click sound effect
  playWordClick() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a gentle click sound
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.1)
    } catch (error) {
      console.warn('Error playing sound:', error)
    }
  }

  // Generate ambient background music (optional)
  playAmbientMusic() {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      // Create a very subtle, continuous ambient tone
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filterNode = this.audioContext.createBiquadFilter()

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime)
      oscillator.type = 'sine'
      
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(400, this.audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime)

      oscillator.start(this.audioContext.currentTime)
      
      // Fade out after 10 seconds
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 10)
      oscillator.stop(this.audioContext.currentTime + 10)
    } catch (error) {
      console.warn('Error playing ambient music:', error)
    }
  }

  // Generate quiz feedback sound effect
  playFeedback(isCorrect: boolean) {
    if (!this.soundEnabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      if (isCorrect) {
        // Success sound - ascending melody
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime) // C5
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1) // E5
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2) // G5
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)
        oscillator.stop(this.audioContext.currentTime + 0.3)
      } else {
        // Gentle incorrect sound - single note
        oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime) // E4
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4)
        oscillator.stop(this.audioContext.currentTime + 0.4)
      }

      oscillator.start(this.audioContext.currentTime)
    } catch (error) {
      console.warn('Error playing feedback sound:', error)
    }
  }

  // AI-powered ambient soundscape generation - DISABLED
  async playAmbientSoundscape(storyContent: string, storyTitle: string) {
    // DISABLED: Current synthesized approach creates annoying ringing sounds
    console.log('🔇 Ambient soundscape disabled - current implementation too harsh')
    return
    
    /* DISABLED CODE - keeping for reference
    if (!this.soundEnabled || !this.audioContext) return

    // Stop any existing ambient loop
    this.stopAmbientLoop()

    try {
      console.log('🎵 Generating AI-powered ambient soundscape...')
      
      // Get AI-generated soundscape description
      const soundscapeDescription = await this.generateSoundscapeDescription(storyContent, storyTitle)
      console.log('🎨 Soundscape concept:', soundscapeDescription)
      
      // Create natural ambient sound based on AI description
      this.createNaturalAmbientSound(soundscapeDescription)
      
    } catch (error) {
      console.warn('Error generating ambient soundscape:', error)
      // Fallback to gentle default sound
      this.createGentleDefaultAmbient()
    }
    */
  }

  // Generate soundscape description using AI
  private async generateSoundscapeDescription(storyContent: string, storyTitle: string): Promise<string> {
    try {
      const response = await fetch('/api/generate-soundscape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyTitle,
          storyContent: storyContent.substring(0, 1000), // Limit content length
        })
      })

      if (!response.ok) {
        throw new Error(`Soundscape generation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.soundscape || 'gentle nature ambience with soft wind and distant birds'
      
    } catch (error) {
      console.warn('Error calling soundscape API:', error)
      // Fallback to content-based analysis
      return this.analyzeSoundscapeFromContent(storyContent, storyTitle)
    }
  }

  // Fallback content analysis for soundscape
  private analyzeSoundscapeFromContent(storyContent: string, storyTitle: string): string {
    const content = `${storyTitle} ${storyContent}`.toLowerCase()
    
    // Natural soundscape mappings
    if (content.includes('ocean') || content.includes('sea') || content.includes('wave') || content.includes('beach')) {
      return 'gentle ocean waves with seagulls and soft coastal breeze'
    } else if (content.includes('forest') || content.includes('tree') || content.includes('jungle') || content.includes('nature')) {
      return 'peaceful forest with gentle wind through leaves and distant bird songs'
    } else if (content.includes('space') || content.includes('star') || content.includes('planet') || content.includes('cosmic')) {
      return 'ethereal cosmic ambience with subtle stellar harmonics'
    } else if (content.includes('mountain') || content.includes('cave') || content.includes('adventure')) {
      return 'mountain wilderness with gentle wind and echoing natural acoustics'
    } else if (content.includes('city') || content.includes('urban') || content.includes('street')) {
      return 'distant urban ambience with soft atmospheric tones'
    } else if (content.includes('rain') || content.includes('storm') || content.includes('cloud')) {
      return 'gentle rain with soft thunder in the distance'
    } else {
      return 'peaceful nature ambience with soft wind and gentle harmonic tones'
    }
  }

  // Create natural-sounding ambient audio
  private createNaturalAmbientSound(description: string) {
    if (!this.audioContext) return

    try {
      // Create base ambient tone
      const baseOscillator = this.audioContext.createOscillator()
      const baseGain = this.audioContext.createGain()
      const baseFilter = this.audioContext.createBiquadFilter()

      // Create texture layer
      const textureOscillator = this.audioContext.createOscillator()
      const textureGain = this.audioContext.createGain()
      const textureFilter = this.audioContext.createBiquadFilter()

      // Create subtle high-frequency layer
      const highOscillator = this.audioContext.createOscillator()
      const highGain = this.audioContext.createGain()
      const highFilter = this.audioContext.createBiquadFilter()

      // Configure based on soundscape description
      if (description.includes('ocean') || description.includes('wave')) {
        this.configureOceanAmbient(baseOscillator, baseGain, baseFilter, textureOscillator, textureGain, textureFilter)
      } else if (description.includes('forest') || description.includes('nature') || description.includes('bird')) {
        this.configureForestAmbient(baseOscillator, baseGain, baseFilter, textureOscillator, textureGain, textureFilter)
      } else if (description.includes('cosmic') || description.includes('space') || description.includes('stellar')) {
        this.configureCosmicAmbient(baseOscillator, baseGain, baseFilter, textureOscillator, textureGain, textureFilter)
      } else if (description.includes('rain') || description.includes('storm')) {
        this.configureRainAmbient(baseOscillator, baseGain, baseFilter, textureOscillator, textureGain, textureFilter)
      } else {
        this.configureGenericNatureAmbient(baseOscillator, baseGain, baseFilter, textureOscillator, textureGain, textureFilter)
      }

      // Add subtle high-frequency sparkle
      highOscillator.type = 'sine'
      highOscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime)
      highFilter.type = 'highpass'
      highFilter.frequency.setValueAtTime(1800, this.audioContext.currentTime)
      highGain.gain.setValueAtTime(0.003, this.audioContext.currentTime)

      // Connect high-frequency layer
      highOscillator.connect(highFilter)
      highFilter.connect(highGain)
      highGain.connect(this.audioContext.destination)

      // Start all oscillators
      baseOscillator.start(this.audioContext.currentTime)
      textureOscillator.start(this.audioContext.currentTime)
      highOscillator.start(this.audioContext.currentTime)

      // Store reference for cleanup
      this.ambientLoop = baseOscillator
      this.ambientGainNode = baseGain

      // Add gentle modulation
      this.addNaturalModulation(baseGain, textureGain)

    } catch (error) {
      console.warn('Error creating natural ambient sound:', error)
    }
  }

  // Ocean wave configuration
  private configureOceanAmbient(baseOsc: OscillatorNode, baseGain: GainNode, baseFilter: BiquadFilterNode, 
                                textureOsc: OscillatorNode, textureGain: GainNode, textureFilter: BiquadFilterNode) {
    if (!this.audioContext) return

    // Base wave sound
    baseOsc.type = 'sine'
    baseOsc.frequency.setValueAtTime(80, this.audioContext.currentTime)
    baseFilter.type = 'lowpass'
    baseFilter.frequency.setValueAtTime(200, this.audioContext.currentTime)
    baseGain.gain.setValueAtTime(0.015, this.audioContext.currentTime)

    // Texture layer for wave movement
    textureOsc.type = 'triangle'
    textureOsc.frequency.setValueAtTime(120, this.audioContext.currentTime)
    textureFilter.type = 'bandpass'
    textureFilter.frequency.setValueAtTime(300, this.audioContext.currentTime)
    textureFilter.Q.setValueAtTime(2, this.audioContext.currentTime)
    textureGain.gain.setValueAtTime(0.008, this.audioContext.currentTime)

    // Connect nodes
    baseOsc.connect(baseFilter)
    baseFilter.connect(baseGain)
    baseGain.connect(this.audioContext.destination)

    textureOsc.connect(textureFilter)
    textureFilter.connect(textureGain)
    textureGain.connect(this.audioContext.destination)
  }

  // Forest ambient configuration
  private configureForestAmbient(baseOsc: OscillatorNode, baseGain: GainNode, baseFilter: BiquadFilterNode,
                                 textureOsc: OscillatorNode, textureGain: GainNode, textureFilter: BiquadFilterNode) {
    if (!this.audioContext) return

    // Base wind through trees
    baseOsc.type = 'sine'
    baseOsc.frequency.setValueAtTime(150, this.audioContext.currentTime)
    baseFilter.type = 'lowpass'
    baseFilter.frequency.setValueAtTime(400, this.audioContext.currentTime)
    baseGain.gain.setValueAtTime(0.012, this.audioContext.currentTime)

    // Texture for rustling leaves
    textureOsc.type = 'sawtooth'
    textureOsc.frequency.setValueAtTime(300, this.audioContext.currentTime)
    textureFilter.type = 'bandpass'
    textureFilter.frequency.setValueAtTime(800, this.audioContext.currentTime)
    textureFilter.Q.setValueAtTime(3, this.audioContext.currentTime)
    textureGain.gain.setValueAtTime(0.005, this.audioContext.currentTime)

    // Connect nodes
    baseOsc.connect(baseFilter)
    baseFilter.connect(baseGain)
    baseGain.connect(this.audioContext.destination)

    textureOsc.connect(textureFilter)
    textureFilter.connect(textureGain)
    textureGain.connect(this.audioContext.destination)
  }

  // Cosmic ambient configuration
  private configureCosmicAmbient(baseOsc: OscillatorNode, baseGain: GainNode, baseFilter: BiquadFilterNode,
                                 textureOsc: OscillatorNode, textureGain: GainNode, textureFilter: BiquadFilterNode) {
    if (!this.audioContext) return

    // Base cosmic drone
    baseOsc.type = 'sine'
    baseOsc.frequency.setValueAtTime(60, this.audioContext.currentTime)
    baseFilter.type = 'lowpass'
    baseFilter.frequency.setValueAtTime(150, this.audioContext.currentTime)
    baseGain.gain.setValueAtTime(0.010, this.audioContext.currentTime)

    // Ethereal texture
    textureOsc.type = 'triangle'
    textureOsc.frequency.setValueAtTime(220, this.audioContext.currentTime)
    textureFilter.type = 'highpass'
    textureFilter.frequency.setValueAtTime(180, this.audioContext.currentTime)
    textureGain.gain.setValueAtTime(0.006, this.audioContext.currentTime)

    // Connect nodes
    baseOsc.connect(baseFilter)
    baseFilter.connect(baseGain)
    baseGain.connect(this.audioContext.destination)

    textureOsc.connect(textureFilter)
    textureFilter.connect(textureGain)
    textureGain.connect(this.audioContext.destination)
  }

  // Rain ambient configuration
  private configureRainAmbient(baseOsc: OscillatorNode, baseGain: GainNode, baseFilter: BiquadFilterNode,
                               textureOsc: OscillatorNode, textureGain: GainNode, textureFilter: BiquadFilterNode) {
    if (!this.audioContext) return

    // Base rain sound
    baseOsc.type = 'sine'
    baseOsc.frequency.setValueAtTime(200, this.audioContext.currentTime)
    baseFilter.type = 'lowpass'
    baseFilter.frequency.setValueAtTime(600, this.audioContext.currentTime)
    baseGain.gain.setValueAtTime(0.008, this.audioContext.currentTime)

    // Rain texture
    textureOsc.type = 'sawtooth'
    textureOsc.frequency.setValueAtTime(800, this.audioContext.currentTime)
    textureFilter.type = 'bandpass'
    textureFilter.frequency.setValueAtTime(1200, this.audioContext.currentTime)
    textureFilter.Q.setValueAtTime(5, this.audioContext.currentTime)
    textureGain.gain.setValueAtTime(0.004, this.audioContext.currentTime)

    // Connect nodes
    baseOsc.connect(baseFilter)
    baseFilter.connect(baseGain)
    baseGain.connect(this.audioContext.destination)

    textureOsc.connect(textureFilter)
    textureFilter.connect(textureGain)
    textureGain.connect(this.audioContext.destination)
  }

  // Generic nature ambient configuration
  private configureGenericNatureAmbient(baseOsc: OscillatorNode, baseGain: GainNode, baseFilter: BiquadFilterNode,
                                        textureOsc: OscillatorNode, textureGain: GainNode, textureFilter: BiquadFilterNode) {
    if (!this.audioContext) return

    // Gentle base tone
    baseOsc.type = 'sine'
    baseOsc.frequency.setValueAtTime(110, this.audioContext.currentTime)
    baseFilter.type = 'lowpass'
    baseFilter.frequency.setValueAtTime(300, this.audioContext.currentTime)
    baseGain.gain.setValueAtTime(0.010, this.audioContext.currentTime)

    // Soft texture
    textureOsc.type = 'triangle'
    textureOsc.frequency.setValueAtTime(165, this.audioContext.currentTime)
    textureFilter.type = 'bandpass'
    textureFilter.frequency.setValueAtTime(500, this.audioContext.currentTime)
    textureFilter.Q.setValueAtTime(2, this.audioContext.currentTime)
    textureGain.gain.setValueAtTime(0.006, this.audioContext.currentTime)

    // Connect nodes
    baseOsc.connect(baseFilter)
    baseFilter.connect(baseGain)
    baseGain.connect(this.audioContext.destination)

    textureOsc.connect(textureFilter)
    textureFilter.connect(textureGain)
    textureGain.connect(this.audioContext.destination)
  }

  // Add natural modulation for organic feel
  private addNaturalModulation(baseGain: GainNode, textureGain: GainNode) {
    if (!this.audioContext) return

    // Very slow, gentle modulation
    const lfo1 = this.audioContext.createOscillator()
    const lfo1Gain = this.audioContext.createGain()
    
    lfo1.type = 'sine'
    lfo1.frequency.setValueAtTime(0.05, this.audioContext.currentTime) // 20-second cycle
    lfo1Gain.gain.setValueAtTime(0.002, this.audioContext.currentTime) // Very subtle
    
    lfo1.connect(lfo1Gain)
    lfo1Gain.connect(baseGain.gain)
    lfo1.start(this.audioContext.currentTime)

    // Even slower modulation for texture
    const lfo2 = this.audioContext.createOscillator()
    const lfo2Gain = this.audioContext.createGain()
    
    lfo2.type = 'triangle'
    lfo2.frequency.setValueAtTime(0.03, this.audioContext.currentTime) // 33-second cycle
    lfo2Gain.gain.setValueAtTime(0.001, this.audioContext.currentTime) // Very subtle
    
    lfo2.connect(lfo2Gain)
    lfo2Gain.connect(textureGain.gain)
    lfo2.start(this.audioContext.currentTime)
  }

  // Gentle fallback ambient sound
  private createGentleDefaultAmbient() {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      const filterNode = this.audioContext.createBiquadFilter()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime) // A2
      
      filterNode.type = 'lowpass'
      filterNode.frequency.setValueAtTime(250, this.audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.008, this.audioContext.currentTime) // Even quieter

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.start(this.audioContext.currentTime)

      this.ambientLoop = oscillator
      this.ambientGainNode = gainNode

    } catch (error) {
      console.warn('Error creating gentle default ambient:', error)
    }
  }

  // Stop ambient loop
  stopAmbientLoop() {
    if (this.ambientLoop) {
      try {
        this.ambientLoop.stop()
        this.ambientLoop = null
        this.ambientGainNode = null
      } catch (error) {
        console.warn('Error stopping ambient loop:', error)
      }
    }
  }
}

export const storybookSounds = StorybookSounds.getInstance()
