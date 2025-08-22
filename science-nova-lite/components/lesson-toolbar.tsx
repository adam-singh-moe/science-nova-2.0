"use client"

import * as React from "react"
import { Home, HelpCircle, Volume2, List, Plus, Minus, Type } from "lucide-react"
import Link from "next/link"

export function LessonToolbar({ onReadAloud }: { onReadAloud?: () => void }) {
  // Deprecated: toolbar replaced by per-tool actions. Kept for reference/testing.
  const [fontScale, setFontScale] = React.useState(1.0)
  const [dyslexic, setDyslexic] = React.useState(false)

  const inc = () => setFontScale(Math.min(1.8, +(fontScale + 0.1).toFixed(2)))
  const dec = () => setFontScale(Math.max(1.0, +(fontScale - 0.1).toFixed(2)))

  return (
    <div className="fixed z-40 bottom-4 left-1/2 -translate-x-1/2 w-[min(94vw,720px)]">
      <div className="mx-auto rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/" className="kid-btn inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200">
            <Home className="w-6 h-6" />
          </Link>
          <button className="kid-btn inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Contents">
            <List className="w-6 h-6" />
          </button>
          <button onClick={onReadAloud} className="kid-btn inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Read aloud">
            <Volume2 className="w-6 h-6" />
          </button>
          <button className="kid-btn inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Help">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 mr-1 text-gray-600"><Type className="w-4 h-4" /><span className="text-sm">Text size</span></div>
          <button onClick={dec} className="kid-btn inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Smaller">
            <Minus className="w-6 h-6" />
          </button>
          <button onClick={inc} className="kid-btn inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200" title="Larger">
            <Plus className="w-6 h-6" />
          </button>
          <button onClick={() => setDyslexic(!dyslexic)} className={`kid-btn inline-flex items-center justify-center h-12 rounded-xl border ${dyslexic ? 'bg-indigo-100 text-indigo-700 border-indigo-300 px-3' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 px-3'}`} title="Dyslexic font">
            <span className="text-sm font-semibold">Dyslexic</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LessonToolbar
