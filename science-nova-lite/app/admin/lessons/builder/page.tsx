"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import { VantaBackground } from "@/components/vanta-background"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export type ToolKind = "TEXT" | "FLASHCARDS" | "QUIZ" | "CROSSWORD"

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
}

function LeftPalette({ onAdd }: { onAdd: (k: ToolKind) => void }) {
  const btn = "w-full rounded-full py-2 border bg-white/70 hover:bg-white/90 transition"
  return (
    <aside className="w-14 md:w-56 shrink-0 p-3 md:p-4 bg-white/50 backdrop-blur border-r">
      <div className="hidden md:block font-semibold mb-2">Tools</div>
      <div className="grid gap-3">
        <button className={btn} onClick={() => onAdd("TEXT")}>Text Box</button>
        <button className={btn} onClick={() => onAdd("FLASHCARDS")}>Flashcards</button>
        <button className={btn} onClick={() => onAdd("QUIZ")}>Quizzes</button>
        <button className={btn} onClick={() => onAdd("CROSSWORD")}>Crossword</button>
      </div>
    </aside>
  )
}

function RightInspector({ items, selectedId, onSelect, onSave, onPreview, onPublish, onUpdateSelected, meta, onReorder }: { items: PlacedTool[]; selectedId: string | null; onSelect: (id: string) => void; onSave: () => void; onPreview: () => void; onPublish: () => void; onUpdateSelected: (patch: any) => void; meta: { title: string; topic: string; grade: number; vanta: string }; onReorder: (id: string, action: 'up'|'down'|'front'|'back') => void }) {
  return (
    <aside className="w-64 shrink-0 p-4 bg-white/60 backdrop-blur border-l">
      <div className="flex gap-2 mb-3">
        <Button variant="outline" onClick={onSave}>Save</Button>
        <Button onClick={onPreview}>Preview</Button>
      </div>
      <Button variant="ghost" className="w-full mb-4 border" onClick={onPublish}>Publish</Button>
      <div className="font-semibold mb-2">Layers</div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {items
          .slice()
          .sort((a,b)=> (b.z ?? 0) - (a.z ?? 0))
          .map(it => (
          <div key={it.id} className={`w-full px-2 py-2 rounded border ${selectedId===it.id? 'bg-blue-50 border-blue-300' : 'bg-white/70 hover:bg-white'}`}>
            <div className="flex items-center gap-2">
              <button onClick={() => onSelect(it.id)} className="flex-1 text-left">
                <div className="text-sm">{it.kind} • {Math.round(it.x)},{Math.round(it.y)}</div>
                <div className="text-[10px] text-gray-500">z: {it.z ?? 0}</div>
              </button>
              <div className="flex items-center gap-1">
                <button title="Bring forward" className="px-1 py-0.5 border rounded" onClick={()=>onReorder(it.id,'up')}>▲</button>
                <button title="Send backward" className="px-1 py-0.5 border rounded" onClick={()=>onReorder(it.id,'down')}>▼</button>
              </div>
            </div>
            {selectedId===it.id && (
              <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
                <button className="border rounded px-1 py-0.5" onClick={()=>onReorder(it.id,'front')}>Front</button>
                <button className="border rounded px-1 py-0.5" onClick={()=>onReorder(it.id,'back')}>Back</button>
              </div>
            )}
          </div>
        ))}
        {items.length===0 && <div className="text-sm text-gray-500">No tools yet.</div>}
      </div>
      {/* Properties */}
      {selectedId && (() => {
        const sel = items.find(i=>i.id===selectedId)
        if (!sel) return null
        return (
          <div className="mt-4">
            <div className="font-semibold mb-2">Properties</div>
            {sel.kind === 'TEXT' && (
              <div className="space-y-2">
                <textarea className="w-full border rounded p-2" rows={4} placeholder="Lesson text" value={sel.data?.text || ''} onChange={(e)=>onUpdateSelected({ data: { ...sel.data, text: e.target.value }})} />
                <button className="w-full px-2 py-1 border rounded" onClick={async()=>{
                  const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'TEXT', grade: meta.grade, topic: meta.topic, prompt: 'Write one concise paragraph.' }) })
                  const json = await res.json()
                  if (json?.text) onUpdateSelected({ data: { ...sel.data, text: (sel.data?.text? sel.data.text+'\n\n': '') + json.text } })
                }}>AI: Generate text</button>
              </div>
            )}
            {sel.kind === 'FLASHCARDS' && (()=>{
              const cards: Array<{q:string;a:string}> = Array.isArray(sel.data?.cards) ? sel.data.cards : []
              const updateCards = (arr: Array<{q:string;a:string}>) => onUpdateSelected({ data: { ...sel.data, cards: arr }})
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Cards ({cards.length})</div>
                    <button className="px-2 py-1 border rounded" onClick={()=>updateCards([...cards, { q:'', a:'' }])}>+ Add</button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {cards.map((c, idx)=> (
                      <div key={idx} className="border rounded p-2 bg-white/80">
                        <div className="flex items-center justify-between mb-1 text-xs text-gray-500">
                          <div>#{idx+1}</div>
                          <div className="flex gap-2">
                            <button className="px-1 py-0.5 border rounded" disabled={idx===0} onClick={()=>{ const arr=[...cards]; const t=arr[idx-1]; arr[idx-1]=arr[idx]; arr[idx]=t; updateCards(arr) }}>Up</button>
                            <button className="px-1 py-0.5 border rounded" disabled={idx===cards.length-1} onClick={()=>{ const arr=[...cards]; const t=arr[idx+1]; arr[idx+1]=arr[idx]; arr[idx]=t; updateCards(arr) }}>Down</button>
                            <button className="px-1 py-0.5 border rounded text-red-600" onClick={()=>{ const arr=[...cards]; arr.splice(idx,1); updateCards(arr) }}>Delete</button>
                          </div>
                        </div>
                        <input className="w-full border rounded p-2 mb-1" placeholder="Question" value={c.q} onChange={(e)=>{ const arr=[...cards]; arr[idx] = { ...arr[idx], q: e.target.value }; updateCards(arr) }} />
                        <input className="w-full border rounded p-2" placeholder="Answer" value={c.a} onChange={(e)=>{ const arr=[...cards]; arr[idx] = { ...arr[idx], a: e.target.value }; updateCards(arr) }} />
                      </div>
                    ))}
                    {cards.length===0 && <div className="text-sm text-gray-500">No cards yet.</div>}
                  </div>
                  <button className="w-full px-2 py-1 border rounded" onClick={async()=>{
                    const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'FLASHCARDS', grade: meta.grade, topic: meta.topic }) })
                    const json = await res.json()
                    if (Array.isArray(json?.cards)) updateCards([...(cards||[]), ...json.cards])
                  }}>AI: Suggest flashcards</button>
                </div>
              )
            })()}
            {sel.kind === 'QUIZ' && (()=>{
              type QuizItem = { type: 'MCQ'|'TF'|'FIB'; question: string; options?: string[]; answer?: string|boolean }
              const items: QuizItem[] = Array.isArray(sel.data?.items) ? sel.data.items : []
              const update = (arr: QuizItem[]) => onUpdateSelected({ data: { ...sel.data, items: arr } })
              const add = (type: QuizItem['type']) => {
                if (type === 'MCQ') update([...(items||[]), { type:'MCQ', question:'', options:['',''], answer:'' }])
                if (type === 'TF') update([...(items||[]), { type:'TF', question:'', answer:true }])
                if (type === 'FIB') update([...(items||[]), { type:'FIB', question:'', answer:'' }])
              }
              const onAi = async () => {
                const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'QUIZ', grade: meta.grade, topic: meta.topic }) })
                const json = await res.json()
                if (Array.isArray(json?.items)) {
                  // Normalize
                  const mapped: QuizItem[] = json.items.map((it: any) => {
                    if (it.type === 'MCQ') return { type:'MCQ', question: it.question || '', options: Array.isArray(it.options)? it.options: [], answer: it.answer ?? '' }
                    if (it.type === 'TF') return { type:'TF', question: it.question || '', answer: !!it.answer }
                    return { type:'FIB', question: it.question || '', answer: it.answer || '' }
                  })
                  update([...(items||[]), ...mapped])
                }
              }
              function exportQuiz() {
                const data = JSON.stringify(items || [], null, 2)
                navigator.clipboard.writeText(data)
                alert('Quiz items copied to clipboard as JSON')
              }
              function importQuiz() {
                const input = prompt('Paste quiz items JSON:')
                if (!input) return
                try {
                  const arr = JSON.parse(input)
                  if (Array.isArray(arr)) update(arr)
                } catch { alert('Invalid JSON') }
              }
              return (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>add('MCQ')}>+ MCQ</button>
                    <button className="px-2 py-1 border rounded" onClick={()=>add('TF')}>+ True/False</button>
                    <button className="px-2 py-1 border rounded" onClick={()=>add('FIB')}>+ Fill-in</button>
                    <button className="ml-auto px-2 py-1 border rounded" onClick={onAi}>AI: Suggest quiz</button>
                    <button className="px-2 py-1 border rounded" onClick={exportQuiz}>Export</button>
                    <button className="px-2 py-1 border rounded" onClick={importQuiz}>Import</button>
                  </div>
                    {items.map((q, idx)=> (
                      <div key={idx} className="border rounded p-2 bg-white/80">
                        <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                          <div>#{idx+1} • {q.type}</div>
                          <div className="flex gap-2">
                            <button className="px-1 py-0.5 border rounded" disabled={idx===0} onClick={()=>{ const arr=[...items]; const t=arr[idx-1]; arr[idx-1]=arr[idx]; arr[idx]=t; update(arr) }}>Up</button>
                            <button className="px-1 py-0.5 border rounded" disabled={idx===items.length-1} onClick={()=>{ const arr=[...items]; const t=arr[idx+1]; arr[idx+1]=arr[idx]; arr[idx]=t; update(arr) }}>Down</button>
                            <button className="px-1 py-0.5 border rounded text-red-600" onClick={()=>{ const arr=[...items]; arr.splice(idx,1); update(arr) }}>Delete</button>
                          </div>
                        </div>
                        <input className="w-full border rounded p-2 mb-2" placeholder="Question" value={q.question} onChange={(e)=>{ const arr=[...items]; arr[idx] = { ...arr[idx], question: e.target.value }; update(arr) }} />
                        {q.type==='MCQ' && (
                          <div className="space-y-1">
                            {(q.options || []).map((opt, oi)=> (
                              <div key={oi} className="flex items-center gap-2">
                                <input className="border rounded p-1 flex-1" placeholder={`Option ${oi+1}`} value={opt} onChange={(e)=>{ const arr=[...items]; const ops=[...(arr[idx].options||[])]; ops[oi]=e.target.value; arr[idx] = { ...arr[idx], options: ops }; update(arr) }} />
                                <label className="text-xs flex items-center gap-1"><input type="radio" name={`ans-${idx}`} checked={q.answer===opt} onChange={()=>{ const arr=[...items]; arr[idx] = { ...arr[idx], answer: opt }; update(arr) }} /> Correct</label>
                                <button className="px-1 py-0.5 border rounded" onClick={()=>{ const arr=[...items]; const ops=[...(arr[idx].options||[])]; ops.splice(oi,1); arr[idx] = { ...arr[idx], options: ops }; update(arr) }}>×</button>
                              </div>
                            ))}
                            <button className="px-2 py-1 border rounded" onClick={()=>{ const arr=[...items]; const ops=[...(arr[idx].options||[])]; ops.push(''); arr[idx] = { ...arr[idx], options: ops }; update(arr) }}>+ Option</button>
                          </div>
                        )}
                        {q.type==='TF' && (
                          <div className="flex items-center gap-3 text-xs">
                            <label className="flex items-center gap-1"><input type="radio" name={`tf-${idx}`} checked={q.answer===true} onChange={()=>{ const arr=[...items]; arr[idx] = { ...arr[idx], answer: true }; update(arr) }} /> True</label>
                            <label className="flex items-center gap-1"><input type="radio" name={`tf-${idx}`} checked={q.answer===false} onChange={()=>{ const arr=[...items]; arr[idx] = { ...arr[idx], answer: false }; update(arr) }} /> False</label>
                          </div>
                        )}
                        {q.type==='FIB' && (
                          <input className="w-full border rounded p-2" placeholder="Answer" value={(q.answer as string) || ''} onChange={(e)=>{ const arr=[...items]; arr[idx] = { ...arr[idx], answer: e.target.value }; update(arr) }} />
                        )}
                      </div>
                    ))}
                    {items.length===0 && <div className="text-sm text-gray-500">No quiz items yet.</div>}
                  </div>
              )
            })()}
            {sel.kind === 'CROSSWORD' && (()=>{
              type CWWord = { id: string; row: number; col: number; dir: 'across'|'down'; answer: string; clue?: string }
              const rows = Number(sel.data?.rows || 10)
              const cols = Number(sel.data?.cols || 10)
              const words: CWWord[] = Array.isArray(sel.data?.words) ? sel.data.words : []
              const update = (patch: any) => onUpdateSelected({ data: { rows, cols, words, ...sel.data, ...patch }})
              const addWord = () => update({ words: [...words, { id: crypto.randomUUID(), row: 0, col: 0, dir: 'across', answer: '', clue: '' }] })
              const aiSuggest = async () => {
                const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'CROSSWORD', grade: meta.grade, topic: meta.topic }) })
                const json = await res.json()
                if (Array.isArray(json?.words)) {
                  const newOnes = json.words.slice(0, 10 - words.length).map((w:string)=> ({ id: crypto.randomUUID(), row: 0, col: 0, dir: 'across', answer: (w||'').toUpperCase(), clue: '' }))
                  update({ words: [...words, ...newOnes] })
                }
              }
              function exportCrossword() {
                const data = JSON.stringify({ rows, cols, words }, null, 2)
                navigator.clipboard.writeText(data)
                alert('Crossword copied to clipboard as JSON')
              }
              function importCrossword() {
                const input = prompt('Paste crossword JSON:')
                if (!input) return
                try {
                  const obj = JSON.parse(input)
                  if (typeof obj==='object' && Array.isArray(obj.words)) update({ rows: obj.rows||10, cols: obj.cols||10, words: obj.words })
                } catch { alert('Invalid JSON') }
              }
              // Simple validation: out-of-bounds and cell conflicts
              const conflicts: Array<string> = []
              const cellMap = new Map<string, string>()
              for (const w of words) {
                const ans = (w.answer||'').toUpperCase()
                for (let k=0;k<ans.length;k++){
                  const r = w.dir==='down'? w.row+k : w.row
                  const c = w.dir==='across'? w.col+k : w.col
                  if (r<0||r>=rows||c<0||c>=cols){ conflicts.push(`Word ${w.answer} out of bounds`) ; break }
                  const key = `${r},${c}`
                  const prev = cellMap.get(key)
                  if (!prev) cellMap.set(key, ans[k])
                  else if (prev!==ans[k]) { conflicts.push(`Conflict at (${r+1},${c+1}) between letters ${prev}/${ans[k]}`); break }
                }
              }
              return (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">Rows <input type="number" min={5} max={20} className="border rounded p-1 w-20" value={rows} onChange={(e)=>update({ rows: Number(e.target.value) })} /></label>
                    <label className="flex items-center gap-2">Cols <input type="number" min={5} max={20} className="border rounded p-1 w-20" value={cols} onChange={(e)=>update({ cols: Number(e.target.value) })} /></label>
                  </div>
                  <div className={`text-xs ${conflicts.length? 'text-red-600':'text-green-700'}`}>
                    {conflicts.length? `${conflicts.length} issues found` : 'No conflicts detected'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={addWord}>+ Add word</button>
                    <button className="px-2 py-1 border rounded" onClick={aiSuggest}>AI: Suggest words</button>
                    <button className="px-2 py-1 border rounded" onClick={exportCrossword}>Export</button>
                    <button className="px-2 py-1 border rounded" onClick={importCrossword}>Import</button>
                  </div>
                  <div className="max-h-64 overflow-auto space-y-2 pr-1">
                    {words.map((w, idx)=> (
                      <div key={w.id} className="border rounded p-2 bg-white/80">
                        <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                          <div>#{idx+1} • {w.dir.toUpperCase()}</div>
                          <div className="flex gap-2">
                            <button className="px-1 py-0.5 border rounded" disabled={idx===0} onClick={()=>{ const arr=[...words]; const t=arr[idx-1]; arr[idx-1]=arr[idx]; arr[idx]=t; update({ words: arr }) }}>Up</button>
                            <button className="px-1 py-0.5 border rounded" disabled={idx===words.length-1} onClick={()=>{ const arr=[...words]; const t=arr[idx+1]; arr[idx+1]=arr[idx]; arr[idx]=t; update({ words: arr }) }}>Down</button>
                            <button className="px-1 py-0.5 border rounded text-red-600" onClick={()=>{ const arr=[...words]; arr.splice(idx,1); update({ words: arr }) }}>Delete</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs">Row <input type="number" min={0} max={rows-1} className="w-full border rounded p-1" value={w.row} onChange={(e)=>{ const arr=[...words]; arr[idx] = { ...arr[idx], row: Number(e.target.value) }; update({ words: arr }) }} /></label>
                          <label className="text-xs">Col <input type="number" min={0} max={cols-1} className="w-full border rounded p-1" value={w.col} onChange={(e)=>{ const arr=[...words]; arr[idx] = { ...arr[idx], col: Number(e.target.value) }; update({ words: arr }) }} /></label>
                          <label className="text-xs">Dir
                            <select className="w-full border rounded p-1" value={w.dir} onChange={(e)=>{ const arr=[...words]; arr[idx] = { ...arr[idx], dir: e.target.value as any }; update({ words: arr }) }}>
                              <option value="across">across</option>
                              <option value="down">down</option>
                            </select>
                          </label>
                          <label className="text-xs">Answer <input className="w-full border rounded p-1 uppercase" value={w.answer} onChange={(e)=>{ const arr=[...words]; arr[idx] = { ...arr[idx], answer: e.target.value.toUpperCase() }; update({ words: arr }) }} /></label>
                          <label className="col-span-2 text-xs">Clue <input className="w-full border rounded p-1" value={w.clue || ''} onChange={(e)=>{ const arr=[...words]; arr[idx] = { ...arr[idx], clue: e.target.value }; update({ words: arr }) }} /></label>
                        </div>
                      </div>
                    ))}
                    {words.length===0 && <div className="text-sm text-gray-500">No words yet. Add or use AI to suggest.</div>}
                  </div>
                </div>
              )
            })()}
          </div>
        )
      })()}
    </aside>
  )
}

type GuideLines = { v: number[]; h: number[] }
function Draggable({ item, onChange, selected, onSelect, onConfigure, onDuplicate, onDelete, onDragState, snap, gridSize, allItems, onGuideChange }: { item: PlacedTool; onChange: (p: Partial<PlacedTool>) => void; selected: boolean; onSelect: () => void; onConfigure: () => void; onDuplicate: () => void; onDelete: () => void; onDragState: (dragging: boolean) => void; snap: boolean; gridSize: number; allItems: PlacedTool[]; onGuideChange: (g: GuideLines) => void }) {
  const start = useRef<{x:number;y:number;w:number;h:number;mx:number;my:number;resizing:boolean} | null>(null)
  const threshold = 6

  const onMouseDown = (e: React.MouseEvent) => {
    onSelect();
    start.current = { x: item.x, y: item.y, w: item.w, h: item.h, mx: e.clientX, my: e.clientY, resizing: (e.target as HTMLElement).dataset.handle === 'se' }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    onDragState(true)
  }
  const onMove = (e: MouseEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.mx
    const dy = e.clientY - start.current.my
    const guides: GuideLines = { v: [], h: [] }
    const others = allItems.filter(i=>i.id!==item.id)
    if (start.current.resizing) {
      let nw = Math.max(240, start.current.w + dx)
      let nh = Math.max(140, start.current.h + dy)
      if (snap) {
        nw = Math.round(nw / gridSize) * gridSize
        nh = Math.round(nh / gridSize) * gridSize
      }
      // Align to neighbor right/bottom edges
      const L = item.x, T = item.y
      const R = L + nw, B = T + nh
      for (const it of others) {
        const l = it.x, r = it.x + it.w, cx = it.x + it.w/2
        const t = it.y, b = it.y + it.h, cy = it.y + it.h/2
        if (Math.abs(R - l) <= threshold) { nw = l - L; guides.v.push(l) }
        if (Math.abs(R - r) <= threshold) { nw = r - L; guides.v.push(r) }
        if (Math.abs(B - t) <= threshold) { nh = t - T; guides.h.push(t) }
        if (Math.abs(B - b) <= threshold) { nh = b - T; guides.h.push(b) }
        if (Math.abs(R - cx) <= threshold) { nw = cx - L; guides.v.push(cx) }
        if (Math.abs(B - cy) <= threshold) { nh = cy - T; guides.h.push(cy) }
      }
      onGuideChange(guides)
      onChange({ w: nw, h: nh })
    } else {
      const nx = Math.max(0, start.current.x + dx)
      const ny = Math.max(0, start.current.y + dy)
      // Alignment to neighbors (left/right/centerX and top/bottom/centerY)
      let ax = nx, ay = ny
      const L = ax, T = ay, R = L + item.w, B = T + item.h
      for (const it of others) {
        const l = it.x, r = it.x + it.w, cx = it.x + it.w/2
        const t = it.y, b = it.y + it.h, cy = it.y + it.h/2
        if (Math.abs(L - l) <= threshold) { ax = l; guides.v.push(l) }
        if (Math.abs(L - r) <= threshold) { ax = r; guides.v.push(r) }
        if (Math.abs(R - r) <= threshold) { ax = r - item.w; guides.v.push(r) }
        if (Math.abs(R - l) <= threshold) { ax = l - item.w; guides.v.push(l) }
        if (Math.abs(L + item.w/2 - cx) <= threshold) { ax = cx - item.w/2; guides.v.push(cx) }

        if (Math.abs(T - t) <= threshold) { ay = t; guides.h.push(t) }
        if (Math.abs(T - b) <= threshold) { ay = b; guides.h.push(b) }
        if (Math.abs(B - b) <= threshold) { ay = b - item.h; guides.h.push(b) }
        if (Math.abs(B - t) <= threshold) { ay = t - item.h; guides.h.push(t) }
        if (Math.abs(T + item.h/2 - cy) <= threshold) { ay = cy - item.h/2; guides.h.push(cy) }
      }
      if (snap) {
        onChange({ x: Math.round(ax / gridSize) * gridSize, y: Math.round(ay / gridSize) * gridSize })
      } else {
        onChange({ x: ax, y: ay })
      }
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
  className={`absolute shadow-sm ${selected? 'ring-2 ring-blue-400': ''}`}
  style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.z ?? 0 }}
      onMouseDown={onMouseDown}
    >
      <div className="h-full w-full bg-white/80 backdrop-blur border rounded-xl overflow-hidden">
        <div className="h-8 px-3 flex items-center justify-between text-xs text-gray-600 border-b bg-white/70">
          <div className="flex items-center gap-2">
            <span>{item.kind}</span>
            <button onClick={(e)=>{e.stopPropagation();onConfigure();}} className="px-2 py-0.5 rounded border hover:bg-white">Configure</button>
            <button onClick={(e)=>{e.stopPropagation();onDuplicate();}} className="px-2 py-0.5 rounded border hover:bg-white">Duplicate</button>
            <button onClick={(e)=>{e.stopPropagation();onDelete();}} className="px-2 py-0.5 rounded border hover:bg-white text-red-600">Delete</button>
          </div>
          <button data-handle="se" className="w-3 h-3 rounded-sm bg-gray-400" title="Resize from bottom-right" />
        </div>
        <div className="p-3 text-sm text-gray-700 h-[calc(100%-2rem)] overflow-auto">
          {item.kind === "TEXT" && (
            <div className="prose max-w-none opacity-80">
              <p>{item.data?.text || 'Sample text…'}</p>
            </div>
          )}
          {item.kind === "FLASHCARDS" && (() => {
            const cards = Array.isArray(item.data?.cards) ? item.data.cards : []
            return (
              <div>
                <div className="font-semibold">Flashcards ({cards.length || 0})</div>
                {cards.length ? (
                  <ul className="list-disc pl-5">
                    {cards.slice(0, 2).map((c:any, i:number) => (
                      <li key={i}><span className="font-medium">Q</span>: {c.q || '—'} <span className="ml-2 font-medium">A</span>: {c.a || '—'}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No cards yet</div>
                )}
              </div>
            )
          })()}
          {item.kind === "QUIZ" && (() => {
            const q = Array.isArray(item.data?.items) ? item.data.items : []
            return (
              <div>
                <div className="font-semibold">Quiz ({q.length || 0})</div>
                {q.length ? (
                  <ul className="list-decimal pl-5">
                    {q.slice(0,2).map((qi:any, i:number) => (
                      <li key={i}>{qi.question || 'Untitled'} <span className="text-xs text-gray-500">[{qi.type}]</span></li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No questions yet</div>
                )}
              </div>
            )
          })()}
          {item.kind === "CROSSWORD" && (() => {
            const rows = Number(item.data?.rows || 10)
            const cols = Number(item.data?.cols || 10)
            const words = Array.isArray(item.data?.words) ? item.data.words : []
            return (
              <div>
                <div className="font-semibold">Crossword {rows}×{cols}</div>
                {words.length ? (
                  <div className="text-xs text-gray-600">{words.length} words</div>
                ) : (
                  <div className="text-gray-500">No words yet</div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default function LessonBuilder() {
  const [items, setItems] = useState<PlacedTool[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [meta, setMeta] = useState({ title: "", topic: "", grade: 3, vanta: "globe", difficulty: 2 as 1|2|3 })
  const [lessonId, setLessonId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [guides, setGuides] = useState<GuideLines>({ v: [], h: [] })
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)
  const firstLoadRef = useRef(true)
  const { session } = useAuth()

  const addTool = (k: ToolKind) => {
    const size = defaultSize[k]
    const y = items.length ? Math.max(...items.map(i => i.y + i.h)) + 40 : 40
    setItems([...items, { id: crypto.randomUUID(), kind: k, x: 40, y, w: size.w, h: size.h, data: {} }])
  }

  const updateItem = (id: string, patch: Partial<PlacedTool>) => setItems(prev => prev.map(it => it.id===id? { ...it, ...patch }: it))

  const vGridLines = useMemo(() => Array.from({ length: Math.ceil(1200 / (gridSize*2)) + 2 }, (_, i) => i * (gridSize*2)), [gridSize])
  const hGridLines = useMemo(() => Array.from({ length: Math.ceil(2400 / (gridSize*2)) + 2 }, (_, i) => i * (gridSize*2)), [gridSize])

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
        }
      } catch (e) {
        console.error('Failed to load lesson', e)
      }
    })()
  }, [session])

  const saveDraft = async (opts?: { silent?: boolean }): Promise<string | null> => {
    if (!session) { alert('Sign in required'); return null }
    try {
      const token = session.access_token
      const payload = {
        id: lessonId || undefined,
        title: meta.title,
        topic: meta.topic,
        grade_level: meta.grade,
        vanta_effect: meta.vanta,
  layout_json: { items, meta: { difficulty: meta.difficulty } },
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
      if (!opts?.silent) alert('Draft saved')
      return json.lesson.id as string
    } catch (e:any) {
      alert(`Save error: ${e.message}`)
      return null
    }
  }
  // Autosave when items/meta change
  useEffect(() => {
    if (firstLoadRef.current) { firstLoadRef.current = false; return }
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => { saveDraft({ silent: true }) }, 1500)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [items, meta.title, meta.topic, meta.grade, meta.vanta])
  const preview = () => { sessionStorage.setItem('lessonPreview', JSON.stringify({ meta, items })); window.open('/lessons/preview','_blank') }
  const publish = async () => {
    if (!session) { alert('Sign in required'); return }
    try {
      // Ensure save first
  const savedId = await saveDraft()
  const idToPublish = savedId || lessonId
  if (!idToPublish) throw new Error('No lesson id to publish')
      const token = session.access_token
  const res = await fetch('/api/lessons/publish', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: idToPublish }) })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Publish failed')
      alert('Published')
    } catch (e:any) { alert(`Publish error: ${e.message}`) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <div className="h-screen w-full grid" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
          <LeftPalette onAdd={addTool} />
          <div className="relative overflow-y-auto" tabIndex={0} onKeyDown={(e)=>{
            if (!selectedId) return
            const delta = e.shiftKey ? 10 : 1
            const sel = items.find(i=>i.id===selectedId)
            if (!sel) return
            if (e.key==='ArrowLeft') { e.preventDefault(); updateItem(sel.id, { x: Math.max(0, sel.x - delta) }) }
            if (e.key==='ArrowRight') { e.preventDefault(); updateItem(sel.id, { x: sel.x + delta }) }
            if (e.key==='ArrowUp') { e.preventDefault(); updateItem(sel.id, { y: Math.max(0, sel.y - delta) }) }
            if (e.key==='ArrowDown') { e.preventDefault(); updateItem(sel.id, { y: sel.y + delta }) }
            if (e.key==='Delete') { e.preventDefault(); if (confirm('Delete selected block?')) setItems(prev=>prev.filter(i=>i.id!==selectedId)) }
          }}>
            <div className="sticky top-0 z-10 m-3 rounded-xl border bg-white/70 backdrop-blur p-3 grid gap-3 grid-cols-1 md:grid-cols-8">
              <input className="border rounded p-2" placeholder="Lesson title" value={meta.title} onChange={(e)=>setMeta({...meta,title:e.target.value})} />
              <input className="border rounded p-2" placeholder="Topic" value={meta.topic} onChange={(e)=>setMeta({...meta,topic:e.target.value})} />
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
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-1"><input type="checkbox" checked={showGrid} onChange={(e)=>setShowGrid(e.target.checked)} /> Grid</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={snapToGrid} onChange={(e)=>setSnapToGrid(e.target.checked)} /> Snap</label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-1">Grid
                  <select className="border rounded p-1 ml-1" value={gridSize} onChange={(e)=>setGridSize(Number(e.target.value))}>
                    {[10,20,40].map(gs => <option key={gs} value={gs}>{gs}px</option>)}
                  </select>
                </label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>{ void saveDraft() }}>Save</Button>
                <Button onClick={preview}>Preview</Button>
              </div>
            </div>
            {/* Vanta only inside the canvas container */}
            <div className="relative mx-auto my-6 rounded-xl max-w-[1200px] border overflow-hidden">
              <VantaBackground scoped effect={meta.vanta}>
                <div ref={canvasRef} className="relative min-h-[2400px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  {/* gridlines */}
                  {showGrid && hGridLines.map((y,i)=> <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-dashed" style={{ top: y, borderColor: dragging? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }} />)}
                  {showGrid && vGridLines.map((x,i)=> <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-dashed" style={{ left: x, borderColor: dragging? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)' }} />)}

                  {/* alignment guides */}
                  {guides.v.map((x, i)=> <div key={`gv-${i}`} className="absolute top-0 bottom-0 border-l border-red-400/70" style={{ left: x }} />)}
                  {guides.h.map((y, i)=> <div key={`gh-${i}`} className="absolute left-0 right-0 border-t border-red-400/70" style={{ top: y }} />)}

          {items
                    .slice()
                    .sort((a,b)=> (a.z ?? 0) - (b.z ?? 0))
                    .map(it => (
                    <Draggable
                      key={it.id}
                      item={it}
                      selected={selectedId===it.id}
                      onSelect={()=>{ setSelectedId(it.id); /* bring to front */
                        setItems(prev=>{
                          const maxZ = Math.max(0, ...prev.map(p=>p.z ?? 0))
                          return prev.map(p=> p.id===it.id ? { ...p, z: (maxZ+1) } : p)
                        })
                      }}
                      onChange={(p)=>updateItem(it.id,p)}
                      onConfigure={()=>alert('Open configure panel (coming next)')}
                      onDuplicate={()=>setItems(prev=>{ const copy={...it,id:crypto.randomUUID(),y:it.y+20,x:it.x+20}; return [...prev, copy] })}
                      onDelete={()=>{ if (confirm('Delete this block?')) setItems(prev=>prev.filter(x=>x.id!==it.id)) }}
                      onDragState={setDragging}
            snap={snapToGrid}
            gridSize={gridSize}
            allItems={items}
            onGuideChange={setGuides}
                    />
                  ))}
                </div>
              </VantaBackground>
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
    </div>
  )
}
