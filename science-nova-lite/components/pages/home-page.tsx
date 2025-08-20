"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScienceLoading } from "@/components/ui/science-loading"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Trophy, Rocket, Clock, Star, ArrowRight, LogIn, Target, Lightbulb, Flame } from "lucide-react"
import Link from "next/link"
import { theme } from "@/lib/theme"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface RecentLesson { id: string; title: string; topic: string; grade_level: number; updated_at?: string }
interface HomeMission { completed: number; total: number; pct: number }
interface UserStats { topicsAccessed: number; topicsCompleted: number; studyAreasExplored: number; totalTimeSpent: number; currentStreak?: number; lastAccessDate?: string }

const mockStats: UserStats = { topicsAccessed: 12, topicsCompleted: 8, studyAreasExplored: 5, totalTimeSpent: 240, currentStreak: 5, lastAccessDate: new Date().toISOString() }
const mockRecentLessons: RecentLesson[] = [
  { id: "1", title: "The Solar System", topic: "Astronomy", grade_level: 5 },
  { id: "2", title: "Chemical Reactions", topic: "Chemistry", grade_level: 5 },
  { id: "3", title: "Photosynthesis", topic: "Biology", grade_level: 5 },
]

interface DailyQuest { id: string; title: string; description: string; icon: string; reward: string; type: 'visual' | 'story' | 'facts' }
interface StudyAreaFrequency { study_area: string; frequency: number }

const getTopicEmoji = (studyArea: string): string => ({ Astronomy: "🪐", Biology: "🌿", Chemistry: "🧪", Physics: "⚛️", "Earth Science": "🌍", default: "🔬" } as any)[studyArea] || "🔬"
const getFunFact = (title: string): string => ({
  "The Solar System": "Jupiter is so big that all the other planets could fit inside it!",
  Photosynthesis: "Plants are like nature's solar panels, turning sunlight into energy!",
  "Chemical Reactions": "When you mix baking soda and vinegar, it creates a mini volcano!",
  default: "Science is everywhere around us, waiting to be discovered!",
}[title] || "Science is everywhere around us, waiting to be discovered!")

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
  const { user, profile, loading, session } = useAuth()
  const [userStats, setUserStats] = useState<UserStats>(mockStats)
  const [recentLessons, setRecentLessons] = useState<RecentLesson[]>(mockRecentLessons)
  const [loadingData, setLoadingData] = useState(false)
  const [dailyQuest, setDailyQuest] = useState<DailyQuest | null>(null)
  const [badges, setBadges] = useState<string[]>([])
  const [mission, setMission] = useState<HomeMission>({ completed: 0, total: 0, pct: 0 })
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)
  const [confettiActive, setConfettiActive] = useState(false)

  const displayName = profile?.full_name || user?.email?.split('@')[0] || "Science Explorer"
  const isAuthenticated = !!user
  const userGradeLevel = profile?.grade_level || 5

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setUserStats(mockStats)
        setRecentLessons(mockRecentLessons)
        fallbackDailyQuest(profile?.learning_preference || 'VISUAL', userGradeLevel)
        return
      }
      setLoadingData(true)
      try {
        const headers: HeadersInit = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const homeRes = await fetch('/api/home', { cache: 'no-store', headers })
        if (!homeRes.ok) throw new Error(`Failed to load home: ${homeRes.status}`)
        const home = await homeRes.json()
        setRecentLessons(home.recentLessons || [])
        setMission(home.mission || { completed: 0, total: 0, pct: 0 })
        setBadges(home.badges || [])
        const rec = home.recommendation
        if (rec) {
          setDailyQuest({ id: rec.id, title: rec.title, description: `Learn about ${rec.topic} today.`, icon: '📘', reward: '+XP • Lesson', type: 'facts' })
        } else {
          // Fallback if no recommendation is available
          fallbackDailyQuest(profile?.learning_preference || 'VISUAL', userGradeLevel)
        }

        // For streak/time, still use achievements stats (telemetry-driven)
  const statsRes = await fetch('/api/achievements', { cache: 'no-store', headers })
        const payload = await statsRes.json()
        const stats = payload.stats as any
        setUserStats({
          topicsAccessed: stats.topicsAccessed || 0,
          topicsCompleted: stats.topicsCompleted || 0,
          studyAreasExplored: stats.studyAreasExplored || 0,
          totalTimeSpent: stats.lessonMinutes || 0,
          currentStreak: stats.currentStreak || 0,
          lastAccessDate: stats.lastAccessDate || new Date().toISOString(),
        })
  // no-op: dailyQuest already set from recommendation or fallback above
      } catch {
  // On failure, show a simple, fun fallback quest
  fallbackDailyQuest(profile?.learning_preference || 'VISUAL', userGradeLevel)
      } finally {
        setLoadingData(false)
      }
    }
    fetchUserData()
  }, [user, profile, userGradeLevel])

  useEffect(() => {
    const checkAndCelebrateStreak = () => {
      if (!userStats?.currentStreak || userStats.currentStreak <= 1) return
      const today = new Date().toDateString()
      const lastCelebrationDate = localStorage.getItem('sciencenova_last_streak_celebration')
      if (lastCelebrationDate !== today) {
        localStorage.setItem('sciencenova_last_streak_celebration', today)
        setShowStreakCelebration(true); setConfettiActive(true)
        setTimeout(() => setConfettiActive(false), 3000)
      }
    }
    if (userStats && !loadingData) checkAndCelebrateStreak()
  }, [userStats, loadingData])

  const fallbackDailyQuest = (learningPreference: string, gradeLevel: number) => {
    const quests = {
      VISUAL: [
        { id: 'visual-clouds', title: 'Cloud Detective', description: '🌤️ Identify cloud types outside today!', icon: '🌤️', reward: '+50 XP • Weather Badge', type: 'visual' as const },
        { id: 'visual-plants', title: 'Plant Explorer', description: '🌱 Find 5 different leaf shapes nearby.', icon: '🌱', reward: '+40 XP • Nature Badge', type: 'visual' as const },
      ],
      STORY: [
        { id: 'story-adventure', title: 'Science Story Time', description: "📚 Imagine a new planet—what's there?", icon: '📚', reward: '+60 XP • Storyteller Badge', type: 'story' as const },
      ],
      FACTS: [
        { id: 'facts-challenge', title: 'Science Facts Challenge', description: '🧠 Learn 3 new science facts today!', icon: '🧠', reward: '+50 XP • Knowledge Badge', type: 'facts' as const },
      ],
    } as const
    const group = (quests as any)[learningPreference] || (quests as any).VISUAL
    setDailyQuest(group[Math.floor(Math.random() * group.length)])
  }

  const calculateStreak = (progressData: any[]): number => {
    if (!progressData.length) return 0
    const today = new Date()
    const dates = progressData.map(p => new Date(p.last_accessed)).sort((a, b) => b.getTime() - a.getTime())
    let streak = 0
    let currentDate = new Date(today)
    for (const date of dates) {
      const daysDiff = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff <= 1) { streak++; currentDate = date } else { break }
    }
    return streak
  }

  const getTopicEmoji = (studyArea: string): string => ({ Astronomy: "🪐", Biology: "🌿", Chemistry: "🧪", Physics: "⚛️", "Earth Science": "🌍", Meteorology: "🌤️", default: "🔬" } as any)[studyArea] || "🔬"

  if (loading || loadingData) return <ScienceLoading message="Loading your science journey..." type="atom" />

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
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

        <div className="mb-8">
          <h1 className={`text-5xl md:text-6xl font-bold font-heading text-transparent bg-clip-text ${theme.gradient.header} mb-4`}>
            Welcome back, {displayName}!
          </h1>
          <p className={`text-lg ${theme.text.secondary} max-w-2xl`}>
            Ready to explore the wonders of science? {isAuthenticated ? "Continue your learning journey" : "Check out what Science Nova has to offer"} with interactive lessons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100/50 rounded-full">
                  <Rocket className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Mission Progress</h3>
                  <p className="text-sm text-blue-700">{mission.completed} of {mission.total} Lessons Complete!</p>
                </div>
              </div>
              <Progress value={mission.pct} className="h-6 mb-2" />
              <p className="text-xs text-blue-600 font-medium">{mission.pct}% Complete</p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 border-gray-300 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100/50 rounded-full">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">Study Badges</h3>
                  <p className="text-sm text-green-700">Your Recent Study Areas</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {badges.map((name, index) => (
                  <div key={index} className="px-3 py-2 bg-white/80 rounded-full shadow-sm text-sm border-2 border-green-200 flex items-center gap-2">
                    <span className="text-xl">{getTopicEmoji(name)}</span>
                    <span className="text-green-800 font-medium">{name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-600 font-medium">Based on your recent lessons</p>
            </CardContent>
          </Card>

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
                <div className="text-4xl font-bold font-heading text-orange-600 mb-1">{Math.floor((userStats.totalTimeSpent || 0) / 60)}h {(userStats.totalTimeSpent || 0) % 60}m</div>
                {userStats.currentStreak && userStats.currentStreak > 0 && (
                  <div className="mt-2 bg-red-100/50 border-2 border-red-300 rounded-full px-3 py-1 text-xs text-red-700 font-bold">🔥 {userStats.currentStreak} Day Streak!</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader>
              <CardTitle className={`${theme.text.primary} flex items-center gap-2`}><Star className="h-5 w-5" /> Explorer's Journal</CardTitle>
              <CardDescription className={theme.text.secondary}>Your latest lessons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLessons.map((l) => (
                  <Link key={l.id} href={`/lessons/${l.id}`} className="block">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 hover:border-accent cursor-pointer group">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center border-2 border-blue-200"><span className="text-2xl">{getTopicEmoji(l.topic)}</span></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium ${theme.text.primary} truncate group-hover:text-accent transition-colors`}>{l.title}</h4>
                        </div>
                        <p className={`text-sm ${theme.text.secondary}`}>{l.topic}</p>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">{l.updated_at ? new Date(l.updated_at).toLocaleDateString() : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader>
              <CardTitle className="text-yellow-900 flex items-center gap-2"><Target className="h-5 w-5" /> Today's Quest</CardTitle>
              <CardDescription className="text-yellow-700">Recommended lesson for you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyQuest && (
                  <div className="bg-yellow-50/50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-yellow-100/50 rounded-full"><Lightbulb className="h-5 w-5 text-yellow-600" /></div>
                      <div>
                        <h4 className="font-bold text-yellow-900">{dailyQuest.title}</h4>
                        <p className="text-sm text-yellow-700">A great pick for your grade</p>
                      </div>
                    </div>
                    <div className="bg-yellow-50/50 rounded-md p-3 mb-3"><p className="text-sm text-yellow-800 font-medium">{dailyQuest.description}</p></div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-xs text-yellow-700">Reward:</span><Badge variant="secondary" className="text-xs bg-yellow-100/50 text-yellow-700">{dailyQuest.reward}</Badge></div>
                      <Link href={`/lessons/${dailyQuest.id}`}><Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white">Start Lesson</Button></Link>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50/50 rounded-lg p-3 border border-gray-200"><div className="flex items-center justify-between text-sm"><span className="text-gray-700">Quest Streak:</span><div className="flex items-center gap-1"><span className="text-gray-900 font-bold">{userStats.currentStreak || 0} days</span><span className="text-yellow-600">🔥</span></div></div></div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <Dialog open={showStreakCelebration} onOpenChange={setShowStreakCelebration}>
        <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 border-2 border-orange-200 rounded-2xl shadow-2xl">
          {confettiActive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="absolute w-3 h-3 rounded-full animate-confetti-fall" style={{ left: `${Math.random() * 100}%`, backgroundColor: ['#fbbf24','#f59e0b','#ec4899','#8b5cf6','#3b82f6','#10b981'][Math.floor(Math.random()*6)], animationDelay: `${Math.random()*2}s`, animationDuration: `${2+Math.random()*2}s` }} />
              ))}
            </div>
          )}
          <DialogHeader className="text-center relative z-10">
            <div className="flex justify-center mb-4"><div className="relative"><Flame className="h-16 w-16 text-orange-500 animate-pulse" /><div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm animate-bounce">{userStats.currentStreak}</div></div></div>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 mb-2">You're on Fire! 🔥</DialogTitle>
            <div className="space-y-3">
              <p className="text-lg font-semibold text-orange-800">You're on a {userStats.currentStreak}-day science streak!</p>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
