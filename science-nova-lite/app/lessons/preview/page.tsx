"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { VantaBackground } from "@/components/vanta-background"

export default function LessonPreview() {
  const [parsed, setParsed] = useState<any>(null)
  const [hydrated, setHydrated] = useState(false)

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

  // Compute a canvas height once hydrated
  const canvasHeight = hydrated && Array.isArray(parsed?.items) && parsed.items.length
    ? Math.max(...parsed.items.map((it: any) => (Number(it.y)||0) + (Number(it.h)||0))) + 120
    : 600

  return (
    <VantaBackground effect={hydrated ? (parsed?.meta?.vanta || 'globe') : 'globe'}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-1">{hydrated ? (parsed?.meta?.title || 'Lesson Preview') : 'Lesson Preview'}</h1>
        <p className="text-gray-600 mb-6">{hydrated ? (
          <>Topic: {parsed?.meta?.topic || 'N/A'} • Grade {parsed?.meta?.grade ?? 'N/A'}</>
        ) : (
          <>Topic: N/A • Grade N/A</>
        )}</p>
        {!hydrated ? (
          <div className="text-sm text-gray-500">Loading preview…</div>
        ) : (
          <div className="relative mx-auto my-6 rounded-xl max-w-[1200px] border overflow-hidden" style={{ minHeight: canvasHeight }}>
          {parsed?.items?.map((it: any) => (
            <div
              key={it.id}
              className="absolute rounded-xl p-4 bg-white/80 backdrop-blur border shadow-sm"
              style={{ left: it.x||0, top: it.y||0, width: it.w||600, height: it.h||220, overflow: 'auto' }}
            >
              {it.kind === 'TEXT' && <p className="prose max-w-none whitespace-pre-wrap">{it.data?.text}</p>}
              {it.kind === 'FLASHCARDS' && (() => {
                const cards = Array.isArray(it.data?.cards) ? it.data.cards : null
                if (cards) {
                  return (
                    <div>
                      <div className="font-semibold">Flashcards ({cards.length})</div>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        {cards.slice(0, 3).map((c: any, idx: number) => (
                          <li key={idx} className="mb-1"><span className="font-medium">Q:</span> {c.q || <em>empty</em>} <span className="ml-2 font-medium">A:</span> {c.a || <em>empty</em>}</li>
                        ))}
                      </ul>
                      {cards.length > 3 && <div className="text-xs text-gray-500 mt-1">+{cards.length - 3} more…</div>}
                    </div>
                  )
                }
                // legacy one-off fields
                if (it.data?.q || it.data?.a) {
                  return (
                    <div>
                      <div className="font-semibold">Flashcard</div>
                      <div className="text-sm text-gray-700">Q: {it.data?.q}</div>
                      <div className="text-sm text-gray-700">A: {it.data?.a}</div>
                    </div>
                  )
                }
                return <div className="text-sm text-gray-500">No flashcards configured</div>
              })()}
              {it.kind === 'QUIZ' && (() => {
                const items = Array.isArray(it.data?.items) ? it.data.items : []
                return (
                  <div className="text-gray-700 text-sm">
                    <div className="font-semibold mb-1">Quiz ({items.length} items)</div>
                    <ul className="list-decimal pl-5">
                      {items.slice(0, 2).map((q: any, i: number) => (
                        <li key={i} className="mb-1">{q.question || <em>Untitled question</em>} <span className="text-xs text-gray-500">[{q.type}]</span></li>
                      ))}
                    </ul>
                    {items.length > 2 && <div className="text-xs text-gray-500 mt-1">+{items.length - 2} more…</div>}
                  </div>
                )
              })()}
              {it.kind === 'CROSSWORD' && (() => {
                const rows = Number(it.data?.rows || 10)
                const cols = Number(it.data?.cols || 10)
                const words = Array.isArray(it.data?.words) ? it.data.words : []
                return (
                  <div className="text-gray-700 text-sm">
                    <div className="font-semibold">Crossword {rows}×{cols}</div>
                    {words.length === 0 ? (
                      <div className="text-sm text-gray-500">No words configured</div>
                    ) : (
                      <ul className="list-disc pl-5">
                        {words.map((w: any) => (
                          <li key={w.id}>
                            <span className="font-medium">{w.answer}</span>
                            {w.clue ? <span className="text-gray-600"> — {w.clue}</span> : null}
                            <span className="text-xs text-gray-500"> @{w.row},{w.col} {w.dir}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
        )}
      </main>
    </VantaBackground>
  )
}
