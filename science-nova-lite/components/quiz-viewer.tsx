"use client"

import React, { useMemo, useState } from "react"
import { postLessonEvent } from '@/lib/lessonTelemetry'
import { setBlockDone } from '@/lib/progress'
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

export function QuizViewer({ items, storageKey, initialMode, contentMeta }: { items: QuizItem[]; storageKey?: string; initialMode?: 'practice'|'review'; contentMeta?: { entryId: string; topicId: string; category: string; subtype: string } }) {
  // Early validation to ensure items is a valid array
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No quiz questions available.</p>
      </div>
    )
  }

  const [responses, setResponses] = useState<Record<number, string | boolean | undefined>>({})
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [mode, setMode] = useState<'practice'|'review'>(initialMode || 'practice')
  const [submitted, setSubmitted] = useState(false)
  const [mounted, setMounted] = React.useState(false)
  // Accent color from parent card; falls back to amber palette when not provided
  const accent = 'var(--sn-accent, #f59e0b)'

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

  // Track explanation views for achievement system
  React.useEffect(() => {
    if (!storageKey) return
    const [_, lessonId, blockId] = storageKey.split(':')
    if (!lessonId || !blockId) return

    // Count how many explanations are currently visible
    let visibleExplanations = 0
    items.forEach((q, idx) => {
      const isChecked = checked[idx]
      const r = responses[idx]
      let isCorrect = false
      if (isChecked) {
        if (q.type === "MCQ" || q.type === "FIB") {
          isCorrect = normalize(String(r ?? "")) === normalize(String(q.answer ?? ""))
        } else if (q.type === "TF") {
          isCorrect = String(r) === String(q.answer)
        }
      }
      // Count if explanation is shown (wrong answer with explanation visible)
      if (isChecked && !isCorrect && q.answer !== undefined) {
        visibleExplanations++
      }
    })

    // Track explanation views when explanations become visible
    if (visibleExplanations > 0) {
      try {
        postLessonEvent({ 
          lessonId, 
          blockId, 
          toolKind: 'QUIZ', 
          eventType: 'explanation_view',
          data: { explanationCount: visibleExplanations }
        })
      } catch {}
    }
  }, [checked, responses, items, storageKey])

  const results = useMemo(() => {
    // Ensure items is an array before processing
    if (!Array.isArray(items) || items.length === 0) {
      return { correct: 0, total: 0, totalChecked: 0 }
    }
    
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
        // Mark block as completed when quiz is submitted
        setBlockDone({ lessonId, blockId }, true)
      }
    } catch {}
    // content completion telemetry (outside lesson context) - removed as part of content management system
  }

  const percentChecked = Math.round((results.totalChecked / Math.max(1, results.total)) * 100)

  return (
    <div className={`space-y-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
      {/* Enhanced Header with Kid-Friendly Colors */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-400/15 rounded-3xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90 backdrop-blur-xl border border-pink-400/30 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 p-4 rounded-2xl backdrop-blur-sm border border-pink-400/40 shadow-2xl">
                  <span className="text-white text-2xl font-bold drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">🧩</span>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
                  Quiz Mode
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70 font-medium">Mode</span>
                  <div className="inline-flex rounded-2xl border border-pink-400/30 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm overflow-hidden shadow-xl">
                    <button
                      type="button"
                      aria-pressed={mode==='practice'}
                      className={`px-6 py-3 text-sm font-bold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${mode==='practice' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg scale-105' : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'}`}
                      onClick={() => { setMode('practice') }}
                    >
                      Practice
                    </button>
                    <button
                      type="button"
                      aria-pressed={mode==='review'}
                      className={`px-6 py-3 text-sm font-bold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${mode==='review' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg scale-105' : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'}`}
                      onClick={() => { setMode('review'); setSubmitted(false); setChecked({}) }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <div className="text-white font-bold text-3xl bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">
                {results.correct}/{results.totalChecked}
              </div>
              <div className="text-sm text-white/70 font-medium">
                checked{results.totalChecked < results.total ? ` (of ${results.total})` : ""}
              </div>
              {results.totalChecked > 0 && (
                <div className="text-2xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
                  {Math.round((results.correct / Math.max(1, results.totalChecked)) * 100)}%
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Progress Bar with Neon Effects */}
          <div className="relative mb-6">
            <div className="h-4 w-full rounded-full bg-slate-800/80 border border-pink-400/30 overflow-hidden backdrop-blur-sm shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 via-purple-400 via-indigo-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-lg relative"
                style={{ width: `${percentChecked}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-300/50 via-purple-300/50 to-cyan-300/50 rounded-full blur-sm animate-pulse"></div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-cyan-400/30 blur-lg"></div>
          </div>

          {/* Action Buttons with Enhanced Styling */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70 font-medium">
              Progress: {percentChecked}% complete
            </div>
            <div className="flex items-center gap-4">
              {mode==='practice' ? (
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all duration-300 border border-cyan-400/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 transform"
                  onClick={reviewAll}
                >
                  Review all
                </button>
              ) : (
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500/80 to-green-500/80 hover:from-emerald-500 hover:to-green-500 text-white font-bold transition-all duration-300 border border-emerald-400/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 transform disabled:opacity-50 disabled:hover:scale-100"
                  onClick={submitReview}
                  disabled={submitted}
                >
                  {submitted ? 'Submitted ✓' : 'Submit review'}
                </button>
              )}
              <button
                type="button"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-600/80 to-slate-700/80 hover:from-slate-600 hover:to-slate-700 text-white font-bold transition-all duration-300 border border-slate-500/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 transform"
                onClick={resetAll}
              >
                Reset all
              </button>
            </div>
          </div>
        </div>
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
          <div key={idx} className="group relative">
            {/* Question Card Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
            
            <div className="relative bg-gradient-to-br from-white/[0.15] via-white/[0.08] to-white/[0.12] backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:border-white/30">
              {/* Question Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl blur-md opacity-40"></div>
                  <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl shadow-lg border border-indigo-400/30">
                    <span className="text-white font-bold text-lg drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]">
                      {idx + 1}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white/95 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    {q.question || "Question"}
                  </h4>
                  {isChecked && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border shadow-lg ${
                        isCorrect 
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/30 text-green-200" 
                          : "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-400/30 text-red-200"
                      }`} role="status" aria-live="polite">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Correct! 🎉
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Incorrect
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Question Content */}
              <div className="space-y-4">
                {q.type === "MCQ" && (
                  <div className="space-y-3">
                    {(q.options || []).map((opt, oi) => {
                      const selected = String(r ?? "") === opt
                      const correct = isChecked && normalize(opt) === normalize(String(q.answer ?? ""))
                      const wrong = isChecked && selected && !correct
                      
                      return (
                        <label
                          key={oi}
                          className={`group/option relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${
                            selected 
                              ? 'bg-gradient-to-r from-purple-500/20 via-indigo-500/15 to-blue-500/20 border-purple-400/40 shadow-lg scale-[1.02]' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          } ${
                            correct 
                              ? "!bg-gradient-to-r !from-green-500/20 !to-emerald-500/20 !border-green-400/40" 
                              : ""
                          } ${
                            wrong 
                              ? "!bg-gradient-to-r !from-red-500/20 !to-pink-500/20 !border-red-400/40" 
                              : ""
                          }`}
                        >
                          {/* Selection Indicator */}
                          <div className="relative">
                            <input
                              type="radio"
                              name={`q-${idx}`}
                              className="sr-only"
                              disabled={false}
                              checked={selected}
                              onChange={() => setResponses((prev) => ({ ...prev, [idx]: opt }))}
                            />
                            <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                              selected 
                                ? 'border-purple-400 bg-gradient-to-r from-purple-400 to-indigo-400 shadow-lg' 
                                : 'border-white/30 group-hover/option:border-white/50'
                            }`}>
                              {selected && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1 shadow-sm"></div>
                              )}
                            </div>
                          </div>
                          <span className="text-white/90 font-medium flex-1 group-hover/option:text-white transition-colors duration-300">
                            {opt}
                          </span>
                          {correct && (
                            <CheckCircle2 className="h-5 w-5 text-green-400 animate-pulse" />
                          )}
                          {wrong && (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === "TF" && (
                  <div className="flex gap-4">
                    {[true, false].map((val) => {
                      const selected = r === val
                      const correct = isChecked && q.answer === val
                      const wrong = isChecked && selected && !correct
                      
                      return (
                        <button
                          key={String(val)}
                          type="button"
                          className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-300 border backdrop-blur-sm shadow-lg hover:scale-105 ${
                            selected 
                              ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-400/40 shadow-xl" 
                              : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
                          } ${
                            correct 
                              ? "!bg-gradient-to-r !from-green-500 !to-emerald-500 !border-green-400/40" 
                              : ""
                          } ${
                            wrong 
                              ? "!bg-gradient-to-r !from-red-500 !to-pink-500 !border-red-400/40" 
                              : ""
                          }`}
                          onClick={() => setResponses((prev) => ({ ...prev, [idx]: val }))}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>{val ? "True" : "False"}</span>
                            {val ? "✓" : "✕"}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.type === "FIB" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full px-4 py-4 rounded-xl bg-white/10 border backdrop-blur-sm text-white placeholder-white/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 ${
                          isChecked 
                            ? (isCorrect 
                                ? "border-green-400/50 bg-green-500/10" 
                                : "border-red-400/50 bg-red-500/10"
                              ) 
                            : "border-white/20 focus:bg-white/15"
                        }`}
                        placeholder="Type your answer here..."
                        value={typeof r === "string" ? r : ""}
                        onChange={(e) => setResponses((prev) => ({ ...prev, [idx]: e.target.value }))}
                      />
                      {isChecked && !isCorrect && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                      )}
                      {isChecked && isCorrect && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        </div>
                      )}
                    </div>
                    {isChecked && !isCorrect && q.answer !== undefined && (
                      <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl backdrop-blur-sm">
                        <span className="text-blue-200 text-sm font-medium">
                          💡 Correct answer: <span className="font-bold">{String(q.answer)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {mode==='practice' && !isChecked && (
                  <div className="pt-4 border-t border-white/10">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500/80 to-blue-500/80 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-300 border border-cyan-400/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105"
                      onClick={() => setChecked((prev) => ({ ...prev, [idx]: true }))}
                    >
                      Check Answer ✨
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
