"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function FadeIn({ 
  children, 
  className = "", 
  delay = 0,
  direction = 'up'
}: FadeInProps) {
  const directionOffset = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { y: 0, x: 20 },
    right: { y: 0, x: -20 }
  }

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directionOffset[direction]
      }}
      animate={{ 
        opacity: 1, 
        x: 0,
        y: 0
      }}
      transition={{ 
        duration: 0.6,
        delay,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      style={{ width: '100%' }}
      {...(className && { className })}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ 
  children, 
  className = "", 
  delay = 0 
}: { 
  children: ReactNode
  className?: string
  delay?: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.5,
        delay,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      style={{ width: '100%' }}
      {...(className && { className })}
    >
      {children}
    </motion.div>
  )
}

export function SlideIn({ 
  children, 
  className = "", 
  delay = 0,
  direction = 'left'
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'left' | 'right' | 'up' | 'down'
}) {
  const directionOffset = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    up: { x: 0, y: -100 },
    down: { x: 0, y: 100 }
  }

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directionOffset[direction]
      }}
      animate={{ 
        opacity: 1, 
        x: 0,
        y: 0
      }}
      transition={{ 
        duration: 0.7,
        delay,
        ease: [0.4, 0.0, 0.2, 1]
      }}
      style={{ width: '100%' }}
      {...(className && { className })}
    >
      {children}
    </motion.div>
  )
}
