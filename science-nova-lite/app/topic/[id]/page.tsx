"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { VantaBackground } from "@/components/vanta-background"
import { getVantaForStudyArea } from "@/lib/vanta-presets"
import { ScienceLoading } from "@/components/ui/science-loading"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExplorerHUD } from "@/components/topic/explorer-hud"
import { ContentGrid } from "@/components/topic/content-grid"
import { ArrowLeft, BookOpen, Loader2, Sparkles, AlertCircle, CheckCircle, X, RotateCcw, Trophy } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { getGradeColor, getAreaColor, theme } from "@/lib/theme"
import type { JSX } from "react/jsx-runtime"

interface Topic {
  id: string
  title: string
  grade_level: number
  study_area_id: string
  study_areas: { id: string; name: string; vanta_effect: string }
}

interface Flashcard { id: string; front: string; back: string; coverImage?: string }
interface QuizQuestion { id: string; question: string; options: string[]; correctAnswer: number; explanation: string }
interface Content { lessonContent: string; flashcards: Flashcard[]; quiz: QuizQuestion[] }

type PageStatus = "loading" | "generating" | "success" | "error"
interface PageState { status: PageStatus; topic: Topic | null; content: Content | null; error: string | null }

// Replaced by shared lib/vanta-presets.ts

const TopicLoading = () => (
  <>
  <VantaBackground />
  <ScienceLoading message="🌟 Loading your amazing topic..." type="orbit" />
  </>
)

const TopicError = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <>
    <VantaBackground />
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.accent} border-2 max-w-md w/full rounded-2xl shadow-lg`}>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">😢</div>
          <AlertCircle className={`h-16 w-16 ${theme.icon.accent} mx-auto mb-4`} />
          <h3 className={`text-xl font-bold ${theme.text.accent} mb-2 font-fredoka`}>Oops! Something went wrong!</h3>
          <p className={`${theme.text.dark} mb-6 font-comic`}>{error}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/topics">
              <Button className={`${theme.button.accent} text-white border-2 ${theme.border.secondary} rounded-2xl font-bold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <ArrowLeft className="h-4 w-4 mr-2" />🏠 Back to Topics
              </Button>
            </Link>
            <Button onClick={onRetry} variant="outline" className={`border-2 ${theme.border.secondary} ${theme.text.muted} ${theme.hover.background} hover:${theme.text.muted} rounded-2xl font-bold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
              🔄 Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </>
)

const GeneratingIndicator = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className={`h-8 w-8 animate-spin mr-4 ${theme.icon.warning}`} />
    <span className={`text-lg ${theme.text.primary} font-comic`}>
      <Sparkles className={`inline-block mr-2 ${theme.icon.warning}`} />✨ Creating your magical lesson...
    </span>
  </div>
)

const QuizQuestionComponent = ({ question, onAnswer }: { question: QuizQuestion; onAnswer: (questionId: string, selectedAnswer: number) => void }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const handleAnswerSelect = (answerIndex: number) => { if (showResult) return; setSelectedAnswer(answerIndex); setShowResult(true); onAnswer(question.id, answerIndex) }
  const resetQuestion = () => { setSelectedAnswer(null); setShowResult(false) }
  return (
    <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className={`${theme.text.primary} font-bold text-sm font-comic`}>{question.question}</h4>
          {showResult && (
            <Button onClick={resetQuestion} size="sm" variant="ghost" className={`${theme.text.muted} hover:${theme.text.primary} p-1 rounded-2xl`}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="space-y-2 mb-3">
          {question.options.map((option, index) => (
            <button key={index} onClick={() => handleAnswerSelect(index)} disabled={showResult} className={`w-full text-left p-3 rounded-xl border-2 text-xs transition-all duration-300 font-bold ${ showResult ? ( index === question.correctAnswer ? `backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} ${theme.text.secondary}` : index === selectedAnswer ? `backdrop-blur-lg ${theme.background.card} ${theme.border.accent} ${theme.text.accent}` : `backdrop-blur-lg ${theme.background.card} ${theme.border.primary} ${theme.text.light}` ) : `backdrop-blur-lg ${theme.background.card} ${theme.border.primary} ${theme.text.primary} ${theme.hover.border} hover:scale-105` }`}>
              <div className="flex items-center gap-2">
                {showResult && index === question.correctAnswer && <CheckCircle className={`h-3 w-3 ${theme.icon.secondary}`} />}
                {showResult && index === selectedAnswer && index !== question.correctAnswer && (<X className={`h-3 w-3 ${theme.icon.accent}`} />)}
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
        {showResult && (
          <div className={`backdrop-blur-lg ${theme.background.card} border-2 ${theme.border.primary} rounded-xl p-3`}>
            <p className={`${theme.text.primary} text-xs font-bold`}>
              <strong>💡 Explanation:</strong> {question.explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const LessonContent = ({ content }: { content: string }) => {
  const processedContent = useMemo(() => {
    let cleanContent = content
    cleanContent = cleanContent.replace(/(<div[^>]*>)([^<]*?)(<\/div>)/g, '$1$2$3')
    const htmlBlockRegex = /<div[^>]*>[\s\S]*?<\/div>/g
    const htmlBlocks: string[] = []
    let htmlIndex = 0
    cleanContent = cleanContent.replace(htmlBlockRegex, (match) => { const placeholder = `__HTML_BLOCK_${htmlIndex}__`; htmlBlocks[htmlIndex] = match; htmlIndex++; return `\n\n${placeholder}\n\n` })
    const sections = cleanContent.split(/\n\n+/).filter(section => section.trim())
    return sections.map((section, index) => {
      section = section.trim()
      const htmlMatch = section.match(/^__HTML_BLOCK_(\d+)__$/)
      if (htmlMatch) { const blockIndex = parseInt(htmlMatch[1]); return { type: "html" as const, content: htmlBlocks[blockIndex] || '', id: `html-${index}` } }
      if (section.includes('<') && section.includes('>')) { section = section.replace(/<[^>]*>/g, '').replace(/[{}]/g, '').trim(); if (!section) return null }
      if (section.startsWith("#")) { const level = section.match(/^#+/)?.[0].length || 1; const text = section.replace(/^#+\s*/, ""); return { type: "heading" as const, content: text, level, id: `heading-${index}` } }
      if (section.length > 0) { return { type: "paragraph" as const, content: section, id: `paragraph-${index}` } }
      return null
    }).filter(Boolean) as Array<{ type: "heading" | "html" | "paragraph"; content: string; level?: number; id: string }>
  }, [content])

  return (
    <div className="prose prose-lg max-w-none">
      {processedContent.map((item) => {
        switch (item.type) {
          case "heading": {
            const HeadingTag = `h${Math.min(item.level || 1, 6)}` as keyof JSX.IntrinsicElements
            return (
              <HeadingTag key={item.id} className={`${theme.text.primary} font-bold mb-4 mt-6 font-fredoka ${ (item.level || 1) === 1 ? "text-2xl" : (item.level || 1) === 2 ? "text-xl" : (item.level || 1) === 3 ? "text-lg" : "text-base" }`}>
                🌟 {item.content}
              </HeadingTag>
            )
          }
          case "html":
            return <div key={item.id} className="my-6" dangerouslySetInnerHTML={{ __html: item.content }} />
          case "paragraph":
            return (<p key={item.id} className={`${theme.text.secondary} leading-relaxed mb-4 font-comic font-bold text-lg`}>{item.content}</p>)
          default:
            return null
        }
      })}
    </div>
  )
}

const TopicView = ({ topic, content, status, onRetry }: { topic: Topic; content: Content | null; status: PageStatus; onRetry: () => void }) => {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [topicCompleted, setTopicCompleted] = useState(false)
  const { toast } = useToast()

  const handleQuizAnswer = (questionId: string, selectedAnswer: number) => setQuizAnswers((prev) => ({ ...prev, [questionId]: selectedAnswer }))

  const handleCompleteLesson = async () => {
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token
      const response = await fetch('/api/user-progress', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ topicId: topic.id, completed: true }) })
      if (response.ok) {
        setTopicCompleted(true)
        toast({ title: "🎉 Lesson Completed!", description: "Great job! You've completed this topic." })
      } else {
        throw new Error('Failed to mark lesson as completed')
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
      toast({ title: "Error", description: "Failed to mark lesson as completed. Please try again.", variant: "destructive" })
    }
  }

  const allQuestionsAnswered = content?.quiz && content.quiz.length > 0 ? content.quiz.every(q => quizAnswers[q.id] !== undefined) : true
  const canCompleteLesson = content && allQuestionsAnswered && !topicCompleted

  return (
    <>
  {(() => { const { effect, preset } = getVantaForStudyArea(topic.study_areas?.name || ""); return <VantaBackground effect={effect} preset={preset} /> })()}
      <ExplorerHUD topicTitle={topic.title} studyAreaName={topic.study_areas?.name || "Science"} gradeLevel={topic.grade_level} />
      <div className="min-h-screen pt-24 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/topics">
              <Button variant="outline" className={`mb-4 border-2 ${theme.border.primary} ${theme.text.primary} ${theme.hover.background} hover:${theme.text.primary} backdrop-blur-lg ${theme.background.transparent} font-bold rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                <ArrowLeft className="h-4 w-4 mr-2" />🏠 Back to Topics
              </Button>
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 ${theme.gradient.primary} rounded-2xl shadow-lg`}>
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className={`text-4xl font-bold text-transparent bg-clip-text ${theme.gradient.header} mb-2 font-fredoka`}>
                  🎓 {topic.title}
                </h1>
                <div className="flex gap-2">
                  <Badge className={`${getGradeColor(topic.grade_level)} text-white font-bold border-2 border-white rounded-2xl px-4 py-2 shadow-lg`}>
                    ⭐ Grade {topic.grade_level}
                  </Badge>
                  {topic.study_areas && (
                    <Badge className={`${getAreaColor(topic.study_areas.name)} text-white font-bold border-2 border-white rounded-2xl px-4 py-2 shadow-lg`}>
                      🔬 {topic.study_areas.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {status === "generating" ? (
              <GeneratingIndicator />
            ) : !content ? (
              <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.primary} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">⏰</div>
                  <AlertCircle className={`h-16 w-16 ${theme.icon.warning} mx-auto mb-4`} />
                  <h3 className={`text-xl font-bold ${theme.text.muted} mb-2 font-fredoka`}>Content Coming Soon!</h3>
                  <p className={`${theme.text.dark} mb-4 font-comic`}>
                    Our magical AI is working hard to create your lesson!
                  </p>
                  <Button onClick={onRetry} className={`${theme.button.warning} text-white border-2 ${theme.border.secondary} rounded-2xl font-bold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                    🔄 Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <ContentGrid content={content.lessonContent} flashcards={content.flashcards?.map(f => ({ ...f, coverImage: f.coverImage || undefined })) || []} />
                {content?.quiz && content.quiz.length > 0 && (
                  <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.accent} border-2 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <CardHeader>
                      <CardTitle className={`${theme.text.accent} flex items-center gap-2 font-fredoka text-xl`}>
                        <CheckCircle className="h-5 w-5" />🎯 Fun Quiz Time!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {content.quiz.map((q) => (
                          <QuizQuestionComponent key={q.id} question={q} onAnswer={(id, ans) => setQuizAnswers((prev) => ({ ...prev, [id]: ans }))} />
                        ))}
                      </div>
                      <div className="pt-4 border-t border-gray-300">
                        {topicCompleted ? (
                          <div className="text-center">
                            <CheckCircle className={`h-12 w-12 ${theme.icon.accent} mx-auto mb-3`} />
                            <h3 className={`text-lg font-bold ${theme.text.accent} mb-2 font-fredoka`}>🎉 Lesson Completed!</h3>
                            <p className={`${theme.text.secondary} font-comic`}>Great job! You've mastered this topic!</p>
                          </div>
                        ) : (
                          <Button onClick={handleCompleteLesson} disabled={!canCompleteLesson} className={`w-full ${canCompleteLesson ? theme.button.accent : 'bg-gray-400'} text-white border-2 ${theme.border.secondary} rounded-2xl font-bold px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100`}>
                            {allQuestionsAnswered ? (<><Trophy className="h-5 w-5 mr-2" />🎓 Complete Lesson</>) : (<><AlertCircle className="h-5 w-5 mr-2" />Answer all questions to complete</>)}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function TopicPage() {
  const params = useParams()
  const { toast } = useToast()
  const [state, setState] = useState<PageState>({ status: "loading", topic: null, content: null, error: null })

  const fetchAndGenerate = useCallback(async () => {
    try {
      setState({ status: "loading", topic: null, content: null, error: null })
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select(`id, title, grade_level, study_area_id, study_areas!inner ( id, name, vanta_effect )`)
        .eq("id", params.id)
        .single()
      if (topicError || !topicData) throw new Error(topicError?.message || "Topic not found")

      try {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        await fetch('/api/user-progress', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ topicId: params.id, completed: false }) })
      } catch (err) {
        console.error('Error tracking topic access:', err)
      }

      const formattedTopicData = { ...topicData, study_areas: Array.isArray(topicData.study_areas) ? topicData.study_areas[0] : topicData.study_areas } as Topic
      setState((prev) => ({ ...prev, status: "generating", topic: formattedTopicData }))

      const response = await fetch("/api/generate-enhanced-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topicId: params.id }) })
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || "Failed to generate content") }
      const contentData = await response.json()
      setState((prev) => ({ ...prev, status: "success", content: contentData }))
    } catch (error) {
      console.error("Error in fetchAndGenerate:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setState((prev) => ({ ...prev, status: "error", error: errorMessage }))
      toast({ title: "Error loading topic", description: errorMessage, variant: "destructive" })
    }
  }, [params.id, toast])

  useEffect(() => { if (params.id) { fetchAndGenerate() } }, [params.id, fetchAndGenerate])
  const handleRetry = () => { fetchAndGenerate() }

  switch (state.status) {
    case "loading":
      return <TopicLoading />
    case "error":
      return <TopicError error={state.error || "Unknown error"} onRetry={handleRetry} />
    case "generating":
    case "success":
      if (!state.topic) return <TopicLoading />
      return <TopicView topic={state.topic} content={state.content} status={state.status} onRetry={handleRetry} />
    default:
      return <TopicLoading />
  }
}
