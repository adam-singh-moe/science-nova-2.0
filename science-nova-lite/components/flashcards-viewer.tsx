"use client"

import React from "react"
import { postLessonEvent } from '@/lib/lessonTelemetry'
import { setBlockDone } from '@/lib/progress'

export type Card = { q: string; a: string }

export function FlashcardsViewer({ cards, storageKey, contentMeta }: { cards: Card[]; storageKey?: string; contentMeta?: { entryId: string; topicId: string; category: string; subtype: string } }) {
  const [index, setIndex] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

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
    // content completion telemetry when reaching end
    if (progressPct === 100 && total > 0 && contentMeta && storageKey) {
      try {
        const [_, lessonId, blockId] = (storageKey || '').split(':')
        if (lessonId && blockId) {
          postLessonEvent({ 
            lessonId, 
            blockId, 
            toolKind: 'FLASHCARDS', 
            eventType: 'content_complete', 
            data: { 
              cards: total, 
              entryId: contentMeta.entryId,
              topicId: contentMeta.topicId,
              category: contentMeta.category,
              subtype: contentMeta.subtype
            } 
          })
        }
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  return (
    <div ref={containerRef} className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      {/* Enhanced Header with Vibrant Neon Colors */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-white/[0.15] via-white/[0.08] to-white/[0.12] backdrop-blur-xl border border-pink-400/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 p-4 rounded-2xl backdrop-blur-sm border border-pink-400/40 shadow-2xl">
                  <span className="text-white text-2xl font-bold drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">🎴</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">Flashcards</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70 font-medium">Study Mode</span>
                  {total > 0 && (
                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/30 backdrop-blur-sm shadow-lg">
                      <span className="text-sm font-bold text-white/90">{index+1}/{total}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="text-white font-bold text-3xl bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">
                {progressPct}%
              </div>
              <div className="text-sm text-white/70 font-medium">Complete</div>
            </div>
          </div>

          {/* Enhanced Progress Bar with Neon Effects */}
          {total > 0 && (
            <div className="relative">
              <div className="h-4 w-full rounded-full bg-slate-800/80 border border-pink-400/30 overflow-hidden backdrop-blur-sm shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 via-purple-400 via-indigo-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-lg relative"
                  style={{ width: `${progressPct}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-300/50 via-purple-300/50 to-cyan-300/50 rounded-full blur-sm animate-pulse"></div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-cyan-400/30 blur-lg"></div>
            </div>
          )}
        </div>
      </div>

      {card ? (
        <div className="relative group">
          {/* Card Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
          
          <div className="relative bg-gradient-to-br from-white/[0.15] via-white/[0.08] to-white/[0.12] backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
            {/* Card Counter with Enhanced Styling */}
            <div className="flex items-center justify-between mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/30 backdrop-blur-sm shadow-lg">
                <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-sm font-bold text-white/90">Card {index+1} of {total}</span>
              </div>
              <div className="text-sm text-white/70 font-medium">
                {flipped ? "Answer Side" : "Question Side"}
              </div>
            </div>

            {/* Enhanced Flip Card with Vibrant Instruction */}
            <div
              className="cursor-pointer select-none group/card"
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label={flipped ? 'Show question' : 'Show answer'}
              onClick={()=>setFlipped(f=>!f)}
              onKeyDown={(e)=>{
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f=>!f) }
              }}
            >
              <div className="mb-6">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <span className="text-white/90 font-bold text-lg">Click to flip card</span>
                  <span className="text-2xl animate-spin-slow">🔄</span>
                </div>
              </div>
              
              <div style={{ perspective: '1200px' }}>
                <div
                  className="relative rounded-2xl border border-white/30 bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-white/[0.12] shadow-2xl hover:shadow-3xl group-hover/card:border-white/40 transition-all duration-300"
                  style={{ 
                    transformStyle: 'preserve-3d', 
                    transition: 'transform 700ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
                    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', 
                    minHeight: 280 
                  }}
                >
                  {/* Question Side with Enhanced Colors */}
                  <div
                    className="absolute inset-0 flex items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-indigo-500/20 backdrop-blur-sm"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center space-y-6">
                      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/40 backdrop-blur-sm shadow-xl">
                        <span className="text-sm uppercase tracking-wide text-cyan-200 font-bold">Question</span>
                        <span className="text-cyan-300 text-xl">❓</span>
                      </div>
                      <div className="text-white text-2xl font-bold leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                        {card.q || '—'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer Side with Enhanced Colors */}
                  <div
                    className="absolute inset-0 flex items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/15 to-emerald-500/20 backdrop-blur-sm"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="text-center space-y-6">
                      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/30 to-emerald-500/30 border border-pink-400/40 backdrop-blur-sm shadow-xl">
                        <span className="text-sm uppercase tracking-wide text-pink-200 font-bold">Answer</span>
                        <span className="text-pink-300 text-xl">💡</span>
                      </div>
                      <div className="text-white text-2xl font-bold leading-relaxed drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                        {card.a || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Controls with Vibrant Colors */}
            <div className="mt-10 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-slate-600/20 to-slate-700/20 border border-slate-500/30 backdrop-blur-sm shadow-lg">
                  <span className="text-sm text-white/70 font-medium">Press</span>
                  <kbd className="px-3 py-2 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded-lg text-sm text-white/90 font-bold border border-pink-400/30 shadow-lg">F</kbd>
                  <span className="text-sm text-white/70 font-medium">to flip •</span>
                  <kbd className="px-3 py-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg text-sm text-white/90 font-bold border border-cyan-400/30 shadow-lg">←</kbd>
                  <kbd className="px-3 py-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg text-sm text-white/90 font-bold border border-cyan-400/30 shadow-lg">→</kbd>
                  <span className="text-sm text-white/70 font-medium">to navigate</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button 
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all duration-300 border border-cyan-400/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-lg" 
                  onClick={prev} 
                  disabled={index===0}
                >
                  ← Previous
                </button>

                <button 
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-slate-600/80 to-slate-700/80 hover:from-slate-600 hover:to-slate-700 text-white font-bold transition-all duration-300 border border-slate-500/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 text-lg"
                  onClick={reset}
                >
                  🔄 Restart
                </button>

                <button 
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-500 hover:to-purple-500 text-white font-bold transition-all duration-300 border border-pink-400/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-lg" 
                  onClick={next} 
                  disabled={index===total-1}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="bg-gradient-to-br from-white/[0.15] via-white/[0.08] to-white/[0.12] backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl text-center">
            <div className="mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <p className="text-white/80 font-medium">No flashcards available</p>
            <p className="text-white/60 text-sm mt-2">Check back later for new study materials!</p>
          </div>
        </div>
      )}
    </div>
  )
}