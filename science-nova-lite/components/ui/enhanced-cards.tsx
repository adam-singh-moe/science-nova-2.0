import { cn } from '@/lib/utils'

interface DiscoveryCardProps {
  children: React.ReactNode
  type: 'FACT' | 'INFO'
  className?: string
  isFlipped?: boolean
  isExpanded?: boolean
  onClick?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  'aria-label'?: string
  tabIndex?: number
}

export function DiscoveryCard({
  children,
  type,
  className,
  isFlipped = false,
  isExpanded = false,
  onClick,
  onKeyDown,
  'aria-label': ariaLabel,
  tabIndex = 0,
  ...props
}: DiscoveryCardProps) {
  const baseClasses = [
    'cursor-pointer',
    'transition-all',
    'duration-500',
    'transform',
    'hover:scale-105',
    'hover:shadow-2xl',
    'backdrop-blur-lg',
    'shadow-lg',
    'hover:shadow-xl',
    'rounded-xl',
    'border-2',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'focus-visible:ring-offset-transparent',
  ]

  const typeClasses = type === 'FACT' 
    ? [
        'bg-gradient-to-br',
        'from-purple-600/80',
        'to-purple-800/80',
        'border-purple-400/50',
        'text-white',
        'hover:from-purple-500/90',
        'hover:to-purple-700/90',
        'focus-visible:ring-purple-400',
      ]
    : [
        'bg-gradient-to-br',
        'from-cyan-600/80',
        'to-cyan-800/80',
        'border-cyan-400/50',
        'text-white',
        'hover:from-cyan-500/90',
        'hover:to-cyan-700/90',
        'focus-visible:ring-cyan-400',
      ]

  const transformClasses = []
  if (isFlipped && type === 'FACT') {
    transformClasses.push('card-flip', 'flipped')
  }
  if (isExpanded) {
    transformClasses.push('scale-110', 'z-50')
  }

  return (
    <div
      className={cn(
        ...baseClasses,
        ...typeClasses,
        ...transformClasses,
        className
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      role="button"
      style={{
        transformStyle: type === 'FACT' ? 'preserve-3d' : undefined,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardFace({ 
  children, 
  isBack = false, 
  className 
}: { 
  children: React.ReactNode
  isBack?: boolean
  className?: string 
}) {
  return (
    <div
      className={cn(
        'w-full',
        'h-full',
        'card-face',
        isBack && 'card-face-back',
        className
      )}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: isBack ? 'rotateY(180deg)' : undefined,
      }}
    >
      {children}
    </div>
  )
}

export function GameButton({
  children,
  variant = 'primary',
  size = 'large',
  className,
  disabled = false,
  onClick,
  ...props
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'small' | 'medium' | 'large'
  className?: string
  disabled?: boolean
  onClick?: () => void
  [key: string]: any
}) {
  const baseClasses = [
    'game-button',
    'font-semibold',
    'transition-all',
    'duration-300',
    'transform',
    'hover:scale-105',
    'focus:outline-none',
    'focus:ring-4',
    'focus:ring-offset-2',
    'focus:ring-offset-transparent',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:hover:scale-100',
    'disabled:hover:shadow-none',
  ]

  const variantClasses = {
    primary: [
      'bg-gradient-to-r',
      'from-purple-600/80',
      'to-pink-600/80',
      'hover:from-purple-600',
      'hover:to-pink-600',
      'text-white',
      'border',
      'border-purple-400/30',
      'focus:ring-purple-400',
      'hover:shadow-purple-500/30',
    ],
    secondary: [
      'bg-white/10',
      'hover:bg-white/20',
      'text-white',
      'border',
      'border-white/20',
      'hover:border-white/40',
      'focus:ring-white',
    ],
    success: [
      'bg-gradient-to-r',
      'from-green-600/80',
      'to-emerald-600/80',
      'hover:from-green-600',
      'hover:to-emerald-600',
      'text-white',
      'border',
      'border-green-400/30',
      'focus:ring-green-400',
      'hover:shadow-green-500/30',
    ],
    warning: [
      'bg-gradient-to-r',
      'from-orange-600/80',
      'to-yellow-600/80',
      'hover:from-orange-600',
      'hover:to-yellow-600',
      'text-white',
      'border',
      'border-orange-400/30',
      'focus:ring-orange-400',
      'hover:shadow-orange-500/30',
    ],
    danger: [
      'bg-gradient-to-r',
      'from-red-600/80',
      'to-pink-600/80',
      'hover:from-red-600',
      'hover:to-pink-600',
      'text-white',
      'border',
      'border-red-400/30',
      'focus:ring-red-400',
      'hover:shadow-red-500/30',
    ],
  }

  const sizeClasses = {
    small: ['px-4', 'py-2', 'text-sm', 'min-h-[40px]'],
    medium: ['px-6', 'py-3', 'text-base', 'min-h-[50px]'],
    large: ['px-8', 'py-4', 'text-lg', 'min-h-[60px]'],
  }

  return (
    <button
      className={cn(
        ...baseClasses,
        ...variantClasses[variant],
        ...sizeClasses[size],
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

export function FeedbackMessage({
  type,
  message,
  className
}: {
  type: 'success' | 'error' | 'info'
  message: string
  className?: string
}) {
  const typeClasses = {
    success: [
      'bg-green-500/20',
      'border-green-400/30',
      'text-green-100',
      'border-2',
    ],
    error: [
      'bg-orange-500/20',
      'border-orange-400/30',
      'text-orange-100',
      'border-2',
    ],
    info: [
      'bg-blue-500/20',
      'border-blue-400/30',
      'text-blue-100',
      'border-2',
    ],
  }

  return (
    <div
      className={cn(
        'p-6',
        'rounded-xl',
        'text-center',
        'feedback-bounce',
        'backdrop-blur-sm',
        ...typeClasses[type],
        className
      )}
    >
      <div className="text-xl child-readable font-bold mb-2">
        {message}
      </div>
    </div>
  )
}