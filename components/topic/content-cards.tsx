"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
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
  const getConceptIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'brain': return <Brain className="h-8 w-8" />
      case 'book': return <BookOpen className="h-8 w-8" />
      case 'zap': return <Zap className="h-8 w-8" />
      case 'sparkles': return <Sparkles className="h-8 w-8" />
      default: return <BookOpen className="h-8 w-8" />
    }
  }

  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className={`h-full backdrop-blur-lg ${theme.background.card} ${theme.border.primary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 ${theme.gradient.primary} rounded-xl shadow-lg text-white`}>
                {getConceptIcon(concept.icon)}
              </div>
              <CardTitle className={`${theme.text.primary} font-fredoka text-xl flex-1`}>
                🧠 {concept.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`${theme.text.secondary} leading-relaxed font-comic text-lg`}>
              {concept.content}
            </p>
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
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="h-full backdrop-blur-lg bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-red-400/20 border-2 border-yellow-400/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-yellow-700 font-fredoka text-xl">
                💡 Fun Fact!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800 font-heading text-lg font-bold leading-relaxed">
              {funFact.fact}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Interactive Diagram Card Component
export function InteractiveDiagramCard({ diagram }: { diagram: InteractiveDiagram }) {
  const [selectedHotspot, setSelectedHotspot] = useState<number | null>(null)

  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card className={`h-full backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 ${theme.gradient.secondary} rounded-xl shadow-lg text-white`}>
                <ImageIcon className="h-8 w-8" />
              </div>
              <CardTitle className={`${theme.text.secondary} font-fredoka text-xl`}>
                🔍 {diagram.title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={3}
                wheel={{ step: 0.1 }}
                pinch={{ step: 5 }}
                doubleClick={{ mode: "reset" }}
              >
                <TransformComponent
                  wrapperClass="!w-full !h-96 border-2 border-gray-300 rounded-xl overflow-hidden"
                  contentClass="!w-full !h-full"
                >
                  <div className="relative w-full h-full">
                    <img
                      src={diagram.imageUrl}
                      alt={diagram.title}
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Interactive Hotspots */}
                    {diagram.hotspots.map((hotspot, index) => (
                      <button
                        key={index}
                        className="absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 hover:scale-110 animate-pulse"
                        style={{
                          left: `${hotspot.x}%`,
                          top: `${hotspot.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => setSelectedHotspot(selectedHotspot === index ? null : index)}
                      >
                        <span className="sr-only">{hotspot.label}</span>
                      </button>
                    ))}

                    {/* Tooltip for selected hotspot */}
                    {selectedHotspot !== null && diagram.hotspots[selectedHotspot] && (
                      <div
                        className="absolute bg-black/80 text-white p-3 rounded-lg shadow-xl max-w-xs z-10"
                        style={{
                          left: `${diagram.hotspots[selectedHotspot].x}%`,
                          top: `${Math.max(diagram.hotspots[selectedHotspot].y - 10, 5)}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <h4 className="font-bold text-sm mb-1">{diagram.hotspots[selectedHotspot].label}</h4>
                        <p className="text-xs">{diagram.hotspots[selectedHotspot].description}</p>
                      </div>
                    )}
                  </div>
                </TransformComponent>
              </TransformWrapper>
              
              <div className="mt-4 text-center">
                <Badge className="bg-blue-100 text-blue-800">
                  🖱️ Click & drag to explore • 🔍 Scroll to zoom • 💫 Click dots for info
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Flashcard Deck Card Component
export function FlashcardDeckCard({ flashcards }: { flashcards: FlashcardData[] }) {
  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className={`h-full backdrop-blur-lg ${theme.background.card} ${theme.border.accent} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 ${theme.gradient.accent} rounded-xl shadow-lg text-white`}>
                <Sparkles className="h-8 w-8" />
              </div>
              <CardTitle className={`${theme.text.accent} font-fredoka text-xl`}>
                🎴 Vocabulary Cards
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {flashcards.map((flashcard) => (
                <FlashcardComponent key={flashcard.id} flashcard={flashcard} />
              ))}
            </div>
            {flashcards.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className={`h-12 w-12 ${theme.icon.accent} mx-auto mb-3`} />
                <p className={`${theme.text.light} text-sm font-comic font-bold`}>
                  No vocabulary cards available for this topic.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
