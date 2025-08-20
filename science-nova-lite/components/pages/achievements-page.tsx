"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Target, Zap, BookOpen, Brain, Rocket, Award, LogIn, Flame, Clock, Eye, Layers, BarChart3, Puzzle, PanelsTopLeft, Compass } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Achievement { id: string; title: string; description: string; icon: string; earned: boolean; earnedDate?: Date; progress?: number; maxProgress?: number; category: "learning" | "exploration" | "consistency" | "mastery" | "lesson" | "quiz" | "crossword" | "flashcards" }
interface UserProgress {
  level: number; totalXP: number; nextLevelXP: number; currentLevelXP: number;
  streak: number; topicsCompleted: number; studyAreasExplored: number; totalTimeSpent: number; lastActiveDate: string;
  // New lesson-focused stats
  lessonsViewed?: number;
  lessonMinutes?: number;
  lessonGroupsExplored?: number;
  lessonDifficulty?: { easy: number; moderate: number; challenging: number };
  quizSubmits?: number; quizBest?: number; quiz80?: number; quiz90?: number; quiz100?: number;
  crosswordsCompleted?: number; flashCycles?: number; flashFlips?: number;
}

const mockAchievements: Achievement[] = [
  { id: "1", title: "First Steps", description: "Complete your first science topic", icon: "🎯", category: "learning", earned: true, earnedDate: new Date("2024-01-15") },
  { id: "2", title: "Explorer", description: "Explore 3 different study areas", icon: "🗺️", category: "exploration", earned: true, earnedDate: new Date("2024-01-20") },
  { id: "3", title: "Consistent Learner", description: "Learn for 5 days in a row", icon: "🔥", category: "consistency", earned: true, earnedDate: new Date("2024-01-25") },
  { id: "4", title: "Topic Master", description: "Complete 10 topics", icon: "📚", category: "mastery", earned: false, progress: 7, maxProgress: 10 },
]
const mockUserProgress: UserProgress = { level: 3, totalXP: 1250, nextLevelXP: 1500, currentLevelXP: 1000, streak: 5, topicsCompleted: 12, studyAreasExplored: 4, totalTimeSpent: 180, lastActiveDate: new Date().toISOString() }

export function AchievementsPage() {
  const { user, profile, loading, session } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements)
  const [userProgress, setUserProgress] = useState<UserProgress>(mockUserProgress)
  const [loadingData, setLoadingData] = useState(false)

  const isAuthenticated = !!user

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) { setAchievements(mockAchievements); setUserProgress(mockUserProgress); return }
      setLoadingData(true)
      try {
        const headers: HeadersInit = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const res = await fetch('/api/achievements', { cache: 'no-store', headers })
        if (!res.ok) throw new Error(`Failed to load achievements: ${res.status}`)
        const payload = await res.json()
        const s = payload.stats
        const ach = payload.achievements
        setUserProgress({
          level: s.level,
          totalXP: s.totalXP,
          nextLevelXP: s.nextLevelXP,
          currentLevelXP: s.currentLevelXP,
          streak: s.currentStreak,
          topicsCompleted: s.topicsCompleted,
          studyAreasExplored: s.studyAreasExplored,
          totalTimeSpent: s.totalTimeSpent,
          lastActiveDate: s.lastAccessDate,
          lessonsViewed: s.lessonsViewed,
          lessonMinutes: s.lessonMinutes,
          lessonGroupsExplored: s.lessonGroupsExplored,
          lessonDifficulty: s.lessonDifficulty,
          quizSubmits: s.quizSubmits,
          quizBest: s.quizBest,
          quiz80: s.quiz80,
          quiz90: s.quiz90,
          quiz100: s.quiz100,
          crosswordsCompleted: s.crosswordsCompleted,
          flashCycles: s.flashCycles,
          flashFlips: s.flashFlips,
        })
        const normalized = (ach || []).map((a: any) => ({ ...a, earnedDate: a.earnedDate ? new Date(a.earnedDate) : undefined }))
        setAchievements(normalized)
      } finally { setLoadingData(false) }
    }
    fetchUserData()
  }, [user])

  // Achievements and streak are computed on the server

  const renderCategoryBadge = (category: Achievement["category"]) => {
    const common = "px-2 py-0.5 text-[10px] rounded-full flex items-center gap-1 border"
    switch (category) {
      case "learning":
        return <Badge className={`${common} bg-blue-50 text-blue-700 border-blue-200`}><BookOpen className="h-3 w-3" /> Learning</Badge>
      case "exploration":
        return <Badge className={`${common} bg-emerald-50 text-emerald-700 border-emerald-200`}><Compass className="h-3 w-3" /> Exploration</Badge>
      case "consistency":
        return <Badge className={`${common} bg-orange-50 text-orange-700 border-orange-200`}><Flame className="h-3 w-3" /> Consistency</Badge>
      case "mastery":
        return <Badge className={`${common} bg-yellow-50 text-yellow-700 border-yellow-200`}><Award className="h-3 w-3" /> Mastery</Badge>
      case "lesson":
        return <Badge className={`${common} bg-indigo-50 text-indigo-700 border-indigo-200`}><BookOpen className="h-3 w-3" /> Lesson</Badge>
      case "quiz":
        return <Badge className={`${common} bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200`}><Brain className="h-3 w-3" /> Quiz</Badge>
      case "crossword":
        return <Badge className={`${common} bg-violet-50 text-violet-700 border-violet-200`}><Puzzle className="h-3 w-3" /> Crossword</Badge>
      case "flashcards":
        return <Badge className={`${common} bg-rose-50 text-rose-700 border-rose-200`}><PanelsTopLeft className="h-3 w-3" /> Flashcards</Badge>
      default:
        return null
    }
  }

  const earnedSorted = achievements
    .filter(a => a.earned)
    .sort((a, b) => (b.earnedDate?.getTime() || 0) - (a.earnedDate?.getTime() || 0))
  const inProgress = achievements.filter(a => !a.earned)

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
        {!isAuthenticated && (
          <Card className="bg-blue-50 border-blue-200 border-2 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Demo Mode</h3>
                  <p className="text-blue-700 text-sm">You're viewing sample achievements. Sign in to track your real progress and earn achievements!</p>
                </div>
                <Button asChild><a href="/login"><LogIn className="h-4 w-4 mr-2" /> Sign In</a></Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-2 flex items-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" /> Your Achievements
          </h1>
          <p className="text-green-700 text-lg">{isAuthenticated ? "Track your learning progress and celebrate your accomplishments!" : "See what achievements you can unlock on your science learning journey!"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/95 border-gray-300 border-2"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-blue-700">Level</CardTitle><Star className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">{userProgress.level}</div><Progress value={((userProgress.totalXP - userProgress.currentLevelXP)/(userProgress.nextLevelXP - userProgress.currentLevelXP))*100} className="mt-2 h-4" /><p className="text-xs text-green-700 mt-1">{userProgress.totalXP - userProgress.currentLevelXP} / {userProgress.nextLevelXP - userProgress.currentLevelXP} XP</p></CardContent></Card>
          <Card className="bg-white/95 border-gray-300 border-2"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-blue-700">Learning Streak</CardTitle><Zap className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="flex items-center gap-2"><div className="text-2xl font-bold text-orange-600">{userProgress.streak} days</div><Flame className="h-6 w-6 text-red-500" /></div><p className="text-xs text-green-700">Keep it up!</p></CardContent></Card>
          <Card className="bg-white/95 border-gray-300 border-2"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-blue-700">Topics Completed</CardTitle><BookOpen className="h-4 w-4 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{userProgress.topicsCompleted}</div><p className="text-xs text-green-700">Great progress!</p></CardContent></Card>
          <Card className="bg-white/95 border-gray-300 border-2"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-blue-700">Study Areas</CardTitle><Target className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{userProgress.studyAreasExplored}/7</div><p className="text-xs text-green-700">Areas explored</p></CardContent></Card>
        </div>

        {/* Lesson Insights */}
        <div className="mb-2">
          <h2 className="text-xl font-bold text-blue-700 mb-3">Lesson Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Lessons Viewed</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{userProgress.lessonsViewed ?? 0}</div>
              <p className="text-xs text-green-700">Unique lessons opened</p>
            </CardContent>
          </Card>
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Lesson Time</CardTitle>
              <Clock className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{userProgress.lessonMinutes ?? 0} min</div>
              <p className="text-xs text-green-700">From active lesson sessions</p>
            </CardContent>
          </Card>
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Subjects Explored</CardTitle>
              <Layers className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-700">{userProgress.lessonGroupsExplored ?? 0}</div>
              <p className="text-xs text-green-700">From your lesson views</p>
            </CardContent>
          </Card>
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Quiz Best</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{userProgress.quizBest ?? 0}%</div>
              <p className="text-xs text-green-700">Across lesson quizzes</p>
            </CardContent>
          </Card>
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Crosswords</CardTitle>
              <Puzzle className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">{userProgress.crosswordsCompleted ?? 0}</div>
              <p className="text-xs text-green-700">Completed successfully</p>
            </CardContent>
          </Card>
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Flashcard Cycles</CardTitle>
              <PanelsTopLeft className="h-4 w-4 text-fuchsia-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fuchsia-700">{userProgress.flashCycles ?? 0}</div>
              <p className="text-xs text-green-700">Decks finished</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2"><Rocket className="h-6 w-6" /> In Progress</h2>
            <div className="space-y-4">
              {inProgress.map((ach) => (
                <Card key={ach.id} className="bg-white/95 border-gray-300 border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 opacity-60 flex items-center justify-center text-2xl border border-gray-300`}>{ach.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-blue-700">{ach.title}</h3>
                          {renderCategoryBadge(ach.category)}
                        </div>
                        <p className="text-green-700 text-sm">{ach.description}</p>
                        {ach.progress !== undefined && ach.maxProgress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-orange-600 mb-1"><span>{ach.progress} / {ach.maxProgress}</span><span>{Math.round((ach.progress/ach.maxProgress)*100)}%</span></div>
                            <Progress value={(ach.progress/ach.maxProgress)*100} className="h-2" />
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="border-2 border-gray-400 text-red-600">In Progress</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2"><Award className="h-6 w-6" /> Earned</h2>
            <div className="space-y-4">
              {earnedSorted.map((ach) => (
                <Card key={ach.id} className="bg-white/95 border-2 border-yellow-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center text-4xl border-2 border-white`}>{ach.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-blue-700">{ach.title}</h3>
                          {renderCategoryBadge(ach.category)}
                        </div>
                        <p className="text-green-700 text-sm">{ach.description}</p>
                      </div>
                      <Badge className="bg-yellow-500/80 text-white border border-gray-300"><Trophy className="h-3 w-3 mr-1" /> Earned</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
