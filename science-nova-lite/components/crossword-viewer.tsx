"use client"

import React from "react"

export type CWWord = {
  id: string
  row: number
  col: number
  dir: "across" | "down"
  answer: string
  clue?: string
}

export function CrosswordViewer({
  rows,
  cols,
  words,
  storageKey,
}: {
  rows: number
  cols: number
  words: CWWord[]
  storageKey?: string
}) {
  const [responses, setResponses] = React.useState<Record<string, string>>({})
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

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

  const inputRef = React.useRef<HTMLInputElement>(null)

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
    if (!v) return "bg-gray-200" // blocked/empty
    const inSelected = selectedId ? v.words.includes(selectedId) : false
    return inSelected ? "bg-yellow-50" : "bg-white"
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

  const selected = currentWord()

  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr]">
      <div>
        <div className="inline-block">
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => {
                const val = responses[cellKey(r, c)] || ""
                if (!cell) return <div key={c} className="w-8 h-8 border bg-gray-200" />
                const isSel = selectedId && cell.words.includes(selectedId)
                const showCorrect = submitted
                const correct = showCorrect && isCorrectCell(r, c)
                return (
                  <input
                    key={c}
                    className={`w-8 h-8 border text-center uppercase outline-none ${cellClasses(r, c)} ${showCorrect ? (correct ? 'border-green-500' : 'border-red-500') : ''}`}
                    value={val}
                    maxLength={1}
                    onChange={(e) => onInput(r, c, e.target.value)}
                    onFocus={() => selectByCell(r, c)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') { e.preventDefault(); moveFocus(r, c, 'left') }
                      else if (e.key === 'ArrowRight') { e.preventDefault(); moveFocus(r, c, 'right') }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(r, c, 'up') }
                      else if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(r, c, 'down') }
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={() => setSubmitted(true)}>
            Check all
          </button>
          {selected && (
            <>
              <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={() => revealWord(selected)}>Reveal word</button>
            </>
          )}
          <button className="px-3 py-1 rounded border bg-white hover:bg-gray-50" onClick={resetAll}>Reset</button>
        </div>
      </div>
      <div>
        <div className="font-medium mb-2">Clues</div>
        <div className="space-y-2">
          {words.map((w, i) => (
            <button key={w.id} className={`w-full text-left px-2 py-1 rounded border ${selectedId===w.id ? 'bg-blue-50 border-blue-300' : 'bg-white'}`} onClick={() => setSelectedId(w.id)}>
              <div className="text-sm">{i+1}. {w.clue || w.answer}</div>
              <div className="text-xs text-gray-500">{w.dir} at ({w.row+1},{w.col+1}) • {w.answer.length} letters</div>
            </button>
          ))}
          {words.length===0 && <div className="text-sm text-gray-500">No words configured.</div>}
        </div>
      </div>
    </div>
  )
}
