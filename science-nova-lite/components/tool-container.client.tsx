"use client"

import * as React from "react"
import ToolActions from "./tool-actions"
import { StudentToolCard } from "./student-tool-card"

export type ToolContainerProps = {
  variant: "text" | "flashcards" | "quiz" | "crossword" | "image"
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

  return (
    <StudentToolCard
      variant={variant}
  bodyBgColor={bodyBgColor}
      actions={<ToolActions targetRef={contentRef as React.RefObject<HTMLElement>} />}
    >
      <div className="tool-content" ref={contentRef}>
        {children}
      </div>
    </StudentToolCard>
  )
}

export default ToolContainer
