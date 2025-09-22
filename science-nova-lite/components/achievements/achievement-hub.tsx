"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, Star, Target, Zap, BookOpen, Brain, Rocket, Award, 
  Flame, Clock, Eye, Layers, BarChart3, Puzzle, PanelsTopLeft, 
  Compass, RefreshCw, TrendingUp, Shuffle, Search, ChevronRight,
  Sparkles, Shield, Mountain, Timer, Users, Crown, Medal,
  Activity, CheckCircle, Lock, Unlock
} from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  category: string
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
  points?: number
  unlockDate?: Date
}

interface AchievementHubProps {
  title: string
  description: string
  icon: React.ReactNode
  theme: {
    primary: string
    secondary: string
    accent: string
    gradient: string
  }
  achievements: Achievement[]
  children?: React.ReactNode
}

export function AchievementHub({ title, description, icon, theme, achievements, children }: AchievementHubProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length
  const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0
  
  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'silver': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'platinum': return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case 'bronze': return <Medal className="h-4 w-4" />
      case 'silver': return <Shield className="h-4 w-4" />
      case 'gold': return <Crown className="h-4 w-4" />
      case 'platinum': return <Sparkles className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }

  return (
    <div className="relative group">
      {/* Outer glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-10 rounded-2xl blur-2xl transition-all duration-500 group-hover:opacity-20 group-hover:blur-3xl`}></div>
      
      <div className={`relative overflow-hidden transition-all duration-500 backdrop-blur-lg border border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 ${isExpanded ? 'row-span-2' : ''}`}>
        <div 
          className={`bg-gradient-to-br ${theme.gradient} p-6 cursor-pointer transition-all duration-300 hover:scale-[1.01] border-b border-white/20 relative overflow-hidden`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-8 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-6 left-12 w-1 h-1 bg-white/60 rounded-full animate-pulse delay-500"></div>
            <div className="absolute top-12 left-16 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse delay-1000"></div>
          </div>
          
          <div className="flex items-center justify-between text-white relative z-10">
            <div className="flex items-center gap-4">
              <div className="text-4xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{icon}</div>
              <div>
                <h3 className="text-xl font-bold drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]">{title}</h3>
                <p className="text-white/95 text-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">{description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]">{unlockedCount}/{totalCount}</div>
              <div className="text-white/95 text-sm flex items-center gap-1">
                <Trophy className="h-4 w-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                {Math.round(completionRate)}%
              </div>
              <ChevronRight className={`h-5 w-5 transition-transform duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${isExpanded ? 'rotate-90' : ''}`} />
            </div>
          </div>
          
          <div className="mt-4 relative z-10">
            <Progress 
              value={completionRate} 
              className="h-2 bg-white/20" 
              style={{
                '--progress-background': 'rgba(255,255,255,0.95)'
              } as any}
            />
          </div>
        </div>

        {isExpanded && (
          <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-500 bg-white/5 backdrop-blur-sm relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-white"></div>
            </div>
            
            <div className="relative z-10">
              {children}
              
              <div className="grid gap-3 mt-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 backdrop-blur-md relative overflow-hidden ${
                      achievement.unlocked
                        ? `bg-gradient-to-r from-green-400/15 to-emerald-400/15 border-green-300/40 shadow-[0_8px_32px_rgba(34,197,94,0.2)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.3)]`
                        : 'bg-white/8 border-white/20 hover:bg-white/12'
                    }`}
                  >
                    {/* Achievement glow effect for unlocked items */}
                    {achievement.unlocked && (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-xl"></div>
                    )}
                    
                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all duration-300 z-10 ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.6)] scale-110' 
                        : 'bg-white/20 opacity-60'
                    }`}>
                      {achievement.unlocked ? (
                        <>
                          {achievement.icon}
                          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                        </>
                      ) : (
                        <Lock className="h-6 w-6 text-white/60" />
                      )}
                    </div>

                    <div className="flex-1 relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${achievement.unlocked ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' : 'text-white/70'}`}>
                          {achievement.title}
                        </h4>
                        {achievement.tier && (
                          <Badge className={`${getTierColor(achievement.tier)} text-xs backdrop-blur-sm`}>
                            {getTierIcon(achievement.tier)}
                            {achievement.tier}
                          </Badge>
                        )}
                        {achievement.points && (
                          <Badge variant="outline" className="text-xs bg-white/10 border-white/30 text-white backdrop-blur-sm">
                            +{achievement.points} XP
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${achievement.unlocked ? 'text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]' : 'text-white/60'}`}>
                        {achievement.description}
                      </p>
                      
                      {!achievement.unlocked && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress}%</span>
                          </div>
                          <Progress value={achievement.progress} className="h-1.5 bg-white/20" />
                        </div>
                      )}
                      
                      {achievement.unlocked && achievement.unlockDate && (
                        <div className="mt-1 text-xs text-green-300 flex items-center gap-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                          <CheckCircle className="h-3 w-3" />
                          Unlocked {achievement.unlockDate.toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {achievement.unlocked && (
                      <div className="text-green-300 relative z-10">
                        <Unlock className="h-5 w-5 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
