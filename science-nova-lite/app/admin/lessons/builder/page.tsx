"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { RoleGuard } from "@/components/layout/role-guard"
// Vanta background is not shown in the builder; only in Preview/Student
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Boxes, Cog, FileText, Grid3X3, HelpCircle, Layers, Plus, Shuffle, Type, MonitorSmartphone, ZoomIn, ZoomOut } from "lucide-react"
import { Image as ImageIcon } from "lucide-react"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import { QuizViewer } from "@/components/quiz-viewer"
import { CrosswordViewer } from "@/components/crossword-viewer"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { useConfirm } from "@/hooks/use-confirm"

export type ToolKind = "TEXT" | "FLASHCARDS" | "QUIZ" | "CROSSWORD" | "IMAGE"

interface PlacedTool {
  id: string
  kind: ToolKind
  x: number
  y: number
  w: number
  h: number
  data: any
  z?: number
}

const defaultSize: Record<ToolKind, { w: number; h: number }> = {
  TEXT: { w: 600, h: 240 },
  FLASHCARDS: { w: 600, h: 260 },
  QUIZ: { w: 600, h: 220 },
  CROSSWORD: { w: 600, h: 220 },
  IMAGE: { w: 480, h: 320 },
}

function LeftPalette({ onAdd, onOpenSettings }: { onAdd: (k: ToolKind) => void; onOpenSettings: () => void }) {
  const iconBtn = "w-12 h-12 grid place-items-center rounded-xl border bg-white/80 hover:bg-white transition shadow-sm"
  const iconWrap = "flex flex-col items-center gap-2"
  return (
    <aside className="w-16 shrink-0 p-3 bg-white/60 backdrop-blur border-r">
      <div className="flex items-center justify-between mb-4">
        <span className="sr-only">Tools</span>
        <button aria-label="Lesson settings" title="Lesson settings" onClick={onOpenSettings} className="w-9 h-9 grid place-items-center rounded-lg border bg-white/80 hover:bg-white shadow-sm">
          <Cog className="h-4 w-4 text-indigo-600" />
        </button>
      </div>
      <div className={iconWrap}>
        <button className={iconBtn} title="Text" onClick={() => onAdd("TEXT")}>
          <Type className="h-5 w-5 text-sky-600" />
        </button>
        <button className={iconBtn} title="Flashcards" onClick={() => onAdd("FLASHCARDS")}>
          <Boxes className="h-5 w-5 text-emerald-600" />
        </button>
        <button className={iconBtn} title="Quiz" onClick={() => onAdd("QUIZ")}>
          <HelpCircle className="h-5 w-5 text-violet-600" />
        </button>
        <button className={iconBtn} title="Crossword" onClick={() => onAdd("CROSSWORD")}>
          <Grid3X3 className="h-5 w-5 text-amber-600" />
        </button>
        <button className={iconBtn} title="Image" onClick={() => onAdd("IMAGE")}>
          <ImageIcon className="h-5 w-5 text-pink-600" />
        </button>
      </div>
    </aside>
  )
}

function AiHelperPanel({ sel, meta, onUpdateSelected }: { sel: PlacedTool; meta: { title: string; topic: string; grade: number; vanta: string; difficulty?: 1|2|3 }; onUpdateSelected: (patch: any) => void }) {
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  // --- helpers: sanitize and parse LLM responses ---
  const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '')
  const stripFences = (s: string) => s
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .replace(/^json\s*\n?/i, '')
  const tidy = (v: any): string => {
    const s = String(v ?? '')
    return stripHtml(stripFences(s)).replace(/[\r\n]+/g, '\n').replace(/\u00a0/g, ' ').trim()
  }
  const tryParseJSON = (raw: string): any | null => {
    const s = stripFences(raw).trim()
    // Try direct parse
    try { return JSON.parse(s) } catch {}
    // Try to extract first {...} or [...] block
    const mArr = s.match(/\[[\s\S]*\]/)
    if (mArr) { try { return JSON.parse(mArr[0]) } catch {} }
    const mObj = s.match(/\{[\s\S]*\}/)
    if (mObj) { try { return JSON.parse(mObj[0]) } catch {} }
    return null
  }
  const parseFlashcardsFromText = (text: string): Array<{q:string;a:string}> => {
    const clean = tidy(text)
    const parsed = tryParseJSON(clean)
    let out: Array<{q:string;a:string}> = []
    if (parsed) {
      if (Array.isArray(parsed)) out = parsed as any
      else if (Array.isArray((parsed as any).cards)) out = (parsed as any).cards
      else if (Array.isArray((parsed as any).items)) out = (parsed as any).items
    }
    // If still empty, parse Q:/A: pairs from text
    if (!out.length) {
      const lines = clean.split(/\n+/)
      let q: string | null = null
      for (const line of lines) {
        const mQ = line.match(/^\s*(Q|Question)\s*[:\-]\s*(.+)$/i)
        const mA = line.match(/^\s*(A|Answer)\s*[:\-]\s*(.+)$/i)
        if (mQ) { q = mQ[2].trim() }
        else if (mA && q) { out.push({ q: q.trim(), a: mA[2].trim() }); q = null }
      }
    }
    return out
      .map((x: any) => ({ q: tidy(x.q ?? x.question ?? ''), a: tidy(x.a ?? x.answer ?? '') }))
      .filter(x => x.q && x.a && x.q.toLowerCase() !== x.a.toLowerCase())
  }

  // Crossword placement util: build an intersecting layout for complexity
  type CWDir = 'across' | 'down'
  type CWWord = { answer: string; clue?: string }
  type Placed = { id: string; row: number; col: number; dir: CWDir; answer: string; clue?: string }
  const placeCrossword = (rows: number, cols: number, words: CWWord[]): Placed[] => {
    const grid: (string | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null))
    const placed: Placed[] = []
    const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < rows && c < cols
    const canPlace = (r: number, c: number, dir: CWDir, w: string): boolean => {
      for (let i = 0; i < w.length; i++) {
        const rr = r + (dir === 'down' ? i : 0)
        const cc = c + (dir === 'across' ? i : 0)
        if (!inside(rr, cc)) return false
        const cur = grid[rr][cc]
        if (cur && cur !== w[i]) return false
        // adjacency rule: avoid touching on sides (except intersections)
        if (!cur) {
          const adj = [
            [rr - 1, cc], [rr + 1, cc], [rr, cc - 1], [rr, cc + 1]
          ]
          for (const [ar, ac] of adj) {
            if (!inside(ar, ac)) continue
            const neighbor = grid[ar][ac]
            if (neighbor) {
              // if neighbor is part of a potential intersection different from letter cell, disallow
              // allow when this cell will be letter-occupied (intersection allowed by cur check)
              // we already know cur is null here, so side-touching not allowed
              return false
            }
          }
        }
      }
      return true
    }
    const commit = (r: number, c: number, dir: CWDir, w: string) => {
      for (let i = 0; i < w.length; i++) {
        const rr = r + (dir === 'down' ? i : 0)
        const cc = c + (dir === 'across' ? i : 0)
        grid[rr][cc] = w[i]
      }
    }
    // shuffle helper
    const shuffle = <T,>(arr: T[]) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
    const list = shuffle(words)
    // seed: place first word near center, across
    if (list.length) {
      const first = list[0].answer.toUpperCase()
      const r0 = Math.max(0, Math.floor(rows / 2) - 1)
      const c0 = Math.max(0, Math.floor((cols - first.length) / 2))
      if (canPlace(r0, c0, 'across', first)) { commit(r0, c0, 'across', first); placed.push({ id: crypto.randomUUID(), row: r0, col: c0, dir: 'across', answer: first, clue: list[0].clue }) }
      else {
        // fallback corners scan
        outer: for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { if (canPlace(r, c, 'across', first)) { commit(r, c, 'across', first); placed.push({ id: crypto.randomUUID(), row: r, col: c, dir: 'across', answer: first, clue: list[0].clue }); break outer } }
      }
    }
    // place remaining with intersections where possible
    for (let idx = 1; idx < list.length; idx++) {
      const w = list[idx].answer.toUpperCase()
      const chars = w.split('')
      const candidates: Array<{ r: number; c: number; dir: CWDir }> = []
      for (const p of placed) {
        const pWord = p.answer
        for (let i = 0; i < pWord.length; i++) {
          const letter = pWord[i]
          for (let j = 0; j < chars.length; j++) {
            if (chars[j] !== letter) continue
            if (p.dir === 'across') {
              const r = p.row - j
              const c = p.col + i
              if (canPlace(r, c, 'down', w)) candidates.push({ r, c, dir: 'down' })
            } else {
              const r = p.row + i
              const c = p.col - j
              if (canPlace(r, c, 'across', w)) candidates.push({ r, c, dir: 'across' })
            }
          }
        }
      }
      const shuffled = candidates.length ? candidates.sort(() => Math.random() - 0.5) : []
      let placedOk = false
      for (const cand of shuffled) {
        if (canPlace(cand.r, cand.c, cand.dir, w)) {
          commit(cand.r, cand.c, cand.dir, w)
          placed.push({ id: crypto.randomUUID(), row: cand.r, col: cand.c, dir: cand.dir, answer: w, clue: list[idx].clue })
          placedOk = true
          break
        }
      }
      if (!placedOk) {
        // try random scans
        for (let tries = 0; tries < 200 && !placedOk; tries++) {
          const dir: CWDir = Math.random() < 0.5 ? 'across' : 'down'
          const rMax = dir === 'down' ? rows - w.length : rows - 1
          const cMax = dir === 'across' ? cols - w.length : cols - 1
          const r = Math.max(0, Math.floor(Math.random() * Math.max(1, rMax)))
          const c = Math.max(0, Math.floor(Math.random() * Math.max(1, cMax)))
          if (canPlace(r, c, dir, w)) {
            commit(r, c, dir, w)
            placed.push({ id: crypto.randomUUID(), row: r, col: c, dir, answer: w, clue: list[idx].clue })
            placedOk = true
            break
          }
        }
      }
    }
    return placed
  }

  const obfuscateClue = (answer: string, clue?: string) => {
    if (!clue) return ''
    const re = new RegExp(answer.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'ig')
    return clue.replace(re, '_'.repeat(Math.min(6, answer.length)))
  }

  const doText = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'TEXT', prompt: desc, topic: meta.topic, grade: meta.grade, difficulty: meta.difficulty })
      })
      const j = await res.json()
      if (j?.text) onUpdateSelected({ data: { ...(sel.data || {}), html: `<p>${String(j.text).replace(/\n/g, '<br/>')}</p>`, text: j.text } })
    } finally { setLoading(false) }
  }

  const doFlash = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'FLASHCARDS',
          // Encourage structured, fence-free output; still parse defensively
          prompt: desc || `Create 6 concise flashcards about ${meta.topic} for Grade ${meta.grade} (difficulty ${meta.difficulty}).
Return JSON with a 'cards' array like [{"q":"question","a":"answer"}].
Do NOT include markdown fences or code blocks.`,
          topic: meta.topic,
          grade: meta.grade,
          difficulty: meta.difficulty,
          limit: 6
        })
      })
      const j = await res.json()
      let cardsArr: any[] = []
      if (Array.isArray(j?.cards)) cardsArr = j.cards
      else if (Array.isArray(j?.items)) cardsArr = j.items
      else if (typeof j?.text === 'string') cardsArr = parseFlashcardsFromText(j.text)
      else if (typeof j === 'string') cardsArr = parseFlashcardsFromText(j)
      if (cardsArr.length) {
        onUpdateSelected({
          data: {
            ...(sel.data || {}),
            cards: cardsArr
              .map((x: any) => ({ id: crypto.randomUUID(), q: tidy(x.q || x.question || ''), a: tidy(x.a || x.answer || '') }))
              .filter((x: any) => x.q && x.a)
          }
        })
      }
    } finally { setLoading(false) }
  }

  const [mcq, setMcq] = useState(2); const [tf, setTf] = useState(2); const [fib, setFib] = useState(1)
  const doQuiz = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'QUIZ', prompt: desc, topic: meta.topic, grade: meta.grade, difficulty: meta.difficulty, counts: { MCQ: mcq, TF: tf, FIB: fib } })
      })
      const j = await res.json()
      let items = Array.isArray(j?.items) ? j.items : []
      // Fallback: if no items provided (e.g., no API key), synthesize simple questions
      if (!items.length) {
        const topic = meta.topic || 'the topic'
        const makeMCQ = (q: string, opts: string[], ans: string) => ({ type: 'MCQ', question: q, options: opts, answer: ans })
        const makeTF = (q: string, ans: boolean) => ({ type: 'TF', question: q, answer: ans })
        const makeFIB = (q: string, ans: string) => ({ type: 'FIB', question: q, answer: ans })
        const mcqs = Array.from({ length: Math.max(0, mcq) }).map((_, i) =>
          makeMCQ(`Which is true about ${topic}? (${i + 1})`, [
            `${topic} relates to science concepts`,
            `It is unrelated to learning`,
            `It's a random idea`,
            `None of the above`
          ], `${topic} relates to science concepts`)
        )
        const tfs = Array.from({ length: Math.max(0, tf) }).map((_, i) => makeTF(`${topic} can be studied with experiments. (${i + 1})`, true))
        const fibs = Array.from({ length: Math.max(0, fib) }).map((_, i) => makeFIB(`${topic} is studied in the subject of _____. (${i + 1})`, 'science'))
        items = [...mcqs, ...tfs, ...fibs]
      }
      if (items.length) onUpdateSelected({ data: { ...(sel.data || {}), items: [...(Array.isArray(sel.data?.items) ? sel.data.items : []), ...items] } })
    } finally { setLoading(false) }
  }

  const [cwCount, setCwCount] = useState(6)
  const doCross = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'CROSSWORD',
          prompt: desc || `Generate ${Math.min(12, Math.max(4, cwCount))} themed crossword entries about ${meta.topic} for Grade ${meta.grade} (difficulty ${meta.difficulty}).
Provide JSON with items: [{"answer":"UPPERCASE","clue":"indirect clue without the word"}].
Avoid giving away the answer in the clue. Mix word lengths (3–10).`,
          topic: meta.topic,
          grade: meta.grade,
          difficulty: meta.difficulty,
          limit: Math.min(12, Math.max(1, cwCount))
        })
      })
      const j = await res.json()
      const rows = Number(sel.data?.rows || 12)
      const cols = Number(sel.data?.cols || 12)
      let placedOut: Array<{ id: string; row: number; col: number; dir: 'across'|'down'; answer: string; clue?: string }> = []

      if (Array.isArray(j?.items) && j.items.length) {
        // Normalize and obfuscate clues if they reveal the answer
        const normalized: CWWord[] = j.items
          .map((w: any) => ({ answer: tidy(w.answer || w.word || '' ).toUpperCase(), clue: tidy(w.clue || '') }))
          .filter((w: CWWord) => w.answer && /^[A-Z]+$/.test(w.answer))
          .map((w: CWWord) => ({ answer: w.answer, clue: obfuscateClue(w.answer, w.clue) }))

        // If positions provided, keep them; else auto-place
        const hasPos = j.items.every((w: any) => w && (typeof w.row === 'number') && (typeof w.col === 'number') && (w.dir === 'across' || w.dir === 'down'))
        if (hasPos) {
          placedOut = j.items.map((w: any) => ({ id: crypto.randomUUID(), row: Number(w.row) || 0, col: Number(w.col) || 0, dir: (w.dir === 'down' ? 'down' : 'across'), answer: String(w.answer || w.word || '').toUpperCase(), clue: obfuscateClue(String(w.answer || w.word || '').toUpperCase(), w.clue || '') }))
        } else {
          placedOut = placeCrossword(rows, cols, normalized)
        }
      } else if (Array.isArray(j?.words) && j.words.length) {
        // Create indirect clues and auto-place with intersections
        const normalized: CWWord[] = j.words
          .map((w: any) => String(w || '').toUpperCase())
          .filter((w: string) => w && /^[A-Z]+$/.test(w))
          .map((w: string) => ({ answer: w, clue: `Related to ${meta.topic.toLowerCase()}: ${'_'.repeat(Math.min(6, w.length))}` }))
        placedOut = placeCrossword(rows, cols, normalized)
      }

      if (placedOut.length) {
        onUpdateSelected({ data: { ...(sel.data || {}), rows, cols, words: placedOut } })
      }
    } finally { setLoading(false) }
  }

  const doImage = async () => {
    setLoading(true)
    try {
      const prompt = `${desc || ''} — Lesson: ${meta.title || ''}, Topic: ${meta.topic || ''}, Grade ${meta.grade}, Difficulty ${meta.difficulty || 2}`
      const res = await fetch('/api/generate-image-enhanced', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, aspectRatio: '16:9', gradeLevel: meta.grade }) })
      const j = await res.json()
      if (j?.success) {
        if (j.type === 'gradient') {
          onUpdateSelected({ data: { ...(sel.data || {}), gradient: j.imageUrl, url: '', alt: (sel.data?.alt || ''), caption: (sel.data?.caption || ''), fit: 'cover' } })
        } else if (j.imageUrl) {
          onUpdateSelected({ data: { ...(sel.data || {}), url: j.imageUrl, gradient: '', fit: 'cover' } })
        }
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <textarea className="w-full border rounded p-2 text-xs" placeholder="Optional description to guide AI" value={desc} onChange={(e) => setDesc(e.target.value)} />
      {sel.kind === 'TEXT' && <Button size="sm" disabled={loading} onClick={doText}>Generate Text</Button>}
      {sel.kind === 'FLASHCARDS' && <Button size="sm" disabled={loading} onClick={doFlash}>Generate Flashcards</Button>}
      {sel.kind === 'QUIZ' && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1 text-xs">
            <label>MCQ <input className="w-full border rounded p-1" type="number" min={0} max={10} value={mcq} onChange={e => setMcq(Number(e.target.value))} /></label>
            <label>TF <input className="w-full border rounded p-1" type="number" min={0} max={10} value={tf} onChange={e => setTf(Number(e.target.value))} /></label>
            <label>FIB <input className="w-full border rounded p-1" type="number" min={0} max={10} value={fib} onChange={e => setFib(Number(e.target.value))} /></label>
          </div>
          <Button size="sm" disabled={loading} onClick={doQuiz}>Generate Quiz</Button>
        </div>
      )}
      {sel.kind === 'CROSSWORD' && (
        <div className="space-y-2">
          <label className="text-xs">Words <input className="w-full border rounded p-1" type="number" min={1} max={10} value={cwCount} onChange={e => setCwCount(Number(e.target.value))} /></label>
          <Button size="sm" disabled={loading} onClick={doCross}>Generate Words</Button>
        </div>
      )}
      {sel.kind === 'IMAGE' && <Button size="sm" disabled={loading} onClick={doImage}>Generate Image</Button>}
    </div>
  )
}

function RightInspector({ items, selectedId, onSelect, onSave, onPreview, onPublish, onUpdateSelected, meta, onReorder }: { items: PlacedTool[]; selectedId: string | null; onSelect: (id: string) => void; onSave: () => void; onPreview: () => void; onPublish: () => void; onUpdateSelected: (patch: any) => void; meta: { title: string; topic: string; grade: number; vanta: string }; onReorder: (id: string, action: 'up'|'down'|'front'|'back') => void }) {
  const iconFor = (k: ToolKind) => k==='TEXT'? <Type className="h-3.5 w-3.5 text-sky-600"/> : k==='FLASHCARDS'? <Boxes className="h-3.5 w-3.5 text-emerald-600"/> : k==='QUIZ'? <HelpCircle className="h-3.5 w-3.5 text-violet-600"/> : k==='CROSSWORD'? <Grid3X3 className="h-3.5 w-3.5 text-amber-600"/> : <ImageIcon className="h-3.5 w-3.5 text-pink-600"/>
  const sel = selectedId ? items.find(i=>i.id===selectedId) : null
  return (
    <aside className="w-72 shrink-0 p-3 bg-white/70 backdrop-blur border-l">
      <div className="mb-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={onSave}>Save</Button>
        <Button size="sm" onClick={onPreview}>Preview</Button>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onPublish}>Publish</Button>
      </div>
      <div className="text-xs font-semibold text-gray-700 mb-1">Layers</div>
      <div className="space-y-1.5 max-h-[58vh] overflow-y-auto pr-1">
        {items
          .slice()
          .sort((a,b)=> (b.z ?? 0) - (a.z ?? 0))
          .map(it => (
          <div key={it.id} className={`w-full px-2 py-1.5 rounded-lg border ${selectedId===it.id? 'bg-indigo-50 border-indigo-200' : 'bg-white/80 hover:bg-white'}`}>
            <div className="flex items-center gap-2">
              <div className="shrink-0">{iconFor(it.kind)}</div>
              <button onClick={() => onSelect(it.id)} className="flex-1 text-left">
                <div className="text-[12px] font-medium text-gray-800">{it.kind}</div>
                <div className="text-[10px] text-gray-500">{Math.round(it.x)},{Math.round(it.y)} • z {it.z ?? 0}</div>
              </button>
              <div className="flex items-center gap-1">
                <button title="Forward" className="px-1 py-0.5 border rounded" onClick={()=>onReorder(it.id,'up')}>▲</button>
                <button title="Backward" className="px-1 py-0.5 border rounded" onClick={()=>onReorder(it.id,'down')}>▼</button>
              </div>
            </div>
            {selectedId===it.id && (
              <div className="mt-1 grid grid-cols-2 gap-1 text-[10px]">
                <button className="border rounded px-1 py-0.5" onClick={()=>onReorder(it.id,'front')}>Front</button>
                <button className="border rounded px-1 py-0.5" onClick={()=>onReorder(it.id,'back')}>Back</button>
              </div>
            )}
          </div>
        ))}
        {items.length===0 && <div className="text-xs text-gray-500">No tools yet.</div>}
      </div>
      <div className="mt-3">
        <div className="text-xs font-semibold mb-2">Properties</div>
        {!sel && <div className="text-xs text-gray-500">Select a layer to edit its properties.</div>}
        {sel && (
          <div className="text-[11px] text-gray-600">Most settings are edited directly on the tool on the canvas. Use AI Helper below to generate content.</div>
        )}
      </div>

      {/* AI Helper moved to inspector */}
      <div className="mt-4">
        <div className="text-xs font-semibold mb-2">AI Helper</div>
        {!sel ? (
          <div className="text-xs text-gray-500">Select a layer to use AI.</div>
        ) : (
          <AiHelperPanel sel={sel} meta={{ ...meta, difficulty: (meta as any).difficulty }} onUpdateSelected={onUpdateSelected} />
        )}
      </div>
    </aside>
  )
}

type GuideLines = { v: number[]; h: number[] }
function Draggable({ item, onChange, selected, onSelect, onConfigure, onDuplicate, onDelete, onDragState, snap, gridSize, allItems, onGuideChange, onActivate, canvasH, onCanvasNeed }: { item: PlacedTool; onChange: (p: Partial<PlacedTool>) => void; selected: boolean; onSelect: () => void; onConfigure: () => void; onDuplicate: () => void; onDelete: () => void; onDragState: (dragging: boolean) => void; snap: boolean; gridSize: number; allItems: PlacedTool[]; onGuideChange: (g: GuideLines) => void; onActivate: () => void; canvasH: number; onCanvasNeed: (needW: number, needH: number) => void }) {
  const start = useRef<{x:number;y:number;w:number;h:number;mx:number;my:number;resizing:boolean; dir?: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'} | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  const [flipMap, setFlipMap] = useState<Record<string, boolean>>({})
  const threshold = 6

  // Start drag only from header bar or resize handles
  const beginDrag = (e: React.MouseEvent) => {
    onSelect();
    const dir = (e.target as HTMLElement).dataset.handle as any
    start.current = { x: item.x, y: item.y, w: item.w, h: item.h, mx: e.clientX, my: e.clientY, resizing: !!dir, dir }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    onDragState(true)
  }
  const onMove = (e: MouseEvent) => {
    if (!start.current) return
    // account for canvas scale (stored on document for simplicity)
    const scale = (document.documentElement.getAttribute('data-canvas-scale') ? Number(document.documentElement.getAttribute('data-canvas-scale')) : 1) || 1
    const dx = (e.clientX - start.current.mx) / scale
    const dy = (e.clientY - start.current.my) / scale
  const designW = 1280, designH = canvasH
    const guides: GuideLines = { v: [], h: [] }
    const others = allItems.filter(i=>i.id!==item.id)
    if (start.current.resizing) {
  const minW = 240, minH = 140
      const dir = start.current.dir || 'se'
      // Keep opposite edges anchored when dragging N or W handles
      let L = start.current.x
      let T = start.current.y
      let R = start.current.x + start.current.w
      let B = start.current.y + start.current.h

  if (dir.includes('e')) { R = L + Math.max(minW, start.current.w + dx); R = Math.min(designW, R) }
  if (dir.includes('s')) { B = T + Math.max(minH, start.current.h + dy); B = Math.min(designH, B) }
      if (dir.includes('w')) { L = Math.min(R - minW, start.current.x + dx); L = Math.max(0, L) }
      if (dir.includes('n')) { T = Math.min(B - minH, start.current.y + dy); T = Math.max(0, T) }

      // Snap
      if (snap) {
        if (dir.includes('w')) { const sx = Math.round(L / gridSize) * gridSize; L = Math.min(R - minW, Math.max(0, sx)) }
        if (dir.includes('n')) { const sy = Math.round(T / gridSize) * gridSize; T = Math.min(B - minH, Math.max(0, sy)) }
        if (dir.includes('e')) { const sw = Math.round((R - L) / gridSize) * gridSize; R = L + Math.max(minW, sw) }
        if (dir.includes('s')) { const sh = Math.round((B - T) / gridSize) * gridSize; B = T + Math.max(minH, sh) }
      }

      // Simple alignment guides for moved edges
      for (const it of others) {
        const l = it.x, r = it.x + it.w, cx = it.x + it.w/2
        const t = it.y, b = it.y + it.h, cy = it.y + it.h/2
        if (dir.includes('e')) {
          if (Math.abs(R - l) <= threshold) { R = l; guides.v.push(l) }
          if (Math.abs(R - r) <= threshold) { R = r; guides.v.push(r) }
          if (Math.abs(R - cx) <= threshold) { R = cx; guides.v.push(cx) }
        }
        if (dir.includes('w')) {
          if (Math.abs(L - l) <= threshold) { L = l; guides.v.push(l) }
          if (Math.abs(L - r) <= threshold) { L = r; guides.v.push(r) }
          if (Math.abs(L - cx) <= threshold) { L = cx; guides.v.push(cx) }
        }
        if (dir.includes('s')) {
          if (Math.abs(B - t) <= threshold) { B = t; guides.h.push(t) }
          if (Math.abs(B - b) <= threshold) { B = b; guides.h.push(b) }
          if (Math.abs(B - cy) <= threshold) { B = cy; guides.h.push(cy) }
        }
        if (dir.includes('n')) {
          if (Math.abs(T - t) <= threshold) { T = t; guides.h.push(t) }
          if (Math.abs(T - b) <= threshold) { T = b; guides.h.push(b) }
          if (Math.abs(T - cy) <= threshold) { T = cy; guides.h.push(cy) }
        }
      }

  const nw = Math.min(Math.max(minW, R - L), designW - L)
  const nh = Math.min(Math.max(minH, B - T), designH - T)
      onGuideChange(guides)
      onChange({ x: L, y: T, w: nw, h: nh })
      // request canvas growth if needed
      onCanvasNeed(L + nw, T + nh)
    } else {
  const nx0 = Math.max(0, start.current.x + dx)
  const ny0 = Math.max(0, start.current.y + dy)
      // Alignment to neighbors (left/right/centerX and top/bottom/centerY)
  let ax = nx0, ay = ny0
      const L = ax, T = ay, R = L + item.w, B = T + item.h
      for (const it of others) {
        const l = it.x, r = it.x + it.w, cx = it.x + it.w/2
        const t = it.y, b = it.y + it.h, cy = it.y + it.h/2
        if (Math.abs(L - l) <= threshold) { ax = l; guides.v.push(l) }
  if (Math.abs(L - r) <= threshold) { ax = r; guides.v.push(r) }
        if (Math.abs(R - l) <= threshold) { ax = l - item.w; guides.v.push(l) }
        if (Math.abs(L + item.w/2 - cx) <= threshold) { ax = cx - item.w/2; guides.v.push(cx) }

        if (Math.abs(T - t) <= threshold) { ay = t; guides.h.push(t) }
        if (Math.abs(T - b) <= threshold) { ay = b; guides.h.push(b) }
        if (Math.abs(B - b) <= threshold) { ay = b - item.h; guides.h.push(b) }
        if (Math.abs(B - t) <= threshold) { ay = t - item.h; guides.h.push(t) }
        if (Math.abs(T + item.h/2 - cy) <= threshold) { ay = cy - item.h/2; guides.h.push(cy) }
      }
  // After alignment, clamp within artboard
  ax = Math.min(Math.max(0, ax), designW - item.w)
  ay = Math.max(0, ay)
  const cx = snap ? Math.round(ax / gridSize) * gridSize : ax
  const cy = snap ? Math.round(ay / gridSize) * gridSize : ay
  const nx = Math.min(Math.max(0, cx), designW - item.w)
  const ny = Math.max(0, cy)
  onChange({ x: nx, y: ny })
      // request canvas growth if needed
      onCanvasNeed(nx + item.w, ny + item.h)
      onGuideChange(guides)
    }
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    onDragState(false)
    onGuideChange({ v: [], h: [] })
  }

  return (
    <div
      data-item-root
      className={`absolute shadow-sm ${selected? 'ring-2 ring-blue-400': ''}`}
      style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.z ?? 0 }}
    >
      <div className="h-full w-full bg-white/80 backdrop-blur border rounded-xl overflow-hidden">
        <div className="h-8 px-3 flex items-center justify-between text-xs text-gray-600 border-b bg-white/70 cursor-move select-none" onMouseDown={beginDrag}>
          <div className="flex items-center gap-2">
            <span>{item.kind}</span>
            <span className="text-gray-300">•</span>
            {item.kind==='CROSSWORD' && (
              <button onClick={(e)=>{e.stopPropagation();onConfigure();}} className="px-2 py-0.5 rounded border hover:bg-white">Configure</button>
            )}
            <button onClick={(e)=>{e.stopPropagation();onDuplicate();}} className="px-2 py-0.5 rounded border hover:bg-white">Duplicate</button>
            <button onClick={(e)=>{e.stopPropagation();onDelete();}} className="px-2 py-0.5 rounded border hover:bg-white text-red-600">Delete</button>
          </div>
          {/* drag-only header; resize handles are shown on selection below */}
        </div>
        {/* Resize handles (8 directions) */}
        {selected && (
          <>
            {/* corners */}
            <button data-handle="nw" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nwse-resize"
              style={{ top: 0, left: 0, transform: 'translate(-50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="ne" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nesw-resize"
              style={{ top: 0, right: 0, transform: 'translate(50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="sw" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nesw-resize"
              style={{ bottom: 0, left: 0, transform: 'translate(-50%, 50%)' }} onMouseDown={beginDrag} />
            <button data-handle="se" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-nwse-resize"
              style={{ bottom: 0, right: 0, transform: 'translate(50%, 50%)' }} onMouseDown={beginDrag} />
            {/* edges */}
            <button data-handle="n" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-n-resize"
              style={{ top: 0, left: '50%', transform: 'translate(-50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="s" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-s-resize"
              style={{ bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' }} onMouseDown={beginDrag} />
            <button data-handle="w" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-w-resize"
              style={{ left: 0, top: '50%', transform: 'translate(-50%, -50%)' }} onMouseDown={beginDrag} />
            <button data-handle="e" title="Resize"
              className="absolute z-10 w-3 h-3 bg-gray-400 rounded-sm cursor-e-resize"
              style={{ right: 0, top: '50%', transform: 'translate(50%, -50%)' }} onMouseDown={beginDrag} />
          </>
        )}
        <div className="p-3 text-sm text-gray-700 h-[calc(100%-2rem)] overflow-auto sn-tool-content" onMouseDown={(e)=>{ e.stopPropagation(); onSelect(); onActivate(); }}>
  {item.kind === "TEXT" && (
            <div className="h-full flex flex-col gap-2">
              <div className="flex items-center gap-1 text-xs">
        <button className="px-2 py-1 border rounded" onMouseDown={(e)=>{e.preventDefault(); textRef.current?.focus(); document.execCommand('bold')}}>Bold</button>
        <button className="px-2 py-1 border rounded" onMouseDown={(e)=>{e.preventDefault(); textRef.current?.focus(); document.execCommand('italic')}}>Italic</button>
        <button className="px-2 py-1 border rounded" onMouseDown={(e)=>{e.preventDefault(); textRef.current?.focus(); document.execCommand('formatBlock', false, 'h2')}}>H2</button>
        <button className="px-2 py-1 border rounded" onMouseDown={(e)=>{e.preventDefault(); textRef.current?.focus(); document.execCommand('formatBlock', false, 'p')}}>P</button>
              </div>
              <div
                ref={textRef}
                contentEditable
                suppressContentEditableWarning
                className="prose max-w-none min-h-40 bg-white/60 rounded p-3 outline-none"
                onInput={(e)=>{
                  const html = (e.currentTarget as HTMLDivElement).innerHTML
                  const text = (e.currentTarget as HTMLDivElement).innerText
                  onChange({ data: { ...item.data, html, text } })
                }}
                dangerouslySetInnerHTML={{ __html: (item.data?.html || item.data?.text) ? (item.data?.html || (item.data?.text as string).replace(/\n/g,'<br/>')) : 'Sample text…' }}
              />
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-1">Live render</div>
                <div className="prose max-w-none bg-white/50 rounded p-3" dangerouslySetInnerHTML={{ __html: (item.data?.html || item.data?.text) ? (item.data?.html || (item.data?.text as string).replace(/\n/g,'<br/>')) : 'Sample text…' }} />
              </div>
            </div>
          )}
          {item.kind === "IMAGE" && (()=>{
            const url: string = item.data?.url || ''
            const fit: 'contain'|'cover'|'fill' = item.data?.fit || 'contain'
            const alt: string = item.data?.alt || ''
            const caption: string = item.data?.caption || ''
            const gradient: string = item.data?.gradient || ''
            const set = (patch:any)=> onChange({ data: { ...item.data, ...patch } })
            return (
              <div className="h-full flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <input className="flex-1 border rounded px-2 py-1" placeholder="Image URL (https://...)" value={url} onChange={(e)=>set({ url: e.target.value, gradient: '' })} />
                  <select className="border rounded px-2 py-1" value={fit} onChange={(e)=>set({ fit: e.target.value })}>
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </div>
                <input className="border rounded px-2 py-1 text-xs" placeholder="Alt text" value={alt} onChange={(e)=>set({ alt: e.target.value })} />
                <input className="border rounded px-2 py-1 text-xs" placeholder="Caption (optional)" value={caption} onChange={(e)=>set({ caption: e.target.value })} />
                <div className="flex-1 min-h-40 bg-white/60 rounded p-2 grid place-items-center overflow-hidden">
                  {gradient ? (
                    <div className="w-full h-full rounded border border-gray-200" style={{ backgroundImage: gradient, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  ) : url ? (
                    <img src={url} alt={alt || 'image'} className="w-full h-full rounded border border-gray-200" style={{ objectFit: fit }} />
                  ) : (
                    <div className="text-gray-500 text-sm">Paste an image URL to preview</div>
                  )}
                </div>
              </div>
            )
          })()}
          {item.kind === "FLASHCARDS" && (() => {
            const cards: Array<{id?:string;q:string;a:string}> = Array.isArray(item.data?.cards) ? item.data.cards : []
            const addCard = () => onChange({ data: { ...item.data, cards: [...cards, { id: crypto.randomUUID(), q: '', a: '' }] }})
            const setCard = (idx:number, patch: Partial<{q:string;a:string}>) => { const arr=[...cards]; arr[idx] = { ...arr[idx], ...patch } as any; onChange({ data: { ...item.data, cards: arr }}) }
            const delCard = (idx:number) => { const arr=[...cards]; arr.splice(idx,1); onChange({ data: { ...item.data, cards: arr }}) }
            const move = (idx:number, dir:number) => { const arr=[...cards]; const t=arr[idx+dir]; arr[idx+dir]=arr[idx]; arr[idx]=t; onChange({ data: { ...item.data, cards: arr }}) }
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Flashcards ({cards.length})</div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={addCard}>+ Add</button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {cards.map((c, idx)=> (
                    <div key={c.id || idx} className="border rounded-lg p-2 bg-white/70">
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>#{idx+1}</span>
                        <div className="flex gap-1">
                          <button className="px-1 py-0.5 border rounded" disabled={idx===0} onClick={()=>move(idx,-1)}>Up</button>
                          <button className="px-1 py-0.5 border rounded" disabled={idx===cards.length-1} onClick={()=>move(idx,1)}>Down</button>
                          <button className="px-1 py-0.5 border rounded text-red-600" onClick={()=>delCard(idx)}>Delete</button>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs mb-1">Question</div>
                          <input className="w-full border rounded p-2" value={c.q || ''} onChange={(e)=>setCard(idx,{ q: e.target.value })} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs mb-1">Answer</div>
                          <input className="w-full border rounded p-2" value={c.a || ''} onChange={(e)=>setCard(idx,{ a: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cards.length===0 && <div className="text-gray-500">No cards yet. Add or use AI to suggest.</div>}
                </div>
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-500 mb-1">Live preview</div>
                  <div className="max-h-64 overflow-auto">
                    <FlashcardsViewer cards={cards.map(c=>({q:c.q||'', a:c.a||''}))} />
                  </div>
                </div>
              </div>
            )
          })()}
          {item.kind === "QUIZ" && (() => {
            type Q = any
            const list: Q[] = Array.isArray(item.data?.items) ? item.data.items : []
            const add = (type: 'MCQ' | 'TF' | 'FIB') => {
              const base: any = { id: crypto.randomUUID(), type, question: '' }
              if (type === 'MCQ') { base.options = ['', '']; base.answer = 0 }
              if (type === 'TF') base.answer = true
              if (type === 'FIB') base.answer = ''
              onChange({ data: { ...item.data, items: [...list, base] } })
            }
            const set = (idx: number, patch: any) => { const arr = [...list]; arr[idx] = { ...arr[idx], ...patch }; onChange({ data: { ...item.data, items: arr } }) }
            const del = (idx: number) => { const arr = [...list]; arr.splice(idx, 1); onChange({ data: { ...item.data, items: arr } }) }
            const move = (idx: number, dir: number) => { const arr = [...list]; const t = arr[idx + dir]; arr[idx + dir] = arr[idx]; arr[idx] = t; onChange({ data: { ...item.data, items: arr } }) }
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Quiz ({list.length})</div>
                  <div className="flex items-center gap-2">
                    <select className="border rounded p-1 text-xs" onChange={(e) => { const t = e.target.value as any; if (t) { add(t); e.currentTarget.selectedIndex = 0 } }}>
                      <option value="">+ Add</option>
                      <option value="MCQ">Multiple choice</option>
                      <option value="TF">True/False</option>
                      <option value="FIB">Fill in blank</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  {list.map((q: any, idx: number) => (
                    <div key={q.id || idx} className="border rounded-lg p-2 bg-white/70">
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>#{idx + 1} [{q.type}]</span>
                        <div className="flex gap-1">
                          <button className="px-1 py-0.5 border rounded" disabled={idx === 0} onClick={() => move(idx, -1)}>Up</button>
                          <button className="px-1 py-0.5 border rounded" disabled={idx === list.length - 1} onClick={() => move(idx, 1)}>Down</button>
                          <button className="px-1 py-0.5 border rounded text-red-600" onClick={() => del(idx)}>Delete</button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="text-xs mb-1">Question</div>
                          <input className="w-full border rounded p-2" value={q.question || ''} onChange={(e) => set(idx, { question: e.target.value })} />
                        </div>
                        {q.type === 'MCQ' && (
                          <div className="space-y-2">
                            <div className="text-xs">Options</div>
                            <div className="grid gap-1">
                              {(Array.isArray(q.options) ? q.options : ['','']).map((opt: string, oi: number) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input type="radio" name={`ans-${q.id || idx}`} checked={q.answer === oi} onChange={() => set(idx, { answer: oi })} />
                                  <input className="flex-1 border rounded p-1 text-sm" value={opt} onChange={(e) => { const opts = [...(q.options || [])]; opts[oi] = e.target.value; set(idx, { options: opts }) }} />
                                  <button className="px-2 py-1 border rounded text-xs" onClick={() => { const opts = [...(q.options || [])]; opts.splice(oi,1); set(idx, { options: opts, answer: 0 }) }}>Del</button>
                                </div>
                              ))}
                            </div>
                            <button className="px-2 py-1 border rounded text-xs" onClick={() => set(idx, { options: [...(q.options || []), ''] })}>+ Option</button>
                          </div>
                        )}
                        {q.type === 'TF' && (
                          <div className="flex items-center gap-2 text-sm">
                            <label className="flex items-center gap-1"><input type="radio" checked={q.answer === true} onChange={() => set(idx, { answer: true })} /> True</label>
                            <label className="flex items-center gap-1"><input type="radio" checked={q.answer === false} onChange={() => set(idx, { answer: false })} /> False</label>
                          </div>
                        )}
                        {q.type === 'FIB' && (
                          <div className="grid gap-1">
                            <div className="text-xs">Answer</div>
                            <input className="w-full border rounded p-1 text-sm" value={q.answer || ''} onChange={(e) => set(idx, { answer: e.target.value })} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {list.length === 0 && <div className="text-gray-500">No questions yet. Use + Add or AI.</div>}
                </div>
                <div className="border-t pt-2">
                  <div className="text-xs text-gray-500 mb-1">Live preview</div>
                  <div className="max-h-64 overflow-auto">
                    <QuizViewer items={list} />
                  </div>
                </div>
              </div>
            )
          })()}

          {item.kind === "CROSSWORD" && (() => {
            const rows = Number(item.data?.rows || 10)
            const cols = Number(item.data?.cols || 10)
            const words: any[] = Array.isArray(item.data?.words) ? item.data.words : []
            const setData = (patch: any) => onChange({ data: { ...item.data, ...patch } })
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label>Rows <input type="number" min={5} max={20} className="w-full border rounded p-1" value={rows} onChange={(e) => setData({ rows: Number(e.target.value) })} /></label>
                  <label>Cols <input type="number" min={5} max={20} className="w-full border rounded p-1" value={cols} onChange={(e) => setData({ cols: Number(e.target.value) })} /></label>
                  <div className="flex items-end"><button className="px-2 py-1 border rounded w-full" onClick={() => setData({ words: [...words, { id: crypto.randomUUID(), row: 0, col: 0, dir: 'across', answer: '', clue: '' }] })}>+ Add word</button></div>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {words.map((w: any, i: number) => (
                    <div key={w.id} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-1 items-center text-xs">
                      <input className="border rounded p-1" placeholder="Answer" value={w.answer || ''} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, answer: e.target.value.toUpperCase() }; setData({ words: arr }) }} />
                      <input className="border rounded p-1" placeholder="Clue" value={w.clue || ''} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, clue: e.target.value }; setData({ words: arr }) }} />
                      <select className="border rounded p-1" value={w.dir || 'across'} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, dir: e.target.value }; setData({ words: arr }) }}>
                        <option value="across">Across</option>
                        <option value="down">Down</option>
                      </select>
                      <input className="border rounded p-1 w-16" type="number" min={0} max={rows - 1} value={w.row || 0} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, row: Number(e.target.value) }; setData({ words: arr }) }} />
                      <input className="border rounded p-1 w-16" type="number" min={0} max={cols - 1} value={w.col || 0} onChange={(e) => { const arr = [...words]; arr[i] = { ...w, col: Number(e.target.value) }; setData({ words: arr }) }} />
                    </div>
                  ))}
                  {words.length === 0 && <div className="text-xs text-gray-500">No words yet. Use + Add above or the AI Helper in the inspector.</div>}
                </div>
                <div className="border-t pt-2">
                  <CrosswordViewer rows={rows} cols={cols} words={words} />
                </div>
              </div>
            )
          })()}
          
        </div>
      </div>
    </div>
  )
}

export default function LessonBuilder() {
  const confirmDialog = useConfirm()
  const [items, setItems] = useState<PlacedTool[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [meta, setMeta] = useState({ title: "", topic: "", grade: 3, vanta: "globe", difficulty: 2 as 1|2|3 })
  const [lessonId, setLessonId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [guides, setGuides] = useState<GuideLines>({ v: [], h: [] })
  const [zoom, setZoom] = useState(1)
  const [device, setDevice] = useState<'desktop'|'mobile'>('desktop')
  // Dynamic canvas that can grow as content expands
  const [canvasSize, setCanvasSize] = useState({ w: 1280, h: 800 })
  // Canvas panning when zoomed
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{x:number;y:number;mx:number;my:number;lastMx:number;lastMy:number;lastT:number}|null>(null)
  const inertiaRef = useRef<number | null>(null)
  // Viewport size (visible area) for proper pan clamping
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })
  const userZoomedRef = useRef(false)
  const clampPan = (z:number, p:{x:number;y:number}) => {
    const scaledW = 1280 * z
    const scaledH = canvasSize.h * z
    const minX = Math.min(0, viewportSize.w - scaledW)
    const minY = Math.min(0, viewportSize.h - scaledH)
    return { x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y)) }
  }
  useEffect(()=>{
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      try {
        const r = el.getBoundingClientRect()
        setViewportSize({ w: Math.floor(r.width), h: Math.floor(r.height) })
      } catch {}
    }
    update()
    let ro: ResizeObserver | null = null
    try {
      if ('ResizeObserver' in window) {
        ro = new ResizeObserver(() => update())
        if (el instanceof Element) ro.observe(el)
      }
    } catch {}
    window.addEventListener('resize', update)
    return () => { try { ro?.disconnect() } catch {}; window.removeEventListener('resize', update) }
  }, [])
  // Clamp pan if zoom changes
  // Auto-fit zoom on first layout; then preserve user overrides. Always clamp pan on changes.
  useEffect(()=>{
    if (!viewportSize.w || !viewportSize.h) return
    if (!userZoomedRef.current) {
      // Fit width only; min zoom is width-fit, max 100%
      const fitW = viewportSize.w / 1280
      const clampedFit = Math.max(Math.min(fitW, 1), 0.3)
      setZoom(clampedFit)
      setPan({ x: 0, y: 0 })
    } else {
      setPan(prev => clampPan(zoom, prev))
    }
  }, [viewportSize.w, viewportSize.h, canvasSize.h])
  useEffect(()=>{ setPan(prev => clampPan(zoom, prev)) }, [zoom])
  useEffect(() => {
    try { document.documentElement.setAttribute('data-canvas-scale', String(zoom)) } catch {}
    return () => { try { document.documentElement.removeAttribute('data-canvas-scale') } catch {} }
  }, [zoom])
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)
  const firstLoadRef = useRef(true)
  const { session } = useAuth()
  const [showMetaDialog, setShowMetaDialog] = useState(true)

  const addTool = (k: ToolKind) => {
    const size = defaultSize[k]
  const y = items.length ? Math.max(...items.map(i => i.y + i.h)) + 40 : 40
  const id = crypto.randomUUID()
  const next = [...items, { id, kind: k, x: 40, y, w: size.w, h: size.h, data: {} }]
  setItems(next)
  // Grow canvas if needed
  const needW = 40 + size.w + 40
  const needH = y + size.h + 40
  setCanvasSize(prev => ({ w: Math.max(prev.w, needW), h: Math.max(prev.h, needH) }))
  }

  const updateItem = (id: string, patch: Partial<PlacedTool>) => setItems(prev => prev.map(it => it.id===id? { ...it, ...patch }: it))

  const vGridLines = useMemo(() => Array.from({ length: Math.ceil((1280+400) / (gridSize*2)) + 2 }, (_, i) => i * (gridSize*2)), [gridSize])
  const hGridLines = useMemo(() => Array.from({ length: Math.ceil((canvasSize.h+800) / (gridSize*2)) + 2 }, (_, i) => i * (gridSize*2)), [gridSize, canvasSize.h])

  // Helper to request canvas growth from children
  const requestCanvasSize = useCallback((_needW:number, needH:number)=>{
    setCanvasSize(prev => {
      const h = needH > prev.h ? Math.ceil((needH + 80) / gridSize) * gridSize : prev.h
      return h === prev.h ? prev : { w: 1280, h }
    })
  }, [gridSize])

  // Load by id if in query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id || !session) return
    ;(async () => {
      try {
        const token = session.access_token
        const res = await fetch(`/api/lessons?id=${id}`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (json?.lesson) {
          setLessonId(json.lesson.id)
          const l = json.lesson
          setMeta({ title: l.title || '', topic: l.topic || '', grade: l.grade_level || 3, vanta: l.vanta_effect || 'globe', difficulty: (l.layout_json?.meta?.difficulty ?? 2) as 1|2|3 })
          setItems(Array.isArray(l.layout_json?.items) ? l.layout_json.items : [])
          // Initialize dynamic canvas height (width fixed to 1280)
          const savedH = Number(l.layout_json?.meta?.canvasHeight) || 0
          if (savedH > 0) {
            setCanvasSize({ w: 1280, h: Math.max(800, savedH) })
          } else {
            const maxH = Math.max(800, ...((l.layout_json?.items||[]).map((it:any)=> (Number(it.y)||0) + (Number(it.h)||0)) as number[]), 0)
            setCanvasSize({ w: 1280, h: Math.ceil((maxH + 40)/gridSize)*gridSize })
          }
        }
      } catch (e) {
        console.error('Failed to load lesson', e)
      }
    })()
  }, [session])

  const saveDraft = async (opts?: { silent?: boolean }): Promise<string | null> => {
  if (!session) { toast({ title: 'Sign in required', description: 'Please sign in to save your work.', variant: 'warning' }); return null }
    try {
      // Enforce required meta fields only for explicit actions (not autosave)
      if (!meta.title.trim() || !meta.topic.trim() || !meta.grade || !meta.vanta) {
  if (!opts?.silent) { setShowMetaDialog(true); toast({ title: 'Lesson settings needed', description: 'Fill in title, topic, grade, and background before saving.', variant: 'info' }) }
        return null
      }
      const token = session.access_token
      const payload = {
        id: lessonId || undefined,
        title: meta.title,
        topic: meta.topic,
        grade_level: meta.grade,
        vanta_effect: meta.vanta,
  layout_json: { items, meta: { difficulty: meta.difficulty, designWidth: 1280, designHeight: 800, canvasWidth: 1280, canvasHeight: canvasSize.h } },
        status: 'draft',
      }
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
  if (!res.ok) throw new Error(json?.error || 'Save failed')
      setLessonId(json.lesson.id)
  if (!opts?.silent) toast({ title: 'Draft saved', description: 'Your lesson was saved as a draft.', variant: 'success' })
      return json.lesson.id as string
    } catch (e:any) {
  toast({ title: 'Save failed', description: String(e.message || e), variant: 'destructive' })
      return null
    }
  }
  // Autosave when items/meta change (skip while settings dialog is open)
  useEffect(() => {
    if (firstLoadRef.current) { firstLoadRef.current = false; return }
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => { if (!showMetaDialog) saveDraft({ silent: true }) }, 1500)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [items, meta.title, meta.topic, meta.grade, meta.vanta, showMetaDialog])
  const preview = () => { sessionStorage.setItem('lessonPreview', JSON.stringify({ meta: { ...meta, designWidth: 1280, designHeight: 800, canvasWidth: 1280, canvasHeight: canvasSize.h }, items })); window.open('/lessons/preview','_blank'); toast({ title: 'Preview opened', description: 'A new tab was opened with your lesson preview.', variant: 'info' }) }
  const publish = async () => {
    if (!session) { toast({ title: 'Sign in required', description: 'Please sign in to publish your lesson.', variant: 'warning' }); return }
    try {
      // Ensure save first
  const savedId = await saveDraft({ silent: false })
  const idToPublish = savedId || lessonId
  if (!idToPublish) throw new Error('No lesson id to publish')
      const token = session.access_token
  const res = await fetch('/api/lessons/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: idToPublish }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Publish failed')
      toast({ title: 'Lesson published', description: 'Your lesson is now live for students.', variant: 'success' })
    } catch (e:any) { toast({ title: 'Publish failed', description: String(e.message || e), variant: 'destructive' }) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <div className="h-screen w-full grid" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
          <LeftPalette onAdd={addTool} onOpenSettings={()=>setShowMetaDialog(true)} />
          <div className="relative overflow-y-auto" tabIndex={0} onKeyDown={(e)=>{
            if (!selectedId || activeId) return
            const delta = e.shiftKey ? 10 : 1
            const sel = items.find(i=>i.id===selectedId)
            if (!sel) return
            // Global shortcuts
            if (e.ctrlKey && (e.key==='0' || e.code==='Digit0')) {
              e.preventDefault()
              userZoomedRef.current = true
              setZoom(1)
              setPan(prev=> clampPan(1, { x: 0, y: 0 }))
              return
            }
            if (e.ctrlKey && (e.key==='1' || e.code==='Digit1')) {
              e.preventDefault()
              userZoomedRef.current = true
              const fit = Math.min(viewportSize.w / canvasSize.w, viewportSize.h / canvasSize.h)
              const z = Math.max(0.5, Math.min(1.5, Number(fit.toFixed(2))))
              setZoom(z)
              setPan(prev=> clampPan(z, { x: 0, y: 0 }))
              return
            }
            if (e.key==='ArrowLeft') { e.preventDefault(); const nx = Math.max(0, sel.x - delta); updateItem(sel.id, { x: nx }); setCanvasSize(prev=> ({ w: prev.w, h: Math.max(prev.h, sel.y + sel.h + 40) })) }
            if (e.key==='ArrowRight') { e.preventDefault(); const nx = sel.x + delta; updateItem(sel.id, { x: nx }); setCanvasSize(prev=> ({ w: Math.max(prev.w, nx + sel.w + 40), h: Math.max(prev.h, sel.y + sel.h + 40) })) }
            if (e.key==='ArrowUp') { e.preventDefault(); const ny = Math.max(0, sel.y - delta); updateItem(sel.id, { y: ny }); setCanvasSize(prev=> ({ w: Math.max(prev.w, sel.x + sel.w + 40), h: prev.h })) }
            if (e.key==='ArrowDown') { e.preventDefault(); const ny = sel.y + delta; updateItem(sel.id, { y: ny }); setCanvasSize(prev=> ({ w: Math.max(prev.w, sel.x + sel.w + 40), h: Math.max(prev.h, ny + sel.h + 40) })) }
            if (e.key==='Delete') {
              e.preventDefault()
              confirmDialog({ title: 'Delete selected block?', actionText: 'Delete', cancelText: 'Cancel', variant: 'destructive' })
                .then(ok => {
                  if (ok) {
                    const prevItems = items
                    setItems(prev=>prev.filter(i=>i.id!==selectedId))
                    const t = toast({
                      title: 'Block deleted',
                      variant: 'success',
                      action: (
                        <ToastAction altText="Undo" onClick={() => {
                          setItems(prevItems)
                          t.dismiss()
                          toast({ title: 'Block restored', variant: 'success' })
                        }}>Undo</ToastAction>
                      ),
                    })
                  }
                })
            }
      }} onMouseDown={(e)=>{
            // clicking empty canvas clears active tool
            if (!(e.target as HTMLElement).closest('.sn-tool-content')) setActiveId(null)
      }}>
            {/* Overlay toolbar: outside canvas, always on top */}
      <div className="pointer-events-none absolute top-6 right-6 z-[60]">
              <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-white/90 px-3 py-1 text-xs shadow-lg">
                <label className="flex items-center gap-1"><input type="checkbox" checked={showGrid} onChange={(e)=>setShowGrid(e.target.checked)} /> Grid</label>
                <span className="text-gray-300">|</span>
                <label className="flex items-center gap-1"><input type="checkbox" checked={snapToGrid} onChange={(e)=>setSnapToGrid(e.target.checked)} /> Snap</label>
                <span className="text-gray-300">|</span>
                <select className="border rounded px-1 py-0.5" value={gridSize} onChange={(e)=>setGridSize(Number(e.target.value))}>
                  {[10,20,40].map(gs => <option key={gs} value={gs}>{gs}px</option>)}
                </select>
                <span className="text-gray-300">|</span>
                <button title="Zoom out" className="px-1 py-0.5 border rounded" onClick={()=>{ userZoomedRef.current = true; setZoom(z=>Math.max(0.5, Math.round((z-0.1)*10)/10)) }}><ZoomOut className="h-3.5 w-3.5"/></button>
                <span className="px-1">{Math.round(zoom*100)}%</span>
    <button title="Zoom in" className="px-1 py-0.5 border rounded" onClick={()=>{ userZoomedRef.current = true; setZoom(z=>Math.min(1.5, Math.round((z+0.1)*10)/10)) }}><ZoomIn className="h-3.5 w-3.5"/></button>
        <button title="100%" className="px-1 py-0.5 border rounded" onClick={()=>{ userZoomedRef.current = true; setZoom(1); setPan(prev=>clampPan(1,{x:0,y:0})) }}>100%</button>
  <button title="Fit" className="px-1 py-0.5 border rounded" onClick={()=>{ userZoomedRef.current = true; const fit = Math.min(viewportSize.w/canvasSize.w, viewportSize.h/canvasSize.h); const z = Math.max(0.5, Math.min(1.5, Number(fit.toFixed(2)))); setZoom(z); setPan(prev=>clampPan(z,{x:0,y:0})) }}>Fit</button>
                <span className="text-gray-300">|</span>
                <button title="Toggle device" className={`px-2 py-0.5 border rounded ${device==='mobile'?'bg-blue-50 border-blue-300':''}`} onClick={()=>setDevice(d=> d==='desktop'?'mobile':'desktop')}><MonitorSmartphone className="h-3.5 w-3.5"/></button>
              </div>
            </div>
            {/* Editor viewport */}
            <div className="relative mx-4 my-6 rounded-xl border overflow-hidden">
        {/* Visible area that we auto-fit into; wheel-zoom centers on cursor */}
        <div
          ref={viewportRef}
          className="relative flex items-center justify-center p-4 bg-transparent"
          data-canvas-scale={zoom}
          onWheel={(e)=>{
            // zoom with wheel; keep point under cursor stable
            e.preventDefault()
            const rect = viewportRef.current?.getBoundingClientRect()
            if (!rect) return
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            const z0 = zoom
            const factor = e.deltaY > 0 ? 0.9 : 1.1
            const z1 = Math.max(0.5, Math.min(1.5, Number((z0 * factor).toFixed(2))))
            if (z1 === z0) return
            userZoomedRef.current = true
            // content coord under cursor
            const cx = (mouseX - pan.x) / z0
            const cy = (mouseY - pan.y) / z0
            const newPan = { x: mouseX - cx * z1, y: mouseY - cy * z1 }
            setZoom(z1)
            setPan(clampPan(z1, newPan))
          }}
        >
                  {/* Unscaled wrapper matching design size for alignment box */}
                  <div
                    className="relative shadow-inner rounded-xl overflow-hidden bg-white/0"
                    style={{ width: 1280, height: canvasSize.h, cursor: zoom>1 ? (isPanning? 'grabbing':'grab') : 'default' }}
                    onMouseDown={(e)=>{
                      // Start panning only when clicking the wrapper itself (empty space) with primary button,
                      // or with middle button anywhere
                      const el = e.target as HTMLElement
                      const isWrapper = el === e.currentTarget
                      const overItem = !!el.closest('[data-item-root]')
                      if (e.button === 1 || (e.button === 0 && isWrapper && !overItem)) {
                        e.preventDefault()
                        // cancel any running inertia
                        if (inertiaRef.current) { cancelAnimationFrame(inertiaRef.current); inertiaRef.current = null }
                        panStartRef.current = { x: pan.x, y: pan.y, mx: e.clientX, my: e.clientY, lastMx: e.clientX, lastMy: e.clientY, lastT: performance.now() }
                        setIsPanning(true)
                        const onMove = (ev: MouseEvent) => {
                          if (!panStartRef.current) return
                          // If user moved over an item root during drag, stop panning to allow item drag
                          const target = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null
                          if (target && target.closest('[data-item-root]')) return
                          const dx = ev.clientX - panStartRef.current.mx
                          const dy = ev.clientY - panStartRef.current.my
                          // compute velocity samples
                          const now = performance.now()
                          const dt = Math.max(1, now - panStartRef.current.lastT)
                          const vx = (ev.clientX - panStartRef.current.lastMx) / dt
                          const vy = (ev.clientY - panStartRef.current.lastMy) / dt
                          panStartRef.current.lastMx = ev.clientX
                          panStartRef.current.lastMy = ev.clientY
                          panStartRef.current.lastT = now
                          // translate canvas; clamp within zoomed bounds
                          const nx = panStartRef.current.x + dx
                          const ny = panStartRef.current.y + dy
                          const scaledW = canvasSize.w * zoom
                          const scaledH = canvasSize.h * zoom
                          const minX = Math.min(0, viewportSize.w - scaledW)
                          const minY = Math.min(0, viewportSize.h - scaledH)
                          setPan({ x: Math.min(0, Math.max(minX, nx)), y: Math.min(0, Math.max(minY, ny)) })
                        }
                        const onUp = () => {
                          window.removeEventListener('mousemove', onMove)
                          window.removeEventListener('mouseup', onUp)
                          // inertia using last recorded deltas
                          const start = panStartRef.current
                          panStartRef.current = null
                          setIsPanning(false)
                          if (!start || zoom <= 1) return
                          // use last sample velocity in px/ms
                          let vx = 0, vy = 0
                          // initialize with zero; we'll compute deltas from last two samples captured in move handler
                          vx = 0; vy = 0
                          const friction = 0.92
                          const step = () => {
                            // apply velocities
                            setPan(prev => {
                              const nx = prev.x + vx * 16
                              const ny = prev.y + vy * 16
                              const scaledW = canvasSize.w * zoom
                              const scaledH = canvasSize.h * zoom
                              const minX = Math.min(0, viewportSize.w - scaledW)
                              const minY = Math.min(0, viewportSize.h - scaledH)
                              return { x: Math.min(0, Math.max(minX, nx)), y: Math.min(0, Math.max(minY, ny)) }
                            })
                            // decay
                            vx *= friction
                            vy *= friction
                            if (Math.abs(vx) < 0.02 && Math.abs(vy) < 0.02) { inertiaRef.current = null; return }
                            inertiaRef.current = requestAnimationFrame(step)
                          }
                          // seed velocity from last mousemove delta if available using a micro history via event listeners (not stored);
                          // to keep it simple we won't seed; inertia will be minimal unless we enhance with a velocity buffer later.
                          // Start only if zoomed and user was actually dragging
                          if (zoom > 1) inertiaRef.current = requestAnimationFrame(step)
                        }
                        window.addEventListener('mousemove', onMove)
                        window.addEventListener('mouseup', onUp)
                      }
                    }}
                  >
                    {/* Scaled canvas content (includes Vanta and grid) */}
          <div
                      ref={canvasRef}
                      className="relative"
                      style={{
            width: canvasSize.w,
            height: canvasSize.h,
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'top left',
                        backgroundColor: 'transparent'
                      }}
                    >
                      {/* No Vanta in builder */}
            {/* Grid overlay (allows clicks through) */}
                      {showGrid && (
                        <div
                          aria-hidden
              className="pointer-events-none absolute inset-0"
                          style={{
                            backgroundImage:
                              `repeating-linear-gradient(0deg, rgba(60,64,67,0.15) 0, rgba(60,64,67,0.15) 1px, transparent 1px, transparent ${gridSize}px),` +
                              `repeating-linear-gradient(90deg, rgba(60,64,67,0.15) 0, rgba(60,64,67,0.15) 1px, transparent 1px, transparent ${gridSize}px)`
                          }}
                        />
                      )}
                      {/* alignment guides */}
                      {guides.v.map((x,i)=>(<div key={`gv-${i}`} className="absolute top-0 bottom-0 w-px bg-rose-400/70" style={{left:x}}/>))}
                      {guides.h.map((y,i)=>(<div key={`gh-${i}`} className="absolute left-0 right-0 h-px bg-rose-400/70" style={{top:y}}/>))}
                      {/* Student viewport frame at 100% (1280×800) */}
                      <div className="pointer-events-none absolute border-2 border-indigo-300/60 rounded" style={{ width: 1280, height: 800, left: 0, top: 0 }} />
                      {/* items */}
                      {items.map(it => (
                      <Draggable
                        key={it.id}
                        item={it}
                        selected={selectedId === it.id}
                        onSelect={()=>setSelectedId(it.id)}
                        onActivate={()=>setActiveId(it.id)}
                        onChange={(p)=>updateItem(it.id,p)}
                        onConfigure={()=>setShowMetaDialog(true)}
                        onDuplicate={()=>setItems(prev=>{ const copy={...it,id:crypto.randomUUID(),y:it.y+20,x:it.x+20}; return [...prev, copy] })}
                        onDelete={async ()=>{
                          const ok = await confirmDialog({ title: 'Delete this block?', actionText: 'Delete', cancelText: 'Cancel', variant: 'destructive' })
                          if (ok) {
                            const prevItems = items
                            setItems(prev=>prev.filter(x=>x.id!==it.id))
                            const t = toast({
                              title: 'Block deleted',
                              variant: 'success',
                              action: (
                                <ToastAction altText="Undo" onClick={() => {
                                  setItems(prevItems)
                                  t.dismiss()
                                  toast({ title: 'Block restored', variant: 'success' })
                                }}>Undo</ToastAction>
                              ),
                            })
                          }
                        }}
                        onDragState={setDragging}
                        snap={snapToGrid}
                        gridSize={gridSize}
                        allItems={items}
                        onGuideChange={setGuides}
                        canvasH={canvasSize.h}
                        onCanvasNeed={requestCanvasSize}
                      />
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          </div>
          <RightInspector items={items} selectedId={selectedId} onSelect={setSelectedId} onSave={saveDraft as any} onPreview={preview} onPublish={publish as any} meta={meta} onReorder={(id, action)=>{
            setItems(prev=>{
              const arr = prev.slice()
              const idx = arr.findIndex(i=>i.id===id)
              if (idx<0) return prev
              const maxZ = Math.max(0, ...arr.map(i=>i.z ?? 0))
              const minZ = Math.min(0, ...arr.map(i=>i.z ?? 0))
              const currentZ = arr[idx].z ?? 0
              if (action==='up') arr[idx].z = currentZ + 1
              if (action==='down') arr[idx].z = currentZ - 1
              if (action==='front') arr[idx].z = maxZ + 1
              if (action==='back') arr[idx].z = minZ - 1
              return arr
            })
          }} onUpdateSelected={(patch)=>{
            if (!selectedId) return; setItems(prev=>prev.map(i=> i.id===selectedId? { ...i, ...patch }: i))
          }} />
        </div>
      </RoleGuard>

      {/* Lesson settings modal */}
      <Dialog open={showMetaDialog} onOpenChange={setShowMetaDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lesson settings</DialogTitle>
            <DialogDescription>These details are required to save your lesson. You can adjust them anytime.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <input className="border rounded p-2" placeholder="Lesson title" value={meta.title} onChange={(e)=>setMeta({...meta,title:e.target.value})} />
            <input className="border rounded p-2" placeholder="Topic" value={meta.topic} onChange={(e)=>setMeta({...meta,topic:e.target.value})} />
            <div className="grid grid-cols-3 gap-2">
              <select className="border rounded p-2" value={meta.grade} onChange={(e)=>setMeta({...meta,grade:Number(e.target.value)})}>
                {[1,2,3,4,5,6].map(g=> <option key={g} value={g}>{`Grade ${g}`}</option>)}
              </select>
              <select className="border rounded p-2" value={meta.vanta} onChange={(e)=>setMeta({...meta,vanta:e.target.value})}>
                {['globe','birds','halo','net','topology','clouds2','rings','cells','waves'].map(v=> <option key={v} value={v}>{v}</option>)}
              </select>
              <select className="border rounded p-2" value={meta.difficulty} onChange={(e)=>setMeta({...meta,difficulty: Number(e.target.value) as 1|2|3})}>
                <option value={1}>Easy</option>
                <option value={2}>Moderate</option>
                <option value={3}>Challenging</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setShowMetaDialog(false)}>Close</Button>
              <Button onClick={()=>setShowMetaDialog(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
