"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/layout/role-guard"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  BookOpen,
  BarChart3,
  Users,
  Target,
  Activity,
  Award,
  Download,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line
} from "recharts"

type StudentReport = {
  studentInfo: {
    id: string
    email: string
    name: string
    grade_level: number | null
    created_at: string
    last_sign_in_at: string | null
    avatar_url: string | null
  }
  activityStats: {
    totalTopicsCompleted: number
    totalLessonsViewed: number
    totalQuizzes: number
    averageQuizScore: number
    totalTimeSpent: number
    currentStreak: number
    achievementsEarned: number
    lastActivity: string | null
  }
  timelineData: Array<{
    date: string
    lessonsViewed: number
    quizzesCompleted: number
    timeSpent: number
    topicsCompleted: number
  }>
  subjectBreakdown: Array<{
    subject: string
    lessonsViewed: number
    averageScore: number
    timeSpent: number
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    category: string
    earned: boolean
    earnedDate?: string
    progress?: number
    maxProgress?: number
  }>
  recentActivity: Array<{
    type: string
    description: string
    timestamp: string
    details?: any
  }>
}

export default function StudentReportPage() {
  const { session } = useAuth()
  const params = useParams()
  const studentId = params.studentId as string
  
  const [report, setReport] = useState<StudentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30") // days
  const [error, setError] = useState<string | null>(null)

  const fetchStudentReport = async () => {
    if (!session || !studentId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString()
      
      const params = new URLSearchParams({
        startDate,
        endDate
      })

      const response = await fetch(`/api/admin/students/${studentId}?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Student not found' : 'Failed to fetch student report')
      }

      const data: StudentReport = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Error fetching student report:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudentReport()
  }, [session, studentId, timeRange])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading student report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/students">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!report) return null

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
          {/* Navigation */}
          <div className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 flex flex-wrap items-center gap-2 md:gap-3">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"><BarChart3 className="h-4 w-4"/>Dashboard</Link>
            <Link href="/admin/students" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"><Users className="h-4 w-4"/>Students</Link>
          </div>

          {/* Secondary Navigation & Controls */}
          <div className="mb-6 flex items-center gap-4">
            <Link href="/admin/students">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Student Header */}
          <div className="mb-6 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={report.studentInfo.avatar_url || undefined} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium text-lg">
                    {getInitials(report.studentInfo.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-semibold text-indigo-900">{report.studentInfo.name}</h1>
                  <p className="text-indigo-900/70">{report.studentInfo.email}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-indigo-900/60">
                    <span>Grade {report.studentInfo.grade_level || "N/A"}</span>
                    <span>•</span>
                    <span>Joined {formatDate(report.studentInfo.created_at)}</span>
                    <span>•</span>
                    <span>Last active {formatDate(report.studentInfo.last_sign_in_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-4 bg-white/70 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lessons Viewed</p>
                  <p className="text-2xl font-semibold">{report.activityStats.totalLessonsViewed}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/70 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Topics Completed</p>
                  <p className="text-2xl font-semibold">{report.activityStats.totalTopicsCompleted}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/70 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Quiz Score</p>
                  <p className={`text-2xl font-semibold ${getGradeColor(report.activityStats.averageQuizScore)}`}>
                    {report.activityStats.averageQuizScore}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/70 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Spent</p>
                  <p className="text-2xl font-semibold">{formatTime(report.activityStats.totalTimeSpent)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Activity Timeline */}
            <Card className="p-6 bg-white/70 backdrop-blur">
              <h3 className="mb-4 font-semibold text-lg">Activity Timeline</h3>
              <div className="h-64">
                <ChartContainer
                  config={{
                    lessonsViewed: {
                      label: "Lessons Viewed",
                      color: "#3b82f6",
                    },
                    quizzesCompleted: {
                      label: "Quizzes Completed", 
                      color: "#10b981",
                    },
                  }}
                  className="h-full w-full"
                >
                  <AreaChart data={report.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <ChartTooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString('en-US')}
                      content={<ChartTooltipContent />}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lessonsViewed" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name="Lessons Viewed"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="quizzesCompleted" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.3}
                      name="Quizzes Completed"
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </Card>

            {/* Subject Breakdown */}
            <Card className="p-6 bg-white/70 backdrop-blur">
              <h3 className="mb-4 font-semibold text-lg">Subject Performance</h3>
              <div className="h-64">
                <ChartContainer
                  config={{
                    averageScore: {
                      label: "Average Score %",
                      color: "#8884d8",
                    },
                  }}
                  className="h-full w-full"
                >
                  <BarChart data={report.subjectBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis 
                      dataKey="subject" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="averageScore" fill="#8884d8" name="Average Score %" />
                  </BarChart>
                </ChartContainer>
              </div>
            </Card>
          </div>

          {/* Achievements and Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Achievements */}
            <Card className="p-6 bg-white/70 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-lg">Achievements</h3>
                <Badge variant="secondary">
                  {report.achievements.filter(a => a.earned).length} / {report.achievements.length}
                </Badge>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{achievement.title}</p>
                        {achievement.earned && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{achievement.description}</p>
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="mt-2">
                          <Progress 
                            value={(achievement.progress / achievement.maxProgress) * 100} 
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {achievement.progress} / {achievement.maxProgress}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6 bg-white/70 backdrop-blur">
              <h3 className="mb-4 font-semibold text-lg">Recent Activity</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {report.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.details && activity.details.score && (
                        <Badge variant="outline" className="mt-1">
                          Score: {activity.details.score}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </RoleGuard>
    </div>
  )
}
