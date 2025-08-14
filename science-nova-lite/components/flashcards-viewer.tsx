"use client"

import React from "react"

export type Card = { q: string; a: string }

type Mode = 'flip' | 'quiz'

export function FlashcardsViewer({ cards, storageKey, initialMode }: { cards: Card[]; storageKey?: string; initialMode?: Mode }) {
  const [index, setIndex] = React.useState(0)
  const [flipped, setFlipped] = React.useState(false)
  const [mode, setMode] = React.useState<Mode>(initialMode || 'flip')
  const [quizState, setQuizState] = React.useState<{ revealed: boolean; correct: Record<number, boolean> }>({ revealed: false, correct: {} })

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
    if (!storageKey) return
    try { localStorage.setItem(storageKey, JSON.stringify({ index, mode, flipped, quizState })) } catch {}
  }, [index, mode, flipped, quizState, storageKey])

  function prev() { setIndex(i => Math.max(0, i - 1)); setFlipped(false) }
  function next() { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false) }
  function resetQuiz() { setQuizState({ revealed: false, correct: {} }); setIndex(0); setFlipped(false) }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'f' || e.key === 'F') { setFlipped(f=>!f) }
      if (e.key === '[') { prev() }
      if (e.key === ']') { next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const card = cards[index]
  const total = cards.length
  const correctCount = Object.values(quizState.correct).filter(Boolean).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded border overflow-hidden">
          <button className={`px-3 py-1 text-sm ${mode==='flip' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={()=>setMode('flip')}>Flip mode</button>
          <button className={`px-3 py-1 text-sm ${mode==='quiz' ? 'bg-blue-600 text-white' : 'bg-white'}`} onClick={()=>{ setMode('quiz'); resetQuiz() }}>Quiz mode</button>
        </div>
        {mode==='quiz' && (
          <div className="text-sm text-gray-700">Score: {correctCount}/{total} ({total? Math.round(correctCount/total*100):0}%)</div>
        )}
      </div>

      {card ? (
        <div className="rounded border bg-white/95 p-4">
          <div className="text-sm text-gray-500 mb-1">Card {index+1} of {total}</div>
          {mode==='flip' ? (
            <div className="cursor-pointer select-none" onClick={()=>setFlipped(f=>!f)}>
              <div className="font-semibold mb-2">{flipped ? 'Answer' : 'Question'}</div>
              <div className="text-gray-800">{flipped ? (card.a || '—') : (card.q || '—')}</div>
              <div className="mt-2 text-xs text-gray-500">Click to flip</div>
            </div>
          ) : (
            <div>
              <div className="font-semibold mb-2">{card.q || 'Question'}</div>
              {!quizState.revealed ? (
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={()=>setQuizState(s=>({ ...s, revealed: true }))}>Show answer</button>
                  <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={()=>{ setQuizState(s=>({ ...s, correct: { ...s.correct, [index]: true } })); next() }}>Mark correct</button>
                  <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={()=>{ setQuizState(s=>({ ...s, correct: { ...s.correct, [index]: false } })); next() }}>Mark incorrect</button>
                </div>
              ) : (
                <div>
                  <div className="text-gray-800">Answer: {card.a || '—'}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={()=>setQuizState(s=>({ ...s, revealed: false }))}>Hide</button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={prev} disabled={index===0}>Prev</button>
            <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={next} disabled={index===total-1}>Next</button>
            <button className="ml-auto px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={()=>{ setIndex(0); setFlipped(false) }}>Restart</button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No flashcards</div>
      )}
    </div>
  )
}
