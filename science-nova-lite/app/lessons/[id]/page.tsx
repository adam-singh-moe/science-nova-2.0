import { VantaBackground } from "@/components/vanta-background"
import { headers } from "next/headers"
import { QuizViewer, type QuizItem as ViewerQuizItem } from "@/components/quiz-viewer"
import { CrosswordViewer } from "@/components/crossword-viewer"
import { FlashcardsViewer } from "@/components/flashcards-viewer"

async function fetchLesson(id: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/lessons?id=${id}`, { cache: 'no-store' })
  const json = await res.json()
  return json.lesson
}

export default async function LessonView({ params, searchParams }: { params: { id: string }, searchParams?: { [k: string]: string | string[] | undefined } }) {
  const lesson = await fetchLesson(params.id)
  if (!lesson || lesson.status !== 'published') {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Lesson not available</div>
  }
  const items = Array.isArray(lesson.layout_json?.items) ? lesson.layout_json.items : []
  const vanta = lesson.vanta_effect || 'globe'

  const canvasHeight = items.length ? Math.max(...items.map((it:any) => (Number(it.y)||0)+(Number(it.h)||0))) + 120 : 600
  const canvasWidth = items.length ? Math.max(...items.map((it:any) => (Number(it.x)||0)+(Number(it.w)||0))) + 120 : 900

  return (
    <VantaBackground effect={vanta}>
      <main className="min-h-screen py-10">
  <div className="mx-auto" style={{ width: canvasWidth }}>
          <div className="bg-white/80 backdrop-blur rounded-xl border p-6 mb-4">
            <h1 className="text-2xl font-bold mb-1">{lesson.title}</h1>
            {lesson.topic && <div className="text-sm text-gray-600">{lesson.topic}</div>}
          </div>
          <div className="relative rounded-xl border overflow-visible" style={{ minHeight: canvasHeight }}>
            {items.map((it: any) => (
              <div
                key={it.id}
                className="absolute rounded-xl p-4 bg-white/85 backdrop-blur border shadow-sm"
                style={{ left: Math.max(0, Number(it.x)||0), top: Math.max(0, Number(it.y)||0), width: Math.max(240, Number(it.w)||600), height: Math.max(160, Number(it.h)||220), overflow: 'auto' }}
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
                  const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards) ? it.data.cards : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                  const storageKey = `sn-flash:${lesson.id}:${it.id}`
                  const spMode = typeof searchParams?.flash === 'string' && (searchParams?.flash === 'flip' || searchParams?.flash === 'quiz') ? searchParams.flash : undefined
                  return <FlashcardsViewer cards={cards} storageKey={storageKey} initialMode={spMode as any} />
                })()}
                {it.kind === 'QUIZ' && (()=>{
                  const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                  if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                  const storageKey = `sn-quiz:${lesson.id}:${it.id}`
                  const spMode = typeof searchParams?.mode === 'string' && (searchParams?.mode === 'review' || searchParams?.mode === 'practice') ? searchParams.mode : undefined
                  return <QuizViewer items={items} storageKey={storageKey} initialMode={spMode as any} />
                })()}
                {it.kind === 'CROSSWORD' && (()=>{
                  const rows = Number(it.data?.rows || 10)
                  const cols = Number(it.data?.cols || 10)
                  const words = Array.isArray(it.data?.words) ? it.data.words : []
                  if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                  const storageKey = `sn-crossword:${lesson.id}:${it.id}`
                  return <CrosswordViewer rows={rows} cols={cols} words={words} storageKey={storageKey} />
                })()}
              </div>
            ))}
          </div>
        </div>
      </main>
    </VantaBackground>
  )
}
