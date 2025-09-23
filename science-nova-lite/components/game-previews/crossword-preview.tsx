import React from 'react'

interface CrosswordPreviewProps {
  className?: string
}

export const CrosswordPreview: React.FC<CrosswordPreviewProps> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      {/* Large Crossword Interface Preview */}
      <div className="w-full h-full flex flex-col justify-center p-6 bg-gradient-to-br from-orange-900/40 to-yellow-900/40 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 opacity-90">
          <div className="bg-orange-500/60 px-4 py-2 rounded-lg text-sm text-orange-200 font-medium">
            5 Words
          </div>
          <div className="text-sm text-gray-300 font-medium">🧩 Crossword</div>
        </div>
        
        {/* Large Crossword Grid */}
        <div className="grid grid-cols-7 gap-1 mb-6 justify-center mx-auto">
          {/* Row 1 - WATER */}
          <div className="w-8 h-8 bg-white/30 border-2 border-orange-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <div className="w-8 h-8 bg-white/30 border-2 border-orange-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <div className="w-8 h-8 bg-white/30 border-2 border-orange-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">T</span>
          </div>
          <div className="w-8 h-8 bg-white/30 border-2 border-orange-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <div className="w-8 h-8 bg-white/30 border-2 border-orange-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          
          {/* Row 2 */}
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-white/30 border-2 border-orange-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">O</span>
          </div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          
          {/* Row 3 - ICE */}
          <div className="w-8 h-8 bg-white/30 border-2 border-blue-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">I</span>
          </div>
          <div className="w-8 h-8 bg-white/30 border-2 border-blue-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <div className="w-8 h-8 bg-white/30 border-2 border-blue-400/50 rounded-md flex items-center justify-center shadow-lg">
            <span className="text-sm font-bold text-white">E</span>
          </div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          
          {/* Row 4 */}
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-white/20 border-2 border-orange-300/60 rounded-md flex items-center justify-center animate-pulse">
            <span className="text-sm text-orange-300">?</span>
          </div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
          <div className="w-8 h-8 bg-transparent"></div>
        </div>
        
        {/* Clues Section */}
        <div className="space-y-2 mb-4 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-sm text-white">
            <span className="text-green-400 font-semibold">1 Across:</span> H₂O substance
          </div>
          <div className="text-sm text-white">
            <span className="text-blue-400 font-semibold">2 Down:</span> Frozen water
          </div>
        </div>
        
        {/* Input Area */}
        <div className="bg-white/20 border-2 border-orange-400/50 rounded-lg px-4 py-3 flex items-center justify-between shadow-lg">
          <span className="text-white font-medium">Type answer...</span>
          <span className="text-orange-400 font-bold">Enter</span>
        </div>
      </div>
    </div>
  )
}