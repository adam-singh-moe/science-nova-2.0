"use client"

import React, { useMemo, useState } from "react"
import { postLessonEvent } from '@/lib/lessonTelemetry'
import { CheckCircle2, XCircle } from "lucide-react"

export type QuizItem = {
  type: "MCQ" | "TF" | "FIB"
  question: string
  options?: string[]
  answer?: string | boolean
}

function normalize(s: string) {
  return (s || "").trim().toLowerCase()
}

export function QuizViewer({ items, storageKey, initialMode }: { items: QuizItem[]; storageKey?: string; initialMode?: 'practice'|'review' }) {
  const [responses, setResponses] = useState<Record<number, string | boolean | undefined>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [mode, setMode] = useState<'practice'|'review'>(initialMode || 'practice')
  const [submitted, setSubmitted] = useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Load persisted state
  React.useEffect(() => {
    if (!storageKey) return
    try {
      const raw = window.localStorage.getItem(storageKey)
    if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          if (parsed.responses && typeof parsed.responses === 'object') setResponses(parsed.responses)
          if (parsed.checked && typeof parsed.checked === 'object') setChecked(parsed.checked)
      if (parsed.mode === 'practice' || parsed.mode === 'review') setMode(parsed.mode)
      if (typeof parsed.submitted === 'boolean') setSubmitted(parsed.submitted)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // Persist on change
  React.useEffect(() => {
    if (!storageKey) return
    try {
      const data = JSON.stringify({ responses, checked, mode, submitted })
      window.localStorage.setItem(storageKey, data)
    } catch {}
  }, [responses, checked, mode, submitted, storageKey])

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10)
    return () => clearTimeout(t)
  }, [])

  const results = useMemo(() => {
    let correct = 0
    let total = items.length
    items.forEach((q, i) => {
      if (!checked[i]) return
      const r = responses[i]
      if (q.type === "MCQ") {
        if (normalize(String(r ?? "")) === normalize(String(q.answer ?? ""))) correct++
      } else if (q.type === "TF") {
        if (String(r) === String(q.answer)) correct++
      } else if (q.type === "FIB") {
        if (normalize(String(r ?? "")) === normalize(String(q.answer ?? ""))) correct++
      }
    })
    return { correct, totalChecked: Object.values(checked).filter(Boolean).length, total }
  }, [items, responses, checked])

  function reviewAll() {
    const next: Record<number, boolean> = {}
    for (let i = 0; i < items.length; i++) {
      next[i] = true
    }
    setChecked(next)
  }

  function resetAll() {
    setResponses({})
    setChecked({})
    setSubmitted(false)
    if (storageKey) {
      try { window.localStorage.removeItem(storageKey) } catch {}
    }
    // try to emit reset event
    try {
      const [_, lessonId, blockId] = (storageKey || '').split(':')
      if (lessonId && blockId) postLessonEvent({ lessonId, blockId, toolKind: 'QUIZ', eventType: 'quiz_reset' })
    } catch {}
  }

  function submitReview() {
    const next: Record<number, boolean> = {}
    for (let i = 0; i < items.length; i++) next[i] = true
    setChecked(next)
    setSubmitted(true)
    // emit submit with score
    try {
      const [_, lessonId, blockId] = (storageKey || '').split(':')
      if (lessonId && blockId) {
        const pct = Math.round((results.correct / Math.max(1, results.total)) * 100)
        postLessonEvent({ lessonId, blockId, toolKind: 'QUIZ', eventType: 'quiz_submit', data: { correct: results.correct, checked: results.totalChecked, total: results.total, pct } })
      }
    } catch {}
  }

  const percentChecked = Math.round((results.totalChecked / Math.max(1, results.total)) * 100)

  return (
    <div className={`space-y-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur rounded-lg border p-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mode</span>
          <div className="inline-flex rounded-lg border bg-white/80 overflow-hidden">
            <button type="button" aria-pressed={mode==='practice'} className={`px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 ${mode==='practice' ? 'bg-amber-600 text-white' : 'hover:bg-amber-50/40'}`} onClick={() => { setMode('practice') }}>Practice</button>
            <button type="button" aria-pressed={mode==='review'} className={`px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 ${mode==='review' ? 'bg-amber-600 text-white' : 'hover:bg-amber-50/40'}`} onClick={() => { setMode('review'); setSubmitted(false); setChecked({}) }}>Review</button>
          </div>
        </div>
        <div className="text-sm text-gray-700 whitespace-nowrap">
          Score: {results.correct}/{results.totalChecked} checked{results.totalChecked < results.total ? ` (of ${results.total})` : ""}
          {results.totalChecked > 0 && (
            <span> — {Math.round((results.correct / Math.max(1, results.totalChecked)) * 100)}%</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {mode==='practice' ? (
            <button type="button" className="px-3 py-1.5 rounded border bg-white hover:bg-amber-50/60 focus:outline-none focus:ring-2 focus:ring-amber-300" onClick={reviewAll}>Review all</button>
          ) : (
            <button type="button" className="px-3 py-1.5 rounded border bg-white hover:bg-amber-50/60 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-300" onClick={submitReview} disabled={submitted}>
              {submitted ? 'Submitted' : 'Submit review'}
            </button>
          )}
          <button type="button" className="px-3 py-1.5 rounded border bg-white hover:bg-amber-50/60 focus:outline-none focus:ring-2 focus:ring-amber-300" onClick={resetAll}>Reset</button>
        </div>
      </div>

      {/* small progress bar for answered */}
      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-amber-500" style={{ width: `${percentChecked}%` }} />
      </div>

      {items.map((q, idx) => {
        const isChecked = !!checked[idx]
        const r = responses[idx]
        let isCorrect: boolean | undefined
        if (isChecked) {
          if (q.type === "MCQ" || q.type === "FIB") {
            isCorrect = normalize(String(r ?? "")) === normalize(String(q.answer ?? ""))
          } else if (q.type === "TF") {
            isCorrect = String(r) === String(q.answer)
          }
        }

        return (
  <div key={idx} className="rounded-xl border p-4 bg-white/95 shadow-sm transition-shadow duration-200 hover:shadow-md">
            <div className="mb-3 flex items-start gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs mt-0.5">{idx + 1}</span>
              <span className="font-medium">{q.question || "Question"}</span>
            </div>

            {q.type === "MCQ" && (
              <div className="space-y-2">
                {(q.options || []).map((opt, oi) => {
                  const selected = String(r ?? "") === opt
                  const correct = isChecked && normalize(opt) === normalize(String(q.answer ?? ""))
                  const wrong = isChecked && selected && !correct
      return (
    <label key={oi} className={`flex items-center gap-2 rounded px-2 py-1 cursor-pointer transition-all border focus-within:ring-2 focus-within:ring-amber-300 ${selected ? 'border-amber-300 bg-amber-50/40 scale-[1.01] shadow-sm' : 'border-transparent'} ${correct ? "bg-green-50" : ""} ${wrong ? "bg-red-50" : "hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name={`q-${idx}`}
            className="accent-amber-600"
                        disabled={false}
                        checked={selected}
                        onChange={() => setResponses((prev) => ({ ...prev, [idx]: opt }))}
                      />
                      <span>{opt}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {q.type === "TF" && (
              <div className="flex gap-2">
                {[true, false].map((val) => {
                  const selected = r === val
                  const correct = isChecked && q.answer === val
                  const wrong = isChecked && selected && !correct
                  return (
                    <button
                      key={String(val)}
                      type="button"
                      className={`px-3 py-1.5 rounded border transition-all ${selected ? "bg-amber-600 text-white border-amber-600 scale-[1.02] shadow-sm" : "bg-white hover:bg-gray-50"} ${correct ? "!bg-green-600 !text-white !border-green-600" : ""} ${wrong ? "!bg-red-600 !text-white !border-red-600" : ""}`}
                      onClick={() => setResponses((prev) => ({ ...prev, [idx]: val }))}
                    >
                      {val ? "True" : "False"}
                    </button>
                  )
                })}
              </div>
            )}

            {q.type === "FIB" && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className={`flex-1 rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-200 ${isChecked ? (isCorrect ? "border-green-500" : "border-red-500") : "border-gray-300"}`}
                  aria-invalid={isChecked ? (!isCorrect) : undefined}
                  placeholder="Your answer"
                  value={typeof r === "string" ? r : ""}
                  onChange={(e) => setResponses((prev) => ({ ...prev, [idx]: e.target.value }))}
                />
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              {mode==='practice' ? (
                <button
                  type="button"
                  className="px-3 py-1.5 rounded border bg-white hover:bg-amber-50/60 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  onClick={() => setChecked((prev) => ({ ...prev, [idx]: true }))}
                >
                  Check
                </button>
              ) : null}
              {(mode==='practice' || submitted) && (
                <>
                  {isChecked && (
                    <span className={`inline-flex items-center gap-1.5 text-sm ${isCorrect ? "text-green-700" : "text-red-700"}`} role="status" aria-live="polite">
                      {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  )}
                  {isChecked && !isCorrect && q.answer !== undefined && (
                    <span className="text-sm text-gray-600">Answer: {String(q.answer)}</span>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
