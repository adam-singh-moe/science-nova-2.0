import { VantaBackground } from "@/components/vanta-background"
import { StudentToolCard } from "@/components/student-tool-card"
import { headers } from "next/headers"
import QuizViewer from "@/components/quiz-viewer.client"
import CrosswordViewer from "@/components/crossword-viewer.client"
import type { QuizItem as ViewerQuizItem } from "@/components/quiz-viewer"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import ImageViewer from "@/components/image-viewer"

import { DESIGN_SIZE, sortByLayer } from "@/lib/layout"
import LessonActivityClient from "@/components/lesson-activity-client"
import { Panel } from "@/components/ui/panel"
async function fetchLesson(id: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/lessons?id=${id}`, { cache: 'no-store' })
  const json = await res.json()
  return json.lesson
}

export default async function LessonView(props: any) {
  const { params, searchParams } = await props
  const lesson = await fetchLesson(params.id)
  if (!lesson || lesson.status !== 'published') {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Lesson not available</div>
  }
  const items = Array.isArray(lesson.layout_json?.items) ? lesson.layout_json.items : []
  const vanta = lesson.vanta_effect || 'globe'

  const designW = lesson.layout_json?.meta?.designWidth || DESIGN_SIZE.width
  const designH = lesson.layout_json?.meta?.designHeight || DESIGN_SIZE.height
  const canvasW = 1280
  const canvasH = Number(lesson.layout_json?.meta?.canvasHeight) || designH

  return (
    <VantaBackground effect={vanta}>
  <main className="min-h-screen py-10">
  {/* Telemetry: lesson view + heartbeat */}
  <LessonActivityClient lessonId={lesson.id} />
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="relative mb-6 mx-auto w-[1280px]">
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-sky-400/50 via-emerald-400/50 to-indigo-400/50 blur" />
            <Panel className="relative p-6">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent mb-1">{lesson.title}</h1>
              {lesson.topic && <div className="text-sm text-gray-600">{lesson.topic}</div>}
            </Panel>
          </div>
          <div className="hidden md:block">
            <div className="mx-auto w-[1280px]">
              <Panel className="relative rounded-2xl p-0 bg-white/60 border-white/20">
                <div className="relative overflow-hidden" style={{ width: 1280, minHeight: canvasH }}>
              {items.map((it: any) => (
                <div
                  key={it.id}
                  className="absolute p-2"
                  style={{ left: Math.max(0, Number(it.x)||0), top: Math.max(0, Number(it.y)||0), width: Math.max(240, Number(it.w)||600), height: Math.max(160, Number(it.h)||220), overflow: 'auto' }}
                >
                {it.kind === 'TEXT' && (
                  <StudentToolCard variant="text">
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
                  const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards) ? it.data.cards : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                  const storageKey = `sn-flash:${lesson.id}:${it.id}`
                  return (
                    <StudentToolCard variant="flashcards">
                      <FlashcardsViewer cards={cards} storageKey={storageKey} />
                    </StudentToolCard>
                  )
                })()}
                {it.kind === 'QUIZ' && (()=>{
                  const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                  if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                  const storageKey = `sn-quiz:${lesson.id}:${it.id}`
                  const spMode = typeof searchParams?.mode === 'string' && (searchParams?.mode === 'review' || searchParams?.mode === 'practice') ? searchParams.mode : undefined
                  return (
                    <StudentToolCard variant="quiz">
                      <QuizViewer items={items} storageKey={storageKey} initialMode={spMode as any} />
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
                    <StudentToolCard variant="image">
                      <ImageViewer url={url} gradient={gradient} fit={fit} alt={alt} caption={caption} variant="canvas" />
                    </StudentToolCard>
                  )
                })()}
                {it.kind === 'CROSSWORD' && (()=>{
                  const rows = Number(it.data?.rows || 10)
                  const cols = Number(it.data?.cols || 10)
                  const words = Array.isArray(it.data?.words) ? it.data.words : []
                  if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                  const storageKey = `sn-crossword:${lesson.id}:${it.id}`
                  return (
                    <StudentToolCard variant="crossword">
                      <CrosswordViewer rows={rows} cols={cols} words={words} storageKey={storageKey} />
                    </StudentToolCard>
                  )
                })()}
                </div>
              ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
        <div className="md:hidden">
          {sortByLayer(items).map((it: any) => (
            <div key={it.id} className="rounded-3xl p-2 mb-4">
              {it.kind === 'TEXT' && (
                <StudentToolCard variant="text">
                  <div className="richtext">
                    {it.data?.html ? (
                      <div dangerouslySetInnerHTML={{ __html: it.data.html }} />
                    ) : (
                      <div className="whitespace-pre-wrap">{it.data?.text || 'Text block'}</div>
                    )}
                  </div>
                </StudentToolCard>
              )}
              {it.kind === 'FLASHCARDS' && (()=> {
                const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards) ? it.data.cards : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                const storageKey = `sn-flash:${lesson.id}:${it.id}`
                return (
                  <StudentToolCard variant="flashcards">
                    <FlashcardsViewer cards={cards} storageKey={storageKey} />
                  </StudentToolCard>
                )
              })()}
              {it.kind === 'QUIZ' && (()=> {
                const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                const storageKey = `sn-quiz:${lesson.id}:${it.id}`
                const spMode = typeof searchParams?.mode === 'string' && (searchParams?.mode === 'review' || searchParams?.mode === 'practice') ? searchParams.mode : undefined
                return (
                  <StudentToolCard variant="quiz">
                    <QuizViewer items={items} storageKey={storageKey} initialMode={spMode as any} />
                  </StudentToolCard>
                )
              })()}
              {it.kind === 'CROSSWORD' && (()=> {
                const rows = Number(it.data?.rows || 10)
                const cols = Number(it.data?.cols || 10)
                const words = Array.isArray(it.data?.words) ? it.data.words : []
                if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                const storageKey = `sn-crossword:${lesson.id}:${it.id}`
                return (
                  <StudentToolCard variant="crossword">
                    <CrosswordViewer rows={rows} cols={cols} words={words} storageKey={storageKey} />
                  </StudentToolCard>
                )
              })()}
              {it.kind === 'IMAGE' && (()=> {
                const url = it.data?.url as string | undefined
                const gradient = it.data?.gradient as string | undefined
                const fit = (it.data?.fit as 'contain'|'cover'|'fill') || 'contain'
                const alt = (it.data?.alt as string) || 'image'
                const caption = it.data?.caption as string | undefined
                return (
                  <StudentToolCard variant="image">
                    <ImageViewer url={url} gradient={gradient} fit={fit} alt={alt} caption={caption} variant="stacked" />
                  </StudentToolCard>
                )
              })()}
            </div>
          ))}
        </div>
      </main>
    </VantaBackground>
  )
}
