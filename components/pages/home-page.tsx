"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScienceLoading } from "@/components/ui/science-loading"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Bot, Trophy, Rocket, TrendingUp, Clock, Star, ArrowRight, LogIn, Activity, Calendar, Target, Lightbulb, Flame, X } from "lucide-react"
import Link from "next/link"
import { theme } from "@/lib/theme"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface RecentActivity {
  id: string
  title: string
  study_area: string
  accessed_at: string
  completed: boolean
}

interface UserStats {
  topicsAccessed: number
  topicsCompleted: number
  studyAreasExplored: number
  totalTimeSpent: number
  adventuresCompleted?: number
  currentStreak?: number
  lastAccessDate?: string
}

// Mock data for demonstration (fallback when not authenticated)
const mockStats: UserStats = {
  topicsAccessed: 12,
  topicsCompleted: 8,
  studyAreasExplored: 5,
  totalTimeSpent: 240, // minutes
  adventuresCompleted: 3,
  currentStreak: 5,
  lastAccessDate: new Date().toISOString()
}

const mockRecentActivity: RecentActivity[] = [
  {
    id: "1",
    title: "The Solar System",
    study_area: "Astronomy",
    accessed_at: "2024-01-15T10:30:00Z",
    completed: true
  },
  {
    id: "2", 
    title: "Chemical Reactions",
    study_area: "Chemistry",
    accessed_at: "2024-01-14T15:45:00Z",
    completed: false
  },
  {
    id: "3",
    title: "Photosynthesis",
    study_area: "Biology", 
    accessed_at: "2024-01-13T09:20:00Z",
    completed: true
  }
]

interface DailyQuest {
  id: string
  title: string
  description: string
  icon: string
  reward: string
  type: 'visual' | 'story' | 'facts'
}

interface StudyAreaFrequency {
  study_area: string
  frequency: number
}

interface AdventureCompletion {
  id: string
  adventure_id: string
  adventure_title: string
  completed_at: string
}

// Helper functions for enhanced UI
const getTopicEmoji = (studyArea: string): string => {
  const emojiMap: { [key: string]: string } = {
    "Astronomy": "🪐",
    "Biology": "🌿",
    "Chemistry": "🧪",
    "Physics": "⚛️",
    "Earth Science": "🌍",
    "Geology": "🗻",
    "Meteorology": "🌤️",
    "Anatomy": "🫀",
    "Marine Biology": "🐠",
    "Botany": "🌱",
    "Zoology": "🦎",
    "Space": "🚀",
    "Ocean": "🌊",
    "Weather": "⛈️",
    "default": "🔬"
  }
  return emojiMap[studyArea] || emojiMap["default"]
}

const getFunFact = (topicTitle: string): string => {
  const funFacts: { [key: string]: string } = {
    "The Solar System": "Jupiter is so big that all the other planets could fit inside it!",
    "Photosynthesis": "Plants are like nature's solar panels, turning sunlight into energy!",
    "Chemical Reactions": "When you mix baking soda and vinegar, it creates a mini volcano!",
    "Ocean Currents": "The ocean has invisible rivers that carry warm and cold water around the world!",
    "Weather Patterns": "Lightning is 5 times hotter than the surface of the Sun!",
    "Animal Habitats": "Polar bears have black skin under their white fur to absorb heat!",
    "Plant Life Cycles": "Some seeds can wait over 100 years before they decide to grow!",
    "Force and Motion": "Without friction, you couldn't walk or even hold a pencil!",
    "Life Cycles": "Butterflies taste with their feet and smell with their antennae!",
    "Simple Machines": "Your arm is a lever, and your elbow is the fulcrum!",
    "default": "Science is everywhere around us, waiting to be discovered!"
  }
  return funFacts[topicTitle] || funFacts["default"]
}

// Get encouraging streak message based on streak length
const getStreakMessage = (streak: number): string => {
  if (streak >= 30) return "You're a true Science Champion! 🏆 Keep the curiosity burning!"
  if (streak >= 21) return "Amazing dedication! Three weeks of continuous learning! 🌟"
  if (streak >= 14) return "Two weeks strong! You're building an incredible learning habit! 💪"
  if (streak >= 7) return "One week of daily science! You're on the path to greatness! ⭐"
  if (streak >= 5) return "Five days in a row! Keep the curiosity burning! 🔥"
  if (streak >= 3) return "Three days strong! Science is becoming a habit! 🚀"
  return "Keep it up! Every day of learning counts! 🌱"
}

export function HomePage() {
  const { user, profile, loading } = useAuth()
  const [userStats, setUserStats] = useState<UserStats>(mockStats)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>(mockRecentActivity)
  const [loadingData, setLoadingData] = useState(false)
  const [dailyQuest, setDailyQuest] = useState<DailyQuest | null>(null)
  const [mostFrequentedTopics, setMostFrequentedTopics] = useState<StudyAreaFrequency[]>([])
  const [totalTopicsForGrade, setTotalTopicsForGrade] = useState<number>(12)
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)
  
  // Use real user data if available, otherwise fall back to mock data for demo
  const displayName = profile?.full_name || user?.email?.split('@')[0] || "Science Explorer"
  const isAuthenticated = !!user
  const userGradeLevel = profile?.grade_level || 5

  // Fetch real user data when authenticated
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        // Use mock data for unauthenticated users
        setUserStats(mockStats)
        setRecentActivity(mockRecentActivity)
        generateDailyQuest(profile?.learning_preference || 'VISUAL', userGradeLevel)
        return
      }

      setLoadingData(true)
      try {
        // Fetch user progress statistics
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select(`
            topic_id,
            completed,
            last_accessed,
            topics (
              id,
              title,
              grade_level,
              study_areas (
                name
              )
            )
          `)
          .eq('user_id', user.id)
          .order('last_accessed', { ascending: false })

        if (progressError) {
          console.error('Error fetching user progress:', progressError)
        } else if (progressData) {
          // Get total topics available for user's grade level
          const { data: gradeTopics, error: gradeError } = await supabase
            .from('topics')
            .select('id')
            .eq('grade_level', userGradeLevel)

          if (!gradeError && gradeTopics) {
            setTotalTopicsForGrade(gradeTopics.length)
          }

          // Get adventure completions
          let adventureCompletions = []
          try {
            const { data: adventureData, error: adventureError } = await supabase
              .from('adventure_completions')
              .select('*')
              .eq('user_id', user.id)

            if (!adventureError && adventureData) {
              adventureCompletions = adventureData
            }
          } catch (error) {
            console.log('Adventure completions table not found, using default values')
          }

          // Calculate stats from progress data
          const stats: UserStats = {
            topicsAccessed: progressData.length,
            topicsCompleted: progressData.filter(p => p.completed).length,
            studyAreasExplored: new Set(progressData.map(p => {
              const topic = Array.isArray(p.topics) ? p.topics[0] : p.topics
              const studyArea = Array.isArray(topic?.study_areas) ? topic.study_areas[0] : topic?.study_areas
              return studyArea?.name
            }).filter(Boolean)).size,
            totalTimeSpent: adventureCompletions.length * 30, // 30 minutes per adventure
            adventuresCompleted: adventureCompletions.length,
            currentStreak: calculateStreak(progressData),
            lastAccessDate: progressData[0]?.last_accessed || new Date().toISOString()
          }

          // Calculate study area frequency for featured adventures
          const studyAreaFreq: { [key: string]: number } = {}
          progressData.forEach(p => {
            const topic = Array.isArray(p.topics) ? p.topics[0] : p.topics
            const studyArea = Array.isArray(topic?.study_areas) ? topic.study_areas[0] : topic?.study_areas
            if (studyArea?.name) {
              studyAreaFreq[studyArea.name] = (studyAreaFreq[studyArea.name] || 0) + 1
            }
          })

          const sortedFrequency = Object.entries(studyAreaFreq)
            .map(([study_area, frequency]) => ({ study_area, frequency }))
            .sort((a, b) => b.frequency - a.frequency)

          setMostFrequentedTopics(sortedFrequency)

          // Format recent activity
          const activity: RecentActivity[] = progressData
            .slice(0, 5)
            .map(p => {
              const topic = Array.isArray(p.topics) ? p.topics[0] : p.topics
              const studyArea = Array.isArray(topic?.study_areas) ? topic.study_areas[0] : topic?.study_areas
              return {
                id: p.topic_id || '',
                title: topic?.title || 'Unknown Topic',
                study_area: studyArea?.name || 'Science',
                accessed_at: p.last_accessed || '',
                completed: p.completed || false
              }
            })

          setUserStats(stats)
          setRecentActivity(activity)
        }

        // Generate daily quest based on user's learning preference
        generateDailyQuest(profile?.learning_preference || 'VISUAL', userGradeLevel)
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Keep using mock data on error
        generateDailyQuest(profile?.learning_preference || 'VISUAL', userGradeLevel)
      } finally {
        setLoadingData(false)
      }
    }

    fetchUserData()
  }, [user, profile, userGradeLevel])

  // Daily streak celebration effect
  useEffect(() => {
    const checkAndCelebrateStreak = () => {
      if (!userStats || !userStats.currentStreak || userStats.currentStreak <= 1) return

      const today = new Date().toDateString()
      const lastCelebrationDate = localStorage.getItem('sciencenova_last_streak_celebration')

      // Check if this is the first login today
      if (lastCelebrationDate !== today) {
        // Update localStorage to mark today as celebrated
        localStorage.setItem('sciencenova_last_streak_celebration', today)
        
        // Show streak celebration
        setShowStreakCelebration(true)
        setConfettiActive(true)
        
        // Stop confetti after 3 seconds
        setTimeout(() => {
          setConfettiActive(false)
        }, 3000)
      }
    }

    // Only run if we have userStats and it's not the initial mock data load
    if (userStats && !loadingData) {
      checkAndCelebrateStreak()
    }
  }, [userStats, loadingData])

  // Generate AI-powered daily quest
  const generateDailyQuest = (learningPreference: string, gradeLevel: number) => {
    const questTypes = {
      'VISUAL': [
        {
          id: 'visual-clouds',
          title: 'Cloud Detective',
          description: '🌤️ Can you identify the three main types of clouds in the sky? Look outside and see if you can spot cumulus, stratus, or cirrus clouds!',
          icon: '🌤️',
          reward: '+50 XP • Weather Badge',
          type: 'visual' as const
        },
        {
          id: 'visual-plants',
          title: 'Plant Explorer',
          description: '🌱 Find 5 different types of leaves around your home or school. What shapes do you see? Can you draw them?',
          icon: '🌱',
          reward: '+40 XP • Nature Badge',
          type: 'visual' as const
        },
        {
          id: 'visual-rocks',
          title: 'Rock Collector',
          description: '🪨 Look for 3 different types of rocks or stones. What colors and textures do you notice? Are they rough or smooth?',
          icon: '🪨',
          reward: '+45 XP • Geology Badge',
          type: 'visual' as const
        }
      ],
      'STORY': [
        {
          id: 'story-adventure',
          title: 'Science Story Time',
          description: '📚 Imagine you\'re a scientist who just discovered a new planet. What would you find there? Write a short story about your adventure!',
          icon: '📚',
          reward: '+60 XP • Storyteller Badge',
          type: 'story' as const
        },
        {
          id: 'story-animal',
          title: 'Animal Adventure',
          description: '🐾 Create a story about an animal\'s day in its natural habitat. How does it find food, stay safe, and interact with other animals?',
          icon: '🐾',
          reward: '+55 XP • Wildlife Badge',
          type: 'story' as const
        }
      ],
      'FACTS': [
        {
          id: 'facts-challenge',
          title: 'Science Facts Challenge',
          description: '🧠 Learn 3 new science facts today! Ask an adult or look up interesting facts about space, animals, or plants.',
          icon: '🧠',
          reward: '+50 XP • Knowledge Badge',
          type: 'facts' as const
        },
        {
          id: 'facts-experiment',
          title: 'Daily Science Fact',
          description: '🔬 Did you know that a single drop of water contains billions of molecules? Find one more amazing science fact today!',
          icon: '🔬',
          reward: '+45 XP • Discovery Badge',
          type: 'facts' as const
        }
      ]
    }

    const questsForPreference = questTypes[learningPreference as keyof typeof questTypes] || questTypes.VISUAL
    const randomQuest = questsForPreference[Math.floor(Math.random() * questsForPreference.length)]
    
    setDailyQuest(randomQuest)
  }

  // Calculate learning streak from progress data
  const calculateStreak = (progressData: any[]): number => {
    if (!progressData.length) return 0
    
    const today = new Date()
    const dates = progressData
      .map(p => new Date(p.last_accessed))
      .sort((a, b) => b.getTime() - a.getTime())
    
    let streak = 0
    let currentDate = new Date(today)
    
    for (const date of dates) {
      const daysDiff = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 1) {
        streak++
        currentDate = date
      } else {
        break
      }
    }
    
    return streak
  }

  // Get featured adventures based on most frequented topics
  const getFeaturedAdventures = () => {
    const topStudyArea = mostFrequentedTopics[0]?.study_area || 'Astronomy'
    
    const adventures = {
      'Astronomy': {
        title: 'Explore the Galaxy!',
        description: 'Journey through space to discover planets, stars, and cosmic mysteries waiting to be explored.',
        icon: '🚀',
        color: 'blue',
        badge: 'Space Adventure'
      },
      'Biology': {
        title: 'Nature\'s Secrets!',
        description: 'Discover how plants grow, what animals eat, and the amazing ways nature works together.',
        icon: '🌱',
        color: 'green',
        badge: 'Biology Adventure'
      },
      'Chemistry': {
        title: 'Chemistry Lab Magic!',
        description: 'Create colorful reactions, mix safe chemicals, and watch science come to life in your virtual lab.',
        icon: '🧪',
        color: 'purple',
        badge: 'Lab Experiments'
      },
      'Physics': {
        title: 'Forces & Motion!',
        description: 'Explore how things move, discover the power of simple machines, and understand the forces around us.',
        icon: '⚛️',
        color: 'orange',
        badge: 'Physics Adventure'
      },
      'Geology': {
        title: 'Earth\'s Treasures!',
        description: 'Dig into the secrets of rocks, minerals, and the amazing processes that shape our planet.',
        icon: '🗻',
        color: 'amber',
        badge: 'Earth Science'
      },
      'Meteorology': {
        title: 'Weather Detective!',
        description: 'Investigate clouds, track storms, and learn how weather patterns affect our daily lives.',
        icon: '⛈️',
        color: 'cyan',
        badge: 'Weather Science'
      },
      'Anatomy': {
        title: 'Body Systems Explorer!',
        description: 'Journey inside the human body to discover how our amazing systems work together.',
        icon: '🫀',
        color: 'red',
        badge: 'Human Body'
      }
    }

    return adventures[topStudyArea as keyof typeof adventures] || adventures['Astronomy']
  }

  if (loading || loadingData) {
    return <ScienceLoading message="Loading your science journey..." type="atom" />
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Demo Mode Notice */}
        {!isAuthenticated && (
          <Card className="bg-blue-50 border-blue-200 border-2 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Demo Mode</h3>
                  <p className="text-blue-700 text-sm">You're viewing demo data. Sign in to access your real progress and personalized content.</p>
                </div>
                <Button asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className={`text-5xl md:text-6xl font-bold font-heading text-transparent bg-clip-text ${theme.gradient.header} mb-4`}>
            Welcome back, {displayName}!
          </h1>
          <p className={`text-lg ${theme.text.secondary} max-w-2xl`}>
            Ready to explore the wonders of science? {isAuthenticated ? "Continue your learning journey" : "Check out what Science Nova has to offer"} with interactive lessons, AI-powered assistance, and exciting adventures.
          </p>
        </div>

        {/* Gamified Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Mission Progress */}
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100/50 rounded-full">
                  <Rocket className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Mission Progress</h3>
                  <p className="text-sm text-blue-700">{userStats.topicsCompleted} of {totalTopicsForGrade} Missions Complete!</p>
                </div>
              </div>
              <Progress 
                value={(userStats.topicsCompleted / totalTopicsForGrade) * 100}
                className="h-6 mb-2"
              />
              <p className="text-xs text-blue-600 font-medium">
                {Math.round((userStats.topicsCompleted / totalTopicsForGrade) * 100)}% Complete
              </p>
            </CardContent>
          </Card>

          {/* Study Badges */}
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100/50 rounded-full">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">Study Badges</h3>
                  <p className="text-sm text-green-700">Areas Explored</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {["⚛️", "🪐", "🌿", "🔬", "🌍", "🧪", "💡", "🦕"].slice(0, userStats.studyAreasExplored).map((badge, index) => (
                  <div key={index} className="p-3 bg-white/20 rounded-full shadow-lg text-3xl border-2 border-green-200">
                    {badge}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 5 - userStats.studyAreasExplored) }).map((_, index) => (
                  <div key={`empty-${index}`} className="p-3 bg-gray-100/50 rounded-full shadow-lg text-3xl border-2 border-gray-200 opacity-30">
                    ❓
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-600 font-medium">
                {userStats.studyAreasExplored}/5 Science Areas Discovered
              </p>
            </CardContent>
          </Card>

          {/* Adventure Time */}
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100/50 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-900">Adventure Time!</h3>
                  <p className="text-sm text-orange-700">Time spent exploring science!</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold font-heading text-orange-600 mb-1">
                  {Math.floor(userStats.totalTimeSpent / 60)}h {userStats.totalTimeSpent % 60}m
                </div>
                <div className="text-sm text-orange-700 mb-2">
                  {userStats.adventuresCompleted} adventures completed
                </div>
                {userStats.totalTimeSpent >= 120 && (
                  <div className="bg-yellow-100/50 border-2 border-yellow-300 rounded-full px-3 py-1 text-xs text-yellow-700 font-bold">
                    🎉 2+ Hours Champion!
                  </div>
                )}
                {userStats.currentStreak && userStats.currentStreak > 0 && (
                  <div className="mt-2 bg-red-100/50 border-2 border-red-300 rounded-full px-3 py-1 text-xs text-red-700 font-bold">
                    🔥 {userStats.currentStreak} Day Streak!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Adventures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader>
              <CardTitle className={`${theme.text.primary} flex items-center gap-2`}>
                <Star className="h-5 w-5" />
                Featured Adventures
              </CardTitle>
              <CardDescription className={theme.text.secondary}>
                Exciting new worlds to explore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Featured Adventure based on most frequented topic */}
                <div className="group relative p-4 bg-white/10 rounded-2xl border border-white/10 hover:border-accent hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100/50 rounded-full">
                        <span className="text-2xl">{getFeaturedAdventures().icon}</span>
                      </div>
                      <div>
                        <h4 className={`font-bold ${theme.text.primary}`}>{getFeaturedAdventures().title}</h4>
                        <Badge variant="outline" className="text-xs bg-blue-100/50 text-blue-700 border-blue-200">
                          {getFeaturedAdventures().badge}
                        </Badge>
                      </div>
                    </div>
                    <p className={`text-sm ${theme.text.secondary} mb-3`}>
                      {getFeaturedAdventures().description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Your favorite topic!
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                
                <div className="group relative p-4 bg-white/10 rounded-2xl border border-white/10 hover:border-accent hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-100/50 rounded-full">
                        <span className="text-2xl">🌊</span>
                      </div>
                      <div>
                        <h4 className={`font-bold ${theme.text.primary}`}>Dive into the Ocean!</h4>
                        <Badge variant="outline" className="text-xs bg-green-100/50 text-green-700 border-green-200">
                          Marine Discovery
                        </Badge>
                      </div>
                    </div>
                    <p className={`text-sm ${theme.text.secondary} mb-3`}>
                      Explore coral reefs, meet amazing sea creatures, and discover the mysteries of the deep blue sea.
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        New creatures await!
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-green-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                
                <div className="group relative p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 cursor-pointer bg-white/95 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100/50 rounded-full">
                        <span className="text-2xl">🧪</span>
                      </div>
                      <div>
                        <h4 className={`font-bold ${theme.text.primary}`}>Chemistry Lab Magic!</h4>
                        <Badge variant="outline" className="text-xs bg-purple-100/50 text-purple-700 border-purple-200">
                          Lab Experiments
                        </Badge>
                      </div>
                    </div>
                    <p className={`text-sm ${theme.text.secondary} mb-3`}>
                      Create colorful reactions, mix safe chemicals, and watch science come to life in your virtual lab.
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                        Interactive experiments
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                
                <div className="group relative p-4 rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-all duration-300 cursor-pointer bg-white/95 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-100/50 rounded-full">
                        <span className="text-2xl">🌱</span>
                      </div>
                      <div>
                        <h4 className={`font-bold ${theme.text.primary}`}>Nature's Secrets!</h4>
                        <Badge variant="outline" className="text-xs bg-orange-100/50 text-orange-700 border-orange-200">
                          Biology Adventure
                        </Badge>
                      </div>
                    </div>
                    <p className={`text-sm ${theme.text.secondary} mb-3`}>
                      Discover how plants grow, what animals eat, and the amazing ways nature works together.
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                        Growing gardens
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Quest */}
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Today's Quest
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Complete your daily science challenge!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyQuest && (
                  <div className="bg-yellow-50/50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-yellow-100/50 rounded-full">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-yellow-900">{dailyQuest.title}</h4>
                        <p className="text-sm text-yellow-700">Perfect for {profile?.learning_preference?.toLowerCase() || 'visual'} learners!</p>
                      </div>
                    </div>
                    <div className="bg-yellow-50/50 rounded-md p-3 mb-3">
                      <p className="text-sm text-yellow-800 font-medium">
                        {dailyQuest.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-yellow-700">Reward:</span>
                        <Badge variant="secondary" className="text-xs bg-yellow-100/50 text-yellow-700">
                          {dailyQuest.reward}
                        </Badge>
                      </div>
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Start Quest
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Quest Streak:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-900 font-bold">
                        {userStats.currentStreak || 0} days
                      </span>
                      <span className="text-yellow-600">🔥</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Explorer's Journal */}
        <Card className="bg-white/95 border-gray-300 border-2">
          <CardHeader>
            <CardTitle className={`${theme.text.primary} flex items-center gap-2`}>
              <BookOpen className="h-5 w-5" />
              Explorer's Journal
            </CardTitle>
            <CardDescription className={theme.text.secondary}>
              Your latest science discoveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <Link 
                  key={activity.id} 
                  href={`/topics?area=${encodeURIComponent(activity.study_area)}`}
                  className="block"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-accent cursor-pointer group">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                      <span className="text-4xl">{getTopicEmoji(activity.study_area)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium ${theme.text.primary} truncate group-hover:text-accent transition-colors`}>{activity.title}</h4>
                        {activity.completed && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                            ✅ Complete
                          </Badge>
                        )}
                        {!activity.completed && (
                          <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                            🔄 In Progress
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${theme.text.secondary} mb-2`}>{activity.study_area}</p>
                      <div className="bg-blue-50 rounded-md p-2 text-xs text-blue-700">
                        <span className="font-medium">Fun Fact:</span> {getFunFact(activity.title)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(activity.accessed_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Rocket className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Start your science adventure!</p>
                  <p className="text-sm">Complete some topics to see your progress here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Celebration Modal */}
      <Dialog open={showStreakCelebration} onOpenChange={setShowStreakCelebration}>
        <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 border-2 border-orange-200 rounded-2xl shadow-2xl">
          {/* Enhanced CSS Confetti Effect */}
          {confettiActive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 rounded-full animate-confetti-fall"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'][Math.floor(Math.random() * 6)],
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={`star-${i}`}
                  className="absolute animate-confetti-spin"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: '1rem'
                  }}
                >
                  ⭐
                </div>
              ))}
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={`fire-${i}`}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: '1.2rem'
                  }}
                >
                  🔥
                </div>
              ))}
            </div>
          )}
          
          <DialogHeader className="text-center relative z-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Flame className="h-16 w-16 text-orange-500 animate-pulse" />
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm animate-bounce">
                  {userStats.currentStreak}
                </div>
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">
              You're on Fire! 🔥
            </DialogTitle>
            <div className="space-y-3">
              <p className="text-lg font-semibold text-orange-800">
                You're on a {userStats.currentStreak}-day science streak!
              </p>
              <p className="text-orange-700">
                {getStreakMessage(userStats.currentStreak || 0)}
              </p>
              <div className="flex justify-center space-x-1">
                {Array.from({ length: Math.min(userStats.currentStreak || 0, 7) }).map((_, i) => (
                  <Flame key={i} className="h-5 w-5 text-orange-500 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
                {(userStats.currentStreak || 0) > 7 && (
                  <span className="text-orange-600 font-bold">+{(userStats.currentStreak || 0) - 7}</span>
                )}
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-6 space-y-3 relative z-10">
            <div className="bg-white/70 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">Streak Bonus XP:</span>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none">
                  +{(userStats.currentStreak || 0) * 10} XP
                </Badge>
              </div>
            </div>
            
            <Button
              onClick={() => setShowStreakCelebration(false)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-full transition-all duration-300 hover:scale-105"
            >
              Keep the Curiosity Burning! 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
