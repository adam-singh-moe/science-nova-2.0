"use client"

import { useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { VantaBackground } from "@/components/vanta-background"
import { useSearchParams } from "next/navigation"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import ImageViewer from "@/components/image-viewer"
import YouTubeViewer from "@/components/youtube-viewer"
const QuizViewer = dynamic(() => import("@/components/quiz-viewer").then(m => m.QuizViewer), { ssr: false, loading: () => <div className="text-sm text-gray-500">Loading quiz…</div> })
const CrosswordViewer = dynamic(() => import("@/components/crossword-viewer").then(m => m.CrosswordViewer), { ssr: false, loading: () => <div className="text-sm text-gray-500">Loading crossword…</div> })
import type { QuizItem as ViewerQuizItem } from "@/components/quiz-viewer"
import { DESIGN_SIZE, sortByLayer } from "@/lib/layout"
import { StudentToolCard } from "@/components/student-tool-card"
import { Panel } from "@/components/ui/panel"

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

  const designW = (parsed?.meta?.designWidth as number) || DESIGN_SIZE.width
  const designH = (parsed?.meta?.designHeight as number) || DESIGN_SIZE.height
  // Builder can extend the canvas; use extended size if present
  const canvasW = 1280
  const canvasH = Number(parsed?.meta?.canvasHeight) || designH

  return (
    <VantaBackground effect={hydrated ? (parsed?.meta?.vanta || 'globe') : 'globe'} lessonBuilder={true}>
      <Navbar />
      <main className="px-4 py-6">
        <div className="relative mb-6 mx-auto w-[1280px]">
      <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-sky-400/50 via-emerald-400/50 to-indigo-400/50 blur" />
      <Panel className="relative p-6">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent mb-1">{hydrated ? (parsed?.meta?.title || 'Lesson Preview') : 'Lesson Preview'}</h1>
            <p className="text-gray-600">{hydrated ? (
              <>Topic: {parsed?.meta?.topic || 'N/A'} • Grade {parsed?.meta?.grade ?? 'N/A'}</>
            ) : (
              <>Topic: N/A • Grade N/A</>
            )}</p>
      </Panel>
        </div>
        {!hydrated ? (
          <div className="text-sm text-gray-500">Loading preview…</div>
        ) : (
          <>
            <div className="hidden md:block">
        <div className="mx-auto w-[1280px]">
                <Panel className="relative rounded-2xl p-0 bg-white/60 border-white/20">
          <div className="relative overflow-hidden" style={{ width: 1280, minHeight: canvasH }}>
                {parsed?.items?.map((it: any) => (
                  <div
                    key={it.id}
                    className="absolute p-2"
                    style={{ left: it.x||0, top: it.y||0, width: Math.max(240, it.w||600), height: Math.max(160, it.h||220), overflow: 'auto', zIndex: it.z ?? 0 }}
                  >
                {it.kind === 'TEXT' && (
                  <StudentToolCard variant="text" bodyBgColor={it.data?.bgColor as string | undefined}>
                    <div className="richtext">
                      {it.data?.html ? (
                        <div dangerouslySetInnerHTML={{ __html: it.data.html }} />
                      ) : (
                        <div className="whitespace-pre-wrap">{it.data?.text || 'Text block'}</div>
                      )}
                    </div>
                  </StudentToolCard>
                )}
                {it.kind === 'FLASHCARDS' && (()=>{
                  const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards)
                    ? it.data.cards
                    : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                  const storageKey = `sn-preview-flash:${it.id}`
                  return (
                    <StudentToolCard variant="flashcards" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <FlashcardsViewer cards={cards} storageKey={storageKey} />
                    </StudentToolCard>
                  )
                })()}
                {it.kind === 'QUIZ' && (()=>{
                  const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                  if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                  const storageKey = `sn-preview-quiz:${it.id}`
                  const urlMode = sp.get('mode')
                  const initialMode = urlMode === 'review' || urlMode === 'practice' ? (urlMode as any) : undefined
                  return (
                    <StudentToolCard variant="quiz" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <QuizViewer items={items} storageKey={storageKey} initialMode={initialMode} />
                    </StudentToolCard>
                  )
                })()}
                {it.kind === 'IMAGE' && (()=>{
                  const url = it.data?.url as string | undefined
                  const gradient = it.data?.gradient as string | undefined
                  const fit = (it.data?.fit as 'contain'|'cover'|'fill') || 'contain'
                  const alt = (it.data?.alt as string) || 'image'
                  const caption = it.data?.caption as string | undefined
                  return (
                    <StudentToolCard variant="image" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <ImageViewer url={url} gradient={gradient} fit={fit} alt={alt} caption={caption} variant="canvas" />
                    </StudentToolCard>
                  )
                })()}
                {it.kind === 'CROSSWORD' && (()=>{
                  const rows = Number(it.data?.rows || 10)
                  const cols = Number(it.data?.cols || 10)
                  const words = Array.isArray(it.data?.words) ? it.data.words : []
                  if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                  const storageKey = `sn-preview-crossword:${it.id}`
                  return (
                    <StudentToolCard variant="crossword" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <CrosswordViewer words={words} storageKey={storageKey} />
                    </StudentToolCard>
                  )
                })()}
                {it.kind === 'VIDEO' && (()=>{
                  const url = it.data?.url as string | undefined
                  const autoplay = it.data?.autoplay as boolean | undefined
                  const showControls = it.data?.showControls !== false
                  return (
                    <StudentToolCard variant="video" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <YouTubeViewer url={url} autoplay={autoplay} showControls={showControls} />
                    </StudentToolCard>
                  )
                })()}
                  </div>
                ))}
                  </div>
                </Panel>
              </div>
            </div>
            <div className="md:hidden">
              {sortByLayer(parsed?.items || []).map((it: any) => (
                <div key={it.id} className="rounded-3xl p-2 mb-4">
                  {it.kind === 'TEXT' && (
                    <StudentToolCard variant="text" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <div className="richtext">
                        {it.data?.html ? (
                          <div dangerouslySetInnerHTML={{ __html: it.data.html }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{it.data?.text || 'Text block'}</div>
                        )}
                      </div>
                    </StudentToolCard>
                  )}
                  {it.kind === 'FLASHCARDS' && (()=>{
                    const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards)
                      ? it.data.cards
                      : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                    const storageKey = `sn-preview-flash:${it.id}`
                    return (
                      <StudentToolCard variant="flashcards" bodyBgColor={it.data?.bgColor as string | undefined}>
                        <FlashcardsViewer cards={cards} storageKey={storageKey} />
                      </StudentToolCard>
                    )
                  })()}
                  {it.kind === 'QUIZ' && (()=>{
                    const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                    if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                    const storageKey = `sn-preview-quiz:${it.id}`
                    const urlMode = sp.get('mode')
                    const initialMode = urlMode === 'review' || urlMode === 'practice' ? (urlMode as any) : undefined
                    return (
                      <StudentToolCard variant="quiz" bodyBgColor={it.data?.bgColor as string | undefined}>
                        <QuizViewer items={items} storageKey={storageKey} initialMode={initialMode} />
                      </StudentToolCard>
                    )
                  })()}
                  {it.kind === 'CROSSWORD' && (()=>{
                    const rows = Number(it.data?.rows || 10)
                    const cols = Number(it.data?.cols || 10)
                    const words = Array.isArray(it.data?.words) ? it.data.words : []
                    if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                    const storageKey = `sn-preview-crossword:${it.id}`
                    return (
                      <StudentToolCard variant="crossword" bodyBgColor={it.data?.bgColor as string | undefined}>
                        <CrosswordViewer words={words} storageKey={storageKey} />
                      </StudentToolCard>
                    )
                  })()}
                  {it.kind === 'IMAGE' && (()=>{
                    const url = it.data?.url as string | undefined
                    const gradient = it.data?.gradient as string | undefined
                    const fit = (it.data?.fit as 'contain'|'cover'|'fill') || 'contain'
                    const alt = (it.data?.alt as string) || 'image'
                    const caption = it.data?.caption as string | undefined
                    return (
                      <StudentToolCard variant="image" bodyBgColor={it.data?.bgColor as string | undefined}>
                        <ImageViewer url={url} gradient={gradient} fit={fit} alt={alt} caption={caption} variant="stacked" />
                      </StudentToolCard>
                    )
                  })()}
                  {it.kind === 'VIDEO' && (()=>{
                    const url = it.data?.url as string | undefined
                    const autoplay = it.data?.autoplay as boolean | undefined
                    const showControls = it.data?.showControls !== false
                    return (
                      <StudentToolCard variant="video" bodyBgColor={it.data?.bgColor as string | undefined}>
                        <YouTubeViewer url={url} autoplay={autoplay} showControls={showControls} />
                      </StudentToolCard>
                    )
                  })()}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </VantaBackground>
  )
}
