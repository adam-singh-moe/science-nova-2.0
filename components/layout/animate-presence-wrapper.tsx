"use client"

import { AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

interface AnimatePresenceWrapperProps {
  children: ReactNode
}

export function AnimatePresenceWrapper({ children }: AnimatePresenceWrapperProps) {
  return (
    <AnimatePresence mode="wait">
      {children}
    </AnimatePresence>
  )
}
