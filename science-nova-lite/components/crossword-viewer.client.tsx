"use client"

import dynamic from "next/dynamic"

const CrosswordViewerDynamic = dynamic(() => import("./crossword-viewer").then(m => m.CrosswordViewer), {
  ssr: false,
  loading: () => <div className="text-sm text-gray-500">Loading crossword…</div>,
})

export default function CrosswordViewerClient(props: { rows: number; cols: number; words: any[]; storageKey?: string }) {
  return <CrosswordViewerDynamic {...props} />
}
