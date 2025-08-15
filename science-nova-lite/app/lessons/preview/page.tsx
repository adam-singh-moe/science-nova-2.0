"use client"

import { useEffect, useState, Suspense } from "react"
import { Navbar } from "@/components/layout/navbar"
import { VantaBackground } from "@/components/vanta-background"
import { useSearchParams } from "next/navigation"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import { QuizViewer, type QuizItem as ViewerQuizItem } from "@/components/quiz-viewer"
import { CrosswordViewer } from "@/components/crossword-viewer"

export default function LessonPreview() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}> 
      <LessonPreviewInner />
    </Suspense>
  )
}

function LessonPreviewInner() {
  const [parsed, setParsed] = useState<any>(null)
  const [hydrated, setHydrated] = useState(false)
  const sp = useSearchParams()

  useEffect(() => {
    try {
      const data = sessionStorage.getItem("lessonPreview")
      setParsed(data ? JSON.parse(data) : null)
    } catch {
      setParsed(null)
    } finally {
      setHydrated(true)
    }
  }, [])

  // Compute canvas size once hydrated to match builder
  const canvasHeight = hydrated && Array.isArray(parsed?.items) && parsed.items.length
    ? Math.max(...parsed.items.map((it: any) => (Number(it.y)||0) + (Number(it.h)||0))) + 120
    : 600
  const canvasWidth = hydrated && Array.isArray(parsed?.items) && parsed.items.length
    ? Math.max(...parsed.items.map((it: any) => (Number(it.x)||0) + (Number(it.w)||0))) + 120
    : 900

  return (
    <VantaBackground effect={hydrated ? (parsed?.meta?.vanta || 'globe') : 'globe'}>
      <Navbar />
  <main className="px-6">
        <h1 className="text-3xl font-bold mb-1">{hydrated ? (parsed?.meta?.title || 'Lesson Preview') : 'Lesson Preview'}</h1>
        <p className="text-gray-600 mb-6">{hydrated ? (
          <>Topic: {parsed?.meta?.topic || 'N/A'} • Grade {parsed?.meta?.grade ?? 'N/A'}</>
        ) : (
          <>Topic: N/A • Grade N/A</>
        )}</p>
        {!hydrated ? (
          <div className="text-sm text-gray-500">Loading preview…</div>
        ) : (
          <div className="relative mx-auto my-6 rounded-xl border overflow-visible" style={{ minHeight: canvasHeight, width: canvasWidth }}>
            {parsed?.items?.map((it: any) => (
              <div
                key={it.id}
                className="absolute rounded-xl p-4 bg-white/80 backdrop-blur border shadow-sm"
                style={{ left: it.x||0, top: it.y||0, width: it.w||600, height: it.h||220, overflow: 'auto' }}
              >
                {it.kind === 'TEXT' && (
                  <div className="prose max-w-none">
                    {it.data?.html ? (
                      <div dangerouslySetInnerHTML={{ __html: it.data.html }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{it.data?.text || 'Text block'}</div>
                    )}
                  </div>
                )}
                {it.kind === 'FLASHCARDS' && (()=>{
                  const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards)
                    ? it.data.cards
                    : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                  const storageKey = `sn-preview-flash:${it.id}`
                  const urlMode = sp.get('flash')
                  const initialMode = urlMode === 'flip' || urlMode === 'quiz' ? (urlMode as any) : undefined
                  return <FlashcardsViewer cards={cards} storageKey={storageKey} initialMode={initialMode} />
                })()}
                {it.kind === 'QUIZ' && (()=>{
                  const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                  if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                  const storageKey = `sn-preview-quiz:${it.id}`
                  const urlMode = sp.get('mode')
                  const initialMode = urlMode === 'review' || urlMode === 'practice' ? (urlMode as any) : undefined
                  return <QuizViewer items={items} storageKey={storageKey} initialMode={initialMode} />
                })()}
                {it.kind === 'CROSSWORD' && (()=>{
                  const rows = Number(it.data?.rows || 10)
                  const cols = Number(it.data?.cols || 10)
                  const words = Array.isArray(it.data?.words) ? it.data.words : []
                  if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                  const storageKey = `sn-preview-crossword:${it.id}`
                  return <CrosswordViewer rows={rows} cols={cols} words={words} storageKey={storageKey} />
                })()}
              </div>
            ))}
          </div>
        )}
      </main>
    </VantaBackground>
  )
}
