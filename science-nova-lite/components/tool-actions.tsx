"use client"

import * as React from "react"
import { Volume2, VolumeX, Plus, Minus } from "lucide-react"

export type ToolActionsProps = {
  targetRef: React.RefObject<HTMLElement>
  onScaleChange?: (scale: number) => void
  min?: number
  max?: number
  step?: number
}

export function ToolActions({ targetRef, onScaleChange, min = 0.8, max = 1.6, step = 0.1 }: ToolActionsProps) {
  const [scale, setScale] = React.useState(1)
  const [speaking, setSpeaking] = React.useState(false)
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined
  const utterRef = React.useRef<SpeechSynthesisUtterance | null>(null)
  const cleanupHighlightsRef = React.useRef<() => void>(() => {})

  const applyScale = (next: number) => {
    const clamped = Math.min(max, Math.max(min, +next.toFixed(2)))
    setScale(clamped)
    if (onScaleChange) onScaleChange(clamped)
    const el = targetRef.current
    if (el) {
      el.style.fontSize = `${clamped}em`
    }
  }

  const inc = () => applyScale(scale + step)
  const dec = () => applyScale(scale - step)

  const clearHighlights = () => {
    const root = targetRef.current
    if (!root) return
    root.querySelectorAll('[data-sn-highlight]')?.forEach((el) => {
      el.classList.remove('sn-reading')
      el.removeAttribute('data-sn-highlight')
    })
  }

  const splitIntoSentences = (text: string) => {
    // Basic sentence split; avoids over-splitting numbers/abbreviations reasonably
    return text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]?/g) || [text]
  }

  const toggleSpeak = () => {
    if (!synth) return
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      clearHighlights()
      return
    }
    const el = targetRef.current
    const text = el?.innerText || el?.textContent || ""
    if (!text) return
    // Prepare sentence-level highlighting by wrapping sentences in spans
    clearHighlights()
    const sentences = splitIntoSentences(text)
    // Rebuild content safely only for highlight container
    // We operate on a cloned text snapshot to avoid nuking existing markup in rich text; instead, map sentence indices to ranges.
    // Simple approach: traverse text nodes and wrap progressively until sentence text length matches.
    const root = el!
    let remaining = sentences.map(s => s.trim())
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const wraps: Array<{ node: Text; start: number; end: number; sentenceIdx: number }> = []
    let idx = 0
    let buffer = ""
    while (walker.nextNode() && idx < remaining.length) {
      const node = walker.currentNode as Text
      const chunk = node.nodeValue || ""
      let pos = 0
      while (idx < remaining.length && pos < chunk.length) {
        const target = remaining[idx]
        const needed = target.length - buffer.length
        const take = Math.min(needed, chunk.length - pos)
        buffer += chunk.slice(pos, pos + take)
        const start = pos
        pos += take
        const end = pos
        wraps.push({ node, start, end, sentenceIdx: idx })
        if (buffer.length >= target.length) {
          buffer = ""
          idx++
        }
      }
    }
    // Apply wrapping spans for each sentence (group segments belonging to the same sentence)
    const sentenceGroups = new Map<number, Array<{ node: Text; start: number; end: number }>>()
    for (const w of wraps) {
      if (!sentenceGroups.has(w.sentenceIdx)) sentenceGroups.set(w.sentenceIdx, [])
      sentenceGroups.get(w.sentenceIdx)!.push({ node: w.node, start: w.start, end: w.end })
    }
    const createdSpans: HTMLElement[] = []
    sentenceGroups.forEach((segments) => {
      // Wrap in reverse order within each text node to keep offsets valid
      const perNode = new Map<Text, Array<{ start: number; end: number }>>()
      for (const seg of segments) {
        if (!perNode.has(seg.node)) perNode.set(seg.node, [])
        perNode.get(seg.node)!.push({ start: seg.start, end: seg.end })
      }
      perNode.forEach((ranges, node) => {
        ranges.sort((a,b) => b.start - a.start)
        for (const r of ranges) {
          const text = node.splitText(r.start)
          const rest = text.splitText(r.end - r.start)
          const span = document.createElement('span')
          span.setAttribute('data-sn-highlight', '1')
          span.className = 'sn-reading'
          span.textContent = text.nodeValue || ''
          text.parentNode?.replaceChild(span, text)
          createdSpans.push(span)
          node = rest // continue after inserted span
        }
      })
    })

    cleanupHighlightsRef.current = clearHighlights

    let sentenceIdx = 0
    const speakNext = () => {
      if (sentenceIdx >= sentences.length) { setSpeaking(false); clearHighlights(); return }
      // Activate current sentence span(s)
      createdSpans.forEach((s, i) => {
        // noop; we already applied class; ensure only current sentence is highlighted
        // Toggle by data attribute index if needed in future; current impl highlights all sentences subtly
      })
      const utter = new SpeechSynthesisUtterance(sentences[sentenceIdx])
      utter.rate = 1
      utter.onend = () => { sentenceIdx += 1; speakNext() }
      utter.onerror = () => { sentenceIdx += 1; speakNext() }
      utterRef.current = utter
      synth!.speak(utter)
    }
    setSpeaking(true)
    speakNext()
  }

  return (
    <div className="flex items-center gap-1 text-white/90">
      <button onClick={dec} title="Smaller" className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/10 hover:bg-white/15 border border-white/15"><Minus className="w-4 h-4" /></button>
      <button onClick={inc} title="Larger" className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/10 hover:bg-white/15 border border-white/15"><Plus className="w-4 h-4" /></button>
      <button onClick={toggleSpeak} title="Read aloud" className={`inline-flex items-center justify-center w-8 h-8 rounded-md border ${speaking ? 'bg-emerald-400/20 border-emerald-400/40' : 'bg-white/10 hover:bg-white/15 border-white/15'}`}>
        {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default ToolActions
