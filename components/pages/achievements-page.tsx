"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Target, Zap, BookOpen, Brain, Rocket, Award, LogIn, Flame } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { theme } from "@/lib/theme"
import Link from "next/link"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedDate?: Date
  progress?: number
  maxProgress?: number
  category: "learning" | "exploration" | "consistency" | "mastery"
}

interface UserProgress {
  level: number
  totalXP: number
  nextLevelXP: number
  currentLevelXP: number
  streak: number
  topicsCompleted: number
  studyAreasExplored: number
  totalTimeSpent: number
  lastActiveDate: string
}

// Mock data
const mockAchievements: Achievement[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Complete your first science topic",
    icon: "🎯",
    category: "learning",
    earned: true,
    earnedDate: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Explorer",
    description: "Explore 3 different study areas",
    icon: "🗺️",
    category: "exploration",
    earned: true,
    earnedDate: new Date("2024-01-20"),
  },
  {
    id: "3",
    title: "Consistent Learner",
    description: "Learn for 5 days in a row",
    icon: "🔥",
    category: "consistency",
    earned: true,
    earnedDate: new Date("2024-01-25"),
  },
  {
    id: "4",
    title: "Topic Master",
    description: "Complete 10 topics",
    icon: "📚",
    category: "mastery",
    earned: false,
    progress: 7,
    maxProgress: 10,
  },
  {
    id: "5",
    title: "Science Enthusiast",
    description: "Complete 25 topics",
    icon: "🧪",
    category: "mastery",
    earned: false,
    progress: 7,
    maxProgress: 25,
  },
  {
    id: "6",
    title: "All-Rounder",
    description: "Explore all 7 study areas",
    icon: "🌟",
    category: "exploration",
    earned: false,
    progress: 4,
    maxProgress: 7,
  },
  {
    id: "7",
    title: "Streak Master",
    description: "Maintain a 10-day learning streak",
    icon: "⚡",
    category: "consistency",
    earned: false,
    progress: 5,
    maxProgress: 10,
  },
  {
    id: "8",
    title: "Adventure Seeker",
    description: "Complete 5 learning adventures",
    icon: "🚀",
    category: "learning",
    earned: false,
    progress: 2,
    maxProgress: 5,
  },
  {
    id: "9",
    title: "Level Up",
    description: "Reach level 5",
    icon: "⭐",
    category: "mastery",
    earned: false,
    progress: 3,
    maxProgress: 5,
  },
]

const mockUserProgress: UserProgress = {
  level: 3,
  totalXP: 1250,
  nextLevelXP: 1500,
  currentLevelXP: 1000,
  streak: 5,
  topicsCompleted: 12,
  studyAreasExplored: 4,
  totalTimeSpent: 180,
  lastActiveDate: new Date().toISOString()
}

export function AchievementsPage() {
  const { user, profile, loading } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements)
  const [userProgress, setUserProgress] = useState<UserProgress>(mockUserProgress)
  const [loadingData, setLoadingData] = useState(false)

  const isAuthenticated = !!user

  // Fetch real user progress and calculate achievements
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        // Use mock data for unauthenticated users
        setAchievements(mockAchievements)
        setUserProgress(mockUserProgress)
        return
      }

      setLoadingData(true)
      try {
        // Use unified server endpoint for stats and achievements
        const res = await fetch('/api/achievements', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load achievements: ${res.status}`)
        const payload = await res.json()

        const s = payload.stats
  const ach = payload.achievements

        const progress: UserProgress = {
          level: s.level,
          totalXP: s.totalXP,
          nextLevelXP: s.nextLevelXP,
          currentLevelXP: s.currentLevelXP,
          streak: s.currentStreak,
          topicsCompleted: s.topicsCompleted,
          studyAreasExplored: s.studyAreasExplored,
          totalTimeSpent: s.totalTimeSpent,
          lastActiveDate: s.lastAccessDate,
        }

        setUserProgress(progress)
        // Normalize dates from server payload
        const normalized = (ach || []).map((a: any) => ({
          ...a,
          earnedDate: a.earnedDate ? new Date(a.earnedDate) : undefined,
        }))
        setAchievements(normalized)
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchUserData()
  }, [user])

  // Achievements and streak are computed on the server; no local calculation needed

  const getCategoryGlowColor = (category: string) => {
    const colors = {
      learning: "border-blue-400 shadow-[0_0_20px_theme(colors.blue.400)]",
      exploration: "border-green-400 shadow-[0_0_20px_theme(colors.green.400)]",
      consistency: "border-orange-400 shadow-[0_0_20px_theme(colors.orange.400)]",
      mastery: "border-purple-400 shadow-[0_0_20px_theme(colors.purple.400)]",
    }
    return colors[category as keyof typeof colors] || "border-yellow-400 shadow-[0_0_20px_theme(colors.yellow.400)]"
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      learning: "from-blue-500 to-cyan-500",
      exploration: "from-green-500 to-emerald-500",
      consistency: "from-orange-500 to-red-500",
      mastery: "from-purple-500 to-violet-500",
    }
    return colors[category as keyof typeof colors] || "from-gray-500 to-slate-500"
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      learning: BookOpen,
      exploration: Target,
      consistency: Zap,
      mastery: Brain,
    }
    return icons[category as keyof typeof icons] || Trophy
  }

  const earnedAchievements = achievements.filter((a) => a.earned)
  const unlockedAchievements = achievements.filter((a) => !a.earned)

  if (loading || loadingData) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your achievements...</p>
        </div>
      </div>
    )
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
                  <p className="text-blue-700 text-sm">You're viewing sample achievements. Sign in to track your real progress and earn achievements!</p>
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

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-heading text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2 flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500 animate-subtle-glow" />
            Your Achievements
          </h1>
          <p className="text-green-700 text-lg animate-stagger-fade" style={{ animationDelay: '0.2s' }}>
            {isAuthenticated 
              ? "Track your learning progress and celebrate your accomplishments!"
              : "See what achievements you can unlock on your science learning journey!"
            }
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/95 border-gray-300 border-2 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Level</CardTitle>
              <Star className="h-4 w-4 text-yellow-500 animate-gentle-bounce" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent animate-completion-celebration">{userProgress.level}</div>
              <Progress
                value={
                  ((userProgress.totalXP - userProgress.currentLevelXP) /
                    (userProgress.nextLevelXP - userProgress.currentLevelXP)) *
                  100
                }
                className="mt-2 h-4 shadow-[0_0_10px_rgba(168,85,247,0.4)] animate-progress-fill"
              />
              <p className="text-xs text-green-700 mt-1">
                {userProgress.totalXP - userProgress.currentLevelXP} /{" "}
                {userProgress.nextLevelXP - userProgress.currentLevelXP} XP
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 border-gray-300 border-2 animate-slide-in-right" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Learning Streak</CardTitle>
              <Zap className="h-4 w-4 text-orange-500 animate-gentle-bounce" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-orange-600">{userProgress.streak} days</div>
                <Flame className="h-6 w-6 text-red-500 animate-soft-pulse" />
              </div>
              <p className="text-xs text-green-700">Keep it up!</p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 border-gray-300 border-2 animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Topics Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600 animate-gentle-bounce" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{userProgress.topicsCompleted}</div>
              <p className="text-xs text-green-700">Great progress!</p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 border-gray-300 border-2 animate-slide-in-right" style={{ animationDelay: '0.6s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Study Areas</CardTitle>
              <Target className="h-4 w-4 text-red-500 animate-gentle-bounce" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{userProgress.studyAreasExplored}/7</div>
              <p className="text-xs text-green-700">Areas explored</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Earned Achievements */}
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <Award className="h-6 w-6" />
              Earned Achievements ({earnedAchievements.length})
            </h2>
            <div className="space-y-4">
              {earnedAchievements.map((achievement, index) => {
                const CategoryIcon = getCategoryIcon(achievement.category)
                return (
                  <Card 
                    key={achievement.id} 
                    className={`bg-white/95 border-2 ${getCategoryGlowColor(achievement.category)} animate-achievement-unlock transform hover:scale-[1.02] transition-all duration-300`}
                    style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-16 h-16 rounded-full bg-gradient-to-r ${getCategoryColor(achievement.category)} flex items-center justify-center text-4xl border-2 border-white shadow-lg animate-success-checkmark`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-700">{achievement.title}</h3>
                          <p className="text-green-700 text-sm">{achievement.description}</p>
                          {achievement.earnedDate && (
                            <p className="text-xs text-orange-600 mt-1">
                              Earned on {achievement.earnedDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-yellow-500/80 text-white border border-gray-300 animate-subtle-glow">
                          <Trophy className="h-3 w-3 mr-1" />
                          Earned
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Progress Achievements */}
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <Rocket className="h-6 w-6" />
              In Progress ({unlockedAchievements.length})
            </h2>
            <div className="space-y-4">
              {unlockedAchievements.map((achievement, index) => {
                const CategoryIcon = getCategoryIcon(achievement.category)
                const progressPercentage =
                  achievement.progress && achievement.maxProgress
                    ? (achievement.progress / achievement.maxProgress) * 100
                    : 0

                return (
                  <Card 
                    key={achievement.id} 
                    className="bg-white/95 border-gray-300 border-2 animate-stagger-fade transform hover:scale-[1.02] transition-all duration-300"
                    style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-r ${getCategoryColor(achievement.category)} opacity-60 flex items-center justify-center text-2xl border border-gray-300 animate-soft-pulse`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-blue-700">{achievement.title}</h3>
                          <p className="text-green-700 text-sm">{achievement.description}</p>
                          {achievement.progress !== undefined && achievement.maxProgress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-orange-600 mb-1">
                                <span>
                                  {achievement.progress} / {achievement.maxProgress}
                                </span>
                                <span>{Math.round(progressPercentage)}%</span>
                              </div>
                              <div className="relative">
                                <Progress value={progressPercentage} className="h-2 animate-progress-fill" />
                                <div 
                                  className="absolute top-0 left-0 h-2 rounded-full animate-skeleton-shimmer opacity-80"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="border-2 border-gray-400 text-red-600">
                          In Progress
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Achievement Categories */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-blue-700 mb-6">Achievement Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {["learning", "exploration", "consistency", "mastery"].map((category) => {
              const CategoryIcon = getCategoryIcon(category)
              const categoryAchievements = achievements.filter((a) => a.category === category)
              const earnedCount = categoryAchievements.filter((a) => a.earned).length

              return (
                <Card key={category} className="bg-white/95 border-gray-300 border-2">
                  <CardHeader className="text-center">
                    <div
                      className={`w-16 h-16 rounded-full bg-gradient-to-r ${getCategoryColor(category)} flex items-center justify-center mx-auto mb-2 border border-gray-300`}
                    >
                      <CategoryIcon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-blue-700 capitalize">{category}</CardTitle>
                    <CardDescription className="text-green-700">
                      {earnedCount} / {categoryAchievements.length} earned
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(earnedCount / categoryAchievements.length) * 100} className="h-2" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
