"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { BookOpen, Search, Trophy, Rocket, Star, Lightbulb, Target, Users, Heart, Zap } from 'lucide-react'

// Empty State Illustration Components with friendly, encouraging designs
interface EmptyStateProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  title: string
  description: string
  action?: React.ReactNode
}

const sizeClasses = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-64 h-64'
}

// Base Empty State Illustration
export const EmptyStateIllustration: React.FC<EmptyStateProps & { 
  icon: React.ReactNode;
  backgroundPattern?: React.ReactNode;
}> = ({
  className,
  size = 'md',
  animated = true,
  title,
  description,
  action,
  icon,
  backgroundPattern
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center text-center p-8 space-y-6',
    className
  )}>
    {/* Illustration Container */}
    <div className={cn(
      sizeClasses[size],
      'relative flex items-center justify-center',
      animated && 'group'
    )}>
      {/* Background Pattern */}
      {backgroundPattern && (
        <div className="absolute inset-0 opacity-5">
          {backgroundPattern}
        </div>
      )}
      
      {/* Main Icon */}
      <div className={cn(
        'relative z-10 text-6xl transition-transform duration-500',
        animated && 'group-hover:scale-110 group-hover:animate-gentle-bounce'
      )}>
        {icon}
      </div>
      
      {/* Floating decorative elements */}
      {animated && (
        <>
          <div className="absolute top-4 right-8 w-2 h-2 bg-blue-400 rounded-full animate-float opacity-60" 
               style={{ animationDelay: '0s' }} />
          <div className="absolute bottom-8 left-4 w-1.5 h-1.5 bg-green-400 rounded-full animate-float opacity-50" 
               style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 left-8 w-1 h-1 bg-purple-400 rounded-full animate-float opacity-40" 
               style={{ animationDelay: '2s' }} />
        </>
      )}
    </div>
    
    {/* Content */}
    <div className="space-y-3 max-w-sm">
      <h3 className={cn(
        'text-xl font-semibold text-gray-700',
        animated && 'animate-fade-up'
      )}>
        {title}
      </h3>
      <p className={cn(
        'text-gray-500 leading-relaxed',
        animated && 'animate-stagger-fade'
      )} style={{ animationDelay: '0.2s' }}>
        {description}
      </p>
    </div>
    
    {/* Action Button */}
    {action && (
      <div className={cn(
        animated && 'animate-stagger-fade'
      )} style={{ animationDelay: '0.4s' }}>
        {action}
      </div>
    )}
  </div>
)

// No Topics Found
export const NoTopicsFound: React.FC<Omit<EmptyStateProps, 'title' | 'description'>> = (props) => (
  <EmptyStateIllustration
    {...props}
    title="🚀 No topics found yet!"
    description="Try adjusting your search or filters to discover amazing science topics waiting for you."
    icon={
      <div className="relative">
        <BookOpen className="w-16 h-16 text-blue-500" />
        <Search className="w-6 h-6 text-blue-400 absolute -bottom-1 -right-1 animate-soft-pulse" />
      </div>
    }
    backgroundPattern={
      <div className="grid grid-cols-6 gap-4 h-full w-full">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-full h-full bg-blue-200 rounded opacity-20" />
        ))}
      </div>
    }
  />
)

// No Achievements Yet
export const NoAchievements: React.FC<Omit<EmptyStateProps, 'title' | 'description'>> = (props) => (
  <EmptyStateIllustration
    {...props}
    title="🌟 Your journey begins here!"
    description="Complete your first science topic to unlock your first achievement. Every great scientist started with a single step!"
    icon={
      <div className="relative">
        <Trophy className="w-16 h-16 text-yellow-500" />
        <Star className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-subtle-glow" />
      </div>
    }
    backgroundPattern={
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 border-2 border-dashed border-yellow-300 rounded-full" />
      </div>
    }
  />
)

// No Search Results
export const NoSearchResults: React.FC<Omit<EmptyStateProps, 'title' | 'description'> & { searchTerm: string }> = ({ 
  searchTerm, 
  ...props 
}) => (
  <EmptyStateIllustration
    {...props}
    title={`🔍 No results for "${searchTerm}"`}
    description="Try different keywords or browse our topic categories to find what you're looking for."
    icon={
      <div className="relative">
        <Search className="w-16 h-16 text-gray-400" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-lg">?</span>
        </div>
      </div>
    }
  />
)

// Welcome/Getting Started
export const WelcomeIllustration: React.FC<Omit<EmptyStateProps, 'title' | 'description'>> = (props) => (
  <EmptyStateIllustration
    {...props}
    title="🎉 Welcome to Science Nova!"
    description="Start your amazing journey through the world of science. Explore topics, earn achievements, and learn with AI assistance!"
    icon={
      <div className="relative">
        <Rocket className="w-16 h-16 text-blue-500 animate-gentle-bounce" />
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-orange-400 rounded animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-1 h-3 bg-red-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 h-4 bg-yellow-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    }
    backgroundPattern={
      <div className="absolute inset-0">
        <div className="absolute top-8 left-8 w-12 h-12 border-2 border-blue-200 rounded rotate-12" />
        <div className="absolute bottom-8 right-8 w-8 h-8 border-2 border-green-200 rounded-full" />
        <div className="absolute top-1/2 right-12 w-6 h-6 border-2 border-purple-200 rounded" />
      </div>
    }
  />
)

// No Progress Yet
export const NoProgress: React.FC<Omit<EmptyStateProps, 'title' | 'description'>> = (props) => (
  <EmptyStateIllustration
    {...props}
    title="📊 Ready to make progress?"
    description="Complete topics and activities to see your learning progress and achievements here!"
    icon={
      <div className="relative">
        <Target className="w-16 h-16 text-green-500" />
        <Zap className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-soft-pulse" />
      </div>
    }
  />
)

// Connection Error
export const ConnectionError: React.FC<Omit<EmptyStateProps, 'title' | 'description'>> = (props) => (
  <EmptyStateIllustration
    {...props}
    title="🌐 Connection issue"
    description="We're having trouble connecting to our servers. Please check your internet connection and try again."
    icon={
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-300 border-dashed rounded-full flex items-center justify-center">
          <span className="text-2xl">📡</span>
        </div>
      </div>
    }
  />
)

// Loading State with Science Theme
export const ScienceLoading: React.FC<{ message?: string; className?: string }> = ({ 
  message = "Loading...", 
  className 
}) => (
  <div className={cn(
    'flex flex-col items-center justify-center p-8 space-y-4',
    className
  )}>
    <div className="relative w-16 h-16">
      {/* Rotating atom */}
      <div className="absolute inset-0 animate-spin">
        <div className="w-full h-full border-4 border-blue-200 border-t-blue-500 rounded-full" />
      </div>
      <div className="absolute inset-2 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}>
        <div className="w-full h-full border-2 border-green-200 border-r-green-500 rounded-full" />
      </div>
      <div className="absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      </div>
    </div>
    <p className="text-gray-600 animate-soft-pulse">{message}</p>
  </div>
)

export {
  EmptyStateIllustration,
  NoTopicsFound,
  NoAchievements,
  NoSearchResults,
  WelcomeIllustration,
  NoProgress,
  ConnectionError,
  ScienceLoading
}
