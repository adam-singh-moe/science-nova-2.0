"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Trophy, Star, Target, Zap, BookOpen, Brain, Rocket, Award, Medal, Crown } from 'lucide-react'

// Achievement Badge Components with elegant designs
interface BadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  animated?: boolean
  children?: React.ReactNode
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
}

const variantClasses = {
  bronze: {
    bg: 'bg-gradient-to-br from-amber-600 to-orange-700',
    ring: 'ring-amber-500/50',
    shadow: 'shadow-[0_8px_30px_rgb(245,158,11,0.3)]',
    glow: 'animate-[glow_2s_ease-in-out_infinite_alternate] shadow-amber-400/50'
  },
  silver: {
    bg: 'bg-gradient-to-br from-slate-400 to-slate-600',
    ring: 'ring-slate-400/50',
    shadow: 'shadow-[0_8px_30px_rgb(148,163,184,0.3)]',
    glow: 'animate-[glow_2s_ease-in-out_infinite_alternate] shadow-slate-400/50'
  },
  gold: {
    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    ring: 'ring-yellow-400/50',
    shadow: 'shadow-[0_8px_30px_rgb(250,204,21,0.4)]',
    glow: 'animate-[glow_2s_ease-in-out_infinite_alternate] shadow-yellow-400/60'
  },
  platinum: {
    bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    ring: 'ring-slate-300/60',
    shadow: 'shadow-[0_8px_30px_rgb(203,213,225,0.4)]',
    glow: 'animate-[glow_2s_ease-in-out_infinite_alternate] shadow-slate-300/60'
  },
  diamond: {
    bg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
    ring: 'ring-cyan-400/60',
    shadow: 'shadow-[0_8px_30px_rgb(34,211,238,0.4)]',
    glow: 'animate-[glow_2s_ease-in-out_infinite_alternate] shadow-cyan-400/60'
  }
}

// Base Achievement Badge
export const AchievementBadge: React.FC<BadgeProps> = ({
  className,
  size = 'md',
  variant = 'gold',
  animated = false,
  children
}) => {
  const variantStyle = variantClasses[variant]
  
  return (
    <div className={cn(
      sizeClasses[size],
      'relative inline-flex items-center justify-center rounded-full',
      'border-2 border-white ring-4',
      variantStyle.bg,
      variantStyle.ring,
      variantStyle.shadow,
      animated && [variantStyle.glow, 'hover:scale-110 transition-transform duration-300'],
      className
    )}>
      <div className="relative z-10 text-white">
        {children}
      </div>
      
      {/* Inner highlight */}
      <div className="absolute inset-2 rounded-full bg-white/20 blur-sm" />
      
      {/* Sparkle effects for animated badges */}
      {animated && (
        <>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-60" />
        </>
      )}
    </div>
  )
}

// Specific Achievement Badges
export const LearningBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props}>
    <BookOpen className="w-1/2 h-1/2" />
  </AchievementBadge>
)

export const ExplorationBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props}>
    <Target className="w-1/2 h-1/2" />
  </AchievementBadge>
)

export const ConsistencyBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props}>
    <Zap className="w-1/2 h-1/2" />
  </AchievementBadge>
)

export const MasteryBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props}>
    <Crown className="w-1/2 h-1/2" />
  </AchievementBadge>
)

export const TrophyBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props}>
    <Trophy className="w-1/2 h-1/2" />
  </AchievementBadge>
)

export const StarBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props}>
    <Star className="w-1/2 h-1/2" />
  </AchievementBadge>
)

// Milestone Badges with Numbers
export const MilestoneBadge: React.FC<BadgeProps & { number: number }> = ({
  number,
  ...props
}) => (
  <AchievementBadge {...props}>
    <span className="text-xs font-bold">{number}</span>
  </AchievementBadge>
)

// Subject-specific badges
export const PhysicsBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props} variant="silver">
    <div className="text-xs font-bold">⚛️</div>
  </AchievementBadge>
)

export const ChemistryBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props} variant="bronze">
    <div className="text-xs font-bold">🧪</div>
  </AchievementBadge>
)

export const BiologyBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props} variant="gold">
    <div className="text-xs font-bold">🌿</div>
  </AchievementBadge>
)

export const MathBadge: React.FC<Omit<BadgeProps, 'children'>> = (props) => (
  <AchievementBadge {...props} variant="platinum">
    <div className="text-xs font-bold">π</div>
  </AchievementBadge>
)

export {
  AchievementBadge,
  LearningBadge,
  ExplorationBadge,
  ConsistencyBadge,
  MasteryBadge,
  TrophyBadge,
  StarBadge,
  MilestoneBadge,
  PhysicsBadge,
  ChemistryBadge,
  BiologyBadge,
  MathBadge
}
