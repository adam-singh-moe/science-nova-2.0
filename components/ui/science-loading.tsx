import React from 'react'

interface ScienceLoadingProps {
  message?: string
  type?: 'beaker' | 'atom' | 'rocket'
}

export function ScienceLoading({ 
  message = "Loading your learning adventure...", 
  type = 'beaker' 
}: ScienceLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {/* Loading Animation */}
        <div className="mb-6 relative">
          {type === 'beaker' && <BeakerAnimation />}
          {type === 'atom' && <AtomAnimation />}
          {type === 'rocket' && <RocketAnimation />}
        </div>
        
        {/* Loading Message */}
        <div className="text-white/90 text-xl font-medium animate-pulse">
          {message}
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center mt-4 space-x-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

function BeakerAnimation() {
  return (
    <div className="relative w-24 h-32 mx-auto">
      {/* Beaker Base */}
      <div className="absolute bottom-0 w-20 h-20 bg-gradient-to-t from-blue-500/30 to-transparent border-2 border-white/30 rounded-b-2xl mx-auto left-2">
        {/* Liquid */}
        <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-accent/50 to-accent/20 rounded-b-xl animate-pulse">
          {/* Bubbles */}
          <div className="bubble bubble-1"></div>
          <div className="bubble bubble-2"></div>
          <div className="bubble bubble-3"></div>
          <div className="bubble bubble-4"></div>
        </div>
      </div>
      
      {/* Beaker Neck */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white/10 border-2 border-white/30 rounded-t-lg"></div>
      
      {/* Steam */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
        <div className="steam steam-1"></div>
        <div className="steam steam-2"></div>
        <div className="steam steam-3"></div>
      </div>
    </div>
  )
}

function AtomAnimation() {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Nucleus */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full shadow-[0_0_15px_hsl(var(--accent))] animate-pulse"></div>
      
      {/* Electron Orbits */}
      <div className="absolute inset-0 animate-spin-slow">
        <div className="w-full h-full border border-white/30 rounded-full relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
        </div>
      </div>
      
      <div className="absolute inset-2 animate-spin-reverse">
        <div className="w-full h-full border border-white/20 rounded-full relative transform rotate-45">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      </div>
      
      <div className="absolute inset-1 animate-spin">
        <div className="w-full h-full border border-white/25 rounded-full relative transform rotate-90">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

function RocketAnimation() {
  return (
    <div className="relative w-16 h-24 mx-auto">
      {/* Rocket Body */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-gradient-to-b from-white/80 to-gray-300/80 rounded-t-full border border-white/30 animate-bounce">
        {/* Rocket Window */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-400/80 rounded-full"></div>
        
        {/* Rocket Fins */}
        <div className="absolute bottom-0 -left-1 w-2 h-4 bg-red-400/80 transform skew-y-12"></div>
        <div className="absolute bottom-0 -right-1 w-2 h-4 bg-red-400/80 transform -skew-y-12"></div>
      </div>
      
      {/* Rocket Flames */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
        <div className="flame flame-1"></div>
        <div className="flame flame-2"></div>
        <div className="flame flame-3"></div>
      </div>
      
      {/* Exhaust Particles */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>
    </div>
  )
}
