"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface FlashcardProps {
  flashcard: {
    id: string
    front: string
    back: string
    coverImage?: string
  }
}

export function FlashcardComponent({ flashcard }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="relative w-full h-40 cursor-pointer perspective-1000 hover:scale-105 transition-transform duration-300"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`absolute inset-0 w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <Card className="h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 border-4 border-blue-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full relative overflow-hidden">
              {/* Cover Image */}
              {flashcard.coverImage ? (
                <div className="w-16 h-16 mb-3 rounded-full overflow-hidden border-2 border-blue-400 bg-white/90 flex items-center justify-center">
                  {flashcard.coverImage.startsWith('data:image/') ? (
                    <Image
                      src={flashcard.coverImage}
                      alt="Flashcard illustration"
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : flashcard.coverImage.startsWith('linear-gradient') ? (
                    <div 
                      className="w-full h-full"
                      style={{ background: flashcard.coverImage }}
                    />
                  ) : (
                    <div className="text-2xl">🎯</div>
                  )}
                </div>
              ) : (
                <div className="absolute top-2 right-2 text-2xl animate-bounce">🤔</div>
              )}
              <p className="text-blue-800 font-bold text-center text-lg font-comic leading-relaxed">
                {flashcard.front}
              </p>
              <div className="absolute bottom-2 left-2 text-xs text-blue-600 font-semibold bg-white/70 px-2 py-1 rounded-full">
                Click to flip! 🔄
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <Card className="h-full bg-gradient-to-br from-green-100 via-yellow-100 to-orange-100 border-4 border-green-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 flex items-center justify-center h-full relative overflow-hidden">
              <div className="absolute top-2 right-2 text-2xl animate-pulse">💡</div>
              <p className="text-green-800 font-bold text-center text-lg font-comic leading-relaxed">
                {flashcard.back}
              </p>
              <div className="absolute bottom-2 left-2 text-xs text-green-600 font-semibold bg-white/70 px-2 py-1 rounded-full">
                Great job! 🌟
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
