"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Database, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { theme } from "@/lib/theme"

interface TextbookStatusProps {
  gradeLevel: number
  showDetails?: boolean
}

interface TextbookStats {
  totalChunks: number
  gradeStats: Array<{
    grade: number
    files: string[]
    chunks: number
    lastProcessed: string | null
  }>
  hasContent: boolean
}

export function TextbookStatus({ gradeLevel, showDetails = false }: TextbookStatusProps) {
  const [stats, setStats] = useState<TextbookStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/process-textbooks')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching textbook stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${theme.text.muted}`}>
        <Clock className="h-4 w-4 animate-spin" />
        <span className="text-sm">Checking textbook status...</span>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={`flex items-center gap-2 ${theme.text.muted}`}>
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">Unable to check textbook status</span>
      </div>
    )
  }

  const gradeStats = stats.gradeStats.find(s => s.grade === gradeLevel)
  const hasTextbookContent = gradeStats && gradeStats.chunks > 0

  if (!showDetails) {
    return (
      <div className="flex items-center gap-2">
        {hasTextbookContent ? (
          <>            <CheckCircle className={`h-4 w-4 ${theme.icon.secondary}`} />
            <span className={`text-sm ${theme.text.secondary}`}>
              Textbook content available ({gradeStats.chunks} sections)
            </span>
          </>
        ) : (
          <>            <AlertCircle className={`h-4 w-4 ${theme.icon.warning}`} />
            <span className={`text-sm ${theme.text.muted}`}>
              No textbook content available
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-lg ${theme.text.primary} flex items-center gap-2`}>
          <Database className={`h-5 w-5 ${theme.icon.accent}`} />
          Textbook Content Status
        </CardTitle>
        <CardDescription className={theme.text.secondary}>
          AI content generation is enhanced with curriculum-aligned textbook content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Grade Status */}
          <div className={`p-3 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-semibold ${theme.text.primary}`}>Grade {gradeLevel}</span>
              <Badge className={hasTextbookContent ? "bg-green-500/60" : "bg-red-500/60"}>
                {hasTextbookContent ? `${gradeStats.chunks} sections` : 'No content'}
              </Badge>
            </div>
            {hasTextbookContent && gradeStats.lastProcessed && (
              <p className={`text-xs ${theme.text.muted}`}>
                Last updated: {new Date(gradeStats.lastProcessed).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Overall System Status */}
          <div className={`p-3 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
            <h4 className={`font-semibold ${theme.text.primary} mb-2 flex items-center gap-2`}>
              <BookOpen className="h-4 w-4" />
              System Overview
            </h4>
            <div className="space-y-1">
              <p className={`text-sm ${theme.text.secondary}`}>
                Total Content Sections: <span className="font-bold">{stats.totalChunks}</span>
              </p>
              <p className={`text-sm ${theme.text.secondary}`}>
                Grades with Content: <span className="font-bold">{stats.gradeStats.length}</span>
              </p>
              <p className={`text-sm ${theme.text.secondary}`}>
                Content Available: <span className="font-bold">{stats.hasContent ? 'Yes' : 'No'}</span>
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className={`p-3 rounded-lg ${theme.background.secondary} ${theme.border.accent} border`}>
            <h4 className={`font-semibold ${theme.text.primary} mb-2`}>Enhanced Learning Features</h4>
            <ul className={`text-sm ${theme.text.secondary} space-y-1`}>
              <li>✓ Curriculum-aligned content generation</li>
              <li>✓ Textbook-grounded explanations</li>
              <li>✓ Grade-appropriate complexity</li>
              <li>✓ Subject-specific accuracy</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
