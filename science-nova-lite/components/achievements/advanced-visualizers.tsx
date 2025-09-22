"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, Lightbulb, Puzzle, Search, RefreshCw, 
  ArrowRight, TrendingUp, Eye, Shuffle,
  CheckCircle, Clock, Target, Zap, Award
} from "lucide-react"

interface ResilienceData {
  quizResets: number
  lowScoreContinuations: number
  improvementStreaks: number
  comebackStories: number
  persistenceScore: number
}

interface LearningStyleData {
  subjectSwitching: number
  explanationViews: number
  explorationDepth: number
  curiosityIndex: number
  learningPatterns: string[]
}

export function ResilienceVisualizer({ data }: { data: ResilienceData }) {
  const resilienceLevel = 
    data.persistenceScore >= 90 ? 'Unbreakable' :
    data.persistenceScore >= 75 ? 'Resilient' :
    data.persistenceScore >= 50 ? 'Determined' :
    data.persistenceScore >= 25 ? 'Learning' : 'Growing'

  const levelColors = {
    'Unbreakable': 'from-purple-500 to-indigo-600',
    'Resilient': 'from-green-500 to-emerald-600',
    'Determined': 'from-blue-500 to-cyan-600',
    'Learning': 'from-orange-500 to-yellow-600',
    'Growing': 'from-gray-400 to-gray-600'
  }

  return (
    <div className="space-y-4">
      {/* Resilience Level Badge */}
      <Card className={`bg-gradient-to-r ${levelColors[resilienceLevel as keyof typeof levelColors]} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{resilienceLevel} Learner</h3>
                <p className="text-white/80">Persistence Score: {data.persistenceScore}%</p>
              </div>
            </div>
            <Award className="h-12 w-12 opacity-75" />
          </div>
        </CardContent>
      </Card>

      {/* Phoenix Journey Tracker */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
        <CardContent className="p-6">
          <h4 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
            🔥 Phoenix Journey - Rising from Challenges
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-orange-500 rounded-full flex items-center justify-center text-white mb-2">
                <RefreshCw className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{data.quizResets}</div>
              <div className="text-sm text-orange-700">Quiz Resets</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-red-500 rounded-full flex items-center justify-center text-white mb-2">
                <Target className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-red-600">{data.lowScoreContinuations}</div>
              <div className="text-sm text-red-700">Continued After Low Scores</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center text-white mb-2">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-green-600">{data.improvementStreaks}</div>
              <div className="text-sm text-green-700">Improvement Streaks</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-purple-500 rounded-full flex items-center justify-center text-white mb-2">
                <Award className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{data.comebackStories}</div>
              <div className="text-sm text-purple-700">Comeback Stories</div>
            </div>
          </div>

          {/* Resilience Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Resilience Growth</span>
              <span>{data.persistenceScore}%</span>
            </div>
            <Progress value={data.persistenceScore} className="h-3" />
          </div>

          {/* Motivational Message */}
          <div className="bg-white/70 rounded-lg p-4 text-center">
            <p className="text-orange-700 font-medium">
              {data.persistenceScore >= 75 
                ? "🌟 You're a true Phoenix - rising stronger from every challenge!"
                : data.persistenceScore >= 50
                ? "🔥 You're building incredible resilience - keep pushing forward!"
                : "🌱 Every attempt makes you stronger - you're on the right path!"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LearningStyleVisualizer({ data }: { data: LearningStyleData }) {
  const learnerType = 
    data.explanationViews > 20 && data.subjectSwitching > 10 ? 'Analytical Explorer' :
    data.explanationViews > 15 ? 'Deep Investigator' :
    data.subjectSwitching > 8 ? 'Curious Wanderer' :
    data.explorationDepth > 75 ? 'Focused Scholar' : 'Emerging Learner'

  const typeColors = {
    'Analytical Explorer': 'from-purple-500 to-pink-600',
    'Deep Investigator': 'from-blue-500 to-indigo-600',
    'Curious Wanderer': 'from-green-500 to-teal-600',
    'Focused Scholar': 'from-orange-500 to-red-600',
    'Emerging Learner': 'from-gray-400 to-gray-600'
  }

  return (
    <div className="space-y-4">
      {/* Learning Type Badge */}
      <Card className={`bg-gradient-to-r ${typeColors[learnerType as keyof typeof typeColors]} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{learnerType}</h3>
                <p className="text-white/80">Curiosity Index: {data.curiosityIndex}%</p>
              </div>
            </div>
            <Lightbulb className="h-12 w-12 opacity-75" />
          </div>
        </CardContent>
      </Card>

      {/* Detective Scholar Investigation Lab */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200">
        <CardContent className="p-6">
          <h4 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
            🔍 Detective Scholar Investigation Lab
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Explanation Views Tracker */}
            <div className="bg-white/70 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Eye className="h-6 w-6 text-indigo-600" />
                <div>
                  <h5 className="font-semibold text-indigo-700">Evidence Examined</h5>
                  <p className="text-sm text-indigo-600">{data.explanationViews} explanations viewed</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {[...Array(Math.min(5, Math.ceil(data.explanationViews / 4)))].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-green-500" />
                    <div className="flex-1 bg-green-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full w-full"></div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Exploration Map */}
            <div className="bg-white/70 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shuffle className="h-6 w-6 text-purple-600" />
                <div>
                  <h5 className="font-semibold text-purple-700">Subject Explorer</h5>
                  <p className="text-sm text-purple-600">{data.subjectSwitching} subject switches</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full" viewBox="0 0 24 24">
                    {[...Array(8)].map((_, i) => {
                      const angle = (i * 45) * (Math.PI / 180)
                      const x = 12 + 8 * Math.cos(angle)
                      const y = 12 + 8 * Math.sin(angle)
                      const isActive = i < Math.min(8, data.subjectSwitching)
                      
                      return (
                        <g key={i}>
                          <line
                            x1="12" y1="12"
                            x2={x} y2={y}
                            stroke={isActive ? "#8b5cf6" : "#e5e7eb"}
                            strokeWidth="2"
                          />
                          <circle
                            cx={x} cy={y}
                            r="2"
                            fill={isActive ? "#8b5cf6" : "#e5e7eb"}
                          />
                        </g>
                      )
                    })}
                    <circle cx="12" cy="12" r="3" fill="#6366f1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Patterns */}
          <div className="mt-6">
            <h5 className="font-semibold text-indigo-700 mb-3">Your Learning Patterns</h5>
            <div className="flex flex-wrap gap-2">
              {data.learningPatterns.map((pattern, index) => (
                <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exploration Depth Gauge */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
        <CardContent className="p-6">
          <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
            <Target className="h-6 w-6" />
            Exploration Depth Meter
          </h4>
          
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-16 overflow-hidden">
              <div className="absolute inset-0 bg-gray-200 rounded-t-full"></div>
              <div 
                className="absolute bottom-0 bg-gradient-to-t from-emerald-500 to-green-400 rounded-t-full transition-all duration-1000"
                style={{ 
                  width: '100%', 
                  height: `${data.explorationDepth}%`,
                  transformOrigin: 'bottom'
                }}
              ></div>
              <div className="absolute inset-0 flex items-end justify-center pb-2">
                <span className="text-white font-bold text-sm">{data.explorationDepth}%</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-emerald-700 font-medium">
              {data.explorationDepth >= 80 
                ? "🌟 Master Explorer - You dive deep into every topic!"
                : data.explorationDepth >= 60
                ? "🔍 Thorough Investigator - You love to understand the details!"
                : "🌱 Growing Explorer - Your curiosity is developing beautifully!"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
