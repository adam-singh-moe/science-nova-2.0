"use client"

import React from "react"
import { postLessonEvent } from '@/lib/lessonTelemetry'
import { setBlockDone } from '@/lib/progress'

export type CWWord = {
  id: string
  row: number
  col: number
  dir: "across" | "down"
  answer: string
  clue?: string
}

export function CrosswordViewer({
  words,
  storageKey,
}: {
  words: CWWord[]
  storageKey?: string
}) {
  // Auto-determine grid size based on word count
  const isLarge = words.length > 15
  const rows = isLarge ? 24 : 15
  const cols = isLarge ? 24 : 15
  
  const [responses, setResponses] = React.useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)
  const [focused, setFocused] = React.useState<{ r: number; c: number } | null>(null)
  const [mounted, setMounted] = React.useState(false)

  // Build cell map
  const cells = React.useMemo(() => {
    const map = new Map<string, { letter: string; words: string[] }>()
    for (const w of words) {
      const ans = (w.answer || "").toUpperCase()
      for (let k = 0; k < ans.length; k++) {
        const r = w.dir === "down" ? w.row + k : w.row
        const c = w.dir === "across" ? w.col + k : w.col
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue
        const key = `${r},${c}`
        const prev = map.get(key)
        const ch = ans[k]
        if (prev) {
          // Keep the letter if consistent; otherwise mark as blank (conflict)
          map.set(key, {
            letter: prev.letter === ch ? ch : "",
            words: Array.from(new Set([...prev.words, w.id])),
          })
        } else {
          map.set(key, { letter: ch, words: [w.id] })
        }
      }
    }
    return map
  }, [rows, cols, words])

  const grid: Array<Array<null | { r: number; c: number; letter: string; words: string[] }>> = []
  for (let r = 0; r < rows; r++) {
    const row: Array<null | { r: number; c: number; letter: string; words: string[] }> = []
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`
      const v = cells.get(key)
      row.push(v ? { r, c, letter: v.letter, words: v.words } : null)
    }
    grid.push(row)
  }

  // persistence
  React.useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === "object") {
          if (parsed.responses && typeof parsed.responses === "object") setResponses(parsed.responses)
          if (typeof parsed.submitted === "boolean") setSubmitted(parsed.submitted)
        }
      }
    } catch {}
  }, [storageKey])

  React.useEffect(() => {
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ responses, submitted }))
    } catch {}
  }, [responses, submitted, storageKey])

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const inputRef = React.useRef<HTMLInputElement>(null)
  const accent = 'var(--sn-accent, #10b981)'

  function cellKey(r: number, c: number) {
    return `r${r}c${c}`
  }

  function onInput(r: number, c: number, val: string) {
    const ch = (val || "").slice(-1).toUpperCase().replace(/[^A-Z]/g, "")
    setResponses((prev) => ({ ...prev, [cellKey(r, c)]: ch }))
  }

  function currentWord(): CWWord | undefined {
    if (!selectedId) return undefined
    return words.find((w) => w.id === selectedId)
  }

  function selectByCell(r: number, c: number) {
    const v = cells.get(`${r},${c}`)
    if (!v) return
    // prefer a word matching recent selection direction
    const curr = currentWord()
    const pick = curr && v.words.includes(curr.id) ? curr.id : v.words[0]
    setSelectedId(pick || null)
  }

  function cellClasses(r: number, c: number) {
    const v = cells.get(`${r},${c}`)
    if (!v) return "bg-transparent" // blocked/empty
    const inSelected = selectedId ? v.words.includes(selectedId) : false
    return inSelected ? "bg-white shadow-md" : "bg-white"
  }

  function moveFocus(r: number, c: number, dir: "left" | "right" | "up" | "down") {
    const delta = dir === "left" ? [0, -1] : dir === "right" ? [0, 1] : dir === "up" ? [-1, 0] : [1, 0]
    let nr = r + delta[0]
    let nc = c + delta[1]
    while (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      if (cells.get(`${nr},${nc}`)) {
        selectByCell(nr, nc)
        break
      }
      nr += delta[0]
      nc += delta[1]
    }
  }

  function checkWord(w: CWWord) {
    const ans = (w.answer || "").toUpperCase()
    for (let k = 0; k < ans.length; k++) {
      const r = w.dir === "down" ? w.row + k : w.row
      const c = w.dir === "across" ? w.col + k : w.col
      const key = cellKey(r, c)
      const correct = responses[key] === ans[k]
      // Use a marker suffix for checked state? Keep it simple: no side effect other than relying on submitted state.
    }
  }

  function revealWord(w: CWWord) {
    const ans = (w.answer || "").toUpperCase()
    const next: Record<string, string> = { ...responses }
    for (let k = 0; k < ans.length; k++) {
      const r = w.dir === "down" ? w.row + k : w.row
      const c = w.dir === "across" ? w.col + k : w.col
      next[cellKey(r, c)] = ans[k]
    }
    setResponses(next)
    // emit reveal
    try {
      const [_, lessonId, blockId] = (storageKey || '').split(':')
      if (lessonId && blockId) postLessonEvent({ lessonId, blockId, toolKind: 'CROSSWORD', eventType: 'crossword_reveal', data: { wordId: w.id } })
    } catch {}
  }

  function resetAll() {
    setResponses({})
    setSubmitted(false)
    if (storageKey) {
      try { localStorage.removeItem(storageKey) } catch {}
    }
  }

  function isCorrectCell(r: number, c: number) {
    const v = cells.get(`${r},${c}`)
    if (!v) return false
    const key = cellKey(r, c)
    const expected = v.letter
    if (!expected) return false
    return (responses[key] || "") === expected
  }

  function isCompletedWord(w: CWWord) {
    const ans = (w.answer || "").toUpperCase()
    for (let k = 0; k < ans.length; k++) {
      const r = w.dir === "down" ? w.row + k : w.row
      const c = w.dir === "across" ? w.col + k : w.col
      const key = cellKey(r, c)
      if ((responses[key] || "") !== ans[k]) return false
    }
    return true
  }

  const selected = currentWord()

  // Fixed cell size for consistent appearance - smaller for better fit in preview
  const cellSize = isLarge ? 'w-4 h-4 text-xs' : 'w-5 h-5 text-xs'

  return (
    <div className={`grid gap-4 md:grid-cols-[1fr_280px] transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      <div className="flex flex-col items-center min-w-0">
        <div className="bg-gray-700 rounded-lg p-2 max-w-full overflow-auto" role="group" aria-label="Crossword grid">
          <div className="grid gap-0 mx-auto" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
            {Array.from({ length: rows * cols }, (_, index) => {
              const r = Math.floor(index / cols)
              const c = index % cols
              const cell = grid[r]?.[c]
              const val = responses[cellKey(r, c)] || ""
              
              if (!cell) return <div key={index} className={`${cellSize} bg-transparent`} aria-hidden />
              
              const isSel = selectedId && cell.words.includes(selectedId)
              const showCorrect = submitted
              const correct = showCorrect && isCorrectCell(r, c)
              const wrongClass = showCorrect && !correct && (responses[cellKey(r,c)] || "").length > 0 ? 'line-through text-red-600' : ''
              
              return (
                <input
                  key={index}
                  className={`${cellSize} border-0 text-center uppercase outline-none transition-all text-gray-800 font-medium ${cellClasses(r, c)} ${wrongClass}`}
                  value={val}
                  maxLength={1}
                  readOnly={submitted && correct}
                  onChange={(e) => onInput(r, c, e.target.value)}
                  onFocus={() => { selectByCell(r, c); setFocused({ r, c }) }}
                  onBlur={() => setFocused(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(r, c, 'left') }
                    else if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(r, c, 'right') }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(r, c, 'up') }
                    else if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(r, c, 'down') }
                  }}
                  aria-label={`Cell ${r+1}, ${c+1}${isSel ? ' (in selected word)' : ''}`}
                />
              )
            })}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <button className="px-2 py-1 text-sm rounded border bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: accent }} onClick={() => setSubmitted(true)}>
            Check all
          </button>
          {submitted && (()=>{
            try {
              const [_, lessonId, blockId] = (storageKey || '').split(':')
              if (lessonId && blockId) {
                const wordsSolved = words.filter(isCompletedWord).length
                const completed = wordsSolved === words.length && words.length > 0
                postLessonEvent({ lessonId, blockId, toolKind: 'CROSSWORD', eventType: 'crossword_check', data: { completed, wordsTotal: words.length, wordsSolved } })
                // Mark block as completed when all words are solved
                if (completed) {
                  setBlockDone({ lessonId, blockId }, true)
                }
              }
            } catch {}
            return null
          })()}
          {selected && (
            <>
              <button className="px-2 py-1 text-sm rounded border bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: accent }} onClick={() => revealWord(selected)}>Reveal word</button>
            </>
          )}
          <button className="px-2 py-1 text-sm rounded border bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: accent }} onClick={resetAll}>Reset</button>
        </div>
      </div>
      <div className="min-w-0">
        <div className="font-medium mb-2 text-gray-800">Clues</div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {words.map((w, i) => {
            const completed = isCompletedWord(w)
            return (
              <button key={w.id} className={`w-full text-left px-3 py-2 rounded border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedId===w.id ? 'bg-gray-100 border-gray-400' : 'bg-white hover:bg-gray-50'} ${completed ? 'opacity-60' : ''}`} style={{ outlineColor: accent }} onClick={() => setSelectedId(w.id)}>
                <div className="text-sm text-gray-800 leading-relaxed">{i+1}. {w.clue || w.answer}</div>
                <div className="text-xs text-gray-500 mt-1">{w.dir} at ({w.row+1},{w.col+1}) • {w.answer.length} letters</div>
              </button>
            )
          })}
          {words.length===0 && <div className="text-sm text-gray-500">No words configured.</div>}
        </div>
      </div>
    </div>
  )
}
