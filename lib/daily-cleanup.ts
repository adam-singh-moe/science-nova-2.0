// Daily cache cleanup scheduler
export class DailyCacheCleanup {
  private static instance: DailyCacheCleanup
  private cleanupTimer: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  static getInstance(): DailyCacheCleanup {
    if (!DailyCacheCleanup.instance) {
      DailyCacheCleanup.instance = new DailyCacheCleanup()
    }
    return DailyCacheCleanup.instance
  }

  // Start daily cleanup scheduler (call this on app startup)
  startDailyCleanup() {
    if (this.cleanupTimer || this.isRunning) {
      console.log('🔄 Daily cache cleanup already running')
      return
    }

    // Calculate milliseconds until next midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    console.log(`🕒 Scheduling daily cache cleanup in ${Math.round(msUntilMidnight / 1000 / 60 / 60)} hours`)

    // Set timeout for first cleanup at midnight
    setTimeout(() => {
      this.performCleanup()
      
      // Then set interval for every 24 hours
      this.cleanupTimer = setInterval(() => {
        this.performCleanup()
      }, 24 * 60 * 60 * 1000) // 24 hours in milliseconds
      
    }, msUntilMidnight)

    this.isRunning = true
  }

  // Stop the cleanup scheduler
  stopDailyCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
      this.isRunning = false
      console.log('🛑 Daily cache cleanup scheduler stopped')
    }
  }

  // Perform the actual cleanup
  private async performCleanup() {
    try {
      console.log('🗑️ Performing scheduled daily cache cleanup...')
      
      // Use the current domain or localhost for the API call
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      
      const response = await fetch(`${baseUrl}/api/daily-cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Scheduled cache cleanup completed:', result.message)
      } else {
        console.error('❌ Scheduled cache cleanup failed:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error in scheduled cache cleanup:', error)
    }
  }

  // Manual cleanup (for testing)
  async manualCleanup() {
    return this.performCleanup()
  }

  // Get cleanup status
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasTimer: !!this.cleanupTimer,
      nextCleanup: this.cleanupTimer ? 'Scheduled for midnight' : 'Not scheduled'
    }
  }
}

// Export singleton instance
export const dailyCleanup = DailyCacheCleanup.getInstance()

// Initialize in browser environment only
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Start cleanup scheduler when the module is loaded
  dailyCleanup.startDailyCleanup()
}
