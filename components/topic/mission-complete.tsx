"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Confetti from "react-confetti"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Star, Trophy, Sparkles, ArrowLeft, BookOpen } from "lucide-react"
import { theme } from "@/lib/theme"

interface MissionCompleteProps {
  topicTitle: string
  grade: string
  area: string
  onComplete?: () => void
}

export function MissionComplete({ topicTitle, grade, area, onComplete }: MissionCompleteProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })
  const sentinelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Get window dimensions for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Intersection Observer to detect when user reaches the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            setShowConfetti(true)
            onComplete?.()
            
            // Stop confetti after 5 seconds
            setTimeout(() => {
              setShowConfetti(false)
            }, 5000)
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% of the sentinel is visible
        rootMargin: '0px'
      }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current)
      }
    }
  }, [isVisible, onComplete])

  const handleBackToTopics = () => {
    setIsVisible(false)
    router.push(`/topics/${grade.toLowerCase()}`)
  }

  const handleStartAdventure = () => {
    setIsVisible(false)
    // Navigate to related storybook based on area
    const areaRoutes = {
      'forces-and-motion': '/storybook/physics-adventure',
      'life-science': '/storybook/biology-adventure',
      'earth-science': '/storybook/earth-adventure',
      'matter': '/storybook/chemistry-adventure',
      'energy': '/storybook/energy-adventure'
    }
    
    const route = areaRoutes[area as keyof typeof areaRoutes] || '/storybook'
    router.push(route)
  }

  const calculateXP = () => {
    // Base XP calculation based on content complexity
    const baseXP = 100
    const gradeMultiplier = parseInt(grade.replace(/\D/g, '')) || 4
    return baseXP + (gradeMultiplier * 25)
  }

  return (
    <>
      {/* Invisible sentinel div at the bottom of content */}
      <div ref={sentinelRef} className="h-4 w-full" />

      {/* Confetti Animation */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          numberOfPieces={200}
          recycle={false}
          gravity={0.3}
          colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
        />
      )}

      {/* Mission Complete Modal */}
      <Dialog open={isVisible} onOpenChange={setIsVisible}>
        <DialogContent className="max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          >
            <DialogHeader className="text-center">
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <div className={`p-4 ${theme.gradient.primary} rounded-full shadow-lg`}>
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                </motion.div>
              </div>
              
              <DialogTitle className={`${theme.text.primary} font-fredoka text-2xl mb-2`}>
                Mission Complete! 🌟
              </DialogTitle>
              
              <p className={`${theme.text.secondary} font-comic text-lg mb-4`}>
                Awesome job completing "{topicTitle}"!
              </p>
            </DialogHeader>

            <div className="space-y-6">
              {/* Rewards Section */}
              <div className="text-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className={`${theme.background.card} rounded-xl p-6 border-2 ${theme.border.primary}`}>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                      <h3 className={`${theme.text.primary} font-fredoka text-xl`}>
                        Rewards Earned!
                      </h3>
                      <Sparkles className="h-6 w-6 text-yellow-500" />
                    </div>
                    
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                    >
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg px-4 py-2 rounded-xl shadow-lg">
                        +{calculateXP()} XP!
                      </Badge>
                    </motion.div>
                    
                    <div className="flex justify-center gap-2 mt-4">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Call-to-Action Buttons */}
              <div className="space-y-3">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Button
                    onClick={handleStartAdventure}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-fredoka text-lg py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Start a Related Adventure! ✨
                  </Button>
                  
                  <Button
                    onClick={handleBackToTopics}
                    variant="outline"
                    className={`w-full ${theme.border.secondary} ${theme.text.secondary} hover:${theme.background.secondary} font-comic py-3 rounded-xl transition-all duration-300`}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Topics
                  </Button>
                </motion.div>
              </div>

              {/* Motivational Message */}
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <p className={`${theme.text.light} font-comic text-sm italic`}>
                    "Science is not only a disciple of reason but also one of romance and passion." - Stephen Hawking
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  )
}
