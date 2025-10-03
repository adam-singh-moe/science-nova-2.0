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
    <div className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      {/* Enhanced Header with Crossword Theme */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-3xl blur-2xl"></div>
        <div className="relative bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-2xl blur-xl opacity-40 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-red-500 p-4 rounded-2xl backdrop-blur-sm border border-amber-500/60 shadow-2xl">
                  <span className="text-white text-2xl font-bold drop-shadow-lg">🔤</span>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-orange-200 to-red-200 bg-clip-text text-transparent drop-shadow-lg">
                  Crossword Puzzle
                </h3>
                <div className="text-sm text-slate-300 font-medium">
                  Fill in the grid to solve the puzzle
                </div>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="text-white font-bold text-3xl bg-gradient-to-r from-red-200 to-amber-200 bg-clip-text text-transparent drop-shadow-lg">
                {words.filter(isCompletedWord).length}/{words.length}
              </div>
              <div className="text-sm text-slate-300 font-medium">Words Solved</div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          {words.length > 0 && (
            <div className="relative mb-6">
              <div className="h-3 w-full rounded-full bg-slate-700/80 border border-slate-500/40 overflow-hidden backdrop-blur-sm shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out shadow-lg relative"
                  style={{ width: `${(words.filter(isCompletedWord).length / words.length) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`grid gap-6 md:grid-cols-[1fr_320px]`}>
        <div className="flex flex-col items-center min-w-0">
          <div className="bg-slate-800/90 backdrop-blur-lg border border-slate-600/40 rounded-2xl p-4 max-w-full overflow-auto shadow-xl" role="group" aria-label="Crossword grid">
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
          
          {/* Enhanced Action Buttons */}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <button 
              className="px-6 py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 shadow-lg hover:shadow-amber-500/25 transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-amber-500/40" 
              onClick={() => setSubmitted(true)}
            >
              Check All Answers
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
              <button 
                className="px-6 py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 shadow-lg hover:shadow-blue-500/25 transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-blue-500/40" 
                onClick={() => revealWord(selected)}
              >
                Reveal Word
              </button>
            )}
            <button 
              className="px-6 py-3 text-sm font-medium rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 shadow-lg hover:shadow-slate-500/25 transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-slate-600/40" 
              onClick={resetAll}
            >
              Reset Puzzle
            </button>
          </div>
        </div>
        
        {/* Enhanced Clues Panel */}
        <div className="min-w-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/90 backdrop-blur-lg border border-slate-600/40 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">📝</span>
                </div>
                <h4 className="text-lg font-bold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Clues
                </h4>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {words.map((w, i) => {
                  const completed = isCompletedWord(w)
                  return (
                    <button 
                      key={w.id} 
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 hover:scale-[1.02] ${
                        selectedId===w.id 
                          ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 border-amber-500/60 shadow-lg backdrop-blur-sm' 
                          : 'bg-slate-700/50 border-slate-600/30 hover:bg-slate-700/70 backdrop-blur-sm shadow-md'
                      } ${completed ? 'opacity-70 ring-2 ring-green-400/50' : ''}`} 
                      style={{ outlineColor: accent }} 
                      onClick={() => setSelectedId(w.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white leading-relaxed">
                            {i+1}. {w.clue || w.answer}
                          </div>
                          <div className="text-xs text-slate-300 mt-2 font-medium">
                            {w.dir.toUpperCase()} • Position ({w.row+1},{w.col+1}) • {w.answer.length} letters
                          </div>
                        </div>
                        {completed && (
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
                {words.length===0 && (
                  <div className="text-center py-8">
                    <div className="text-slate-400 text-sm font-medium">No words configured for this puzzle.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
