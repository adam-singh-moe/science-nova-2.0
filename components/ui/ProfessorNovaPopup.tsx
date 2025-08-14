"use client"

import { Bot, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Insight {
  type: string
  title: string
  content: string
  buttonText: string
}

interface ProfessorNovaPopupProps {
  isOpen: boolean
  isLoading: boolean
  insight: Insight | null
  onClose: () => void
}

export function ProfessorNovaPopup({ isOpen, isLoading, insight, onClose }: ProfessorNovaPopupProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card 
        className={`
          bg-background/80 backdrop-blur-2xl border-2 border-accent shadow-2xl shadow-accent/20 rounded-2xl
          max-w-md mx-4 transform transition-all duration-500 ease-out
          ${isAnimating 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-95'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Professor Nova Avatar */}
        <div className="relative p-6 pb-4">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-8 w-8 p-0 hover:bg-accent/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Professor Nova Avatar and Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {/* Glowing avatar container */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 p-1 animate-pulse">
                <div className="w-full h-full rounded-full bg-background/90 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              {/* Sparkle effects around avatar */}
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-bounce" />
              </div>
              <div className="absolute -bottom-1 -left-1">
                <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground">Professor Nova</h3>
              <p className="text-sm text-muted-foreground">AI Science Tutor</p>
            </div>
          </div>

          {/* Insight Title */}
          {insight && (
            <h4 className="text-lg font-semibold text-foreground mb-2">
              {insight.title}
            </h4>
          )}
        </div>

        {/* Body Content */}
        <div className="px-6 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              {/* Loading animation with spinning atoms */}
              <div className="relative mb-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-500 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <p className="text-center text-muted-foreground text-sm animate-pulse">
                Professor Nova is analyzing the data...
              </p>
              <div className="flex gap-1 mt-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-100"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animation-delay-200"></div>
              </div>
            </div>
          ) : insight ? (
            <div className="space-y-4">
              {/* Insight Content */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-foreground leading-relaxed">
                  {insight.content}
                </p>
              </div>

              {/* Insight Type Badge */}
              <div className="flex justify-center">
                <span className={`
                  inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                  ${insight.type === 'FunFact' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    insight.type === 'Question' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    insight.type === 'Discussion' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }
                `}>
                  {insight.type === 'FunFact' && '🤓'} 
                  {insight.type === 'Question' && '🤔'} 
                  {insight.type === 'Discussion' && '💭'} 
                  {insight.type === 'Challenge' && '🎯'} 
                  {insight.type}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Something went wrong. Try again!</p>
            </div>
          )}
        </div>

        {/* Footer with Action Button */}
        <div className="px-6 pb-6">
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing...
              </>
            ) : insight ? (
              insight.buttonText
            ) : (
              "Close"
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ProfessorNovaPopup
