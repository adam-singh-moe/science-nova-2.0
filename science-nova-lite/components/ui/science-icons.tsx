"use client"

import React from 'react'
import { cn } from '@/lib/utils'

// Science-themed icon components with clean, minimalist designs
interface ScienceIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

// Physics Icon - Atom with orbital rings
export const PhysicsIcon: React.FC<ScienceIconProps> = ({ 
  className, 
  size = 'md', 
  animated = false 
}) => (
  <div className={cn(
    sizeClasses[size],
    'relative inline-flex items-center justify-center',
    animated && 'group',
    className
  )}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        'w-full h-full',
        animated && 'group-hover:animate-gentle-bounce transition-transform duration-300'
      )}
    >
      {/* Nucleus */}
      <circle 
        cx="12" 
        cy="12" 
        r="2" 
        fill="currentColor"
        className={animated ? 'animate-soft-pulse' : ''}
      />
      
      {/* Orbital rings */}
      <ellipse 
        cx="12" 
        cy="12" 
        rx="8" 
        ry="4" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        className={cn(
          'opacity-70',
          animated && 'group-hover:animate-[spin_4s_linear_infinite]'
        )}
      />
      <ellipse 
        cx="12" 
        cy="12" 
        rx="8" 
        ry="4" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        className={cn(
          'opacity-50',
          animated && 'group-hover:animate-[spin_3s_linear_infinite_reverse]'
        )}
        transform="rotate(60 12 12)"
      />
      <ellipse 
        cx="12" 
        cy="12" 
        rx="8" 
        ry="4" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="none"
        className={cn(
          'opacity-30',
          animated && 'group-hover:animate-[spin_5s_linear_infinite]'
        )}
        transform="rotate(120 12 12)"
      />
    </svg>
  </div>
)

// Chemistry Icon - Molecular structure with bonds
export const ChemistryIcon: React.FC<ScienceIconProps> = ({ 
  className, 
  size = 'md', 
  animated = false 
}) => (
  <div className={cn(
    sizeClasses[size],
    'relative inline-flex items-center justify-center',
    animated && 'group',
    className
  )}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        'w-full h-full',
        animated && 'group-hover:animate-gentle-bounce transition-transform duration-300'
      )}
    >
      {/* Molecular bonds */}
      <line x1="6" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" className="opacity-60" />
      <line x1="12" y1="12" x2="18" y2="8" stroke="currentColor" strokeWidth="2" className="opacity-60" />
      <line x1="12" y1="12" x2="12" y2="18" stroke="currentColor" strokeWidth="2" className="opacity-60" />
      
      {/* Atoms */}
      <circle 
        cx="6" 
        cy="8" 
        r="2.5" 
        fill="currentColor"
        className={cn(
          'opacity-80',
          animated && 'group-hover:animate-soft-pulse'
        )}
      />
      <circle 
        cx="18" 
        cy="8" 
        r="2.5" 
        fill="currentColor"
        className={cn(
          'opacity-70',
          animated && 'group-hover:animate-soft-pulse'
        )}
        style={{ animationDelay: '0.2s' }}
      />
      <circle 
        cx="12" 
        cy="12" 
        r="3" 
        fill="currentColor"
        className={cn(
          'opacity-90',
          animated && 'group-hover:animate-soft-pulse'
        )}
        style={{ animationDelay: '0.1s' }}
      />
      <circle 
        cx="12" 
        cy="18" 
        r="2.5" 
        fill="currentColor"
        className={cn(
          'opacity-75',
          animated && 'group-hover:animate-soft-pulse'
        )}
        style={{ animationDelay: '0.3s' }}
      />
    </svg>
  </div>
)

// Biology Icon - DNA double helix
export const BiologyIcon: React.FC<ScienceIconProps> = ({ 
  className, 
  size = 'md', 
  animated = false 
}) => (
  <div className={cn(
    sizeClasses[size],
    'relative inline-flex items-center justify-center',
    animated && 'group',
    className
  )}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        'w-full h-full',
        animated && 'group-hover:animate-gentle-bounce transition-transform duration-300'
      )}
    >
      {/* DNA strands */}
      <path
        d="M8 4 Q12 8 8 12 Q12 16 8 20"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        className={cn(
          'opacity-80',
          animated && 'group-hover:animate-[wave_2s_ease-in-out_infinite]'
        )}
      />
      <path
        d="M16 4 Q12 8 16 12 Q12 16 16 20"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        className={cn(
          'opacity-80',
          animated && 'group-hover:animate-[wave_2s_ease-in-out_infinite_reverse]'
        )}
      />
      
      {/* Base pairs */}
      <line x1="8" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
      <line x1="10" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
      <line x1="10" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
      <line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth="1.5" className="opacity-50" />
    </svg>
  </div>
)

// Math Icon - Mathematical symbols and equations
export const MathIcon: React.FC<ScienceIconProps> = ({ 
  className, 
  size = 'md', 
  animated = false 
}) => (
  <div className={cn(
    sizeClasses[size],
    'relative inline-flex items-center justify-center',
    animated && 'group',
    className
  )}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        'w-full h-full',
        animated && 'group-hover:animate-gentle-bounce transition-transform duration-300'
      )}
    >
      {/* Mathematical symbols */}
      <text
        x="12"
        y="8"
        textAnchor="middle"
        className={cn(
          'fill-current text-xs font-bold',
          animated && 'group-hover:animate-soft-pulse'
        )}
      >
        π
      </text>
      
      <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="2" />
      
      <text
        x="8"
        y="17"
        textAnchor="middle"
        className={cn(
          'fill-current text-xs font-bold',
          animated && 'group-hover:animate-soft-pulse'
        )}
        style={{ animationDelay: '0.1s' }}
      >
        x²
      </text>
      
      <text
        x="16"
        y="17"
        textAnchor="middle"
        className={cn(
          'fill-current text-xs font-bold',
          animated && 'group-hover:animate-soft-pulse'
        )}
        style={{ animationDelay: '0.2s' }}
      >
        √
      </text>
    </svg>
  </div>
)

// Beaker Icon for general science
export const BeakerIcon: React.FC<ScienceIconProps> = ({ 
  className, 
  size = 'md', 
  animated = false 
}) => (
  <div className={cn(
    sizeClasses[size],
    'relative inline-flex items-center justify-center',
    animated && 'group',
    className
  )}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        'w-full h-full',
        animated && 'group-hover:animate-gentle-bounce transition-transform duration-300'
      )}
    >
      {/* Beaker body */}
      <path
        d="M9 3v6l-4 8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1l-4-8V3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      
      {/* Liquid */}
      <path
        d="M7.5 14l1-2h7l1 2v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-3z"
        fill="currentColor"
        className={cn(
          'opacity-30',
          animated && 'group-hover:animate-soft-pulse'
        )}
      />
      
      {/* Bubbles */}
      <circle cx="10" cy="15" r="0.5" fill="currentColor" className="opacity-60" />
      <circle cx="13" cy="16" r="0.5" fill="currentColor" className="opacity-60" />
      <circle cx="11" cy="17" r="0.5" fill="currentColor" className="opacity-60" />
      
      {/* Beaker rim */}
      <line x1="9" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  </div>
)

// Progress metaphor icons

// DNA Progress Strand
export const DNAProgress: React.FC<{ progress: number; className?: string }> = ({ 
  progress, 
  className 
}) => (
  <div className={cn('relative w-8 h-16', className)}>
    <svg viewBox="0 0 32 64" className="w-full h-full">
      {/* Background strand */}
      <path
        d="M8 4 Q16 12 8 24 Q16 36 8 48 Q16 56 8 60"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="opacity-20"
      />
      <path
        d="M24 4 Q16 12 24 24 Q16 36 24 48 Q16 56 24 60"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="opacity-20"
      />
      
      {/* Progress strand */}
      <path
        d="M8 4 Q16 12 8 24 Q16 36 8 48 Q16 56 8 60"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="opacity-80"
        strokeDasharray="56"
        strokeDashoffset={56 - (progress / 100) * 56}
        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
      />
      <path
        d="M24 4 Q16 12 24 24 Q16 36 24 48 Q16 56 24 60"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="opacity-80"
        strokeDasharray="56"
        strokeDashoffset={56 - (progress / 100) * 56}
        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
      />
    </svg>
  </div>
)

// Atom Progress Ring
export const AtomProgress: React.FC<{ progress: number; className?: string }> = ({ 
  progress, 
  className 
}) => {
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('relative w-8 h-8', className)}>
      <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
        {/* Background ring */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="opacity-20"
        />
        
        {/* Progress ring */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="opacity-80"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
        
        {/* Nucleus */}
        <circle
          cx="16"
          cy="16"
          r="2"
          fill="currentColor"
          className="opacity-90"
        />
      </svg>
    </div>
  )
}

export {
  PhysicsIcon,
  ChemistryIcon,
  BiologyIcon,
  MathIcon,
  BeakerIcon,
  DNAProgress,
  AtomProgress
}
