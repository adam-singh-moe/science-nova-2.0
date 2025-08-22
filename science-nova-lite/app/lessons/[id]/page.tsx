import { VantaBackground } from "@/components/vanta-background"
import { getVantaForStudyArea } from "@/lib/vanta-presets"
import { headers } from "next/headers"
import QuizViewer from "@/components/quiz-viewer.client"
import CrosswordViewer from "@/components/crossword-viewer.client"
import type { QuizItem as ViewerQuizItem } from "@/components/quiz-viewer"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import ImageViewer from "@/components/image-viewer"
import { setBlockDone } from "@/lib/progress"
import { AutoCompleteWrapper } from "@/components/auto-complete-wrapper"

import { DESIGN_SIZE, sortByLayer } from "@/lib/layout"
import LessonActivityClient from "@/components/lesson-activity-client"
import LessonHeader from "@/components/lesson-header"
import ToolContainer from "@/components/tool-container.client"
async function fetchLesson(id: string) {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const base = `${proto}://${host}`
  const res = await fetch(`${base}/api/lessons?id=${id}`, { cache: 'no-store' })
  const json = await res.json()
  return json.lesson
}

export default async function LessonView(props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const lesson = await fetchLesson(params.id)
  if (!lesson || lesson.status !== 'published') {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Lesson not available</div>
  }
  const items = Array.isArray(lesson.layout_json?.items) ? lesson.layout_json.items : []
  const vanta = lesson.vanta_effect || 'globe'
  const { effect: vantaEffect, preset: vantaPreset } = getVantaForStudyArea(lesson.topic || undefined)

  const designW = lesson.layout_json?.meta?.designWidth || DESIGN_SIZE.width
  const designH = lesson.layout_json?.meta?.designHeight || DESIGN_SIZE.height
  const canvasW = 1280
  const canvasH = Number(lesson.layout_json?.meta?.canvasHeight) || designH
  const blockIds: string[] = (Array.isArray(items) ? items : []).map((it: any) => String(it?.id || '')).filter(Boolean)
  const tocItems = items.map((it: any) => ({ id: String(it.id), label: (it.kind || 'Item'), y: Number(it.y) || 0 }))

  return (
  <VantaBackground effect={vanta || vantaEffect} preset={vantaPreset}>
  <main className="min-h-screen py-10">
  {/* Telemetry: lesson view + heartbeat */}
  <LessonActivityClient lessonId={lesson.id} />
        <LessonHeader lessonId={lesson.id} title={lesson.title} stageText={lesson.topic} blockIds={blockIds} tocItems={tocItems} />
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="hidden md:block">
            <div className="mx-auto w-[1280px]">
                <div id="lesson-canvas" className="relative overflow-hidden rounded-3xl" style={{ width: 1280, minHeight: canvasH }}>
              {items.map((it: any) => (
                <div
                  key={it.id}
                  className="absolute p-2"
                  style={{ left: Math.max(0, Number(it.x)||0), top: Math.max(0, Number(it.y)||0), width: Math.max(240, Number(it.w)||600), height: Math.max(160, Number(it.h)||220), overflow: 'auto' }}
                >
                {it.kind === 'TEXT' && (
                  <AutoCompleteWrapper lessonId={lesson.id} blockId={it.id}>
                    <ToolContainer variant="text" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <div className="richtext">
                        {it.data?.html ? (
                          <div dangerouslySetInnerHTML={{ __html: it.data.html }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{it.data?.text || 'Text block'}</div>
                        )}
                      </div>
                    </ToolContainer>
                  </AutoCompleteWrapper>
                )}
                {it.kind === 'FLASHCARDS' && (()=>{
                  const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards) ? it.data.cards : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                  const storageKey = `sn-flash:${lesson.id}:${it.id}`
                  return (
                    <ToolContainer variant="flashcards" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <FlashcardsViewer cards={cards} storageKey={storageKey} />
                    </ToolContainer>
                  )
                })()}
                {it.kind === 'QUIZ' && (()=>{
                  const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                  if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                  const storageKey = `sn-quiz:${lesson.id}:${it.id}`
                  const spMode = typeof searchParams?.mode === 'string' && (searchParams?.mode === 'review' || searchParams?.mode === 'practice') ? searchParams.mode : undefined
                  return (
                    <ToolContainer variant="quiz" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <QuizViewer items={items} storageKey={storageKey} initialMode={spMode as any} />
                    </ToolContainer>
                  )
                })()}
                {it.kind === 'IMAGE' && (()=>{
                  const url = it.data?.url as string | undefined
                  const gradient = it.data?.gradient as string | undefined
                  const fit = (it.data?.fit as 'contain'|'cover'|'fill') || 'contain'
                  const alt = (it.data?.alt as string) || 'image'
                  const caption = it.data?.caption as string | undefined
                  return (
                    <AutoCompleteWrapper lessonId={lesson.id} blockId={it.id}>
                      <ToolContainer variant="image" bodyBgColor={it.data?.bgColor as string | undefined}>
                        <ImageViewer url={url} gradient={gradient} fit={fit} alt={alt} caption={caption} variant="canvas" />
                      </ToolContainer>
                    </AutoCompleteWrapper>
                  )
                })()}
                {it.kind === 'CROSSWORD' && (()=>{
                  const rows = Number(it.data?.rows || 10)
                  const cols = Number(it.data?.cols || 10)
                  const words = Array.isArray(it.data?.words) ? it.data.words : []
                  if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                  const storageKey = `sn-crossword:${lesson.id}:${it.id}`
                  return (
                    <ToolContainer variant="crossword" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <CrosswordViewer words={words} storageKey={storageKey} />
                    </ToolContainer>
                  )
                })()}
                </div>
              ))}
                </div>
            </div>
          </div>
        </div>
        <div className="md:hidden">
          {sortByLayer(items).map((it: any) => (
            <div key={it.id} className="rounded-3xl p-2 mb-4">
              {it.kind === 'TEXT' && (
                <AutoCompleteWrapper lessonId={lesson.id} blockId={it.id}>
                  <ToolContainer variant="text" bodyBgColor={it.data?.bgColor as string | undefined}>
                    <div className="richtext">
                      {it.data?.html ? (
                        <div dangerouslySetInnerHTML={{ __html: it.data.html }} />
                      ) : (
                        <div className="whitespace-pre-wrap">{it.data?.text || 'Text block'}</div>
                      )}
                    </div>
                  </ToolContainer>
                </AutoCompleteWrapper>
              )}
              {it.kind === 'FLASHCARDS' && (()=> {
                const cards: Array<{q:string;a:string}> = Array.isArray(it.data?.cards) ? it.data.cards : (it.data?.q || it.data?.a ? [{ q: it.data.q || '', a: it.data.a || '' }] : [])
                const storageKey = `sn-flash:${lesson.id}:${it.id}`
                return (
                  <ToolContainer variant="flashcards" bodyBgColor={it.data?.bgColor as string | undefined}>
                    <FlashcardsViewer cards={cards} storageKey={storageKey} />
                  </ToolContainer>
                )
              })()}
              {it.kind === 'QUIZ' && (()=> {
                const items: ViewerQuizItem[] = Array.isArray(it.data?.items) ? it.data.items : []
                if (items.length===0) return <div className="text-gray-600">Quiz not available</div>
                const storageKey = `sn-quiz:${lesson.id}:${it.id}`
                const spMode = typeof searchParams?.mode === 'string' && (searchParams?.mode === 'review' || searchParams?.mode === 'practice') ? searchParams.mode : undefined
                return (
                  <ToolContainer variant="quiz" bodyBgColor={it.data?.bgColor as string | undefined}>
                    <QuizViewer items={items} storageKey={storageKey} initialMode={spMode as any} />
                  </ToolContainer>
                )
              })()}
              {it.kind === 'CROSSWORD' && (()=> {
                const rows = Number(it.data?.rows || 10)
                const cols = Number(it.data?.cols || 10)
                const words = Array.isArray(it.data?.words) ? it.data.words : []
                if (!words.length) return <div className="text-gray-600">Crossword not available</div>
                const storageKey = `sn-crossword:${lesson.id}:${it.id}`
                return (
                  <ToolContainer variant="crossword" bodyBgColor={it.data?.bgColor as string | undefined}>
                    <CrosswordViewer words={words} storageKey={storageKey} />
                  </ToolContainer>
                )
              })()}
              {it.kind === 'IMAGE' && (()=> {
                const url = it.data?.url as string | undefined
                const gradient = it.data?.gradient as string | undefined
                const fit = (it.data?.fit as 'contain'|'cover'|'fill') || 'contain'
                const alt = (it.data?.alt as string) || 'image'
                const caption = it.data?.caption as string | undefined
                return (
                  <AutoCompleteWrapper lessonId={lesson.id} blockId={it.id}>
                    <ToolContainer variant="image" bodyBgColor={it.data?.bgColor as string | undefined}>
                      <ImageViewer url={url} gradient={gradient} fit={fit} alt={alt} caption={caption} variant="stacked" />
                    </ToolContainer>
                  </AutoCompleteWrapper>
                )
              })()}
            </div>
          ))}
        </div>
  </main>
    </VantaBackground>
  )
}
