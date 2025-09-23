"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3,
  TrendingUp, 
  Users, 
  Target,
  Award,
  Clock,
  BookOpen,
  Activity,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

interface WeeklyReport {
  id: string
  user_id: string
  week_start_date: string
  week_end_date: string
  total_lessons_attempted: number
  total_lessons_completed: number
  total_time_spent_minutes: number
  avg_quiz_score: number
  topics_explored: number
  arcade_games_played: number
  discovery_items_viewed: number
  engagement_score: number
  achievement_points: number
  streak_days: number
  report_data: any
  created_at: string
  users: {
    email: string
    profiles: {
      display_name?: string
      grade_level?: number
    }[]
  }
}

interface ReportSummary {
  totalStudents: number
  avgEngagementScore: number
  totalLessonsCompleted: number
  avgTimeSpent: number
  topPerformers: Array<{
    userId: string
    displayName: string
    email: string
    engagementScore: number
    lessonsCompleted: number
  }>
  weeklyTrends: Array<{
    week: string
    students: number
    avgEngagement: number
    totalLessons: number
  }>
}

export default function ReportsPage() {
  const { session } = useAuth()
  
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [gradeFilter, setGradeFilter] = useState<number | null>(null)
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Get available weeks for filtering
  const getAvailableWeeks = () => {
    const weeks = new Set(reports.map(r => r.week_start_date))
    return Array.from(weeks).sort().reverse()
  }

  // Fetch weekly reports
  const fetchReports = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('weekly_student_reports')
        .select(`
          *,
          users (
            email,
            profiles (
              display_name,
              grade_level
            )
          )
        `)
        .order('week_start_date', { ascending: false })
        .order('engagement_score', { ascending: false })

      // Apply filters
      if (selectedWeek) {
        query = query.eq('week_start_date', selectedWeek)
      }

      if (gradeFilter) {
        query = query.eq('users.profiles.grade_level', gradeFilter)
      }

      const { data, error } = await query.limit(100)

      if (error) {
        console.error('Error fetching reports:', error)
        return
      }

      setReports((data as WeeklyReport[]) || [])
      calculateSummary(data as WeeklyReport[])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary statistics
  const calculateSummary = (reportsData: WeeklyReport[]) => {
    if (!reportsData || reportsData.length === 0) {
      setSummary(null)
      return
    }

    const totalStudents = new Set(reportsData.map(r => r.user_id)).size
    const avgEngagementScore = reportsData.reduce((sum, r) => sum + r.engagement_score, 0) / reportsData.length
    const totalLessonsCompleted = reportsData.reduce((sum, r) => sum + r.total_lessons_completed, 0)
    const avgTimeSpent = reportsData.reduce((sum, r) => sum + r.total_time_spent_minutes, 0) / reportsData.length

    // Get top performers (highest engagement score)
    const topPerformers = reportsData
      .slice(0, 10)
      .map(r => ({
        userId: r.user_id,
        displayName: r.users?.profiles?.[0]?.display_name || 'Student',
        email: r.users?.email || '',
        engagementScore: r.engagement_score,
        lessonsCompleted: r.total_lessons_completed
      }))

    // Calculate weekly trends
    const weeklyData = new Map<string, { students: Set<string>, totalLessons: number, totalEngagement: number, count: number }>()
    
    reportsData.forEach(r => {
      const week = r.week_start_date
      if (!weeklyData.has(week)) {
        weeklyData.set(week, { students: new Set(), totalLessons: 0, totalEngagement: 0, count: 0 })
      }
      const weekData = weeklyData.get(week)!
      weekData.students.add(r.user_id)
      weekData.totalLessons += r.total_lessons_completed
      weekData.totalEngagement += r.engagement_score
      weekData.count++
    })

    const weeklyTrends = Array.from(weeklyData.entries())
      .map(([week, data]) => ({
        week,
        students: data.students.size,
        avgEngagement: data.totalEngagement / data.count,
        totalLessons: data.totalLessons
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    setSummary({
      totalStudents,
      avgEngagementScore,
      totalLessonsCompleted,
      avgTimeSpent,
      topPerformers,
      weeklyTrends
    })
  }

  // Generate new reports for current week
  const generateWeeklyReports = async () => {
    setGenerating(true)
    try {
      const { data, error } = await supabase.rpc('generate_weekly_reports')
      
      if (error) {
        console.error('Error generating reports:', error)
        return
      }

      console.log('Weekly reports generated:', data)
      fetchReports()
    } catch (error) {
      console.error('Error generating reports:', error)
    } finally {
      setGenerating(false)
    }
  }

  // Export reports as CSV
  const exportReports = () => {
    if (!reports.length) return

    const headers = [
      'Week Start',
      'Student Email',
      'Display Name',
      'Grade Level',
      'Lessons Attempted',
      'Lessons Completed',
      'Time Spent (min)',
      'Avg Quiz Score',
      'Topics Explored',
      'Arcade Games',
      'Discovery Items',
      'Engagement Score',
      'Achievement Points',
      'Streak Days'
    ]

    const csvData = reports.map(r => [
      r.week_start_date,
      r.users?.email || '',
      r.users?.profiles?.[0]?.display_name || '',
      r.users?.profiles?.[0]?.grade_level || '',
      r.total_lessons_attempted,
      r.total_lessons_completed,
      r.total_time_spent_minutes,
      r.avg_quiz_score?.toFixed(1) || '0.0',
      r.topics_explored,
      r.arcade_games_played,
      r.discovery_items_viewed,
      r.engagement_score?.toFixed(1) || '0.0',
      r.achievement_points,
      r.streak_days
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weekly-reports-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (session) {
      fetchReports()
    }
  }, [session, selectedWeek, gradeFilter])

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getEngagementLabel = (score: number) => {
    if (score >= 80) return 'High'
    if (score >= 60) return 'Medium'
    return 'Low'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-3">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Weekly Reports</h1>
            <p className="text-gray-600">Student engagement and activity analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateWeeklyReports} disabled={generating}>
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Reports
              </>
            )}
          </Button>
          <Button variant="outline" onClick={exportReports} disabled={!reports.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Weeks</option>
            {getAvailableWeeks().map(week => (
              <option key={week} value={week}>
                Week of {new Date(week).toLocaleDateString()}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter || ''}
            onChange={(e) => setGradeFilter(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Grades</option>
            {[3, 4, 5, 6, 7, 8].map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>

          {(selectedWeek || gradeFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedWeek('')
                setGradeFilter(null)
              }}
              className="text-gray-600"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{summary.totalStudents}</p>
                <p className="text-sm text-gray-600">Active Students</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{summary.avgEngagementScore.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Engagement</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{summary.totalLessonsCompleted}</p>
                <p className="text-sm text-gray-600">Lessons Completed</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{Math.round(summary.avgTimeSpent)}</p>
                <p className="text-sm text-gray-600">Avg Minutes/Week</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Top Performers */}
      {summary?.topPerformers && summary.topPerformers.length > 0 && (
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Performers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.topPerformers.slice(0, 6).map((performer, index) => (
              <div key={performer.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{performer.displayName}</p>
                  <p className="text-sm text-gray-600">{performer.lessonsCompleted} lessons</p>
                </div>
                <Badge className={getEngagementColor(performer.engagementScore)}>
                  {performer.engagementScore.toFixed(0)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Individual Reports */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Individual Reports ({reports.length})
          </h3>
          <Button onClick={fetchReports} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p>No reports found for the selected filters.</p>
            <Button onClick={generateWeeklyReports} className="mt-4">
              Generate Reports
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {report.users?.profiles?.[0]?.display_name || 'Student'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.users?.email} • Grade {report.users?.profiles?.[0]?.grade_level}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEngagementColor(report.engagement_score)}>
                          {getEngagementLabel(report.engagement_score)} ({report.engagement_score.toFixed(0)})
                        </Badge>
                        <Badge variant="outline">
                          {report.total_lessons_completed} lessons
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Week of {new Date(report.week_start_date).toLocaleDateString()}
                      </span>
                      {expandedReport === report.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedReport === report.id && (
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{report.total_lessons_attempted}</p>
                        <p className="text-sm text-blue-800">Lessons Attempted</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{Math.round(report.total_time_spent_minutes)}</p>
                        <p className="text-sm text-green-800">Minutes Spent</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{report.topics_explored}</p>
                        <p className="text-sm text-purple-800">Topics Explored</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{report.streak_days}</p>
                        <p className="text-sm text-orange-800">Streak Days</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Quiz Performance</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800">
                          {report.avg_quiz_score?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Arcade Games</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800">
                          {report.arcade_games_played}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Discovery Items</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800">
                          {report.discovery_items_viewed}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}