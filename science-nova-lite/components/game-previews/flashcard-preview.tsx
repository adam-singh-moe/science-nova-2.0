import React from 'react'

interface FlashcardPreviewProps {
  className?: string
}

export const FlashcardPreview: React.FC<FlashcardPreviewProps> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      {/* Large Flashcard Interface Preview */}
      <div className="w-full h-full flex flex-col justify-center p-6 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-sm relative">
        {/* Card Stack Effect - More prominent */}
        <div className="absolute inset-4 bg-blue-500/20 rounded-xl border border-blue-400/30 transform rotate-2 shadow-lg"></div>
        <div className="absolute inset-2 bg-blue-500/30 rounded-xl border border-blue-400/40 transform rotate-1 shadow-lg"></div>
        
        {/* Progress */}
        <div className="flex items-center justify-between mb-6 opacity-90 relative z-10">
          <div className="bg-blue-500/60 px-4 py-2 rounded-lg text-sm text-blue-200 font-medium">
            Card 3 of 12
          </div>
          <div className="text-sm text-gray-300 font-medium">🧠 Study Mode</div>
        </div>
        
        {/* Large Flashcard Content */}
        <div className="bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-xl p-8 mb-6 border-2 border-blue-400/50 min-h-[120px] flex items-center justify-center relative z-10 shadow-xl">
          <div className="text-center transform group-hover:scale-105 transition-transform">
            <div className="text-4xl font-bold text-white mb-2 drop-shadow-lg">H₂O</div>
            <div className="text-blue-300 font-medium">Chemical Formula</div>
          </div>
        </div>
        
        {/* Card Controls - Larger buttons */}
        <div className="flex items-center justify-between mb-4 relative z-10 gap-4">
          <div className="bg-red-500/40 border-2 border-red-400/50 rounded-lg px-4 py-2 flex-1 text-center">
            <span className="text-red-300 font-medium">❌ Hard</span>
          </div>
          <div className="bg-white/20 border-2 border-white/30 rounded-lg px-4 py-2 flex-1 text-center">
            <span className="text-white font-medium">🔄 Flip</span>
          </div>
          <div className="bg-green-500/40 border-2 border-green-400/50 rounded-lg px-4 py-2 flex-1 text-center">
            <span className="text-green-300 font-medium">✅ Easy</span>
          </div>
        </div>
        
        {/* Progress Dots - Larger */}
        <div className="flex justify-center space-x-2 relative z-10">
          <div className="w-2 h-2 bg-blue-400 rounded-full shadow-sm"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full shadow-sm"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}