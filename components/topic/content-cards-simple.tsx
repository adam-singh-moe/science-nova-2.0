"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { FlashcardComponent } from "@/components/ui/flashcard"
import { Lightbulb, BookOpen, Image as ImageIcon, Brain, Zap, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { theme } from "@/lib/theme"
import { useState } from "react"

// Types for different content types
export interface KeyConcept {
  id: string
  title: string
  content: string
  icon: string
}

export interface FunFact {
  id: string
  fact: string
}

export interface InteractiveDiagram {
  id: string
  imageUrl: string
  title: string
  hotspots: Array<{
    x: number
    y: number
    label: string
    description: string
  }>
}

export interface FlashcardData {
  id: string
  front: string
  back: string
  coverImage?: string
}

// Key Concept Card Component
export function KeyConceptCard({ concept }: { concept: KeyConcept }) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'brain': return <Brain className="h-5 w-5" />
      case 'zap': return <Zap className="h-5 w-5" />
      case 'sparkles': return <Sparkles className="h-5 w-5" />
      default: return <BookOpen className="h-5 w-5" />
    }
  }

  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.primary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${theme.text.primary} flex items-center gap-2 font-fredoka text-lg`}>
              {getIcon(concept.icon)}
              {concept.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${theme.text.secondary} font-comic text-sm leading-relaxed`}>
              {concept.content}
            </p>
            <Badge 
              className={`mt-4 ${theme.background.secondary} text-white font-bold border-2 border-white rounded-xl px-3 py-1 shadow-md`}
            >
              💡 Key Concept
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Fun Fact Card Component
export function FunFactCard({ funFact }: { funFact: FunFact }) {
  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02, rotate: 1 }}
      >
        <Card className={`backdrop-blur-lg ${theme.background.secondary} ${theme.border.secondary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full`}>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🤔</div>
            <Badge 
              className={`mb-4 ${theme.background.secondary} text-white font-bold border-2 border-white rounded-xl px-3 py-1 shadow-md`}
            >
              💭 Fun Fact
            </Badge>
            <p className={`${theme.text.primary} font-comic text-sm leading-relaxed font-bold`}>
              {funFact.fact}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Interactive Diagram Card Component (simplified without zoom)
export function InteractiveDiagramCard({ diagram }: { diagram: InteractiveDiagram }) {
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null)

  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${theme.text.secondary} flex items-center gap-2 font-fredoka text-lg`}>
              <ImageIcon className="h-5 w-5" />
              {diagram.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-100 rounded-xl p-4 mb-4">
              <div className="text-center py-8">
                <ImageIcon className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 font-comic">Interactive Diagram Placeholder</p>
                <p className="text-xs text-gray-400 mt-2">Zoom functionality temporarily disabled</p>
              </div>
            </div>
            
            <Badge 
              className={`${theme.background.secondary} text-white font-bold border-2 border-white rounded-xl px-3 py-1 shadow-md`}
            >
              🔍 Interactive Diagram
            </Badge>
            
            {selectedHotspot !== null && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-blue-800">
                  {diagram.hotspots[selectedHotspot]?.label}
                </h4>
                <p className="text-blue-600 text-sm">
                  {diagram.hotspots[selectedHotspot]?.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Flashcard Deck Component
export function FlashcardDeckCard({ flashcards }: { flashcards: FlashcardData[] }) {
  const [currentCard, setCurrentCard] = useState(0)

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % flashcards.length)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  if (flashcards.length === 0) {
    return (
      <div>
        <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 rounded-2xl shadow-lg h-full`}>
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🎴</div>
            <p className="text-gray-500 font-comic">No flashcards available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full`}>
          <CardHeader className="pb-3">
            <CardTitle className={`${theme.text.secondary} flex items-center gap-2 font-fredoka text-lg`}>
              <Sparkles className="h-5 w-5" />
              Flashcard Deck ({currentCard + 1}/{flashcards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <FlashcardComponent flashcard={flashcards[currentCard]} />
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={prevCard}
                disabled={flashcards.length <= 1}
                className={`px-4 py-2 rounded-lg ${theme.button.secondary} text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ← Previous
              </button>
              
              <Badge 
                className={`${theme.background.secondary} text-white font-bold border-2 border-white rounded-xl px-3 py-1 shadow-md`}
              >
                🎴 Study Cards
              </Badge>
              
              <button
                onClick={nextCard}
                disabled={flashcards.length <= 1}
                className={`px-4 py-2 rounded-lg ${theme.button.secondary} text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Next →
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
