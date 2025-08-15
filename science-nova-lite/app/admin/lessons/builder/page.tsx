"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type React from "react"
import { RoleGuard } from "@/components/layout/role-guard"
import { VantaBackground } from "@/components/vanta-background"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Boxes, Cog, FileText, Grid3X3, HelpCircle, Layers, Plus, Shuffle, Type } from "lucide-react"
import { FlashcardsViewer } from "@/components/flashcards-viewer"
import { QuizViewer } from "@/components/quiz-viewer"
import { CrosswordViewer } from "@/components/crossword-viewer"

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
      </div>
    </aside>
  )
}

function RightInspector({ items, selectedId, onSelect, onSave, onPreview, onPublish, onUpdateSelected, meta, onReorder }: { items: PlacedTool[]; selectedId: string | null; onSelect: (id: string) => void; onSave: () => void; onPreview: () => void; onPublish: () => void; onUpdateSelected: (patch: any) => void; meta: { title: string; topic: string; grade: number; vanta: string }; onReorder: (id: string, action: 'up'|'down'|'front'|'back') => void }) {
  const iconFor = (k: ToolKind) => k==='TEXT'? <Type className="h-3.5 w-3.5 text-sky-600"/> : k==='FLASHCARDS'? <Boxes className="h-3.5 w-3.5 text-emerald-600"/> : k==='QUIZ'? <HelpCircle className="h-3.5 w-3.5 text-violet-600"/> : <Grid3X3 className="h-3.5 w-3.5 text-amber-600"/>
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
        {sel && sel.kind !== 'CROSSWORD' && (
          <div className="text-[11px] text-gray-600">Most settings are edited directly on the tool in the canvas. AI helpers are inside each tool.</div>
        )}
        {sel && sel.kind === 'CROSSWORD' && (()=>{
          const rows = Number(sel.data?.rows || 10)
          const cols = Number(sel.data?.cols || 10)
          const words = Array.isArray(sel.data?.words) ? sel.data.words : []
          const update = (patch:any)=> onUpdateSelected({ data: { ...sel.data, ...patch } })
          const setWords = (arr:any[])=> onUpdateSelected({ data: { ...sel.data, words: arr } })
          const addWord = ()=> setWords([...(words||[]), { id: crypto.randomUUID(), row:0, col:0, dir:'across', answer:'', clue:'' }])
          return (
            <div className="space-y-2">
              <label className="text-xs">Rows <input type="number" min={5} max={20} className="w-full border rounded p-1" value={rows} onChange={(e)=>update({ rows: Number(e.target.value) })} /></label>
              <label className="text-xs">Cols <input type="number" min={5} max={20} className="w-full border rounded p-1" value={cols} onChange={(e)=>update({ cols: Number(e.target.value) })} /></label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded" onClick={addWord}>+ Add word</button>
                <button className="px-2 py-1 border rounded" onClick={async()=>{
                  const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'CROSSWORD', prompt:'suggest words', grade: meta.grade, topic: meta.topic }) })
                  const j = await res.json(); if (Array.isArray(j?.items)) setWords([...(words||[]), ...j.items.map((w:any)=>({ id: crypto.randomUUID(), row:w.row||0, col:w.col||0, dir:w.dir||'across', answer:(w.answer||'').toUpperCase(), clue:w.clue||'' }))])
                }}>AI: Suggest words</button>
              </div>
            </div>
          )
        })()}
      </div>
    </aside>
  )
}

type GuideLines = { v: number[]; h: number[] }
function Draggable({ item, onChange, selected, onSelect, onConfigure, onDuplicate, onDelete, onDragState, snap, gridSize, allItems, onGuideChange, onActivate }: { item: PlacedTool; onChange: (p: Partial<PlacedTool>) => void; selected: boolean; onSelect: () => void; onConfigure: () => void; onDuplicate: () => void; onDelete: () => void; onDragState: (dragging: boolean) => void; snap: boolean; gridSize: number; allItems: PlacedTool[]; onGuideChange: (g: GuideLines) => void; onActivate: () => void }) {
  const start = useRef<{x:number;y:number;w:number;h:number;mx:number;my:number;resizing:boolean; dir?: 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'} | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  const [flipMap, setFlipMap] = useState<Record<string, boolean>>({})
  const [view, setView] = useState<'edit'|'preview'>('edit')
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
    const dx = e.clientX - start.current.mx
    const dy = e.clientY - start.current.my
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

      if (dir.includes('e')) { R = L + Math.max(minW, start.current.w + dx) }
      if (dir.includes('s')) { B = T + Math.max(minH, start.current.h + dy) }
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

      const nw = Math.max(minW, R - L)
      const nh = Math.max(minH, B - T)
      onGuideChange(guides)
      onChange({ x: L, y: T, w: nw, h: nh })
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
    >
      <div className="h-full w-full bg-white/80 backdrop-blur border rounded-xl overflow-hidden">
        <div className="h-8 px-3 flex items-center justify-between text-xs text-gray-600 border-b bg-white/70 cursor-move select-none" onMouseDown={beginDrag}>
          <div className="flex items-center gap-2">
            <span>{item.kind}</span>
            <span className="text-gray-300">•</span>
            <button className={`px-2 py-0.5 rounded border ${view==='edit'?'bg-blue-50 border-blue-300':''}`} onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>{e.stopPropagation(); setView('edit')}}>Edit</button>
            <button className={`px-2 py-0.5 rounded border ${view==='preview'?'bg-blue-50 border-blue-300':''}`} onMouseDown={(e)=>e.stopPropagation()} onClick={(e)=>{e.stopPropagation(); setView('preview')}}>Preview</button>
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
                <button className="px-2 py-1 border rounded" onClick={async (e)=>{
                  e.preventDefault()
                  try {
                    const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'TEXT', prompt:'Write a concise paragraph.' }) })
                    const j = await res.json(); if (j?.text && textRef.current) { textRef.current.innerHTML = (textRef.current.innerHTML? textRef.current.innerHTML + '<br/><br/>' : '') + j.text; onChange({ data: { ...item.data, html: textRef.current.innerHTML, text: textRef.current.innerText }}) }
                  } catch {}
                }}>AI: Generate</button>
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
            </div>
          )}
          {item.kind === "FLASHCARDS" && (() => {
            const cards: Array<{id?:string;q:string;a:string}> = Array.isArray(item.data?.cards) ? item.data.cards : []
            const addCard = () => onChange({ data: { ...item.data, cards: [...cards, { id: crypto.randomUUID(), q: '', a: '' }] }})
            const setCard = (idx:number, patch: Partial<{q:string;a:string}>) => { const arr=[...cards]; arr[idx] = { ...arr[idx], ...patch } as any; onChange({ data: { ...item.data, cards: arr }}) }
            const delCard = (idx:number) => { const arr=[...cards]; arr.splice(idx,1); onChange({ data: { ...item.data, cards: arr }}) }
            const move = (idx:number, dir:number) => { const arr=[...cards]; const t=arr[idx+dir]; arr[idx+dir]=arr[idx]; arr[idx]=t; onChange({ data: { ...item.data, cards: arr }}) }
            const aiOne = async () => {
              try { const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'FLASHCARDS', prompt:'one Q/A', limit:1 }) }); const j = await res.json(); const qa = Array.isArray(j?.items)? j.items[0] : (j || {}); if (qa?.q || qa?.a) onChange({ data: { ...item.data, cards: [...cards, { id: crypto.randomUUID(), q: qa.q || '', a: qa.a || '' }] }}) } catch {}
            }
            if (view === 'preview') {
              return (
                <div className="h-full overflow-auto">
                  <FlashcardsViewer cards={cards.map(c=>({q:c.q||'', a:c.a||''}))} />
                </div>
              )
            }
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Flashcards ({cards.length})</div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 border rounded" onClick={aiOne}>AI: Suggest</button>
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
              </div>
            )
          })()}
          {item.kind === "QUIZ" && (() => {
            type Q = any
            const list: Q[] = Array.isArray(item.data?.items) ? item.data.items : []
            const add = (type:'MCQ'|'TF'|'FIB') => {
              const base: any = { id: crypto.randomUUID(), type, question: '' }
              if (type==='MCQ') base.options = ['', '']; base.answer = 0
              if (type==='TF') base.answer = true
              if (type==='FIB') base.answer = ''
              onChange({ data: { ...item.data, items: [...list, base] }})
            }
            const set = (idx:number, patch:any) => { const arr=[...list]; arr[idx] = { ...arr[idx], ...patch }; onChange({ data: { ...item.data, items: arr }}) }
            const del = (idx:number) => { const arr=[...list]; arr.splice(idx,1); onChange({ data: { ...item.data, items: arr }}) }
            const move = (idx:number, dir:number) => { const arr=[...list]; const t=arr[idx+dir]; arr[idx+dir]=arr[idx]; arr[idx]=t; onChange({ data: { ...item.data, items: arr }}) }
            const aiOne = async (idx?:number) => {
              try { const res = await fetch('/api/ai-helper', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool:'QUIZ', prompt:'one item', limit:1 })}); const j = await res.json(); const item0 = Array.isArray(j?.items)? j.items[0] : undefined; if (item0) onChange({ data: { ...item.data, items: [...list, item0] }}) } catch {}
            }
            if (view === 'preview') {
              return (
                <div className="h-full overflow-auto">
                  <QuizViewer items={list} />
                </div>
              )
            }
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Quiz ({list.length})</div>
                  <div className="flex items-center gap-2">
                    <select className="border rounded p-1 text-xs" onChange={(e)=>{ const t=e.target.value as any; if (t) { add(t); e.currentTarget.selectedIndex=0 }}}>
                      <option value="">+ Add</option>
                      <option value="MCQ">Multiple choice</option>
                      <option value="TF">True/False</option>
                      <option value="FIB">Fill in blank</option>
                    </select>
                    <button className="px-2 py-1 border rounded" onClick={()=>aiOne()}>AI: Suggest one</button>
                  </div>
                </div>
                <div className="grid gap-2">
                  {list.map((q, idx)=> (
                    <div key={q.id || idx} className="border rounded-lg p-2 bg-white/70">
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>#{idx+1} [{q.type}]</span>
                        <div className="flex gap-1">
                          <button className="px-1 py-0.5 border rounded" disabled={idx===0} onClick={()=>move(idx,-1)}>Up</button>
                          <button className="px-1 py-0.5 border rounded" disabled={idx===list.length-1} onClick={()=>move(idx,1)}>Down</button>
                          <button className="px-1 py-0.5 border rounded text-red-600" onClick={()=>del(idx)}>Delete</button>
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        <input className="w-full border rounded p-2" placeholder="Question" value={q.question || ''} onChange={(e)=>set(idx,{ question: e.target.value })} />
                        {q.type==='MCQ' && (
                          <div className="space-y-1">
                            {(q.options || []).map((op:string, oi:number)=> (
                              <div key={oi} className="flex items-center gap-2">
                                <input type="radio" name={`mcq-${item.id}-${idx}`} checked={q.answer===oi} onChange={()=>set(idx,{ answer: oi })} />
                                <input className="flex-1 border rounded p-2" placeholder={`Option ${oi+1}`} value={op} onChange={(e)=>{ const opts=[...(q.options||[])]; opts[oi]=e.target.value; set(idx,{ options: opts }) }} />
                                <button className="px-2 py-1 border rounded" onClick={()=>set(idx,{ options: [...(q.options||[]), ''] })}>+ Opt</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type==='TF' && (
                          <div className="flex items-center gap-4 text-sm">
                            <label className="flex items-center gap-1"><input type="radio" name={`tf-${item.id}-${idx}`} checked={q.answer===true} onChange={()=>set(idx,{ answer: true })}/> True</label>
                            <label className="flex items-center gap-1"><input type="radio" name={`tf-${item.id}-${idx}`} checked={q.answer===false} onChange={()=>set(idx,{ answer: false })}/> False</label>
                          </div>
                        )}
                        {q.type==='FIB' && (
                          <input className="w-full border rounded p-2" placeholder="Correct answer" value={q.answer || ''} onChange={(e)=>set(idx,{ answer: e.target.value })} />
                        )}
                        <div>
                          <button className="px-2 py-1 border rounded" onClick={()=>aiOne(idx)}>AI: Suggest this</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {list.length===0 && <div className="text-gray-500">No questions yet. Use + Add or AI.</div>}
                </div>
              </div>
            )
          })()}
          {item.kind === "CROSSWORD" && (() => {
            const rows = Number(item.data?.rows || 10)
            const cols = Number(item.data?.cols || 10)
            const words = Array.isArray(item.data?.words) ? item.data.words : []
            if (view === 'preview') {
              return (
                <div className="h-full overflow-auto">
                  <CrosswordViewer rows={rows} cols={cols} words={words} />
                </div>
              )
            }
            return (
              <div>
                <div className="font-semibold">Crossword {rows}×{cols}</div>
                {words.length ? (
                  <div className="text-xs text-gray-600">{words.length} words • Switch to Preview to view grid</div>
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
  const [activeId, setActiveId] = useState<string | null>(null)
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
  const [showMetaDialog, setShowMetaDialog] = useState(true)

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
      // Enforce required meta fields only for explicit actions (not autosave)
      if (!meta.title.trim() || !meta.topic.trim() || !meta.grade || !meta.vanta) {
        if (!opts?.silent) {
          setShowMetaDialog(true)
          alert('Please fill lesson settings before saving')
        }
        return null
      }
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
  // Autosave when items/meta change (skip while settings dialog is open)
  useEffect(() => {
    if (firstLoadRef.current) { firstLoadRef.current = false; return }
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => { if (!showMetaDialog) saveDraft({ silent: true }) }, 1500)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  }, [items, meta.title, meta.topic, meta.grade, meta.vanta, showMetaDialog])
  const preview = () => { sessionStorage.setItem('lessonPreview', JSON.stringify({ meta, items })); window.open('/lessons/preview','_blank') }
  const publish = async () => {
    if (!session) { alert('Sign in required'); return }
    try {
      // Ensure save first
  const savedId = await saveDraft({ silent: false })
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
          <LeftPalette onAdd={addTool} onOpenSettings={()=>setShowMetaDialog(true)} />
          <div className="relative overflow-y-auto" tabIndex={0} onKeyDown={(e)=>{
            if (!selectedId || activeId) return
            const delta = e.shiftKey ? 10 : 1
            const sel = items.find(i=>i.id===selectedId)
            if (!sel) return
            if (e.key==='ArrowLeft') { e.preventDefault(); updateItem(sel.id, { x: Math.max(0, sel.x - delta) }) }
            if (e.key==='ArrowRight') { e.preventDefault(); updateItem(sel.id, { x: sel.x + delta }) }
            if (e.key==='ArrowUp') { e.preventDefault(); updateItem(sel.id, { y: Math.max(0, sel.y - delta) }) }
            if (e.key==='ArrowDown') { e.preventDefault(); updateItem(sel.id, { y: sel.y + delta }) }
            if (e.key==='Delete') { e.preventDefault(); if (confirm('Delete selected block?')) setItems(prev=>prev.filter(i=>i.id!==selectedId)) }
          }} onMouseDown={(e)=>{
            // clicking empty canvas clears active tool
            if (!(e.target as HTMLElement).closest('.sn-tool-content')) setActiveId(null)
          }}>
            {/* Vanta only inside the canvas container */}
            <div className="relative mx-4 my-6 rounded-xl border overflow-hidden">
              <VantaBackground scoped effect={meta.vanta}>
                <div ref={canvasRef} className="relative min-h-[2400px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  {/* compact canvas controls */}
                  <div className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1 text-xs shadow">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={showGrid} onChange={(e)=>setShowGrid(e.target.checked)} /> Grid</label>
                    <span className="text-gray-300">|</span>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={snapToGrid} onChange={(e)=>setSnapToGrid(e.target.checked)} /> Snap</label>
                    <span className="text-gray-300">|</span>
                    <select className="border rounded px-1 py-0.5" value={gridSize} onChange={(e)=>setGridSize(Number(e.target.value))}>
                      {[10,20,40].map(gs => <option key={gs} value={gs}>{gs}px</option>)}
                    </select>
                  </div>
                  {/* alignment guides */}
                  {guides.v.map((x,i)=>(<div key={`gv-${i}`} className="absolute top-0 bottom-0 w-px bg-rose-400/70" style={{left:x}}/>))}
                  {guides.h.map((y,i)=>(<div key={`gh-${i}`} className="absolute left-0 right-0 h-px bg-rose-400/70" style={{top:y}}/>))}
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
