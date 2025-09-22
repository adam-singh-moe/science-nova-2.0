"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trophy, Star, Target, Zap, BookOpen, Brain, Rocket, Award, LogIn, Flame, Clock, Eye, Layers, BarChart3, Puzzle, PanelsTopLeft, Compass, RefreshCw, TrendingUp, Shuffle, Search, Sparkles, Crown, Medal, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { AchievementHub } from "@/components/achievements/achievement-hub"
import { QuizMasteryVisualizer, LearningJourneyVisualizer } from "@/components/achievements/achievement-visualizers"
import { ResilienceVisualizer, LearningStyleVisualizer } from "@/components/achievements/advanced-visualizers"

interface Achievement { id: string; title: string; description: string; icon: string; earned: boolean; earnedDate?: Date; progress?: number; maxProgress?: number; category: "learning" | "exploration" | "consistency" | "mastery" | "lesson" | "quiz" | "crossword" | "flashcards" | "resilience" | "learning-style" | "engagement" | "learning-behavior" }
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
  const [apiAchievements, setApiAchievements] = useState<any[]>([])

  const isAuthenticated = !!user

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) { 
        setAchievements(mockAchievements); 
        setUserProgress(mockUserProgress); 
        return 
      }
      setLoadingData(true)
      try {
        const headers: HeadersInit = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const res = await fetch('/api/achievements', { cache: 'no-store', headers })
        if (!res.ok) throw new Error(`Failed to load achievements: ${res.status}`)
        const payload = await res.json()
        const s = payload.stats
        const ach = payload.achievements || []
        
        // Set API achievements for new system
        setApiAchievements(ach)
        
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

  // Transform API achievements into our new structure
  const transformAchievements = (apiAchievements: any[]) => {
    return apiAchievements.map(ach => ({
      id: ach.id,
      title: ach.title,
      description: ach.description,
      icon: getAchievementIcon(ach.id),
      unlocked: ach.unlocked,
      progress: ach.progress,
      category: getAchievementCategory(ach.id),
      tier: getAchievementTier(ach.progress),
      points: getAchievementPoints(ach.id),
      unlockDate: ach.unlocked ? new Date() : undefined
    }))
  }

  const getAchievementIcon = (id: string) => {
    const iconMap: { [key: string]: string } = {
      'quiz-master-pro': '🎓',
      'learning-phoenix': '🔥',
      'subject-explorer': '🌍', 
      'detective-scholar': '🔍',
      'consistency-champion': '🏆',
      'deep-dive-scholar': '⏰',
      'resilient-learner': '💪',
      'time-keeper': '🕐'
    }
    return iconMap[id] || '⭐'
  }

  const getAchievementCategory = (id: string) => {
    const categoryMap: { [key: string]: string } = {
      'quiz-master-pro': 'excellence',
      'learning-phoenix': 'resilience',
      'subject-explorer': 'learning-style',
      'detective-scholar': 'learning-style', 
      'consistency-champion': 'learning-behavior',
      'deep-dive-scholar': 'engagement',
      'resilient-learner': 'resilience',
      'time-keeper': 'learning-behavior'
    }
    return categoryMap[id] || 'learning'
  }

  const getAchievementTier = (progress: number): 'bronze' | 'silver' | 'gold' | 'platinum' | undefined => {
    if (progress >= 100) return 'gold'
    if (progress >= 75) return 'silver'
    if (progress >= 50) return 'bronze'
    return undefined
  }

  const getAchievementPoints = (id: string) => {
    const pointMap: { [key: string]: number } = {
      'quiz-master-pro': 500,
      'learning-phoenix': 300,
      'subject-explorer': 400,
      'detective-scholar': 350,
      'consistency-champion': 600,
      'deep-dive-scholar': 450,
      'resilient-learner': 400,
      'time-keeper': 300
    }
    return pointMap[id] || 100
  }

  const transformedAchievements = transformAchievements(apiAchievements)

  // Group achievements by category
  const excellenceAchievements = transformedAchievements.filter(a => a.category === 'excellence')
  const resilienceAchievements = transformedAchievements.filter(a => a.category === 'resilience')
  const learningStyleAchievements = transformedAchievements.filter(a => a.category === 'learning-style')
  const engagementAchievements = transformedAchievements.filter(a => a.category === 'engagement')
  const learningBehaviorAchievements = transformedAchievements.filter(a => a.category === 'learning-behavior')

  // Mock data for visualizers - replace with real data
  const quizMasteryData = {
    totalQuizzes: userProgress.quizSubmits || 0,
    averageScore: userProgress.quizBest || 0,
    perfectScores: userProgress.quiz100 || 0,
    improvementStreak: 3,
    highScoreStreak: 2,
    strongestSubject: 'Science',
    weakestSubject: 'Mathematics',
    recentScores: [75, 80, 85, 90, 88, 92, 95, 89, 94, 96]
  }

  const resilienceData = {
    quizResets: 3,
    lowScoreContinuations: 2,
    improvementStreaks: 4,
    comebackStories: 1,
    persistenceScore: 75
  }

  const learningStyleData = {
    subjectSwitching: userProgress.studyAreasExplored || 0,
    explanationViews: 15,
    explorationDepth: 80,
    curiosityIndex: 85,
    learningPatterns: ['Visual Learner', 'Detail-Oriented', 'Question Asker', 'Explorer']
  }

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
          <div className="relative mb-6">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-blue-500/10 backdrop-blur-lg border-2 border-blue-400/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">Demo Mode</h3>
                  <p className="text-white/90 text-sm drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">You're viewing sample achievements. Sign in to track your real progress and earn achievements!</p>
                </div>
                <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 hover:scale-105 transition-all duration-300 drop-shadow-[0_4px_15px_rgba(0,0,0,0.3)]" asChild>
                  <a href="/login">
                    <LogIn className="h-4 w-4 mr-2" /> 
                    Sign In
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center mb-8 relative">
          {/* Glow effect background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl backdrop-blur-sm"></div>
          
          <div className="relative">
            <h1 className="font-heading text-5xl font-bold mb-4 flex items-center justify-center gap-4">
              <div className="relative">
                <Trophy className="h-14 w-14 text-yellow-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]" />
                {/* Glow ring */}
                <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl scale-150"></div>
              </div>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]">
                Achievement Universe
              </span>
            </h1>
            <p className="text-white/95 text-xl max-w-2xl mx-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] font-medium">
              Explore your learning journey through interactive achievement hubs that celebrate your unique learning style and progress!
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="relative group">
            {/* Animated glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
            <div className="relative bg-white/8 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center hover:bg-white/12 transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(251,191,36,0.3)]">
              <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_20px_rgba(251,191,36,0.7)]" />
              <div className="text-3xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">{userProgress.level}</div>
              <div className="text-white/90 font-medium">Level</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
            <div className="relative bg-white/8 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center hover:bg-white/12 transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(34,197,94,0.3)]">
              <Flame className="h-8 w-8 text-green-400 mx-auto mb-2 drop-shadow-[0_0_20px_rgba(34,197,94,0.7)]" />
              <div className="text-3xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">{userProgress.streak}</div>
              <div className="text-white/90 font-medium">Day Streak</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-violet-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
            <div className="relative bg-white/8 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center hover:bg-white/12 transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(168,85,247,0.3)]">
              <Medal className="h-8 w-8 text-purple-400 mx-auto mb-2 drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]" />
              <div className="text-3xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">{transformedAchievements.filter(a => a.unlocked).length}</div>
              <div className="text-white/90 font-medium">Unlocked</div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
            <div className="relative bg-white/8 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center hover:bg-white/12 transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(59,130,246,0.3)]">
              <Sparkles className="h-8 w-8 text-blue-400 mx-auto mb-2 drop-shadow-[0_0_20px_rgba(59,130,246,0.7)]" />
              <div className="text-3xl font-bold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">{userProgress.totalXP}</div>
              <div className="text-white/90 font-medium">Total XP</div>
            </div>
          </div>
        </div>

        {/* Achievement Hubs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Excellence Hub */}
          <AchievementHub
            title="Excellence Mastery"
            description="Showcase your academic prowess"
            icon={<Crown className="h-10 w-10" />}
            theme={{
              primary: 'yellow-500',
              secondary: 'amber-600', 
              accent: 'yellow-400',
              gradient: 'from-yellow-400 to-amber-600'
            }}
            achievements={excellenceAchievements}
          >
            <QuizMasteryVisualizer 
              data={quizMasteryData}
              masteryLevel={quizMasteryData.averageScore >= 90 ? 'expert' : quizMasteryData.averageScore >= 80 ? 'advanced' : 'intermediate'}
            />
          </AchievementHub>

          {/* Resilience Hub */}
          <AchievementHub
            title="Phoenix Resilience"
            description="Rising stronger from every challenge"
            icon={<TrendingUp className="h-10 w-10" />}
            theme={{
              primary: 'orange-500',
              secondary: 'red-600',
              accent: 'orange-400', 
              gradient: 'from-orange-400 to-red-600'
            }}
            achievements={resilienceAchievements}
          >
            <ResilienceVisualizer data={resilienceData} />
          </AchievementHub>

          {/* Learning Style Hub */}
          <AchievementHub
            title="Explorer's Mind"
            description="Discover your unique learning style"
            icon={<Brain className="h-10 w-10" />}
            theme={{
              primary: 'purple-500',
              secondary: 'indigo-600',
              accent: 'purple-400',
              gradient: 'from-purple-400 to-indigo-600'
            }}
            achievements={learningStyleAchievements}
          >
            <LearningStyleVisualizer data={learningStyleData} />
          </AchievementHub>

          {/* Engagement & Behavior Hub */}
          <AchievementHub
            title="Learning Journey"
            description="Track your consistency and engagement"
            icon={<Rocket className="h-10 w-10" />}
            theme={{
              primary: 'green-500', 
              secondary: 'emerald-600',
              accent: 'green-400',
              gradient: 'from-green-400 to-emerald-600'
            }}
            achievements={[...engagementAchievements, ...learningBehaviorAchievements]}
          >
            <LearningJourneyVisualizer
              studyStreak={userProgress.streak}
              totalStudyDays={30}
              subjectsExplored={userProgress.studyAreasExplored}
              deepDiveMinutes={userProgress.totalTimeSpent}
              consistencyScore={75}
            />
          </AchievementHub>
        </div>

        {/* Achievement Progress Summary */}
        <div className="mt-8 relative">
          {/* Subtle glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 via-purple-400/10 to-pink-400/10 rounded-3xl blur-xl"></div>
          
          <div className="relative bg-white/8 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]">
              <Target className="h-8 w-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
              Your Achievement Journey
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <h4 className="font-semibold text-white/95 mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">Next Milestone</h4>
                <p className="text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                  {transformedAchievements.find(a => !a.unlocked && a.progress > 50)?.title || 'Keep exploring to unlock more achievements!'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <h4 className="font-semibold text-white/95 mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">Recent Achievement</h4>
                <p className="text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                  {transformedAchievements.find(a => a.unlocked)?.title || 'Start your journey to earn your first achievement!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
