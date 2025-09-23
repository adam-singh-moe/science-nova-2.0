import React from 'react'

interface QuizPreviewProps {
  className?: string
}

export const QuizPreview: React.FC<QuizPreviewProps> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      {/* Large Quiz Interface Preview */}
      <div className="w-full h-full flex flex-col justify-center p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-4 opacity-80">
          <div className="bg-purple-500/60 px-3 py-1.5 rounded-lg text-sm text-purple-200 font-medium">
            Question 1 of 5
          </div>
          <div className="text-sm text-gray-300 font-mono">⏱️ 2:30</div>
        </div>
        
        {/* Question */}
        <div className="mb-6">
          <div className="text-lg font-semibold text-white mb-4 leading-tight">
            What is the chemical symbol for water?
          </div>
          
          {/* Answer Options - Larger and more prominent */}
          <div className="space-y-3">
            <div className="bg-white/20 border-2 border-purple-400/40 rounded-lg px-4 py-3 text-white font-medium hover:bg-purple-500/30 transition-colors">
              A) H₂O
            </div>
            <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-gray-200">
              B) CO₂
            </div>
            <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-gray-200">
              C) NaCl
            </div>
            <div className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-gray-200">
              D) O₂
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-2 mb-4">
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full w-1/5 shadow-lg"></div>
        </div>
        
        {/* Submit Button */}
        <div className="bg-gradient-to-r from-purple-500/80 to-pink-500/80 rounded-lg px-6 py-3 text-center shadow-lg">
          <span className="text-white font-semibold">Submit Answer</span>
        </div>
      </div>
    </div>
  )
}