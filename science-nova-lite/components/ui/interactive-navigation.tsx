"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { PhysicsIcon, ChemistryIcon, BiologyIcon, MathIcon, BeakerIcon } from './science-icons'
import { 
  BookOpen, 
  Trophy, 
  User, 
  Home, 
  Search, 
  Settings,
  ChevronRight,
  Star,
  Target,
  Zap
} from 'lucide-react'

// Interactive Navigation Item with hover effects
interface NavItemProps {
  icon: React.ReactNode
  label: string
  href?: string
  active?: boolean
  onClick?: () => void
  className?: string
  badge?: number
  description?: string
}

export const InteractiveNavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  href,
  active = false,
  onClick,
  className,
  badge,
  description
}) => {
  const ItemWrapper = href ? 'a' : 'button'
  
  return (
    <ItemWrapper
      href={href}
      onClick={onClick}
      className={cn(
        'group relative w-full flex items-center gap-3 px-4 py-3 rounded-lg',
        'transition-all duration-300 ease-out',
        'hover:bg-white/80 hover:shadow-md hover:animate-nav-hover',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
        'active:scale-[0.98]',
        active && 'bg-blue-50 text-blue-700 shadow-md',
        !active && 'text-gray-700 hover:text-blue-600',
        className
      )}
    >
      {/* Icon with hover animation */}
      <div className={cn(
        'relative flex items-center justify-center w-8 h-8',
        'transition-transform duration-300',
        'group-hover:animate-icon-hover'
      )}>
        {icon}
        
        {/* Badge indicator */}
        {badge && badge > 0 && (
          <div className={cn(
            'absolute -top-1 -right-1 w-4 h-4',
            'bg-red-500 text-white text-xs font-bold',
            'rounded-full flex items-center justify-center',
            'animate-soft-pulse'
          )}>
            {badge > 99 ? '99+' : badge}
          </div>
        )}
      </div>
      
      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {description}
          </div>
        )}
      </div>
      
      {/* Arrow indicator */}
      <ChevronRight className={cn(
        'w-4 h-4 opacity-0 group-hover:opacity-100',
        'transform translate-x-[-4px] group-hover:translate-x-0',
        'transition-all duration-200'
      )} />
      
      {/* Active indicator */}
      {active && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
      )}
    </ItemWrapper>
  )
}

// Subject-specific navigation with science icons
export const SubjectNavigation: React.FC<{ className?: string }> = ({ className }) => {
  const subjects = [
    {
      icon: <PhysicsIcon size="md" animated />,
      label: 'Physics',
      description: 'Forces, energy & motion',
      color: 'text-blue-600'
    },
    {
      icon: <ChemistryIcon size="md" animated />,
      label: 'Chemistry', 
      description: 'Atoms, molecules & reactions',
      color: 'text-green-600'
    },
    {
      icon: <BiologyIcon size="md" animated />,
      label: 'Biology',
      description: 'Life & living organisms',
      color: 'text-purple-600'
    },
    {
      icon: <MathIcon size="md" animated />,
      label: 'Mathematics',
      description: 'Numbers, patterns & logic',
      color: 'text-orange-600'
    },
    {
      icon: <BeakerIcon size="md" animated />,
      label: 'General Science',
      description: 'Mixed topics & experiments',
      color: 'text-gray-600'
    }
  ]

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-4 mb-3">
        Study Areas
      </h3>
      {subjects.map((subject, index) => (
        <InteractiveNavItem
          key={subject.label}
          icon={<div className={subject.color}>{subject.icon}</div>}
          label={subject.label}
          description={subject.description}
          className="animate-stagger-fade"
          style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Main navigation with achievement indicators
export const MainNavigation: React.FC<{ className?: string }> = ({ className }) => {
  const mainItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: 'Dashboard',
      description: 'Your learning overview',
      active: true
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: 'Topics',
      description: 'Explore science topics',
      badge: 3
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      label: 'Achievements',
      description: 'Track your progress',
      badge: 1
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'Profile',
      description: 'Manage your account'
    }
  ]

  return (
    <div className={cn('space-y-1', className)}>
      {mainItems.map((item, index) => (
        <InteractiveNavItem
          key={item.label}
          {...item}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 100}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// Quick stats with animated progress
export const QuickStats: React.FC<{ className?: string }> = ({ className }) => {
  const stats = [
    {
      icon: <Star className="w-4 h-4 text-yellow-500" />,
      label: 'Level 5',
      progress: 75,
      color: 'bg-yellow-500'
    },
    {
      icon: <Target className="w-4 h-4 text-green-500" />,
      label: '12 Topics',
      progress: 60,
      color: 'bg-green-500'
    },
    {
      icon: <Zap className="w-4 h-4 text-orange-500" />,
      label: '5 Day Streak',
      progress: 83,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className={cn('space-y-3 px-4', className)}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Quick Stats
      </h3>
      {stats.map((stat, index) => (
        <div 
          key={stat.label}
          className="flex items-center gap-3 animate-stagger-fade"
          style={{ animationDelay: `${index * 100 + 500}ms` } as React.CSSProperties}
        >
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm">
            {stat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-700">{stat.label}</div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className={cn(
                  'h-1.5 rounded-full transition-all duration-1000 ease-out animate-progress-fill',
                  stat.color
                )}
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export {
  InteractiveNavItem,
  SubjectNavigation,
  MainNavigation,
  QuickStats
}
