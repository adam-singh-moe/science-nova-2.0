"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Target, Trophy, Zap, Flame, CheckCircle2, 
  TrendingUp, Calendar, Award, Star, Sparkles,
  BarChart3, Activity, Clock, Timer
} from "lucide-react"

interface QuizMasteryData {
  totalQuizzes: number
  averageScore: number
  perfectScores: number
  improvementStreak: number
  highScoreStreak: number
  weakestSubject?: string
  strongestSubject?: string
  recentScores: number[]
}

interface QuizMasteryVisualizerProps {
  data: QuizMasteryData
  masteryLevel: 'novice' | 'intermediate' | 'advanced' | 'expert' | 'master'
}

export function QuizMasteryVisualizer({ data, masteryLevel }: QuizMasteryVisualizerProps) {
  const getMasteryColor = () => {
    switch (masteryLevel) {
      case 'novice': return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' }
      case 'intermediate': return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' }
      case 'advanced': return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' }
      case 'expert': return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' }
      case 'master': return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' }
    }
  }

  const colors = getMasteryColor()
  const maxScore = Math.max(...data.recentScores, 100)

  return (
    <div className="space-y-4">
      {/* Mastery Level Indicator */}
      <div className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
              <Trophy className={`h-6 w-6 ${colors.text}`} />
            </div>
            <div>
              <h4 className={`font-bold text-lg ${colors.text} capitalize`}>{masteryLevel} Quiz Master</h4>
              <p className="text-sm text-gray-600">{data.averageScore}% average across {data.totalQuizzes} quizzes</p>
            </div>
          </div>
          <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
            Level {masteryLevel === 'master' ? '5' : masteryLevel === 'expert' ? '4' : masteryLevel === 'advanced' ? '3' : masteryLevel === 'intermediate' ? '2' : '1'}
          </Badge>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{data.averageScore}%</div>
            <div className="text-xs text-green-600">Average Score</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 text-center">
            <Sparkles className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-700">{data.perfectScores}</div>
            <div className="text-xs text-amber-600">Perfect Scores</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-700">{data.improvementStreak}</div>
            <div className="text-xs text-blue-600">Improvement Streak</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-700">{data.highScoreStreak}</div>
            <div className="text-xs text-purple-600">High Score Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance Chart */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Quiz Performance
          </h4>
          <div className="flex items-end gap-2 h-24">
            {data.recentScores.slice(-10).map((score, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t-sm transition-all duration-500 ${
                    score >= 90 ? 'bg-green-500' : 
                    score >= 80 ? 'bg-blue-500' : 
                    score >= 70 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ height: `${(score / maxScore) * 100}%` }}
                />
                <div className="text-xs text-gray-500">{score}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      {(data.strongestSubject || data.weakestSubject) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.strongestSubject && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8 text-green-600" />
                  <div>
                    <h5 className="font-semibold text-green-700">Strongest Subject</h5>
                    <p className="text-green-600 capitalize">{data.strongestSubject}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.weakestSubject && (
            <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-orange-600" />
                  <div>
                    <h5 className="font-semibold text-orange-700">Growth Opportunity</h5>
                    <p className="text-orange-600 capitalize">{data.weakestSubject}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

interface LearningJourneyProps {
  studyStreak: number
  totalStudyDays: number
  subjectsExplored: number
  deepDiveMinutes: number
  consistencyScore: number
}

export function LearningJourneyVisualizer({ 
  studyStreak, 
  totalStudyDays, 
  subjectsExplored, 
  deepDiveMinutes, 
  consistencyScore 
}: LearningJourneyProps) {
  const journeyMilestones = [
    { days: 7, title: "Week Warrior", icon: "🔥", unlocked: studyStreak >= 7 },
    { days: 30, title: "Month Master", icon: "🏆", unlocked: studyStreak >= 30 },
    { days: 100, title: "Century Scholar", icon: "👑", unlocked: studyStreak >= 100 },
    { days: 365, title: "Year Champion", icon: "🌟", unlocked: studyStreak >= 365 },
  ]

  const subjectMilestones = [
    { count: 3, title: "Explorer", color: "bg-blue-500", unlocked: subjectsExplored >= 3 },
    { count: 5, title: "Wanderer", color: "bg-green-500", unlocked: subjectsExplored >= 5 },
    { count: 7, title: "Navigator", color: "bg-purple-500", unlocked: subjectsExplored >= 7 },
    { count: 10, title: "Pathfinder", color: "bg-yellow-500", unlocked: subjectsExplored >= 10 },
  ]

  return (
    <div className="space-y-6">
      {/* Streak Visualization */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-orange-700 flex items-center gap-2">
              <Flame className="h-6 w-6" />
              Study Streak Journey
            </h4>
            <div className="text-3xl font-bold text-orange-600">{studyStreak} days</div>
          </div>
          
          <div className="flex justify-between items-end mb-4">
            {journeyMilestones.map((milestone, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  milestone.unlocked 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg scale-110' 
                    : 'bg-gray-200 opacity-60'
                }`}>
                  {milestone.unlocked ? milestone.icon : '🔒'}
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${milestone.unlocked ? 'text-orange-700' : 'text-gray-500'}`}>
                    {milestone.title}
                  </div>
                  <div className="text-xs text-gray-500">{milestone.days} days</div>
                </div>
              </div>
            ))}
          </div>
          
          <Progress value={Math.min(100, (studyStreak / 365) * 100)} className="h-3" />
          <div className="text-xs text-gray-600 mt-1">Progress to Year Champion</div>
        </CardContent>
      </Card>

      {/* Deep Dive Meter */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-indigo-700 flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Deep Dive Sessions
            </h4>
            <div className="text-2xl font-bold text-indigo-600">{Math.floor(deepDiveMinutes / 60)}h {deepDiveMinutes % 60}m</div>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full transition-all duration-1000 relative"
                style={{ width: `${Math.min(100, (deepDiveMinutes / 600) * 100)}%` }}
              >
                <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0min</span>
              <span>10hr goal</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Explorer Path */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
        <CardContent className="p-6">
          <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
            <Target className="h-6 w-6" />
            Subject Explorer Path
          </h4>
          
          <div className="flex items-center gap-4 mb-4">
            {subjectMilestones.map((milestone, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full transition-all duration-300 ${
                  milestone.unlocked ? milestone.color : 'bg-gray-300'
                }`}></div>
                <div className="text-xs text-center">
                  <div className={`font-semibold ${milestone.unlocked ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {milestone.title}
                  </div>
                  <div className="text-gray-500">{milestone.count}</div>
                </div>
                {index < subjectMilestones.length - 1 && (
                  <div className={`w-12 h-0.5 ${milestone.unlocked && subjectMilestones[index + 1].unlocked ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{subjectsExplored}/10</div>
            <div className="text-sm text-emerald-700">Subjects Explored</div>
          </div>
        </CardContent>
      </Card>

      {/* Consistency Radar */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
        <CardContent className="p-6">
          <h4 className="font-bold text-purple-700 mb-4 flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Consistency Score
          </h4>
          
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeDasharray={`${consistencyScore}, 100`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{consistencyScore}%</div>
                  <div className="text-xs text-purple-600">Consistent</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
