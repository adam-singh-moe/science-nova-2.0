"use client"

import { useEffect } from 'react'
import { dailyCleanup } from '@/lib/daily-cleanup'

export function CacheCleanupInitializer() {
  useEffect(() => {
    // Initialize daily cache cleanup on component mount
    console.log('🚀 Initializing daily cache cleanup...')
    dailyCleanup.startDailyCleanup()

    // Cleanup on unmount
    return () => {
      dailyCleanup.stopDailyCleanup()
    }
  }, [])

  // This component doesn't render anything
  return null
}
