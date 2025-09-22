"use client"

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Device capability detection
interface DeviceCapabilities {
  reduceMotion: boolean
  touchDevice: boolean
  lowPowerMode: boolean
  connectionSpeed: 'slow' | 'fast' | 'unknown'
  deviceMemory: number
}

// Custom hook for device capabilities
export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    reduceMotion: false,
    touchDevice: false,
    lowPowerMode: false,
    connectionSpeed: 'unknown',
    deviceMemory: 4
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const detectCapabilities = () => {
      // Reduced motion preference
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Touch device detection
      const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Battery API for low power mode (experimental)
      let lowPowerMode = false
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          lowPowerMode = battery.level < 0.2 && !battery.charging
          setCapabilities(prev => ({ ...prev, lowPowerMode }))
        }).catch(() => {})
      }

      // Connection speed estimation
      let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown'
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection.effectiveType) {
          connectionSpeed = ['slow-2g', '2g', '3g'].includes(connection.effectiveType) ? 'slow' : 'fast'
        }
      }

      // Device memory (if available)
      const deviceMemory = (navigator as any).deviceMemory || 4

      setCapabilities({
        reduceMotion,
        touchDevice,
        lowPowerMode,
        connectionSpeed,
        deviceMemory
      })
    }

    detectCapabilities()

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', detectCapabilities)

    return () => {
      motionQuery.removeEventListener('change', detectCapabilities)
    }
  }, [])

  return capabilities
}

// Adaptive Animation Wrapper
interface AdaptiveAnimationProps {
  children: React.ReactNode
  className?: string
  enabledAnimations?: string[]
  fallbackClassName?: string
  forceFallback?: boolean
  performanceMode?: 'auto' | 'high' | 'low'
}

export const AdaptiveAnimation: React.FC<AdaptiveAnimationProps> = ({
  children,
  className,
  enabledAnimations = [],
  fallbackClassName,
  forceFallback = false,
  performanceMode = 'auto'
}) => {
  const capabilities = useDeviceCapabilities()
  const [shouldUseAnimations, setShouldUseAnimations] = useState(true)

  useEffect(() => {
    if (forceFallback) {
      setShouldUseAnimations(false)
      return
    }

    // Determine if animations should be enabled based on device capabilities
    const shouldDisable = 
      capabilities.reduceMotion ||
      (performanceMode === 'low') ||
      (performanceMode === 'auto' && (
        capabilities.lowPowerMode ||
        capabilities.connectionSpeed === 'slow' ||
        capabilities.deviceMemory < 2
      ))

    setShouldUseAnimations(!shouldDisable)
  }, [capabilities, forceFallback, performanceMode])

  const finalClassName = shouldUseAnimations 
    ? cn(className, ...enabledAnimations)
    : cn(fallbackClassName || className?.replace(/animate-\S+/g, ''))

  return (
    <div 
      className={finalClassName}
      data-animations-enabled={shouldUseAnimations}
      data-device-touch={capabilities.touchDevice}
      data-reduce-motion={capabilities.reduceMotion}
    >
      {children}
    </div>
  )
}

// Performance-Aware Component Wrapper
interface PerformanceWrapperProps {
  children: React.ReactNode
  lazyThreshold?: number
  className?: string
  fallback?: React.ReactNode
}

export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({
  children,
  lazyThreshold = 0.1,
  className,
  fallback
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const capabilities = useDeviceCapabilities()

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        if (entry.isIntersecting) {
          // Delay rendering for low-end devices
          const delay = capabilities.deviceMemory < 2 ? 100 : 0
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: lazyThreshold }
    )

    const element = document.querySelector(`[data-performance-wrapper]`)
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [lazyThreshold, capabilities.deviceMemory])

  if (!isVisible) {
    return (
      <div 
        data-performance-wrapper
        className={cn('min-h-20', className)}
      >
        {fallback || (
          <div className="animate-pulse bg-gray-200 rounded h-full w-full" />
        )}
      </div>
    )
  }

  return (
    <div 
      data-performance-wrapper
      className={className}
      data-visible={isVisible}
      data-intersecting={isIntersecting}
    >
      {children}
    </div>
  )
}

// Touch-Optimized Interaction Zone
interface TouchZoneProps {
  children: React.ReactNode
  onTap?: () => void
  onDoubleTap?: () => void
  onLongPress?: () => void
  className?: string
  hapticFeedback?: boolean
  rippleEffect?: boolean
}

export const TouchZone: React.FC<TouchZoneProps> = ({
  children,
  onTap,
  onDoubleTap,
  onLongPress,
  className,
  hapticFeedback = true,
  rippleEffect = true
}) => {
  const [tapCount, setTapCount] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null)
  const capabilities = useDeviceCapabilities()

  useEffect(() => {
    if (tapCount === 1) {
      const timer = setTimeout(() => {
        if (onTap) onTap()
        setTapCount(0)
      }, 300)
      return () => clearTimeout(timer)
    } else if (tapCount === 2) {
      if (onDoubleTap) onDoubleTap()
      setTapCount(0)
    }
  }, [tapCount, onTap, onDoubleTap])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!capabilities.touchDevice) return

    setIsPressed(true)
    
    // Create ripple effect
    if (rippleEffect) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const y = e.touches[0].clientY - rect.top
      setRipplePosition({ x, y })
    }

    // Haptic feedback
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }

    // Long press detection
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress()
        setTapCount(0)
      }, 500)
      
      const handleTouchEnd = () => {
        clearTimeout(timer)
        document.removeEventListener('touchend', handleTouchEnd)
      }
      
      document.addEventListener('touchend', handleTouchEnd)
    }
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
    setTapCount(prev => prev + 1)
    
    // Clear ripple after animation
    setTimeout(() => setRipplePosition(null), 300)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden touch-manipulation',
        'transition-transform duration-100 ease-out',
        isPressed && capabilities.touchDevice && 'scale-95',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-touch-zone
    >
      {children}
      
      {/* Ripple Effect */}
      {ripplePosition && rippleEffect && (
        <div
          className="absolute pointer-events-none animate-touch-ripple"
          style={{
            left: ripplePosition.x - 20,
            top: ripplePosition.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            transform: 'scale(0)',
          }}
        />
      )}
    </div>
  )
}

// Responsive Layout Container with Device Awareness
interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  mobileFirst?: boolean
  adaptiveSpacing?: boolean
  optimizeForTouch?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileFirst = true,
  adaptiveSpacing = true,
  optimizeForTouch = true
}) => {
  const capabilities = useDeviceCapabilities()
  const [containerClass, setContainerClass] = useState('')

  useEffect(() => {
    let classes = []

    // Base responsive classes
    if (mobileFirst) {
      classes.push('flex flex-col sm:flex-row')
    }

    // Adaptive spacing based on device
    if (adaptiveSpacing) {
      if (capabilities.touchDevice) {
        classes.push('p-4 sm:p-6 lg:p-8')
      } else {
        classes.push('p-2 sm:p-4 lg:p-6')
      }
    }

    // Touch optimization
    if (optimizeForTouch && capabilities.touchDevice) {
      classes.push('min-h-12 min-w-12') // Minimum touch target size
    }

    // Connection-aware content loading
    if (capabilities.connectionSpeed === 'slow') {
      classes.push('space-y-2') // Reduced spacing for faster loading
    } else {
      classes.push('space-y-4')
    }

    setContainerClass(classes.join(' '))
  }, [capabilities, mobileFirst, adaptiveSpacing, optimizeForTouch])

  return (
    <div
      className={cn(containerClass, className)}
      data-touch-device={capabilities.touchDevice}
      data-connection-speed={capabilities.connectionSpeed}
      data-reduce-motion={capabilities.reduceMotion}
    >
      {children}
    </div>
  )
}

// Animation Performance Monitor
export const useAnimationPerformance = () => {
  const [frameRate, setFrameRate] = useState(60)
  const [isOptimal, setIsOptimal] = useState(true)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFrameRate = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setFrameRate(fps)
        setIsOptimal(fps >= 50) // Consider 50+ FPS as optimal
        
        frameCount = 0
        lastTime = currentTime
      }
      
      animationId = requestAnimationFrame(measureFrameRate)
    }

    animationId = requestAnimationFrame(measureFrameRate)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [])

  return { frameRate, isOptimal }
}
