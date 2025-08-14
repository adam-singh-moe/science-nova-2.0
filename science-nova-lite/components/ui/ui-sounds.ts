// Sound effects utility for general UI interactions (lite copy)
export class UISounds {
  private static instance: UISounds
  private audioContext: AudioContext | null = null
  private soundEnabled = true

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch {}
    }
  }

  static getInstance(): UISounds {
    if (!UISounds.instance) UISounds.instance = new UISounds()
    return UISounds.instance
  }

  setSoundEnabled(enabled: boolean) { this.soundEnabled = enabled }

  private blip(freqStart: number, freqEnd: number, dur = 0.12, type: OscillatorType = 'sine', vol = 0.08) {
    if (!this.soundEnabled || !this.audioContext) return
    try {
      const ctx = this.audioContext
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + dur * 0.8)
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
      osc.start(); osc.stop(ctx.currentTime + dur)
    } catch {}
  }

  playClick() { this.blip(800, 600, 0.08, 'sine', 0.06) }
  playToggle() { this.blip(400, 200, 0.15, 'triangle', 0.06) }
  playSuccess() { this.blip(700, 1000, 0.2, 'sine', 0.06) }
  playOpen() { this.blip(150, 300, 0.2, 'sawtooth', 0.05) }
  playClose() { this.blip(300, 150, 0.15, 'sawtooth', 0.04) }
  playError() { this.blip(220, 190, 0.2, 'sine', 0.07) }
  playHover() { this.blip(1000, 900, 0.05, 'sine', 0.03) }
}

export const uiSounds = UISounds.getInstance()
