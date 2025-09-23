"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { VantaBackground } from '@/components/vanta-background'
import { PageTransition } from '@/components/layout/page-transition'
import { 
  Gamepad2, 
  Zap, 
  Shuffle, 
  Trophy,
  Star,
  Play,
  RefreshCw,
  Clock,
  Target
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { QuizViewer } from '@/components/quiz-viewer'
import { FlashcardsViewer } from '@/components/flashcards-viewer'
import { CrosswordViewer } from '@/components/crossword-viewer'
import { QuizPreview, FlashcardPreview, CrosswordPreview } from '@/components/game-previews'

interface ArcadeEntry {
  id: string
  topic_id: string
  subtype: 'QUIZ' | 'FLASHCARDS' | 'GAME'
  title: string
  payload: any
  difficulty?: string
  topics: {
    title: string
    grade_level: number
    study_areas: {
      name: string
    }
  }
}

export default function ArcadePage() {
  const { session } = useAuth()
  const [arcadeContent, setArcadeContent] = useState<ArcadeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContent, setSelectedContent] = useState<ArcadeEntry | null>(null)
  const [currentDate] = useState(new Date().toISOString().split('T')[0])

  const fetchArcadeContent = async (forceRefresh = false) => {
    if (!session?.user?.id) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId: session.user.id,
        date: forceRefresh ? new Date().toISOString().split('T')[0] : currentDate
      })

      const response = await fetch(`/api/arcade?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch arcade content')

      const data = await response.json()
      let content = data.data || []
      
      setArcadeContent(content)
    } catch (error) {
      console.error('Error fetching arcade content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewTopic = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/arcade', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: session.user.id,
          forceNew: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        setArcadeContent(data.data || [])
      }
    } catch (error) {
      console.error('Error getting new topic:', error)
    }
  }

  const trackEngagement = async (entryId: string, eventType: string) => {
    try {
      await fetch('/api/content-engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          entry_id: entryId,
          topic_id: selectedContent?.topic_id,
          category: 'ARCADE',
          subtype: selectedContent?.subtype,
          event_type: eventType,
          meta: {
            user_id: session?.user?.id,
            timestamp: new Date().toISOString()
          }
        })
      })
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  const handlePlayContent = (content: ArcadeEntry) => {
    setSelectedContent(content)
    trackEngagement(content.id, 'open')
  }

  const handleCloseContent = () => {
    if (selectedContent) {
      trackEngagement(selectedContent.id, 'close')
    }
    setSelectedContent(null)
  }

  useEffect(() => {
    fetchArcadeContent()
  }, [session])

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'hard': return 'bg-red-500/20 text-red-300 border-red-400/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
    }
  }

  const getSubtypeIcon = (subtype: string) => {
    switch (subtype) {
      case 'QUIZ': return <Target className="h-5 w-5" />
      case 'FLASHCARDS': return <Zap className="h-5 w-5" />
      case 'GAME': return <Trophy className="h-5 w-5" />
      default: return <Gamepad2 className="h-5 w-5" />
    }
  }

  const getSubtypePreview = (subtype: string) => {
    switch (subtype) {
      case 'QUIZ': return <QuizPreview className="w-full h-full" />
      case 'FLASHCARDS': return <FlashcardPreview className="w-full h-full" />
      case 'GAME': return <CrosswordPreview className="w-full h-full" />
      default: return <QuizPreview className="w-full h-full" />
    }
  }

  const renderContentViewer = () => {
    if (!selectedContent) return null

    const commonProps = {
      storageKey: `arcade_${selectedContent.id}`,
      contentMeta: {
        entryId: selectedContent.id,
        topicId: selectedContent.topic_id,
        category: 'ARCADE',
        subtype: selectedContent.subtype
      }
    }

    switch (selectedContent.subtype) {
      case 'QUIZ':
        // Debug: Log the payload structure to understand data format
        console.log('Quiz payload:', selectedContent.payload)
        
        // Ensure payload is an array before passing to QuizViewer
        const quizItems = Array.isArray(selectedContent.payload) 
          ? selectedContent.payload 
          : selectedContent.payload?.items || selectedContent.payload?.questions || []
        
        console.log('Processed quiz items:', quizItems)
        
        return (
          <QuizViewer
            items={quizItems}
            {...commonProps}
          />
        )
      case 'FLASHCARDS':
        // Ensure payload is an array for flashcards
        const flashcardData = Array.isArray(selectedContent.payload)
          ? selectedContent.payload
          : selectedContent.payload?.cards || selectedContent.payload?.items || []
        
        return (
          <FlashcardsViewer
            cards={flashcardData.map((item: any) => ({ q: item.question, a: item.answer })) || []}
            {...commonProps}
          />
        )
      case 'GAME':
        // Ensure payload is an array for crossword
        const crosswordWords = Array.isArray(selectedContent.payload)
          ? selectedContent.payload
          : selectedContent.payload?.words || selectedContent.payload?.items || []
        
        return (
          <CrosswordViewer
            words={crosswordWords}
            storageKey={commonProps.storageKey}
          />
        )
      default:
        return null
    }
  }

  return (
    <VantaBackground>
      <main className="container mx-auto px-4 py-6">
        <PageTransition>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="rounded-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 p-3 backdrop-blur-sm border border-purple-400/30 shadow-lg">
                <Gamepad2 className="h-8 w-8 text-white drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight">
                Knowledge Arcade
              </h1>
            </div>
            <p className="text-lg text-white/80 max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              Challenge yourself with today's collection of interactive games, quizzes, and flashcards!
            </p>
          </div>

        {/* Daily Topic Info */}
        {arcadeContent.length > 0 && (
          <Card className="mb-6 p-5 rounded-2xl border border-white/25 bg-white/12 backdrop-blur-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-purple-400 drop-shadow-[0_0_15px_rgba(147,51,234,0.6)]" />
                <div>
                  <h3 className="font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight">
                    Today's Topic: {arcadeContent[0]?.topics?.title}
                  </h3>
                  <p className="text-sm text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                    {arcadeContent[0]?.topics?.study_areas?.name} • Grade {arcadeContent[0]?.topics?.grade_level}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleNewTopic}
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-1.5 rounded-full border border-purple-400/40 bg-purple-400/20 text-purple-200 backdrop-blur-sm hover:bg-purple-400/30 hover:border-purple-300/60 transition-all duration-300"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  New Topic
                </Button>
                <Button
                  onClick={() => fetchArcadeContent(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-1.5 rounded-full border border-purple-400/40 bg-purple-400/20 text-purple-200 backdrop-blur-sm hover:bg-purple-400/30 hover:border-purple-300/60 transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse rounded-2xl border border-white/25 bg-white/12 backdrop-blur-lg shadow-lg">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/20 rounded mb-4"></div>
                <div className="h-10 bg-white/20 rounded"></div>
              </Card>
            ))}
          </div>
        ) : arcadeContent.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border border-white/25 bg-white/12 backdrop-blur-lg shadow-lg">
            <Gamepad2 className="h-16 w-16 mx-auto text-purple-400/60 mb-4 drop-shadow-[0_0_15px_rgba(147,51,234,0.4)]" />
            <h3 className="text-xl font-semibold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] tracking-tight">
              No Arcade Content Available
            </h3>
            <p className="text-white/80 mb-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              Check back later for new games and activities!
            </p>
            <Button 
              onClick={() => fetchArcadeContent(true)}
              className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg border border-purple-400/30 backdrop-blur-sm transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {arcadeContent.map((content) => (
              <Card 
                key={content.id} 
                className="group relative overflow-hidden rounded-2xl border border-white/25 bg-black/20 backdrop-blur-lg shadow-lg transition-all duration-500 hover:shadow-[0_20px_40px_rgba(147,51,234,0.4)] hover:-translate-y-2 hover:scale-105 transform-gpu hover:bg-black/30 cursor-pointer"
              >
                {/* Background Preview - Balanced visibility */}
                <div className="absolute inset-0 opacity-30 group-hover:opacity-45 transition-opacity duration-500">
                  {getSubtypePreview(content.subtype)}
                </div>
                
                {/* Subtle energy ripples on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                  <div className="absolute inset-0 rounded-2xl border-2 border-purple-400/20 animate-ping"></div>
                  <div className="absolute inset-2 rounded-2xl border border-pink-400/30 animate-ping delay-200"></div>
                </div>

                <div className="relative p-6 z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-purple-400 drop-shadow-[0_0_15px_rgba(147,51,234,0.6)] transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(147,51,234,0.8)]">
                        {getSubtypeIcon(content.subtype)}
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 rounded-full border border-purple-400/40 bg-purple-400/20 text-purple-200 backdrop-blur-sm group-hover:bg-purple-400/30 group-hover:border-purple-300/60 transition-all duration-300"
                      >
                        {content.subtype}
                      </Badge>
                    </div>
                    {content.difficulty && (
                      <Badge className={`text-xs px-2 py-0.5 rounded-full backdrop-blur-sm transition-all duration-300 ${getDifficultyColor(content.difficulty)}`}>
                        {content.difficulty}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:text-purple-200 transition-colors duration-300 mb-3 leading-tight">
                    {content.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-white/80 mb-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)] group-hover:text-white/90 transition-colors duration-300">
                    <Clock className="h-4 w-4" />
                    <span>
                      {content.subtype === 'QUIZ' && content.payload.questions 
                        ? `${content.payload.questions.length} questions`
                        : content.subtype === 'FLASHCARDS' && content.payload.cards
                        ? `${content.payload.cards.length} cards`
                        : content.subtype === 'GAME' && content.payload.clues
                        ? `${content.payload.clues.length} clues`
                        : 'Interactive content'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handlePlayContent(content)}
                      className="px-4 py-2 bg-purple-600/60 hover:bg-purple-600/80 transition-all duration-300 text-white text-sm rounded-full border border-purple-400/40 backdrop-blur-sm shadow-md hover:shadow-purple-500/30"
                      size="sm"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

          {/* Navigation */}
          <div className="mt-12 text-center">
            <Link href="/discovery">
              <Button 
                variant="outline" 
                className="mx-2 px-4 py-2 rounded-full border border-green-400/40 bg-green-400/20 text-green-200 backdrop-blur-sm hover:bg-green-400/30 hover:border-green-300/60 transition-all duration-300"
              >
                Explore Discovery Zone
              </Button>
            </Link>
          </div>
        </PageTransition>
      </main>

      {/* Game Modal */}
      <Modal
        isOpen={!!selectedContent}
        onClose={handleCloseContent}
        title={selectedContent?.title || 'Game'}
        size="xl"
      >
        {selectedContent && renderContentViewer()}
      </Modal>
    </VantaBackground>
  )
}