"use client"

import * as React from "react"
import ToolActions from "./tool-actions"
import { StudentToolCard } from "./student-tool-card"

export type ToolContainerProps = {
  variant: "text" | "flashcards" | "quiz" | "crossword" | "image" | "video"
  children: React.ReactNode
  enableReadAloud?: boolean
  bodyBgColor?: string
}

export function ToolContainer({ variant, children, enableReadAloud = true, bodyBgColor }: ToolContainerProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.fontSize = '1em'
    }
  }, [])

  // Don't show AI helper tools for video variant
  const showActions = variant !== "video"

  return (
    <StudentToolCard
      variant={variant}
      bodyBgColor={bodyBgColor}
      actions={showActions ? <ToolActions targetRef={contentRef as React.RefObject<HTMLElement>} /> : undefined}
    >
      <div className="tool-content" ref={contentRef}>
        {children}
      </div>
    </StudentToolCard>
  )
}

export default ToolContainer
