"use client"

import { useEffect, useState, Suspense } from "react"
import { Navbar } from "@/components/layout/navbar"
import { VantaBackground } from "@/components/vanta-background"
import { useSearchParams } from "next/navigation"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import { QuizViewer, type QuizItem as ViewerQuizItem } from "@/components/quiz-viewer"
import { CrosswordViewer } from "@/components/crossword-viewer"
import { DESIGN_SIZE, sortByLayer } from "@/lib/layout"
import { StudentToolCard } from "@/components/student-tool-card"

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
    <VantaBackground effect={hydrated ? (parsed?.meta?.vanta || 'globe') : 'globe'}>
      <Navbar />
      <main className="px-4">
        <div className="relative mb-6">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-sky-400/60 via-emerald-400/60 to-indigo-400/60 blur" />
          <div className="relative bg-white/75 backdrop-blur-md border rounded-3xl p-6">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent mb-1">{hydrated ? (parsed?.meta?.title || 'Lesson Preview') : 'Lesson Preview'}</h1>
            <p className="text-gray-600">{hydrated ? (
              <>Topic: {parsed?.meta?.topic || 'N/A'} • Grade {parsed?.meta?.grade ?? 'N/A'}</>
            ) : (
              <>Topic: N/A • Grade N/A</>
            )}</p>
          </div>
        </div>
        {!hydrated ? (
          <div className="text-sm text-gray-500">Loading preview…</div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="relative mx-auto my-6 rounded-xl border overflow-hidden bg-black/5" style={{ width: 1280, minHeight: canvasH }}>
                {parsed?.items?.map((it: any) => (
                  <div
                    key={it.id}
                    className="absolute p-2"
                    style={{ left: it.x||0, top: it.y||0, width: Math.max(240, it.w||600), height: Math.max(160, it.h||220), overflow: 'auto', zIndex: it.z ?? 0 }}
                  >
                {it.kind === 'TEXT' && (
                  <StudentToolCard variant="text">
                    <div className="prose max-w-none prose-h1:mt-0 prose-h1:mb-2 prose-h2:mt-3 prose-h2:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-a:text-blue-600 hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
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
                  const urlMode = sp.get('flash')
                  const initialMode = urlMode === 'flip' || urlMode === 'quiz' ? (urlMode as any) : undefined
                  return (
                    <StudentToolCard variant="flashcards">
                      <FlashcardsViewer cards={cards} storageKey={storageKey} initialMode={initialMode} />
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
                    <StudentToolCard variant="quiz">
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
                    <StudentToolCard variant="image">
                      <figure className="w-full h-full">
                        {gradient ? (
                          <div className="w-full h-[calc(100%-1.5rem)] rounded border border-gray-200" style={{ backgroundImage: gradient, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        ) : url ? (
                          <img src={url} alt={alt} className="w-full h-[calc(100%-1.5rem)] rounded border border-gray-200 object-center" style={{ objectFit: fit }} />
                        ) : (
                          <div className="w-full h-[calc(100%-1.5rem)] rounded border border-dashed border-gray-300 grid place-items-center text-gray-500 text-sm">No image</div>
                        )}
                        {caption && <figcaption className="text-xs text-gray-600 mt-1">{caption}</figcaption>}
                      </figure>
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
                    <StudentToolCard variant="crossword">
                      <CrosswordViewer rows={rows} cols={cols} words={words} storageKey={storageKey} />
                    </StudentToolCard>
                  )
                })()}
                  </div>
                ))}
              </div>
            </div>
            <div className="md:hidden">
              {sortByLayer(parsed?.items || []).map((it: any) => (
                <div key={it.id} className="rounded-3xl p-2 mb-4">
                  {it.kind === 'TEXT' && (
                    <StudentToolCard variant="text">
                      <div className="prose max-w-none prose-h1:mt-0 prose-h1:mb-2 prose-h2:mt-3 prose-h2:mb-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-a:text-blue-600 hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
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
                    const urlMode = sp.get('flash')
                    const initialMode = urlMode === 'flip' || urlMode === 'quiz' ? (urlMode as any) : undefined
                    return (
                      <StudentToolCard variant="flashcards">
                        <FlashcardsViewer cards={cards} storageKey={storageKey} initialMode={initialMode} />
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
                      <StudentToolCard variant="quiz">
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
                      <StudentToolCard variant="crossword">
                        <CrosswordViewer rows={rows} cols={cols} words={words} storageKey={storageKey} />
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
                        <figure>
                          {gradient ? (
                            <div className="w-full h-48 rounded border border-gray-200" style={{ backgroundImage: gradient, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                          ) : url ? (
                            <img src={url} alt={alt} className="w-full rounded border border-gray-200" style={{ objectFit: fit }} />
                          ) : (
                            <div className="w-full h-48 rounded border border-dashed border-gray-300 grid place-items-center text-gray-500 text-sm">No image</div>
                          )}
                          {caption && <figcaption className="text-xs text-gray-600 mt-1">{caption}</figcaption>}
                        </figure>
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
