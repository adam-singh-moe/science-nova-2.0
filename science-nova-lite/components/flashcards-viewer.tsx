"use client"

import React from "react"

export type Card = { q: string; a: string }

type Mode = 'flip' | 'quiz'

export function FlashcardsViewer({ cards, storageKey, initialMode }: { cards: Card[]; storageKey?: string; initialMode?: Mode }) {
  const [index, setIndex] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [mode, setMode] = React.useState<Mode>(initialMode || 'flip')
  const [quizState, setQuizState] = React.useState<{ revealed: boolean; correct: Record<number, boolean> }>({ revealed: false, correct: {} })
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.index === 'number') setIndex(Math.max(0, Math.min(cards.length - 1, parsed.index)))
          if (typeof parsed.mode === 'string') setMode(parsed.mode)
          if (typeof parsed.flipped === 'boolean') setFlipped(parsed.flipped)
          if (parsed.quizState) setQuizState(parsed.quizState)
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
    try { localStorage.setItem(storageKey, JSON.stringify({ index, mode, flipped, quizState })) } catch {}
  }, [index, mode, flipped, quizState, storageKey])

  function prev() { setIndex(i => Math.max(0, i - 1)); setFlipped(false) }
  function next() { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false) }
  function resetQuiz() { setQuizState({ revealed: false, correct: {} }); setIndex(0); setFlipped(false) }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'f' || e.key === 'F') { setFlipped(f=>!f) }
  if (e.key === '[' || e.key === 'ArrowLeft') { prev() }
  if (e.key === ']' || e.key === 'ArrowRight') { next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const card = cards[index]
  const total = cards.length
  const correctCount = Object.values(quizState.correct).filter(Boolean).length

  const progressPct = total ? Math.round(((index + 1) / total) * 100) : 0

  return (
    <div className={`space-y-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      <div>
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-lg border bg-white/80 backdrop-blur shadow-sm overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm transition-colors ${mode==='flip' ? 'bg-fuchsia-600 text-white' : 'hover:bg-fuchsia-50/40'}`}
              onClick={()=>setMode('flip')}
            >Flip mode</button>
            <button
              className={`px-3 py-1.5 text-sm transition-colors ${mode==='quiz' ? 'bg-fuchsia-600 text-white' : 'hover:bg-fuchsia-50/40'}`}
              onClick={()=>{ setMode('quiz'); resetQuiz() }}
            >Quiz mode</button>
          </div>
          {mode==='quiz' && (
            <div className="text-sm text-gray-700">Score: {correctCount}/{total} ({total? Math.round(correctCount/total*100):0}%)</div>
          )}
        </div>
        {total > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-fuchsia-500" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>

      {card ? (
        <div className="rounded-xl border bg-white/95 p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">Card {index+1} of {total}</div>
          {mode==='flip' ? (
            <div className="cursor-pointer select-none" onClick={()=>setFlipped(f=>!f)}>
              <div className="font-semibold mb-2">Flip the card</div>
              <div style={{ perspective: '1200px' }}>
                <div
                  className="relative rounded-xl border bg-white shadow-md hover:shadow-lg transition-shadow"
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
          ) : (
            <div>
              <div className="font-semibold mb-2">{card.q || 'Question'}</div>
              {!quizState.revealed ? (
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded border bg-white hover:bg-fuchsia-50/60" onClick={()=>setQuizState(s=>({ ...s, revealed: true }))}>Show answer</button>
                  <button className="px-3 py-1.5 rounded border bg-white hover:bg-green-50" onClick={()=>{ setQuizState(s=>({ ...s, correct: { ...s.correct, [index]: true } })); next() }}>Mark correct</button>
                  <button className="px-3 py-1.5 rounded border bg-white hover:bg-rose-50" onClick={()=>{ setQuizState(s=>({ ...s, correct: { ...s.correct, [index]: false } })); next() }}>Mark incorrect</button>
                </div>
              ) : (
                <div>
                  <div className="text-gray-800">Answer: {card.a || '—'}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded border bg-white hover:bg-fuchsia-50/60" onClick={()=>setQuizState(s=>({ ...s, revealed: false }))}>Hide</button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button className="px-3 py-1.5 rounded border bg-white hover:bg-fuchsia-50/60 disabled:opacity-50" onClick={prev} disabled={index===0}>Prev</button>
            <button className="px-3 py-1.5 rounded border bg-white hover:bg-fuchsia-50/60 disabled:opacity-50" onClick={next} disabled={index===total-1}>Next</button>
            <button className="ml-auto px-3 py-1.5 rounded border bg-white hover:bg-fuchsia-50/60" onClick={()=>{ setIndex(0); setFlipped(false) }}>Restart</button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No flashcards</div>
      )}
    </div>
  )
}
