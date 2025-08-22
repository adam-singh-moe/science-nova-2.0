"use client"

import React from "react"
import { setBlockDone } from "@/lib/progress"

interface AutoCompleteWrapperProps {
  lessonId: string
  blockId: string
  children: React.ReactNode
  delayMs?: number
}

export function AutoCompleteWrapper({ 
  lessonId, 
  blockId, 
  children, 
  delayMs = 3000 
}: AutoCompleteWrapperProps) {
  const hasMarkedRef = React.useRef(false)

  React.useEffect(() => {
    if (hasMarkedRef.current) return

    const timer = setTimeout(() => {
      if (!hasMarkedRef.current) {
        setBlockDone({ lessonId, blockId }, true)
        hasMarkedRef.current = true
      }
    }, delayMs)

    return () => clearTimeout(timer)
  }, [lessonId, blockId, delayMs])

  return <>{children}</>
}
