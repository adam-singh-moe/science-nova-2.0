"use client"

import React from "react"
import { postLessonEvent } from '@/lib/lessonTelemetry'
import { setBlockDone } from '@/lib/progress'

export type Card = { q: string; a: string }

export function FlashcardsViewer({ cards, storageKey }: { cards: Card[]; storageKey?: string }) {
  const [index, setIndex] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const accent = 'var(--sn-accent, #c026d3)'

  React.useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.index === 'number') setIndex(Math.max(0, Math.min(cards.length - 1, parsed.index)))
          if (typeof parsed.flipped === 'boolean') setFlipped(parsed.flipped)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, cards.length])

  React.useEffect(() => {
    // Enable entrance animation once mounted on client
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  React.useEffect(() => {
    if (!storageKey) return
    try { localStorage.setItem(storageKey, JSON.stringify({ index, flipped })) } catch {}
  }, [index, flipped, storageKey])

  function prev() { setIndex(i => Math.max(0, i - 1)); setFlipped(false) }
  function next() { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false) }
  function reset() { setIndex(0); setFlipped(false) }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!containerRef.current) return
      // Only act when focus is within the flashcards area to avoid global capture
      const root = containerRef.current
      const active = document.activeElement
      const within = active ? root.contains(active) : true
      if (!within) return
      if (e.key === 'f' || e.key === 'F' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f=>!f) }
      if (e.key === '[' || e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      if (e.key === ']' || e.key === 'ArrowRight') { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const card = cards[index]
  const total = cards.length
  const progressPct = total ? Math.round(((index + 1) / total) * 100) : 0

  // Emit flip and cycle telemetry
  React.useEffect(() => {
    if (!storageKey) return
    try {
      const [_, lessonId, blockId] = (storageKey || '').split(':')
      if (lessonId && blockId) {
        postLessonEvent({ lessonId, blockId, toolKind: 'FLASHCARDS', eventType: 'flash_flip', data: { index } })
        if (progressPct === 100 && total > 0) {
          postLessonEvent({ lessonId, blockId, toolKind: 'FLASHCARDS', eventType: 'flash_cycle', data: { cards: total } })
          // Mark block as completed when user reaches the last card
          setBlockDone({ lessonId, blockId }, true)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  return (
    <div ref={containerRef} className={`space-y-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      <div>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-lg border bg-white/80 backdrop-blur shadow-sm overflow-hidden px-3 py-1.5">
            <span className="text-sm font-medium text-gray-700">Flip mode</span>
            {total > 0 && <span className="text-xs text-gray-500">{index+1}/{total}</span>}
          </div>
        </div>
        {total > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full" style={{ width: `${progressPct}%`, backgroundColor: accent }} />
          </div>
        )}
      </div>

      {card ? (
        <div className="rounded-xl border bg-white/95 p-4 shadow-sm" aria-live="polite">
          <div className="text-sm text-gray-500 mb-1">Card {index+1} of {total}</div>
          <div
            className="cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            aria-label={flipped ? 'Show question' : 'Show answer'}
            onClick={()=>setFlipped(f=>!f)}
            onKeyDown={(e)=>{
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f=>!f) }
            }}
          >
              <div className="font-semibold mb-2">Flip the card</div>
              <div style={{ perspective: '1200px' }}>
                <div
                  className="relative rounded-xl border bg-white shadow-md hover:shadow-lg transition-shadow motion-reduce:transition-none"
                  style={{ transformStyle: 'preserve-3d', transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: 200 }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center p-6"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Question</div>
                      <div className="text-gray-800">{card.q || '—'}</div>
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 flex items-center justify-center p-6"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="text-center">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Answer</div>
                      <div className="text-gray-800">{card.a || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Click or press “F” to flip • Use [ / ] or Arrow keys to navigate</div>
            </div>
          <div className="mt-3 flex items-center gap-2">
            <button className="px-3 py-1.5 rounded border bg-white text-gray-700 hover:bg-fuchsia-50/60 hover:text-gray-800 disabled:opacity-50 disabled:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: accent }} onClick={prev} disabled={index===0}>Prev</button>
            <button className="px-3 py-1.5 rounded border bg-white text-gray-700 hover:bg-fuchsia-50/60 hover:text-gray-800 disabled:opacity-50 disabled:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: accent }} onClick={next} disabled={index===total-1}>Next</button>
            <button className="ml-auto px-3 py-1.5 rounded border bg-white text-gray-700 hover:bg-fuchsia-50/60 hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: accent }} onClick={reset}>Restart</button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No flashcards</div>
      )}
    </div>
  )
}
