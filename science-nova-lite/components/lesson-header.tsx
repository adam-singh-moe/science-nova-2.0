"use client"

import * as React from "react"
import { getLessonProgress } from "@/lib/progress"
import { List } from "lucide-react"

type TocItem = { id: string; label: string; y: number }

export function LessonHeader({
  lessonId,
  title,
  stageText,
  blockIds,
  tocItems = [],
  canvasSelector = "#lesson-canvas",
}: {
  lessonId: string
  title: string
  stageText?: string
  blockIds: string[]
  tocItems?: TocItem[]
  canvasSelector?: string
}) {
  const [progress, setProgress] = React.useState(() => ({ done: 0, total: blockIds.length, percent: 0 }))
  const [showToc, setShowToc] = React.useState(false)

  React.useEffect(() => {
    const update = () => setProgress(getLessonProgress(lessonId, blockIds))
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [lessonId, blockIds.join(',')])

  const scrollToItem = (y: number) => {
    const canvas = document.querySelector(canvasSelector) as HTMLElement | null
    const header = document.getElementById("lesson-header")
    const headerH = header ? header.getBoundingClientRect().height : 64
    const pageTop = window.scrollY
    let targetY = y
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const canvasTop = rect.top + window.scrollY
      targetY = canvasTop + y - headerH - 8
    }
    window.scrollTo({ top: targetY, behavior: 'smooth' })
    setShowToc(false)
  }

  return (
    <div id="lesson-header" className="sticky top-0 z-30">
      <div className="mx-auto max-w-[1280px] w-full px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="kid-h1 font-extrabold text-white/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] truncate">{title}</div>
            <div className="kid-h2 text-white/80 text-sm mt-0.5 drop-shadow">{stageText || 'Lesson'}</div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 justify-end">
              <div className="text-right">
                <div className="text-xs text-white/80">Progress</div>
                <div className="w-44 h-2 rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full bg-emerald-400/90 transition-all" style={{ width: `${progress.percent}%` }} />
                </div>
              </div>
              {tocItems.length > 0 && (
                <div className="relative">
                  <button onClick={() => setShowToc(v => !v)} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white/90">
                    <List className="w-4 h-4" />
                    <span className="text-sm font-medium">Contents</span>
                  </button>
                  {showToc && (
                    <div className="absolute right-0 mt-2 w-64 rounded-lg bg-black/60 backdrop-blur text-white shadow-lg border border-white/10 p-2 max-h-72 overflow-auto">
                      {tocItems.map(it => (
                        <button key={it.id} onClick={() => scrollToItem(it.y)} className="block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-white/10">
                          {it.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LessonHeader
