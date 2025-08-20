"use client"

import dynamic from "next/dynamic"
import type { QuizItem } from "./quiz-viewer"

const QuizViewerDynamic = dynamic(() => import("./quiz-viewer").then(m => m.QuizViewer), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-500">Loading quiz…</div>,
})

export default function QuizViewerClient(props: { items: QuizItem[]; storageKey?: string; initialMode?: 'practice'|'review' }) {
  return <QuizViewerDynamic {...props} />
}
