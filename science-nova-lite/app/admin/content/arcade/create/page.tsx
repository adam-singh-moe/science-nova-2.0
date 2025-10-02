"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { RoleGuard } from "@/components/layout/role-guard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Save, Eye, Wand2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

// Import game creation components
import { QuizCreator } from "@/components/arcade/quiz-creator"
import CrosswordCreator from "@/components/arcade/crossword-creator"
import { WordSearchCreator } from "@/components/arcade/word-search-creator"
import { MemoryGameCreator } from "@/components/arcade/memory-game-creator"

// Types
interface GameData {
  title: string
  description: string
  topic_id: string
  difficulty: 'easy' | 'medium' | 'hard'
  grade_level: number
  payload: any
}

export default function ArcadeCreatePage() {
  const { session } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameType = searchParams.get('type') || 'quiz'
  const editId = searchParams.get('edit') // For editing existing content
  
  const [gameData, setGameData] = useState<GameData>({
    title: '',
    description: '',
    topic_id: '',
    difficulty: 'medium',
    grade_level: 0, // Will be updated when user selects
    payload: {}
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(!!editId)
  const [loading, setLoading] = useState(!!editId)

  const gameTypeConfig = {
    quiz: {
      title: 'Create Quiz Game',
      icon: '❓',
      description: 'Multiple choice questions to test knowledge'
    },
    crossword: {
      title: 'Create Crossword',
      icon: '🧩',
      description: 'Interactive word puzzle with clues'
    },
    'word-search': {
      title: 'Create Word Search',
      icon: '🔍',
      description: 'Find hidden words in a grid'
    },
    'memory-game': {
      title: 'Create Memory Game',
      icon: '🃏',
      description: 'Match pairs of related terms'
    }
  }

  const currentConfig = gameTypeConfig[gameType as keyof typeof gameTypeConfig] || gameTypeConfig.quiz

  // Load existing data when editing
  useEffect(() => {
    const loadExistingGame = async () => {
      if (!editId || !session) return
      
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/content?category=ARCADE&limit=100`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to fetch games')
        
        const data = await response.json()
        const game = data.data?.find((item: any) => item.id === editId)
        
        if (game) {
          setGameData({
            title: game.title || '',
            description: game.description || '',
            topic_id: game.topic_id || '',
            difficulty: (game.difficulty_level || 'medium') as 'easy' | 'medium' | 'hard',
            grade_level: game.topics?.grade_level || 0,
            payload: game.game_data || {}
          })
        }
      } catch (error) {
        console.error('Error loading existing game:', error)
        toast({
          title: "Error Loading Game",
          description: "Failed to load existing game data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadExistingGame()
  }, [editId, session])

  const handleSave = async (asDraft = true) => {
    if (!gameData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your game",
        variant: "destructive"
      })
      return
    }

    if (!gameData.topic_id) {
      toast({
        title: "Topic Required",
        description: "Please select a topic for your game",
        variant: "destructive"
      })
      return
    }

    if (!gameData.grade_level) {
      toast({
        title: "Grade Level Required",
        description: "Please select a grade level for your game",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Debug session data
      console.log('Session debug:', {
        session: session,
        user: session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      })

      // Map game types to specific API subtypes
      const getSubtype = (type: string) => {
        switch (type) {
          case 'quiz': return 'QUIZ'
          case 'crossword': return 'CROSSWORD'
          case 'word-search': return 'WORDSEARCH'
          case 'memory-game': return 'MEMORY'
          default: return 'QUIZ'
        }
      }

      const apiUrl = isEditing ? '/api/admin/content' : '/api/admin/arcade'
      const method = isEditing ? 'PUT' : 'POST'
      
      const payload = isEditing ? {
        id: editId,
        category: 'ARCADE',
        title: gameData.title,
        description: gameData.description,
        topic_id: gameData.topic_id,
        game_type: getSubtype(gameType),
        game_data: gameData.payload,
        difficulty_level: gameData.difficulty,
        status: asDraft ? 'draft' : 'published'
      } : {
        title: gameData.title,
        description: gameData.description,
        topic_id: gameData.topic_id,
        game_type: getSubtype(gameType),
        game_data: gameData.payload,
        difficulty_level: gameData.difficulty,
        status: asDraft ? 'draft' : 'published',
        created_by: session?.user?.id || session?.user?.email
      }

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: asDraft ? "Draft Saved" : "Game Published",
          description: `Your ${currentConfig.title.toLowerCase()} has been ${asDraft ? 'saved as draft' : 'published'}.`
        })
        router.push('/admin/content/arcade')
      } else {
        throw new Error('Failed to save game')
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your game. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderCreator = () => {
    const props = {
      gameData,
      onUpdate: (newData: GameData) => {
        console.log('🎮 Game data updated:', newData)
        setGameData(newData)
      },
      onPreview: () => setIsPreviewOpen(true)
    }

    switch (gameType) {
      case 'quiz':
        return <QuizCreator {...props} />
      case 'crossword':
        return <CrosswordCreator {...props} />
      case 'word-search':
        return <WordSearchCreator {...props} />
      case 'memory-game':
        return <MemoryGameCreator {...props} />
      default:
        return <QuizCreator {...props} />
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50"
      style={{
        backgroundImage:
          "radial-gradient(40rem 40rem at -10% -10%, rgba(59,130,246,0.18), transparent), radial-gradient(36rem 36rem at 120% 10%, rgba(168,85,247,0.16), transparent)",
      }}
    >
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Header */}
          <div className="mb-6 rounded-2xl border bg-white/70 px-6 py-4 backdrop-blur shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/content/arcade">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Arcade Manager
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{currentConfig.icon}</div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {isEditing ? `Edit ${currentConfig.title.replace('Create ', '')}` : currentConfig.title}
                    </h1>
                    <p className="text-gray-600">{currentConfig.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  variant="outline"
                  size="sm"
                  disabled={!gameData.title?.trim() || !gameData.topic_id || !gameData.grade_level || gameData.grade_level < 1}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  variant="outline"
                  size="sm"
                  disabled={isSaving || !gameData.title?.trim() || !gameData.topic_id || !gameData.grade_level || gameData.grade_level < 1}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave(false)}
                  size="sm"
                  disabled={isSaving || !gameData.title?.trim() || !gameData.topic_id || !gameData.grade_level || gameData.grade_level < 1}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Publish Game
                </Button>
              </div>
            </div>
          </div>

          {/* Creator Interface */}
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading existing game data...</p>
              </div>
            </div>
          ) : (
            renderCreator()
          )}
        </main>
      </RoleGuard>
    </div>
  )
}