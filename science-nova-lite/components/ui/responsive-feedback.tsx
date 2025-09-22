"use client"

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Check, Wifi, WifiOff, Upload, Save, AlertCircle, Loader2 } from 'lucide-react'

// Progressive Image Loading with Blur-to-Sharp Effect
interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  onLoad?: () => void
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className,
  placeholder,
  onLoad
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [imageSrc, setImageSrc] = useState(placeholder || '')

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setImageSrc(src)
      setIsLoaded(true)
      onLoad?.()
    }
  }, [src, onLoad])

  return (
    <div className="relative overflow-hidden">
      <img
        src={imageSrc || src}
        alt={alt}
        className={cn(
          'transition-all duration-800 ease-out',
          !isLoaded && 'filter blur-xl scale-110',
          isLoaded && 'filter-none scale-100 animate-blur-to-sharp',
          className
        )}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}
    </div>
  )
}

// Save State Indicator Component
interface SaveIndicatorProps {
  state: 'idle' | 'saving' | 'saved' | 'error'
  className?: string
  showText?: boolean
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  state,
  className,
  showText = true
}) => {
  const getIndicatorContent = () => {
    switch (state) {
      case 'saving':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          text: 'Saving...',
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-700'
        }
      case 'saved':
        return {
          icon: <Check className="w-4 h-4 animate-saved-checkmark" />,
          text: 'Saved',
          bgColor: 'bg-green-500',
          textColor: 'text-green-700'
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Error saving',
          bgColor: 'bg-red-500',
          textColor: 'text-red-700'
        }
      default:
        return null
    }
  }

  const content = getIndicatorContent()
  if (!content) return null

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
      'transition-all duration-300 ease-out',
      state === 'saving' && 'animate-saving-pulse',
      state === 'saved' && 'animate-save-success',
      className
    )}>
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-white',
        content.bgColor
      )}>
        {content.icon}
      </div>
      {showText && (
        <span className={content.textColor}>
          {content.text}
        </span>
      )}
    </div>
  )
}

// Auto-save Indicator
export const AutoSaveIndicator: React.FC<{ visible: boolean; className?: string }> = ({
  visible,
  className
}) => {
  if (!visible) return null

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50',
      'bg-white shadow-lg border border-gray-200 rounded-lg px-3 py-2',
      'animate-auto-save',
      className
    )}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Auto-saved
      </div>
    </div>
  )
}

// Connection Status Indicator
interface ConnectionStatusProps {
  isOnline: boolean
  className?: string
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
  className
}) => {
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    setShowIndicator(true)
    const timer = setTimeout(() => setShowIndicator(false), 3000)
    return () => clearTimeout(timer)
  }, [isOnline])

  if (!showIndicator) return null

  return (
    <div className={cn(
      'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
      'px-4 py-2 rounded-full text-white text-sm font-medium',
      'transition-all duration-500 ease-out',
      isOnline 
        ? 'bg-green-500 animate-online-fade' 
        : 'bg-red-500 animate-offline-fade',
      className
    )}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4 animate-connection-pulse" />
        )}
        {isOnline ? 'Connected' : 'Offline'}
      </div>
    </div>
  )
}

// Upload Progress Component
interface UploadProgressProps {
  progress: number
  fileName?: string
  isComplete?: boolean
  className?: string
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  fileName,
  isComplete = false,
  className
}) => {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-72',
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isComplete ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        )}>
          {isComplete ? (
            <Check className="w-4 h-4 animate-saved-checkmark" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {fileName || 'Uploading file...'}
          </p>
          <p className="text-sm text-gray-500">
            {isComplete ? 'Upload complete' : `${Math.round(progress)}% complete`}
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300 ease-out',
            isComplete 
              ? 'bg-green-500 animate-upload-complete' 
              : 'bg-blue-500 animate-upload-progress'
          )}
          style={{ 
            width: `${progress}%`,
            '--progress-width': `${progress}%`
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

// Touch-Responsive Button with Ripple Effect
interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  className,
  disabled = false,
  variant = 'primary'
}) => {
  const [isPressed, setIsPressed] = useState(false)

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }

  const handleTouchStart = () => {
    if (!disabled) setIsPressed(true)
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
    if (!disabled) onClick?.()
  }

  return (
    <button
      className={cn(
        'touch-ripple relative px-4 py-2 rounded-lg font-medium',
        'transition-all duration-200 ease-out',
        'active:animate-touch-feedback',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        isPressed && 'scale-95',
        disabled && 'opacity-50 cursor-not-allowed',
        variantStyles[variant],
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Responsive Loading Skeleton
interface LoadingSkeletonProps {
  lines?: number
  className?: string
  variant?: 'text' | 'card' | 'avatar' | 'image'
}

export const ResponsiveLoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className,
  variant = 'text'
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="space-y-3">
            <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
          </div>
        )
      case 'avatar':
        return (
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        )
      case 'image':
        return (
          <div className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
        )
      default:
        return (
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-4 bg-gray-200 rounded animate-pulse',
                  i === lines - 1 && 'w-2/3'
                )}
              />
            ))}
          </div>
        )
    }
  }

  return (
    <div className={cn('animate-pulse', className)}>
      {renderSkeleton()}
    </div>
  )
}

// Gesture-Aware Swipe Container
interface SwipeContainerProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  className?: string
}

export const SwipeContainer: React.FC<SwipeContainerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  className
}) => {
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [isSwipping, setIsSwiping] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setStartY(e.touches[0].clientY)
    setIsSwiping(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSwipping) return

    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = startX - currentX
    const diffY = startY - currentY

    const threshold = 50

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > threshold) {
        setIsSwiping(true)
        if (diffX > 0 && onSwipeLeft) {
          onSwipeLeft()
        } else if (diffX < 0 && onSwipeRight) {
          onSwipeRight()
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > threshold && diffY > 0 && onSwipeUp) {
        setIsSwiping(true)
        onSwipeUp()
      }
    }
  }

  return (
    <div
      className={cn('touch-pan-y', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {children}
    </div>
  )
}

// All components are already exported inline above
